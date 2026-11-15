import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../contexts/ToastContext';
import { AuthProvider } from '../contexts/AuthContext';
import { FocusTimerProvider } from '../contexts/FocusTimerContext';
import { AppLayout } from '../layouts/AppLayout';
import { HabitsPage } from '../pages/HabitsPage';
import { JournalPage } from '../pages/JournalPage';
import { MemoriesPage } from '../pages/MemoriesPage';
import { ProfilePage } from '../pages/ProfilePage';
import { StudyPage } from '../pages/StudyPage';
import { habitService } from '../services/habitService';
import { journalService } from '../services/journalService';
import { memoryService } from '../services/memoryService';
import { profileService } from '../services/profileService';
import { studyService } from '../services/studyService';
import { authService } from '../services/authService';

vi.mock('../services/authService', () => ({
  authService: {
    refresh: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    demoLogin: vi.fn(),
    logout: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    me: vi.fn(),
    resetDemoData: vi.fn()
  }
}));

vi.mock('../services/habitService', () => ({
  habitService: {
    getAll: vi.fn(),
    getSummary: vi.fn(),
    getHeatmap: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    setLog: vi.fn()
  }
}));

vi.mock('../services/studyService', () => ({
  studyService: {
    getLearningPaths: vi.fn(),
    createLearningPath: vi.fn(),
    updateLearningPath: vi.fn(),
    deleteLearningPath: vi.fn(),
    getSessions: vi.fn(),
    getSummary: vi.fn(),
    createSession: vi.fn(),
    updateSession: vi.fn(),
    deleteSession: vi.fn()
  }
}));

vi.mock('../services/journalService', () => ({
  journalService: {
    getByDate: vi.fn(),
    getAll: vi.fn(),
    upsert: vi.fn()
  }
}));

vi.mock('../services/personalDevelopmentService', () => ({
  personalDevelopmentService: {
    getTodayMoodLog: vi.fn().mockResolvedValue(null),
    upsertMoodLog: vi.fn().mockResolvedValue(null)
  }
}));

vi.mock('../services/memoryService', () => ({
  memoryService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    uploadImage: vi.fn(),
    deleteImage: vi.fn()
  }
}));

vi.mock('../services/profileService', () => ({
  profileService: {
    get: vi.fn(),
    update: vi.fn(),
    exportData: vi.fn()
  }
}));

