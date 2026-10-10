import React, { useEffect, useState } from "react";

export const WindowControls = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    if (api.getWindowState) {
      api.getWindowState().then((state) => {
        if (state && typeof state.isMaximized === "boolean") {
          setIsMaximized(state.isMaximized);
        }
      }).catch(() => {});
    }

    if (api.onWindowStateChanged) {
      const unsubscribe = api.onWindowStateChanged((state) => {
        if (state && typeof state.isMaximized === "boolean") {
          setIsMaximized(state.isMaximized);
        }
      });
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, []);

  const handleMinimize = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const api = window.electronAPI;
    if (api?.minimize) api.minimize();
    else if (api?.minimizeWindow) api.minimizeWindow();
  };

  const handleMaximize = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const api = window.electronAPI;
    if (api?.maximize) api.maximize();
    else if (api?.maximizeWindow) api.maximizeWindow();
    setIsMaximized((prev) => !prev);
  };

  const handleClose = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const api = window.electronAPI;
    if (api?.close) api.close();
    else if (api?.closeWindow) api.closeWindow();
  };

  return (
    <div
      className="window-controls-container"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        display: "flex",
        alignItems: "center",
        height: "42px",
        WebkitAppRegion: "no-drag",
        zIndex: 99999,
        pointerEvents: "auto",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="window-control-btn minimize"
        onClick={handleMinimize}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseEnter={() => setHovered("minimize")}
        onMouseLeave={() => setHovered(null)}
        title="Minimize"
        aria-label="Minimize"
        style={{
          width: "46px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: hovered === "minimize" ? "rgba(0, 0, 0, 0.08)" : "transparent",
          border: "none",
          outline: "none",
          cursor: "pointer",
          color: "var(--text-primary, #333333)",
          WebkitAppRegion: "no-drag",
          pointerEvents: "auto",
          transition: "background-color 0.15s ease",
        }}
      >
        <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor" style={{ pointerEvents: "none" }}>
          <rect width="10" height="1" />
        </svg>
      </button>

      <button
        type="button"
        className="window-control-btn maximize"
        onClick={handleMaximize}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseEnter={() => setHovered("maximize")}
        onMouseLeave={() => setHovered(null)}
        title={isMaximized ? "Restore" : "Maximize"}
        aria-label={isMaximized ? "Restore" : "Maximize"}
        style={{
          width: "46px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: hovered === "maximize" ? "rgba(0, 0, 0, 0.08)" : "transparent",
          border: "none",
          outline: "none",
          cursor: "pointer",
          color: "var(--text-primary, #333333)",
          WebkitAppRegion: "no-drag",
          pointerEvents: "auto",
          transition: "background-color 0.15s ease",
        }}
      >
        {isMaximized ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" style={{ pointerEvents: "none" }}>
            <rect x="2.5" y="0.5" width="7" height="7" />
            <path d="M0.5 2.5 V9.5 H7.5" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" style={{ pointerEvents: "none" }}>
            <rect x="0.5" y="0.5" width="9" height="9" />
          </svg>
        )}
      </button>

      <button
        type="button"
        className="window-control-btn close"
        onClick={handleClose}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseEnter={() => setHovered("close")}
        onMouseLeave={() => setHovered(null)}
        title="Close"
        aria-label="Close"
        style={{
          width: "46px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: hovered === "close" ? "#e81123" : "transparent",
          border: "none",
          outline: "none",
          cursor: "pointer",
          color: hovered === "close" ? "#ffffff" : "var(--text-primary, #333333)",
          WebkitAppRegion: "no-drag",
          pointerEvents: "auto",
          transition: "background-color 0.15s ease, color 0.15s ease",
        }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          stroke={hovered === "close" ? "#ffffff" : "currentColor"}
          strokeWidth="1.2"
          style={{ pointerEvents: "none" }}
        >
          <path d="M1 1 L9 9 M9 1 L1 9" />
        </svg>
      </button>
    </div>
  );
};

export default WindowControls;
