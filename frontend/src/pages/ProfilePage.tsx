import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DayformIcon } from '../components/common/DayformIcon';
import { PageHeader } from '../components/common/PageHeader';
import { PwaInstallModal } from '../components/common/PwaInstallModal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { parseApiError } from '../services/api/apiError';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import type { ThemePreference } from '../types/api';
import { toIsoDate } from '../utils/date';
import { applyThemePreference } from '../utils/theme';
import { usePwa } from '../utils/usePwa';

const THEMES: ThemePreference[] = ['Auto', 'Light', 'Dark'];

export const ProfilePage: React.FC = () => {
  const { user, setUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { canInstall, hasNativePrompt, isInstalled, isIOS, triggerInstall } = usePwa();
  const [pwaModalOpen, setPwaModalOpen] = useState(false);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [timeZoneId, setTimeZoneId] = useState(user?.timeZoneId ?? 'UTC');
  const [journeyStartDate, setJourneyStartDate] = useState(user?.journeyStartDate ?? toIsoDate());
  const [theme, setTheme] = useState<ThemePreference>(user?.themePreference ?? 'Auto');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  // PIN App Lock state
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  // Restore backup state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoring, setRestoring] = useState(false);

  // Delete account state
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteAccountBusy, setDeleteAccountBusy] = useState(false);

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

  const handleExportJson = async () => {
    setExporting(true);
    try {
      const data = await profileService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grandline-backup-${toIsoDate()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('Full JSON backup downloaded');
    } catch (err) {
      showToast(parseApiError(err, 'Could not export data.').message, 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const csv = await profileService.exportCsv();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grandline-habits-${toIsoDate()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('CSV habits data downloaded');
    } catch (err) {
      showToast(parseApiError(err, 'Could not export CSV.').message, 'error');
    }
  };

  const handleExportCalendarIcs = () => {
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Grandline Daily Tracker//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nX-WR-CALNAME:Grandline Planner\nBEGIN:VEVENT\nSUMMARY:Daily Grandline Habit Check-in\nDESCRIPTION:Stay relentless. Track habits and deep work.\nRRULE:FREQ=DAILY\nSTATUS:CONFIRMED\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grandline-planner-${toIsoDate()}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('iCalendar (.ics) export downloaded');
  };

  const handleExportPdf = () => {
    window.print();
    showToast('Print / Save to PDF dialog opened');
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoring(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      await profileService.restoreBackup(json);
      showToast('Data restored successfully! Refreshing...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      showToast(parseApiError(err, 'Could not restore backup file.').message, 'error');
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length !== 4 || !/^\d{4}$/.test(pinInput)) {
      showToast('PIN must be exactly 4 digits (0-9)', 'error');
      return;
    }
    setSavingPin(true);
    try {
      await profileService.setPin(pinInput);
      if (user) setUser({ ...user, hasAppPin: true });
      showToast('App lock PIN set successfully! 🛡️');
      setPinDialogOpen(false);
      setPinInput('');
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    } finally {
      setSavingPin(false);
    }
  };

  const handleRemovePin = async () => {
    if (!window.confirm('Remove app lock PIN protection?')) return;
    try {
      await profileService.setPin(null);
      if (user) setUser({ ...user, hasAppPin: false });
      showToast('App lock PIN removed');
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteAccountBusy(true);
    try {
      await profileService.deleteAccount();
      showToast('Account permanently deleted. Safe travels.');
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    } finally {
      setDeleteAccountBusy(false);
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
      <PageHeader eyebrow="Your space" title="Profile & Preferences" subtitle="Account, security PIN, backups, and data ownership." />

      <div
        className="cd"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '14px 18px',
          marginBottom: 16
        }}
      >
        <div
          className="av"
          style={{ width: 48, height: 48, fontSize: 18, flexShrink: 0 }}
          aria-hidden="true"
        >
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <b className="d" style={{ fontSize: 17 }}>{user?.displayName}</b>
            {user?.isDemoUser && (
              <span className="badge badge-personal badge-sm">Demo Mode</span>
            )}
            <span className="badge badge-active badge-sm">{user?.themePreference || 'Auto'} Theme</span>
          </div>
          <div className="mut" style={{ fontSize: 12.5 }}>{user?.email}</div>
        </div>

        <button
          type="button"
          className="btn sec sm"
          onClick={handleSignOut}
          style={{ gap: 6, flexShrink: 0 }}
        >
          <DayformIcon name="signout" size={14} />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="df-grid-2">
        <form className="cd" onSubmit={handleSave}>
          <b className="d" style={{ display: 'block', marginBottom: 12, fontSize: 16 }}>
            Personal Details
          </b>

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

          <div className="g2 profile-journey-tz-grid">
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* App Lock / Security PIN */}
          <div className="cd">
            <b className="d" style={{ display: 'block', marginBottom: 6, fontSize: 16 }}>
              🛡️ App Lock / PIN Protection
            </b>
            <p className="mut" style={{ margin: '0 0 14px', fontSize: 13 }}>
              {user?.hasAppPin
                ? 'App Lock is enabled with a 4-digit security PIN.'
                : 'Protect your journal and personal logs with a 4-digit PIN.'}
            </p>

            <div className="row" style={{ gap: 8 }}>
              <button
                type="button"
                className="btn pri"
                onClick={() => setPinDialogOpen(true)}
                style={{ fontSize: 13 }}
              >
                {user?.hasAppPin ? 'Change PIN' : 'Set 4-Digit PIN'}
              </button>
              {user?.hasAppPin && (
                <button
                  type="button"
                  className="btn sec"
                  onClick={handleRemovePin}
                  style={{ fontSize: 13 }}
                >
                  Disable PIN
                </button>
              )}
            </div>
          </div>

          {/* Progressive Web App (PWA) Section */}
          <div className="cd">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <b className="d" style={{ fontSize: 16 }}>
                📱 Mobile App & PWA
              </b>
              <span className={`badge ${isInstalled ? 'badge-completed' : 'badge-info'}`}>
                {isInstalled ? 'App Installed' : 'Browser Mode'}
              </span>
            </div>
            <p className="mut" style={{ margin: '0 0 14px', fontSize: 13 }}>
              {isInstalled
                ? 'Grandline is running in standalone mobile/desktop app mode with offline storage.'
                : 'Install Grandline to your phone home screen or desktop for fast offline launch.'}
            </p>

            <button
              type="button"
              className={`btn ${isInstalled ? 'sec' : 'pri'} f`}
              onClick={() => setPwaModalOpen(true)}
            >
              <DayformIcon name="download" size={15} />
              <span>{isInstalled ? 'PWA Details & Guidance' : canInstall ? 'Install Grandline App' : 'Installation Guidance'}</span>
            </button>
          </div>

          {/* Data Export & Backup */}
          <div className="cd">
            <b className="d" style={{ display: 'block', marginBottom: 6, fontSize: 16 }}>
              Data Ownership & Exports
            </b>
            <p className="mut" style={{ margin: '0 0 14px', fontSize: 13 }}>
              Export or restore your records in standard non-proprietary formats.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="profile-exports-grid">
                <button type="button" className="btn sec f" onClick={handleExportJson} disabled={exporting}>
                  <DayformIcon name="copy" size={15} />
                  <span>{exporting ? 'Preparing export…' : 'Export Full Backup (JSON)'}</span>
                </button>

                <button type="button" className="btn sec f" onClick={handleExportCsv}>
                  <DayformIcon name="habit" size={15} />
                  <span>Export Habit Records (CSV)</span>
                </button>

                <button type="button" className="btn sec f" onClick={handleExportPdf}>
                  <DayformIcon name="pen" size={15} />
                  <span>Print & Save Summary Report (PDF)</span>
                </button>

                <button type="button" className="btn sec f" onClick={handleExportCalendarIcs}>
                  <DayformIcon name="cal" size={15} />
                  <span>Export Calendar Schedule (.ICS)</span>
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleRestoreFile}
              />

              <button
                type="button"
                className="btn sec f"
                disabled={restoring}
                onClick={() => fileInputRef.current?.click()}
              >
                <DayformIcon name="reset" size={15} />
                <span>{restoring ? 'Restoring backup…' : 'Restore from JSON Backup'}</span>
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="cd" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <b className="d" style={{ display: 'block', marginBottom: 6, fontSize: 16, color: '#dc2626' }}>
              Account & Danger Zone
            </b>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {canResetDemo ? (
                <button
                  type="button"
                  className="btn sec f"
                  onClick={() => setResetDialogOpen(true)}
                >
                  <DayformIcon name="reset" size={15} />
                  <span>Reset dev demo data</span>
                </button>
              ) : null}

              <button type="button" className="btn dg f" onClick={handleSignOut}>
                Sign out
              </button>

              <button
                type="button"
                className="btn dg f"
                onClick={() => setDeleteAccountOpen(true)}
              >
                <DayformIcon name="trash" size={15} />
                <span>Delete Account & Wipe All Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PIN Dialog */}
      {pinDialogOpen && (
        <div className="sheet-backdrop" onClick={() => setPinDialogOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 18 }}>Set 4-Digit Security PIN</h3>
            <p className="mut" style={{ margin: '0 0 16px', fontSize: 13 }}>
              Choose a 4-digit code to protect your local session.
            </p>

            <form onSubmit={handleSetPin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="lbl">4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  pattern="\d{4}"
                  placeholder="••••"
                  className="inp"
                  style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  autoFocus
                  required
                />
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn sec" onClick={() => setPinDialogOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn pri" disabled={savingPin || pinInput.length !== 4}>
                  {savingPin ? 'Saving...' : 'Set PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Demo Dialog */}
      <ConfirmDialog
        isOpen={resetDialogOpen}
        title="Reset development demo data"
        message="Restore the 5-month deterministic demo dataset for this development account?"
        confirmLabel="Restore demo data"
        isBusy={resetBusy}
        onConfirm={handleResetDemo}
        onCancel={() => setResetDialogOpen(false)}
      />

      {/* Delete Account Dialog */}
      <ConfirmDialog
        isOpen={deleteAccountOpen}
        title="Permanently Delete Account"
        message="Are you completely sure? This will irrevocably delete your profile, all habits, study sessions, goals, notes, memories, and financial transactions. This action cannot be reversed."
        confirmLabel="Permanently Delete Account"
        isBusy={deleteAccountBusy}
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteAccountOpen(false)}
      />

      {/* PWA Install Modal */}
      <PwaInstallModal
        isOpen={pwaModalOpen}
        onClose={() => setPwaModalOpen(false)}
        onInstall={triggerInstall}
        hasNativePrompt={hasNativePrompt}
        isIOS={isIOS}
      />
    </>
  );
};
