import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { DayformIcon } from '../components/common/DayformIcon';
import { QuickAddModal } from '../components/layout/QuickAddModal';
import { useAuth } from '../contexts/AuthContext';

const MOBILE_TABS = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/habits', label: 'Habits', icon: 'habit', end: false },
  { to: '/study', label: 'Study', icon: 'book', end: false },
  { to: '/memories', label: 'Memories', icon: 'img', end: false },
  { to: '/progress', label: 'Progress', icon: 'chart', end: false }
] as const;

const DESKTOP_NAV = [
  ...MOBILE_TABS,
  { to: '/planner', label: 'Planner', icon: 'cal', end: false },
  { to: '/journal', label: 'Journal', icon: 'pen', end: false },
  { to: '/profile', label: 'Profile', icon: 'user', end: false }
] as const;

export const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const initial = (user?.displayName?.trim()?.[0] || 'A').toUpperCase();

  return (
    <div className="df-shell">
      <header className="df-header">
        <NavLink to="/" className="df-logo" aria-label="DAYFORM Home">
          <b className="df-logo-mark">d</b>
          <span>DAYFORM</span>
        </NavLink>

        <div className="df-header-actions">
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
    </div>
  );
};

