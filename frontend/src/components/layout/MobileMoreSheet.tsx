import React from 'react';
import { NavLink } from 'react-router-dom';
import { DayformIcon } from '../common/DayformIcon';
import { SheetModal } from '../common/SheetModal';

interface MobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickCapture?: () => void;
  onOpenInstallModal?: () => void;
  canInstall?: boolean;
}

const MORE_SECTIONS = [
  {
    to: '/balance',
    title: 'Balance',
    desc: 'Financial command center, budgets & expenses',
    icon: 'wallet',
    badge: 'Finance'
  },
  {
    to: '/progress',
    title: 'Progress',
    desc: 'Analytics, gamification & milestone journey',
    icon: 'chart',
    badge: 'Stats'
  },
  {
    to: '/memories',
    title: 'Memories',
    desc: 'Milestones, photos & life timeline archive',
    icon: 'img',
    badge: 'Timeline'
  },
  {
    to: '/journal',
    title: 'Journal',
    desc: 'Daily 3-prompt structured evening reflection',
    icon: 'pen',
    badge: 'Daily'
  },
  {
    to: '/health',
    title: 'Health & Lifestyle',
    desc: 'Sleep, hydration, workout & vitality tracker',
    icon: 'heart',
    badge: 'Vitality'
  },
  {
    to: '/profile',
    title: 'Profile & Settings',
    desc: 'Preferences, themes, PIN lock & cloud backups',
    icon: 'user',
    badge: 'System'
  }
] as const;

export const MobileMoreSheet: React.FC<MobileMoreSheetProps> = ({
  isOpen,
  onClose,
  onOpenQuickCapture,
  onOpenInstallModal,
  canInstall
}) => {
  return (
    <SheetModal isOpen={isOpen} onClose={onClose} title="Explore Grandline">
      <div className="more-sheet-content">
        <p className="mut" style={{ margin: '0 0 14px', fontSize: 13 }}>
          Access all modules, personal performance hubs, and app tools.
        </p>

        <div className="more-grid">
          {MORE_SECTIONS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => `more-card ${isActive ? 'active' : ''}`}
            >
              <div className="more-card-icon">
                <DayformIcon name={item.icon} size={20} />
              </div>
              <div className="more-card-info">
                <div className="more-card-header">
                  <b>{item.title}</b>
                  <span className="badge badge-info">{item.badge}</span>
                </div>
                <small>{item.desc}</small>
              </div>
              <div className="more-card-arrow">
                <DayformIcon name="right" size={16} />
              </div>
            </NavLink>
          ))}
        </div>

        <div className="more-actions-row" style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {onOpenQuickCapture && (
            <button
              type="button"
              className="btn sec f"
              style={{ flex: '1 1 140px' }}
              onClick={() => {
                onClose();
                onOpenQuickCapture();
              }}
            >
              <DayformIcon name="zap" size={16} />
              <span>Quick Capture</span>
            </button>
          )}

          {canInstall && onOpenInstallModal && (
            <button
              type="button"
              className="btn pri f"
              style={{ flex: '1 1 140px' }}
              onClick={() => {
                onClose();
                onOpenInstallModal();
              }}
            >
              <DayformIcon name="download" size={16} />
              <span>Install Grandline</span>
            </button>
          )}
        </div>
      </div>
    </SheetModal>
  );
};