function wrap(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <AuthProvider>
          <FocusTimerProvider>{ui}</FocusTimerProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('Core feature pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.refresh).mockResolvedValue(null);
  });

  it('renders Habits empty state, creates, edits, deletes, and toggles check-in', async () => {
    const user = userEvent.setup();
    const createdHabit = {
      id: 'h1',
      name: 'Morning walk',
      category: 'Health',
      target: '20 min',
      icon: 'leaf',
      isActive: true,
      completedToday: false,
      createdAtUtc: '2026-11-12T00:00:00Z'
    };

    vi.mocked(habitService.getAll).mockResolvedValueOnce([]).mockResolvedValue([createdHabit]);
    vi.mocked(habitService.getSummary).mockResolvedValue({
      weeklyAveragePercent: 0,
      currentStreakDays: 0,
      bestStreakDays: 0,
      activeCount: 0
    });
    vi.mocked(habitService.getHeatmap).mockResolvedValue([]);
    vi.mocked(habitService.create).mockResolvedValue(createdHabit);
    vi.mocked(habitService.update).mockResolvedValue({ ...createdHabit, name: 'Evening walk' });
    vi.mocked(habitService.remove).mockResolvedValue();
    vi.mocked(habitService.setLog).mockResolvedValue({
      id: 'log1',
      habitId: 'h1',
      logDate: '2026-11-12',
      isCompleted: true
    });

    wrap(<HabitsPage />);

    expect(await screen.findByText('No habits here')).toBeInTheDocument();
    const openButtons = screen.getAllByRole('button', { name: 'Add habit' });
    await user.click(openButtons[0]);
    await user.type(screen.getByLabelText('Habit name'), 'Morning walk');
    const submitButtons = screen.getAllByRole('button', { name: 'Add habit' });
    await user.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => {
      expect(habitService.create).toHaveBeenCalled();
    });
    expect(await screen.findByText('Morning walk')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Complete Morning walk' }));
    expect(habitService.setLog).toHaveBeenCalledWith('h1', expect.any(String), true);

    await user.click(screen.getByRole('button', { name: 'Edit Morning walk' }));
    const nameInput = screen.getByLabelText('Habit name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Evening walk');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => {
      expect(habitService.update).toHaveBeenCalledWith('h1', expect.objectContaining({ name: 'Evening walk' }));
    });

    await user.click(screen.getByRole('button', { name: 'Delete Morning walk' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(habitService.remove).toHaveBeenCalledWith('h1');
    });
  });

  it('renders Habits error state and retries loading', async () => {
    const user = userEvent.setup();
    vi.mocked(habitService.getAll).mockRejectedValueOnce(new Error('Network down')).mockResolvedValueOnce([]);
    vi.mocked(habitService.getSummary).mockResolvedValue({
      weeklyAveragePercent: 0,
      currentStreakDays: 0,
      bestStreakDays: 0,
      activeCount: 0
    });
    vi.mocked(habitService.getHeatmap).mockResolvedValue([]);

    wrap(<HabitsPage />);

    expect(await screen.findByText('Network down')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('No habits here')).toBeInTheDocument();
  });

  it('logs a study session on StudyPage', async () => {
    const user = userEvent.setup();
    vi.mocked(studyService.getLearningPaths).mockResolvedValue([]);
    vi.mocked(studyService.getSummary).mockResolvedValue({
      totalMinutesAllTime: 60,
      totalSessionsAllTime: 2,
      minutesThisWeek: 30
    });
    vi.mocked(studyService.getSessions).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 15,
      totalCount: 0,
      totalPages: 0
    });
    vi.mocked(studyService.createSession).mockResolvedValue({
      id: 's1',
      learningPathId: null,
      learningPathName: 'General study',
      topic: 'PostgreSQL Indexes',
      minutes: 45,
      sessionDate: '2026-11-12',
      createdAtUtc: '2026-11-12T00:00:00Z'
    });

    wrap(<StudyPage />);

    await user.click(await screen.findByRole('button', { name: /Log time/i }));
    await user.type(screen.getByLabelText('Topic'), 'PostgreSQL Indexes');
    const mins = screen.getByLabelText('Minutes');
    await user.clear(mins);
    await user.type(mins, '45');
    await user.click(screen.getByRole('button', { name: 'Save session' }));

    await waitFor(() => {
      expect(studyService.createSession).toHaveBeenCalledWith(
        expect.objectContaining({ topic: 'PostgreSQL Indexes', minutes: 45 })
      );
    });
  });

  it('loads and saves Journal reflection prompts', async () => {
    const user = userEvent.setup();
    vi.mocked(journalService.getByDate).mockResolvedValue(null);
    vi.mocked(journalService.getAll).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      totalCount: 0,
      totalPages: 0
    });
    vi.mocked(journalService.upsert).mockResolvedValue({
      id: 'j1',
      entryDate: '2026-11-12',
      accomplishments: 'Finished API tests',
      distractions: 'Notifications',
      improvements: 'Mute phone',
      createdAtUtc: '2026-11-12T00:00:00Z',
      updatedAtUtc: '2026-11-12T00:00:00Z'
    });

    wrap(<JournalPage />);

    const acc = await screen.findByLabelText('What did I accomplish today?');
    await user.type(acc, 'Finished API tests');
    await user.click(screen.getByRole('button', { name: 'Save reflection' }));

    await waitFor(() => {
      expect(journalService.upsert).toHaveBeenCalled();
    });
    expect(await screen.findByText('Reflection saved')).toBeInTheDocument();
  });

  it('rejects oversized image on Memories upload form', async () => {
    const user = userEvent.setup();
    vi.mocked(memoryService.getAll).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 100,
      totalCount: 0,
      totalPages: 0
    });

    wrap(<MemoriesPage />);

    await user.click(await screen.findByRole('button', { name: 'Add memory' }));
    const fileInput = screen.getByLabelText('Photo (optional, max 5 MB)');
    const bigFile = new File([new Uint8Array(6 * 1024 * 1024)], 'huge.png', { type: 'image/png' });
    await user.upload(fileInput, bigFile);

    expect(await screen.findByText('Photo exceeds the 5 MB maximum size.')).toBeInTheDocument();
  });

  it('persists theme preference and renders responsive navigation', async () => {
    const user = userEvent.setup();
    const demoUser = {
      id: 'u1',
      displayName: 'Alex Morgan',
      email: 'alex@example.com',
      themePreference: 'Auto' as const,
      journeyStartDate: '2026-08-20',
      timeZoneId: 'UTC',
      isDemoUser: false,
      createdAtUtc: '2026-08-20T00:00:00Z'
    };

    vi.mocked(authService.refresh).mockResolvedValue({
      accessToken: 'tok',
      expiresAtUtc: new Date(Date.now() + 60000).toISOString(),
      user: demoUser
    });
    vi.mocked(profileService.update).mockResolvedValue({ ...demoUser, themePreference: 'Dark' });

    render(
      <MemoryRouter initialEntries={['/profile']}>
        <ToastProvider>
          <AuthProvider>
            <FocusTimerProvider>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/profile" element={<ProfilePage />} />
                </Route>
              </Routes>
            </FocusTimerProvider>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    expect(await screen.findByLabelText('Sidebar navigation')).toBeInTheDocument();
    expect(screen.getByLabelText('Primary navigation')).toBeInTheDocument();

    const darkBtn = await screen.findByRole('button', { name: 'Dark' });
    await user.click(darkBtn);

    await waitFor(() => {
      expect(profileService.update).toHaveBeenCalledWith(expect.objectContaining({ themePreference: 'Dark' }));
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });
});
