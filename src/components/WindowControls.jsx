import React, { useEffect, useState } from 'react';

export const WindowControls = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const hasAPI = typeof window !== 'undefined' && !!window.electronAPI;

  useEffect(() => {
    if (!hasAPI || !window.electronAPI) return;

    if (window.electronAPI.getWindowState) {
      window.electronAPI.getWindowState().then((state) => {
        if (state && typeof state.isMaximized === 'boolean') {
          setIsMaximized(state.isMaximized);
        }
      }).catch(() => {});
    }

    if (window.electronAPI.onWindowStateChanged) {
      const unsubscribe = window.electronAPI.onWindowStateChanged((state) => {
        if (state && typeof state.isMaximized === 'boolean') {
          setIsMaximized(state.isMaximized);
        }
      });
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [hasAPI]);

  const handleMinimize = (e) => {
    e?.stopPropagation();
    if (window.electronAPI?.minimize) {
      window.electronAPI.minimize();
    } else if (window.electronAPI?.minimizeWindow) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = (e) => {
    e?.stopPropagation();
    if (window.electronAPI?.maximize) {
      window.electronAPI.maximize();
    } else if (window.electronAPI?.maximizeWindow) {
      window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = (e) => {
    e?.stopPropagation();
    if (window.electronAPI?.close) {
      window.electronAPI.close();
    } else if (window.electronAPI?.closeWindow) {
      window.electronAPI.closeWindow();
    }
  };

  return (
    <div className="window-controls-container" style={{ WebkitAppRegion: 'no-drag', zIndex: 9999 }}>
      <button
        className="window-control-btn minimize"
        onClick={handleMinimize}
        title="Minimize"
        aria-label="Minimize"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
          <rect width="10" height="1" />
        </svg>
      </button>
      <button
        className="window-control-btn maximize"
        onClick={handleMaximize}
        title={isMaximized ? "Restore" : "Maximize"}
        aria-label={isMaximized ? "Restore" : "Maximize"}
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        {isMaximized ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="2.5" y="0.5" width="7" height="7" />
            <path d="M0.5 2.5 V9.5 H7.5" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="0.5" y="0.5" width="9" height="9" />
          </svg>
        )}
      </button>
      <button
        className="window-control-btn close"
        onClick={handleClose}
        title="Close"
        aria-label="Close"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.1">
          <path d="M1 1 L9 9 M9 1 L1 9" />
        </svg>
      </button>
    </div>
  );
};

export default WindowControls;
