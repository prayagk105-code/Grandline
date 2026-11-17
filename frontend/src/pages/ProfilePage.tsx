import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DayformIcon } from '../components/common/DayformIcon';
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
type ProfileTab = 'overview' | 'security' | 'preferences';

export const ProfilePage: React.FC = () => {
  const { user, setUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { canInstall, hasNativePrompt, isInstalled, isIOS, triggerInstall } = usePwa();
  const [pwaModalOpen, setPwaModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
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
      setEditProfileModalOpen(false);
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
    <div className="v4-page-container">
      {/* V4 Profile Header Card (Screenshot 5) */}
      <div className="v4-profile-header">
        <div className="v4-profile-avatar-wrap">
          <div className="v4-profile-avatar" aria-hidden="true">
            {initial}
          </div>
          <span className="v4-online-dot" title="Online" />
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px', color: '#1E1B4B' }}>
          {user?.displayName || 'Alex Vane'}
        </h1>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: '#6B7280' }}>
          Lead Product Architect & Navigator
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          <span
            style={{
              background: '#EEECFA',
              color: '#3B28CC',
              padding: '4px 12px',
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
            SYNC ACTIVE • V4.2 VAULT
          </span>

          {user?.isDemoUser && (
            <span
              style={{
                background: '#FEF3C7',
                color: '#92400E',
                padding: '4px 10px',
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 700
              }}
            >
              Demo Mode
            </span>
          )}
        </div>
      </div>

      {/* Pill Sub-Navigation Tabs (Screenshot 5) */}
      <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
        <button
          type="button"
          className={`v4-tab-pill ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          👤 Overview
        </button>
        <button
          type="button"
          className={`v4-tab-pill ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          🛡️ Security
        </button>
        <button
          type="button"
          className={`v4-tab-pill ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          ⚙️ Preferences
        </button>
      </div>

      {/* Tab: OVERVIEW (Screenshot 5) */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Card 1: Identity Matrix */}
          <div className="v4-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#EEECFA',
                    color: '#3B28CC',
                    display: 'grid',
                    placeItems: 'center'
                  }}
                >
                  <DayformIcon name="user" size={18} />
                </div>
                <div>
                  <b style={{ fontSize: 15, color: '#1E1B4B', display: 'block' }}>Identity Matrix</b>
                  <small style={{ color: '#6B7280', fontSize: 11.5 }}>Core profile & credentials</small>
                </div>
              </div>

              <button
                type="button"
                style={{
                  background: '#EEECFA',
                  color: '#3B28CC',
                  border: 'none',
                  borderRadius: 9999,
                  padding: '5px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                onClick={() => setEditProfileModalOpen(true)}
              >
                Edit
              </button>
            </div>

            {/* Email verified row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: '#F8FAFD',
                border: '1px solid #EEF2F6',
                borderRadius: 14,
                marginBottom: 10
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <DayformIcon name="envelope" size={16} />
                <div>
                  <b style={{ fontSize: 13, color: '#1E1B4B', display: 'block' }}>{user?.email || 'alex.vane@grandline.os'}</b>
                  <small style={{ color: '#0D9488', fontSize: 11, fontWeight: 600 }}>Verified Enterprise Tier</small>
                </div>
              </div>
              <div style={{ color: '#10B981' }}>
                <DayformIcon name="check" size={16} />
              </div>
            </div>

            {/* Mantra of the Voyage */}
            <div className="v4-mantra-box">
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#6D28D9',
                  display: 'block',
                  marginBottom: 6
                }}
              >
                MANTRA OF THE VOYAGE
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontStyle: 'italic',
                  color: '#4C1D95',
                  lineHeight: 1.45
                }}
              >
                &ldquo;Calm focus in the chaos, unyielding momentum toward the horizon.&rdquo;
              </p>
            </div>
          </div>

          {/* Card 2: Display Studio */}
          <div className="v4-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#CCFBF1',
                  color: '#0D9488',
                  display: 'grid',
                  placeItems: 'center'
                }}
              >
                <DayformIcon name="sparkles" size={18} />
              </div>
              <div>
                <b style={{ fontSize: 15, color: '#1E1B4B', display: 'block' }}>Display Studio</b>
                <small style={{ color: '#6B7280', fontSize: 11.5 }}>Customize your spatial aesthetic</small>
              </div>
            </div>

            {/* Theme options grid (Screenshot 5) */}
            <div className="v4-theme-selector-grid" role="radiogroup" aria-label="Theme appearance">
              {THEMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`v4-theme-card ${theme === t ? 'active' : ''}`}
                  onClick={() => handleThemeChange(t)}
                  aria-pressed={theme === t}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      display: 'grid',
                      placeItems: 'center',
                      background: t === 'Dark' ? '#111827' : t === 'Light' ? '#FFFFFF' : 'linear-gradient(135deg, #6B7280 0%, #1F2937 100%)',
                      color: t === 'Light' ? '#1E1B4B' : '#FFFFFF',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                      border: t === 'Light' ? '1px solid #E5E7EB' : 'none'
                    }}
                  >
                    {t === 'Auto' && <span style={{ fontWeight: 800, fontSize: 14 }}>A</span>}
                    {t === 'Light' && <DayformIcon name="sun" size={18} />}
                    {t === 'Dark' && <DayformIcon name="moon" size={18} />}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: theme === t ? '#3B28CC' : '#4B5563' }}>
                    {t}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Card 3: Data Ownership & Export */}
          <div className="v4-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <b style={{ fontSize: 15, color: '#1E1B4B' }}>Data Ownership & Export</b>
              <span style={{ fontSize: 11.5, color: '#6B7280', fontWeight: 600 }}>Full Control</span>
            </div>

            <div className="v4-export-grid">
              <button type="button" className="v4-export-card" onClick={handleExportJson} disabled={exporting}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: '#EEECFA',
                    color: '#3B28CC',
                    display: 'grid',
                    placeItems: 'center'
                  }}
                >
                  <DayformIcon name="code" size={15} />
                </div>
                <b style={{ fontSize: 13, color: '#1E1B4B' }}>JSON Backup</b>
                <small style={{ color: '#6B7280', fontSize: 11 }}>Raw system snapshot</small>
              </button>

              <button type="button" className="v4-export-card" onClick={handleExportCsv}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: '#CCFBF1',
                    color: '#0D9488',
                    display: 'grid',
                    placeItems: 'center'
                  }}
                >
                  <DayformIcon name="habit" size={15} />
                </div>
                <b style={{ fontSize: 13, color: '#1E1B4B' }}>CSV Records</b>
                <small style={{ color: '#6B7280', fontSize: 11 }}>Habits & metrics log</small>
              </button>

              <button type="button" className="v4-export-card" onClick={handleExportPdf}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: '#FEF3C7',
                    color: '#D97706',
                    display: 'grid',
                    placeItems: 'center'
                  }}
                >
                  <DayformIcon name="pen" size={15} />
                </div>
                <b style={{ fontSize: 13, color: '#1E1B4B' }}>PDF Summary</b>
                <small style={{ color: '#6B7280', fontSize: 11 }}>Monthly reflection</small>
              </button>

              <button type="button" className="v4-export-card" onClick={handleExportCalendarIcs}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: '#E0E7FF',
                    color: '#4338CA',
                    display: 'grid',
                    placeItems: 'center'
                  }}
                >
                  <DayformIcon name="cal" size={15} />
                </div>
                <b style={{ fontSize: 13, color: '#1E1B4B' }}>iCal Sync</b>
                <small style={{ color: '#6B7280', fontSize: 11 }}>External calendar feed</small>
              </button>
            </div>

            {/* Restore from JSON backup button */}
            <div style={{ marginTop: 12 }}>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleRestoreFile}
              />
              <button
                type="button"
                style={{
                  width: '100%',
                  background: '#F8FAFD',
                  border: '1px solid #EEF2F6',
                  borderRadius: 12,
                  padding: '10px 14px',
                  color: '#4B5563',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
                disabled={restoring}
                onClick={() => fileInputRef.current?.click()}
              >
                <DayformIcon name="reset" size={14} />
                <span>{restoring ? 'Restoring backup…' : 'Restore from JSON Backup'}</span>
              </button>
            </div>
          </div>

          {/* Card 4: Danger Zone (Screenshot 5) */}
          <div className="v4-danger-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: '#FEE2E2',
                  color: '#DC2626',
                  display: 'grid',
                  placeItems: 'center'
                }}
              >
                <DayformIcon name="triangle-exclamation" size={16} />
              </div>
              <div>
                <b style={{ fontSize: 14, color: '#991B1B', display: 'block' }}>Danger Zone</b>
                <small style={{ color: '#B91C1C', fontSize: 11 }}>Irreversible account operations</small>
              </div>
            </div>

            {canResetDemo && (
              <button
                type="button"
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: 9999,
                  background: '#FFFFFF',
                  color: '#991B1B',
                  border: '1px solid #FCA5A5',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
                onClick={() => setResetDialogOpen(true)}
              >
                <DayformIcon name="reset" size={14} />
                <span>Reset dev demo data</span>
              </button>
            )}

            <button
              type="button"
              className="v4-btn-signout-all"
              onClick={handleSignOut}
            >
              <span>Sign out from all devices</span>
              <DayformIcon name="signout" size={14} />
            </button>

            <button
              type="button"
              className="v4-btn-purge"
              onClick={() => setDeleteAccountOpen(true)}
            >
              <span>Delete Account & Purge Vault</span>
              <DayformIcon name="trash" size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Tab: SECURITY */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="v4-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#EEECFA',
                  color: '#3B28CC',
                  display: 'grid',
                  placeItems: 'center'
                }}
              >
                <DayformIcon name="shield" size={18} />
              </div>
              <div>
                <b style={{ fontSize: 15, color: '#1E1B4B', display: 'block' }}>App Lock & Security PIN</b>
                <small style={{ color: '#6B7280', fontSize: 11.5 }}>
                  {user?.hasAppPin ? 'App Lock is enabled with a 4-digit security PIN.' : 'Protect your journal and personal vault with a 4-digit PIN.'}
                </small>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                type="button"
                className="btn pri sm"
                onClick={() => setPinDialogOpen(true)}
              >
                {user?.hasAppPin ? 'Change PIN' : 'Set 4-Digit PIN'}
              </button>
              {user?.hasAppPin && (
                <button
                  type="button"
                  className="btn sec sm"
                  onClick={handleRemovePin}
                >
                  Disable PIN
                </button>
              )}
            </div>
          </div>

          <div className="v4-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <b style={{ fontSize: 15, color: '#1E1B4B' }}>Mobile App & PWA Status</b>
              <span className={`badge ${isInstalled ? 'badge-completed' : 'badge-info'}`}>
                {isInstalled ? 'App Installed' : 'Browser Mode'}
              </span>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#6B7280' }}>
              {isInstalled
                ? 'Grandline is running in standalone mobile/desktop app mode with offline storage.'
                : 'Install Grandline to your phone home screen or desktop for fast offline launch.'}
            </p>
            <button
              type="button"
              className="btn sec sm f"
              onClick={() => setPwaModalOpen(true)}
            >
              <DayformIcon name="download" size={14} />
              <span>{isInstalled ? 'PWA Details & Guidance' : canInstall ? 'Install Grandline App' : 'Installation Guidance'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab: PREFERENCES / DETAILS */}
      {activeTab === 'preferences' && (
        <form className="v4-card" onSubmit={handleSaveProfile}>
          <b style={{ display: 'block', marginBottom: 14, fontSize: 16, color: '#1E1B4B' }}>
            Account & System Preferences
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

          <button type="submit" className="v4-btn-primary-full" style={{ marginTop: 12 }} disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      )}

      {/* Edit Profile Modal (opened from Edit button in Overview) */}
      {editProfileModalOpen && (
        <div className="sheet-backdrop" onClick={() => setEditProfileModalOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 18, color: '#1E1B4B' }}>Edit Profile Details</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6B7280' }}>
              Update your identity and display preferences.
            </p>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="f">
                <label htmlFor="modal-prof-name">Display name</label>
                <input
                  id="modal-prof-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>

              <div className="f">
                <label htmlFor="modal-prof-tz">Time zone</label>
                <input
                  id="modal-prof-tz"
                  type="text"
                  value={timeZoneId}
                  onChange={(e) => setTimeZoneId(e.target.value)}
                />
              </div>

              <div className="f">
                <label htmlFor="modal-prof-journey">Journey start date</label>
                <input
                  id="modal-prof-journey"
                  type="date"
                  max={toIsoDate()}
                  value={journeyStartDate}
                  onChange={(e) => setJourneyStartDate(e.target.value)}
                />
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn sec" onClick={() => setEditProfileModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn pri" disabled={saving}>
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIN Dialog */}
      {pinDialogOpen && (
        <div className="sheet-backdrop" onClick={() => setPinDialogOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 18, color: '#1E1B4B' }}>Set 4-Digit Security PIN</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6B7280' }}>
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
    </div>
  );
};

