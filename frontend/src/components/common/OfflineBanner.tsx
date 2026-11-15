import React, { useEffect, useState } from 'react';
import { DayformIcon } from './DayformIcon';

interface OfflineBannerProps {
  isOnline: boolean;
  onUpdateAvailable?: boolean;
  onReloadUpdate?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  onUpdateAvailable,
  onReloadUpdate
}) => {
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowReconnected(true);
      const t = setTimeout(() => setShowReconnected(false), 3500);
      return () => clearTimeout(t);
    }
  }, [isOnline, wasOffline]);

  if (onUpdateAvailable) {
    return (
      <aside aria-label="App update available" className="pwa-status-bar update-bar">
        <div className="pwa-status-inner">
          <DayformIcon name="sparkles" size={16} />
          <span>A new version of Grandline is available!</span>
          {onReloadUpdate && (
            <button type="button" className="btn pri sm" onClick={onReloadUpdate}>
              Update Now
            </button>
          )}
        </div>
      </aside>
    );
  }

  if (!isOnline) {
    return (
      <aside aria-label="Network status: Offline" className="pwa-status-bar offline-bar">
        <div className="pwa-status-inner">
          <DayformIcon name="wifioff" size={16} />
          <span>You are currently offline. Viewing cached content.</span>
        </div>
      </aside>
    );
  }

  if (showReconnected) {
    return (
      <aside aria-label="Network status: Online" className="pwa-status-bar online-bar">
        <div className="pwa-status-inner">
          <DayformIcon name="wifi" size={16} />
          <span>Connection restored. Synchronized with cloud!</span>
        </div>
      </aside>
    );
  }

  return null;
};

