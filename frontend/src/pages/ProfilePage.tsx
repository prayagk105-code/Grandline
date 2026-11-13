import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DayformIcon } from '../components/common/DayformIcon';
import { PageHeader } from '../components/common/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { parseApiError } from '../services/api/apiError';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import type { ThemePreference } from '../types/api';
import { toIsoDate } from '../utils/date';
import { applyThemePreference } from '../utils/theme';

const THEMES: ThemePreference[] = ['Auto', 'Light', 'Dark'];

export const ProfilePage: React.FC = () => {
  const { user, setUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [timeZoneId, setTimeZoneId] = useState(user?.timeZoneId ?? 'UTC');
  const [journeyStartDate, setJourneyStartDate] = useState(user?.journeyStartDate ?? toIsoDate());
  const [theme, setTheme] = useState<ThemePreference>(user?.themePreference ?? 'Auto');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setTimeZoneId(user.timeZoneId);
      setJourneyStartDate(user.journeyStartDate);
      setTheme(user.themePreference);
    }
  }, [user]);

  const handleThemeChange = async (next: ThemePreference) => {
    setTheme(next);
    applyThemePreference(next);
    if (!user) return;
    try {
      const updated = await profileService.update({
        displayName: displayName.trim() || user.displayName,
        themePreference: next,
        timeZoneId,
        journeyStartDate
      });
      setUser(updated);
    } catch (err) {
      showToast(parseApiError(err, 'Could not save theme preference.').message, 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      showToast('Display name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const updated = await profileService.update({
        displayName: displayName.trim(),
        themePreference: theme,
        timeZoneId: timeZoneId.trim() || 'UTC',
        journeyStartDate
      });
      setUser(updated);
      applyThemePreference(updated.themePreference);
      showToast('Profile updated');
    } catch (err) {
      showToast(parseApiError(err, 'Could not update profile.').message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await profileService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dayform-backup-${toIsoDate()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('Backup file downloaded');
    } catch (err) {
      showToast(parseApiError(err, 'Could not export data.').message, 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleResetDemo = async () => {
    setResetBusy(true);
    try {
      await authService.resetDemoData();
      showToast('Demo data restored');
      setResetDialogOpen(false);
    } catch (err) {
      showToast(parseApiError(err, 'Could not reset demo data.').message, 'error');
    } finally {
      setResetBusy(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const initial = (user?.displayName?.trim()?.[0] || 'A').toUpperCase();
  const canResetDemo = import.meta.env.DEV && Boolean(user?.isDemoUser);

  return (
    <>
      <PageHeader eyebrow="Your space" title="Profile" subtitle="Account and preferences." />

      <div className="cd" style={{ textAlign: 'center' }}>
        <div
          className="av"
          style={{ width: 64, height: 64, margin: '0 auto 10px', fontSize: 22 }}
          aria-hidden="true"
        >
          {initial}
        </div>
        <b className="d" style={{ fontSize: 18 }}>{user?.displayName}</b>
        <div className="mut">{user?.email}</div>
      </div>

      <div className="df-grid-2">
        <form className="cd" onSubmit={handleSave}>
          <div className="f">
            <label htmlFor="prof-name">Display name</label>
            <input
              id="prof-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="f">
            <label htmlFor="prof-email">Email</label>
            <input id="prof-email" type="email" value={user?.email ?? ''} disabled />
          </div>

          <div className="g2 g2-stack-mobile">
            <div className="f">
              <label htmlFor="prof-journey">Journey start date</label>
              <input
                id="prof-journey"
                type="date"
                max={toIsoDate()}
                value={journeyStartDate}
                onChange={(e) => setJourneyStartDate(e.target.value)}
              />
            </div>
            <div className="f">
              <label htmlFor="prof-tz">Time zone</label>
              <input
                id="prof-tz"
                type="text"
                value={timeZoneId}
                onChange={(e) => setTimeZoneId(e.target.value)}
              />
            </div>
          </div>

          <div className="f">
            <label>Appearance</label>
            <div className="seg" role="radiogroup" aria-label="Theme appearance">
              {THEMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={theme === t ? 'on' : ''}
                  onClick={() => handleThemeChange(t)}
                  aria-pressed={theme === t}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn pri f" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>

        <div className="cd" style={{ alignSelf: 'start' }}>
          <b className="d" style={{ display: 'block', marginBottom: 12, fontSize: 16 }}>
            Data & session
          </b>
          <button type="button" className="btn f" onClick={handleExport} disabled={exporting}>
            <DayformIcon name="copy" size={16} />
            <span>{exporting ? 'Preparing export…' : 'Export my data (JSON)'}</span>
          </button>

          {canResetDemo ? (
            <button
              type="button"
              className="btn f"
              style={{ marginTop: 8 }}
              onClick={() => setResetDialogOpen(true)}
            >
              <DayformIcon name="reset" size={16} />
              <span>Reset dev demo data</span>
            </button>
          ) : null}

          <button type="button" className="btn dg f" style={{ marginTop: 8 }} onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={resetDialogOpen}
        title="Reset development demo data"
        message="Restore the 5-month deterministic demo dataset for this development account?"
        confirmLabel="Restore demo data"
        isBusy={resetBusy}
        onConfirm={handleResetDemo}
        onCancel={() => setResetDialogOpen(false)}
      />
    </>
  );
};

