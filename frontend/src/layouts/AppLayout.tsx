import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { DayformIcon } from '../components/common/DayformIcon';
import { GlobalSearchModal } from '../components/common/GlobalSearchModal';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { PinLockModal } from '../components/common/PinLockModal';
import { PwaInstallModal } from '../components/common/PwaInstallModal';
import { QuickCaptureModal } from '../components/common/QuickCaptureModal';
import { MobileMoreSheet } from '../components/layout/MobileMoreSheet';
import { QuickAddModal } from '../components/layout/QuickAddModal';
import { useAuth } from '../contexts/AuthContext';
import { usePwa } from '../utils/usePwa';

// Primary 5 Mobile Navigation Tabs
const PRIMARY_MOBILE_TABS = [
  { to: '/', label: 'HOME', icon: 'home', end: true },
  { to: '/habits', label: 'HABITS', icon: 'habit', end: false },
  { to: '/study', label: 'STUDY', icon: 'book', end: false },
  { to: '/planner', label: 'PLANNER', icon: 'cal', end: false }
] as const;

// Desktop Navigation - Preserves all 8 sections
const DESKTOP_NAV = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/habits', label: 'Habits', icon: 'habit', end: false },
  { to: '/study', label: 'Study', icon: 'book', end: false },
  { to: '/planner', label: 'Planner', icon: 'cal', end: false },
  { to: '/memories', label: 'Memories', icon: 'img', end: false },
  { to: '/balance', label: 'Balance', icon: 'wallet', end: false },
  { to: '/progress', label: 'Progress', icon: 'chart', end: false },
  { to: '/profile', label: 'Profile', icon: 'user', end: false }
] as const;

const MORE_ROUTES = ['/balance', '/progress', '/memories', '/journal', '/health', '/profile'];

