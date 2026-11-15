import React from 'react';
import { SheetModal } from './SheetModal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  isBusy = false,
  onConfirm,
  onCancel
}) => {
  return (
    <SheetModal isOpen={isOpen} title={title} onClose={onCancel}>
      <p style={{ marginTop: 0 }}>{message}</p>
      <div className="row" style={{ marginTop: 14 }}>
        <button type="button" className="btn sec" style={{ flex: 1 }} onClick={onCancel} disabled={isBusy}>
          Cancel
        </button>
        <button type="button" className="btn dg" style={{ flex: 1 }} onClick={onConfirm} disabled={isBusy}>
          {isBusy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </SheetModal>
  );
};

