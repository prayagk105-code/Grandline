import React, { useState } from 'react';
import { parseApiError } from '../../services/api/apiError';
import { profileService } from '../../services/profileService';

interface PinLockModalProps {
  onUnlock: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        verify(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const verify = async (code: string) => {
    setChecking(true);
    setErrorMsg(null);
    try {
      const valid = await profileService.verifyPin(code);
      if (valid) {
        sessionStorage.setItem('grandline_pin_unlocked', 'true');
        onUnlock();
      } else {
        setErrorMsg('Incorrect PIN. Please try again.');
        setPin('');
      }
    } catch (err) {
      setErrorMsg(parseApiError(err, 'Could not verify PIN').message);
      setPin('');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
    >
      <div
        className="cd"
        style={{
          width: '100%',
          maxWidth: 340,
          padding: 32,
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12 }}>🛡️</div>
        <h2 style={{ margin: '0 0 6px', fontSize: 20 }}>Grandline App Lock</h2>
        <p className="mut" style={{ margin: '0 0 24px', fontSize: 13 }}>
          Enter your 4-digit security PIN to access your personal dashboard.
        </p>

        {/* PIN Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: i < pin.length ? 'var(--ac)' : 'var(--bd)',
                transition: 'background 0.2s ease'
              }}
            />
          ))}
        </div>

        {errorMsg && (
          <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 16 }}>
            {errorMsg}
          </div>
        )}

        {/* Keypad */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            maxWidth: 240,
            margin: '0 auto'
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              className="btn"
              style={{ height: 48, fontSize: 18, fontWeight: 600 }}
              disabled={checking}
              onClick={() => handleDigit(d)}
            >
              {d}
            </button>
          ))}
          <div />
          <button
            type="button"
            className="btn"
            style={{ height: 48, fontSize: 18, fontWeight: 600 }}
            disabled={checking}
            onClick={() => handleDigit('0')}
          >
            0
          </button>
          <button
            type="button"
            className="btn"
            style={{ height: 48, fontSize: 14 }}
            disabled={checking || pin.length === 0}
            onClick={handleBackspace}
            aria-label="Delete"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
};
