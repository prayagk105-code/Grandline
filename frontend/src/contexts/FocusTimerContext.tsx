import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { studyService } from '../services/studyService';
import { parseApiError } from '../services/api/apiError';
import { toIsoDate } from '../utils/date';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const TIMER_STORAGE_KEY = 'dayform_focus_timer_state';

type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

interface PersistedTimerState {
  presetMinutes: number;
  status: TimerStatus;
  remainingSeconds: number;
  endTimestampMs: number | null;
  startedAtUtc: string | null;
  learningPathId: string | null;
  topic: string;
  clientSessionKey: string;
  sessionSaved: boolean;
}

function makeSessionKey(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function loadInitialState(): PersistedTimerState {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedTimerState;
      if (parsed.status === 'running' && parsed.endTimestampMs) {
        const left = Math.max(0, Math.ceil((parsed.endTimestampMs - Date.now()) / 1000));
        return {
          ...parsed,
          remainingSeconds: left,
          status: left === 0 ? 'completed' : 'running'
        };
      }
      return parsed;
    }
  } catch {
    // ignore corrupted local timer state
  }

  return {
    presetMinutes: 25,
    status: 'idle',
    remainingSeconds: 25 * 60,
    endTimestampMs: null,
    startedAtUtc: null,
    learningPathId: null,
    topic: '',
    clientSessionKey: makeSessionKey(),
    sessionSaved: false
  };
}

interface FocusTimerContextValue {
  presetMinutes: number;
  status: TimerStatus;
  remainingSeconds: number;
  totalSeconds: number;
  learningPathId: string | null;
  topic: string;
  isSaving: boolean;
  setPreset: (minutes: number) => void;
  setLearningPathId: (id: string | null) => void;
  setTopic: (topic: string) => void;
  toggle: () => void;
  reset: () => void;
  saveElapsed: () => Promise<boolean>;
  onSessionLogged: (cb: () => void) => () => void;
}

const FocusTimerContext = createContext<FocusTimerContextValue | null>(null);

export const FocusTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [state, setState] = useState<PersistedTimerState>(loadInitialState);
  const [isSaving, setIsSaving] = useState(false);
  const listenersRef = useRef<Set<() => void>>(new Set());
  const savingLockRef = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota error
    }
  }, [state]);

  const notifySessionLogged = useCallback(() => {
    listenersRef.current.forEach((cb) => cb());
  }, []);

  const persistSession = useCallback(
    async (minutesToLog: number, current: PersistedTimerState): Promise<boolean> => {
      if (!isAuthenticated || current.sessionSaved || savingLockRef.current) return false;
      savingLockRef.current = true;
      setIsSaving(true);

      try {
        await studyService.createSession({
          learningPathId: current.learningPathId || null,
          topic: current.topic.trim() || 'Focus session',
          minutes: Math.max(1, minutesToLog),
          sessionDate: toIsoDate(),
          startedAtUtc: current.startedAtUtc ?? undefined,
          completedAtUtc: new Date().toISOString(),
          clientSessionKey: current.clientSessionKey
        });

        setState((prev) => ({ ...prev, sessionSaved: true }));
        notifySessionLogged();
        return true;
      } catch (err) {
        showToast(parseApiError(err, 'Could not save focus session.').message, 'error');
        return false;
      } finally {
        savingLockRef.current = false;
        setIsSaving(false);
      }
    },
    [isAuthenticated, notifySessionLogged, showToast]
  );

  // Tick interval based on endTimestampMs so drift or tab switches stay accurate
  useEffect(() => {
    if (state.status !== 'running' || !state.endTimestampMs) return;

    const tick = () => {
      const left = Math.max(0, Math.ceil((state.endTimestampMs! - Date.now()) / 1000));
      if (left <= 0) {
        setState((prev) => {
          if (prev.status !== 'running') return prev;
          return { ...prev, remainingSeconds: 0, status: 'completed', endTimestampMs: null };
        });
      } else {
        setState((prev) => (prev.remainingSeconds === left ? prev : { ...prev, remainingSeconds: left }));
      }
    };

    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [state.status, state.endTimestampMs]);

  // Auto-save exactly once when timer naturally completes
  useEffect(() => {
    if (state.status === 'completed' && !state.sessionSaved && isAuthenticated) {
      persistSession(state.presetMinutes, state).then((ok) => {
        if (ok) {
          showToast('Session complete — added to study time');
        }
      });
    }
  }, [state, isAuthenticated, persistSession, showToast]);

  const setPreset = useCallback((minutes: number) => {
    setState((prev) => ({
      ...prev,
      presetMinutes: minutes,
      status: 'idle',
      remainingSeconds: minutes * 60,
      endTimestampMs: null,
      startedAtUtc: null,
      clientSessionKey: makeSessionKey(),
      sessionSaved: false
    }));
  }, []);

  const setLearningPathId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, learningPathId: id }));
  }, []);

  const setTopic = useCallback((topic: string) => {
    setState((prev) => ({ ...prev, topic }));
  }, []);

  const toggle = useCallback(() => {
    setState((prev) => {
      if (prev.status === 'running') {
        const left = prev.endTimestampMs
          ? Math.max(0, Math.ceil((prev.endTimestampMs - Date.now()) / 1000))
          : prev.remainingSeconds;
        return {
          ...prev,
          status: 'paused',
          remainingSeconds: left,
          endTimestampMs: null
        };
      }

      const startFrom = prev.status === 'completed' || prev.remainingSeconds <= 0
        ? prev.presetMinutes * 60
        : prev.remainingSeconds;
      const freshKey = prev.status === 'completed' ? makeSessionKey() : prev.clientSessionKey;

      return {
        ...prev,
        status: 'running',
        remainingSeconds: startFrom,
        endTimestampMs: Date.now() + startFrom * 1000,
        startedAtUtc: prev.startedAtUtc ?? new Date().toISOString(),
        clientSessionKey: freshKey,
        sessionSaved: prev.status === 'completed' ? false : prev.sessionSaved
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: 'idle',
      remainingSeconds: prev.presetMinutes * 60,
      endTimestampMs: null,
      startedAtUtc: null,
      clientSessionKey: makeSessionKey(),
      sessionSaved: false
    }));
  }, []);

  const saveElapsed = useCallback(async () => {
    const total = state.presetMinutes * 60;
    const elapsedSeconds = total - state.remainingSeconds;
    if (elapsedSeconds <= 0) {
      showToast('Start a session first');
      return false;
    }
    const mins = Math.max(1, Math.round(elapsedSeconds / 60));
    const ok = await persistSession(mins, state);
    if (ok) {
      showToast('Study session saved');
      reset();
    }
    return ok;
  }, [persistSession, reset, showToast, state]);

  const onSessionLogged = useCallback((cb: () => void) => {
    listenersRef.current.add(cb);
    return () => {
      listenersRef.current.delete(cb);
    };
  }, []);

  return (
    <FocusTimerContext.Provider
      value={{
        presetMinutes: state.presetMinutes,
        status: state.status,
        remainingSeconds: state.remainingSeconds,
        totalSeconds: state.presetMinutes * 60,
        learningPathId: state.learningPathId,
        topic: state.topic,
        isSaving,
        setPreset,
        setLearningPathId,
        setTopic,
        toggle,
        reset,
        saveElapsed,
        onSessionLogged
      }}
    >
      {children}
    </FocusTimerContext.Provider>
  );
};

export function useFocusTimer(): FocusTimerContextValue {
  const ctx = useContext(FocusTimerContext);
  if (!ctx) throw new Error('useFocusTimer must be used within FocusTimerProvider');
  return ctx;
}