export const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);

  const {
    canInstall,
    hasNativePrompt,
    isInstalled,
    isOnline,
    isIOS,
    swUpdateAvailable,
    triggerInstall,
    reloadToUpdate
  } = usePwa();

  // App Lock PIN check
  const [isPinLocked, setIsPinLocked] = useState(() => {
    return Boolean(user?.hasAppPin && sessionStorage.getItem('grandline_pin_unlocked') !== 'true');
  });

  useEffect(() => {
    if (user?.hasAppPin && sessionStorage.getItem('grandline_pin_unlocked') !== 'true') {
      setIsPinLocked(true);
    } else {
      setIsPinLocked(false);
    }
  }, [user?.hasAppPin]);

  const initial = (user?.displayName?.trim()?.[0] || 'G').toUpperCase();
  const isMoreRouteActive = MORE_ROUTES.some((r) => location.pathname.startsWith(r));

  if (isPinLocked) {
    return <PinLockModal onUnlock={() => setIsPinLocked(false)} />;
  }

  return (
    <div className="df-shell">
      {/* Offline & Update Banner */}
      <OfflineBanner
        isOnline={isOnline}
        onUpdateAvailable={swUpdateAvailable}
        onReloadUpdate={reloadToUpdate}
      />

      <header className="df-header v4-header">
        <div className="row" style={{ alignItems: 'center', gap: 10 }}>
          <NavLink to="/" className="df-logo" aria-label="Grandline Home">
            <b className="df-logo-mark" style={{ background: '#3B28CC', color: '#FFFFFF', borderRadius: 10 }}>⚓</b>
            <span>GRANDLINE</span>
          </NavLink>

          {/* Cloud Sync Status Pill */}
          <div
            className="row sync-badge v4-sync-badge"
            title={isOnline ? 'Cloud synchronised and up-to-date' : 'Offline - local cache active'}
          >
            <span
              className="sync-dot v4-sync-dot"
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: isOnline ? '#10B981' : '#B8752B',
                display: 'inline-block'
              }}
            />
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em' }} className="sync-text">
              {isOnline ? 'SYNC' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <div className="df-header-actions" style={{ alignItems: 'center' }}>
          {/* PWA Install Button when installable and not yet installed - Desktop only */}
          {canInstall && !isInstalled && (
            <button
              type="button"
              className="btn pri sm install-header-btn desktop-only"
              onClick={() => setInstallModalOpen(true)}
              title="Install Grandline Web App"
              style={{ padding: '5px 10px', fontSize: 12, gap: 5 }}
            >
              <DayformIcon name="download" size={14} />
              <span className="install-text">Install App</span>
            </button>
          )}

          {/* Search Icon Button */}
          <button
            type="button"
            className="ib header-btn"
            onClick={() => setSearchOpen(true)}
            aria-label="Global Search (Ctrl+K)"
            title="Global Search (Ctrl+K)"
          >
            <DayformIcon name="search" size={17} />
          </button>

          {/* Desktop-only Quick Access to Journal & Planner */}
          <button
            type="button"
            className="ib header-btn desktop-only"
            onClick={() => navigate('/journal')}
            aria-label="Journal"
            title="Daily Reflection Journal"
          >
            <DayformIcon name="pen" size={17} />
          </button>
          <button
            type="button"
            className="ib header-btn desktop-only"
            onClick={() => navigate('/planner')}
            aria-label="Planner"
            title="Calendar & Tasks Planner"
          >
            <DayformIcon name="cal" size={17} />
          </button>

          {/* Quick Add Icon Button */}
          <button
            type="button"
            className="v4-btn-quick-add header-btn"
            onClick={() => setQuickAddOpen(true)}
            aria-label="Quick add"
            title="Quick Add Habit or Session"
          >
            <DayformIcon name="plus" size={18} />
          </button>

          {/* Profile Avatar Button */}
          <button
            type="button"
            className="av header-av"
            onClick={() => navigate('/profile')}
            aria-label="Profile"
            title="Account & Settings"
            style={{ width: 34, height: 34, fontSize: 13, border: '2px solid #E5E7EB' }}
          >
            {initial}
          </button>
        </div>
      </header>

      <div className="df-body">
        <aside className="df-sidebar" aria-label="Sidebar navigation">
          {DESKTOP_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `df-side-link ${isActive ? 'on' : ''}`}
            >
              <DayformIcon name={item.icon} size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button
            type="button"
            className="btn pri f"
            style={{ marginTop: 8 }}
            onClick={() => setQuickAddOpen(true)}
          >
            <DayformIcon name="plus" size={16} />
            <span>Quick add</span>
          </button>

          {canInstall && !isInstalled && (
            <button
              type="button"
              className="btn sec f"
              style={{ marginTop: 6 }}
              onClick={() => setInstallModalOpen(true)}
            >
              <DayformIcon name="download" size={15} />
              <span>Install PWA</span>
            </button>
          )}
        </aside>

        <main className="df-main">
          <Outlet />
        </main>
      </div>

      {/* Exactly 5 items in Mobile Bottom Navigation */}
      <nav className="nv" aria-label="Primary navigation">
        <div className="nv-grid">
          {PRIMARY_MOBILE_TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => `nv-btn ${isActive ? 'on' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <span>
                    <DayformIcon name={tab.icon} size={18} />
                  </span>
                  <span style={{ fontSize: 9.5, fontWeight: isActive ? 700 : 600, letterSpacing: '0.04em' }}>
                    {tab.label}
                  </span>
                  {isActive && <span className="v4-nav-dot" />}
                </>
              )}
            </NavLink>
          ))}

          {/* 5th Navigation Item: More */}
          <button
            type="button"
            className={`nv-btn ${isMoreRouteActive || moreSheetOpen ? 'on' : ''}`}
            onClick={() => setMoreSheetOpen(true)}
            aria-label="More navigation and features"
            aria-expanded={moreSheetOpen}
          >
            <span>
              <DayformIcon name="more" size={18} />
            </span>
            <span style={{ fontSize: 9.5, fontWeight: (isMoreRouteActive || moreSheetOpen) ? 700 : 600, letterSpacing: '0.04em' }}>
              MORE
            </span>
            {(isMoreRouteActive || moreSheetOpen) && <span className="v4-nav-dot" />}
          </button>
        </div>
      </nav>

      {/* Modals & Sheets */}
      <QuickAddModal isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      <QuickCaptureModal isOpen={quickCaptureOpen} onClose={() => setQuickCaptureOpen(false)} />
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileMoreSheet
        isOpen={moreSheetOpen}
        onClose={() => setMoreSheetOpen(false)}
        onOpenQuickCapture={() => setQuickCaptureOpen(true)}
        onOpenInstallModal={() => setInstallModalOpen(true)}
        canInstall={canInstall && !isInstalled}
      />
      <PwaInstallModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        onInstall={triggerInstall}
        hasNativePrompt={hasNativePrompt}
        isIOS={isIOS}
      />
    </div>
  );
};
