import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { DayformIcon } from '../components/common/DayformIcon';
import { GlobalSearchModal } from '../components/common/GlobalSearchModal';
import { PinLockModal } from '../components/common/PinLockModal';
import { QuickAddModal } from '../components/layout/QuickAddModal';
import { useAuth } from '../contexts/AuthContext';

const MOBILE_TABS = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/habits', label: 'Habits', icon: 'habit', end: false },
  { to: '/study', label: 'Study', icon: 'book', end: false },
  { to: '/planner', label: 'Planner', icon: 'cal', end: false },
  { to: '/balance', label: 'Balance', icon: 'wallet', end: false },
  { to: '/progress', label: 'Progress', icon: 'chart', end: false }
] as const;

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

export const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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

  const initial = (user?.displayName?.trim()?.[0] || 'A').toUpperCase();

  if (isPinLocked) {
    return <PinLockModal onUnlock={() => setIsPinLocked(false)} />;
  }

  return (
    <div className="df-shell">
      <header className="df-header">
        <NavLink to="/" className="df-logo" aria-label="Grandline Home">
          <b className="df-logo-mark">G</b>
          <span>GRANDLINE</span>
        </NavLink>

        <div className="df-header-actions" style={{ alignItems: 'center' }}>
          {/* Cloud Sync Status Indicator */}
          <div
            className="row"
            style={{ gap: 6, alignItems: 'center', padding: '4px 8px', borderRadius: 12, background: 'var(--sf)' }}
            title="Cloud synchronised and up-to-date"
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 500 }} className="mut">Synced</span>
          </div>

          <button
            type="button"
            className="ib"
            onClick={() => setSearchOpen(true)}
            aria-label="Global Search (Ctrl+K)"
            title="Global Search (Ctrl+K)"
          >
            <DayformIcon name="search" />
          </button>
          <button type="button" className="ib" onClick={() => navigate('/journal')} aria-label="Journal">
            <DayformIcon name="pen" />
          </button>
          <button type="button" className="ib" onClick={() => navigate('/planner')} aria-label="Planner">
            <DayformIcon name="cal" />
          </button>
          <button type="button" className="ib" onClick={() => setQuickAddOpen(true)} aria-label="Quick add">
            <DayformIcon name="plus" />
          </button>
          <button type="button" className="av" onClick={() => navigate('/profile')} aria-label="Profile">
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
        </aside>

        <main className="df-main">
          <Outlet />
        </main>
      </div>

      <nav className="nv" aria-label="Primary navigation">
        <div className="nv-grid">
          {MOBILE_TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => `nv-btn ${isActive ? 'on' : ''}`}
            >
              <span>
                <DayformIcon name={tab.icon} size={19} />
              </span>
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <QuickAddModal isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};
