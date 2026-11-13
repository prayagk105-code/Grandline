import React, { useEffect } from 'react';
import { DayformIcon } from './DayformIcon';

interface SheetModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const SheetModal: React.FC<SheetModalProps> = ({ isOpen, title, onClose, children }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="sh"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sb">
        <div className="sh-h">
          <h3>{title}</h3>
          <button type="button" className="ib" onClick={onClose} aria-label="Close">
            <DayformIcon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

