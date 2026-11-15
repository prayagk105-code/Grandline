import React from 'react';
import { DayformIcon } from './DayformIcon';
import { SheetModal } from './SheetModal';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => Promise<boolean | void>;
  hasNativePrompt: boolean;
  isIOS: boolean;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  hasNativePrompt,
  isIOS
}) => {
  const [installing, setInstalling] = React.useState(false);

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      await onInstall();
      onClose();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <SheetModal isOpen={isOpen} onClose={onClose} title="Install Grandline">
      <div className="pwa-modal-body" style={{ textAlign: 'left' }}>
        <div
          className="pwa-app-banner"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px',
            background: 'var(--sf)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 16
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'var(--ac)',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              fontSize: 26,
              fontWeight: 700,
              boxShadow: 'var(--shadow-soft)'
            }}
          >
            ⚓
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b style={{ fontSize: 16, display: 'block' }}>Grandline</b>
            <span className="mut" style={{ fontSize: 12 }}>
              Personal Performance, Study & Life OS
            </span>
          </div>
          <span className="badge badge-success">PWA Ready</span>
        </div>

        <p style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5, margin: '0 0 16px' }}>
          Install Grandline directly onto your home screen or desktop for a fast, native app experience with offline capability and instant loading.
        </p>

        {hasNativePrompt ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              type="button"
              className="btn pri f"
              style={{ height: 44, fontSize: 14 }}
              onClick={handleInstallClick}
              disabled={installing}
            >
              <DayformIcon name="download" size={18} />
              <span>{installing ? 'Installing...' : 'Add to Home Screen'}</span>
            </button>
            <p className="mut" style={{ fontSize: 11, textAlign: 'center', margin: 0 }}>
              Installs natively through your browser without app store downloads.
            </p>
          </div>
        ) : isIOS ? (
          <div className="ios-instructions" style={{ display: 'grid', gap: 12 }}>
            <div
              style={{
                background: 'var(--cd)',
                border: '1px solid var(--ln)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--ac2)',
                  color: 'var(--ac)',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                  flex: 'none'
                }}
              >
                1
              </span>
              <span style={{ fontSize: 13 }}>
                Tap the <strong>Share</strong> button in Safari's toolbar (square with arrow up).
              </span>
            </div>

            <div
              style={{
                background: 'var(--cd)',
                border: '1px solid var(--ln)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--ac2)',
                  color: 'var(--ac)',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                  flex: 'none'
                }}
              >
                2
              </span>
              <span style={{ fontSize: 13 }}>
                Scroll down and select <strong>Add to Home Screen</strong>.
              </span>
            </div>

            <div
              style={{
                background: 'var(--cd)',
                border: '1px solid var(--ln)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--ac2)',
                  color: 'var(--ac)',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                  flex: 'none'
                }}
              >
                3
              </span>
              <span style={{ fontSize: 13 }}>
                Tap <strong>Add</strong> in the top right corner to confirm.
              </span>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--sf)',
              fontSize: 13,
              lineHeight: 1.5
            }}
          >
            <b>Desktop Installation:</b> Click the install icon in your browser's address bar (or browser menu &gt; <em>Install Grandline</em>) to run in a dedicated desktop window.
          </div>
        )}

        <div
          style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: '1px solid var(--ln)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span className="mut" style={{ fontSize: 12 }}>
            Version 2.0 PWA
          </span>
          <button type="button" className="btn outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </SheetModal>
  );
};

