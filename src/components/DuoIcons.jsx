import React from 'react';

// User's Custom Music Note Icon
export const CustomIcon = ({ size = 20, className = '', stroke = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
    <path d="M13 10l-4 2" />
  </svg>
);

// Duo-Tone Branded App Logo based on CustomIcon
export const DuoAppLogo = ({ size = 22, className = '' }) => (
  <svg
    width={size}
    height={size}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
  >
    <path
      d="M9 18V5l12-2v13"
      stroke="var(--duo-stroke, currentColor)"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="6" cy="18" r="3" stroke="var(--duo-stroke, currentColor)" strokeWidth="2" fill="var(--duo-purple, #7c5cbf)" />
    <circle cx="18" cy="16" r="3" stroke="var(--duo-stroke, currentColor)" strokeWidth="2" fill="var(--duo-purple, #7c5cbf)" />
    <path
      d="M13 10l-4 2"
      stroke="var(--duo-purple-light, #c084fc)"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

// Duo-Tone Home Navigation Icon
export const DuoHome = ({ size = 20, active = false, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 01-1.5 1.5H15v-6a1.5 1.5 0 00-1.5-1.5h-3A1.5 1.5 0 009 15.5v6H4.5A1.5 1.5 0 013 20v-9.5z"
      stroke={active ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={active ? 'rgba(124, 92, 191, 0.12)' : 'none'}
    />
    <path
      d="M10.5 21.5v-6a1.5 1.5 0 011.5-1.5h0a1.5 1.5 0 011.5 1.5v6"
      stroke="var(--duo-purple, #7c5cbf)"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <circle cx="12" cy="8" r="1.5" fill="var(--duo-purple, #7c5cbf)" />
  </svg>
);

// Duo-Tone Music Library Icon
export const DuoLibrary = ({ size = 20, active = false, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M4 19.5v-15A1.5 1.5 0 015.5 3H8v18H5.5A1.5 1.5 0 014 19.5z"
      stroke={active ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
      strokeWidth="1.8"
      fill={active ? 'rgba(124, 92, 191, 0.12)' : 'none'}
    />
    <path
      d="M8 3h4.5A1.5 1.5 0 0114 4.5v15a1.5 1.5 0 01-1.5 1.5H8V3z"
      stroke={active ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
      strokeWidth="1.8"
    />
    <path
      d="M14 5.5l5 1.5a1.5 1.5 0 011 1.4v10.6a1.5 1.5 0 01-1.9 1.4L14 19"
      stroke="var(--duo-purple, #7c5cbf)"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <line x1="11" y1="7" x2="11" y2="10" stroke="var(--duo-purple, #7c5cbf)" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// Duo-Tone Download Icon
export const DuoDownload = ({ size = 20, active = false, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
      stroke={active ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 10l5 5 5-5"
      stroke="var(--duo-purple, #7c5cbf)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="12"
      y1="15"
      x2="12"
      y2="3"
      stroke="var(--duo-purple, #7c5cbf)"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// Duo-Tone Trash Icon
export const DuoTrash = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <path d="M3 6h18" stroke="var(--duo-stroke, currentColor)" strokeWidth="1.8" strokeLinecap="round" />
    <path
      d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
      stroke="var(--duo-stroke, currentColor)"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line x1="10" y1="11" x2="10" y2="17" stroke="var(--duo-purple, #7c5cbf)" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="14" y1="11" x2="14" y2="17" stroke="var(--duo-purple, #7c5cbf)" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// Duo-Tone Settings Gear Icon
export const DuoSettings = ({ size = 20, active = false, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <circle
      cx="12"
      cy="12"
      r="3.2"
      stroke="var(--duo-purple, #7c5cbf)"
      strokeWidth="2.2"
      fill={active ? 'rgba(124, 92, 191, 0.25)' : 'rgba(124, 92, 191, 0.1)'}
    />
    <path
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
      stroke={active ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Duo-Tone Play Button
export const DuoPlay = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M8 5.5v13l11-6.5L8 5.5z"
      fill="var(--duo-purple, #7c5cbf)"
      stroke="var(--duo-stroke, currentColor)"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);

// Duo-Tone Pause Button
export const DuoPause = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <line x1="8" y1="5.5" x2="8" y2="18.5" stroke="var(--duo-purple, #7c5cbf)" strokeWidth="3" strokeLinecap="round" />
    <line x1="16" y1="5.5" x2="16" y2="18.5" stroke="var(--duo-purple, #7c5cbf)" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// Duo-Tone Skip Next Button
export const DuoSkipNext = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <path d="M5 6l7 6-7 6V6z" fill="var(--duo-stroke, currentColor)" />
    <path d="M12 6l7 6-7 6V6z" fill="var(--duo-purple, #7c5cbf)" />
    <line x1="20" y1="6" x2="20" y2="18" stroke="var(--duo-stroke, currentColor)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Duo-Tone Skip Previous Button
export const DuoSkipPrev = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <line x1="4" y1="6" x2="4" y2="18" stroke="var(--duo-stroke, currentColor)" strokeWidth="2" strokeLinecap="round" />
    <path d="M19 18l-7-6 7-6v12z" fill="var(--duo-stroke, currentColor)" />
    <path d="M12 18l-7-6 7-6v12z" fill="var(--duo-purple, #7c5cbf)" />
  </svg>
);

// Duo-Tone Volume Speaker Icon
export const DuoVolume = ({ size = 18, muted = false, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <path d="M11 5L6 9H3v6h3l5 4V5z" fill="var(--duo-stroke, currentColor)" />
    {muted ? (
      <>
        <line x1="16" y1="9" x2="21" y2="14" stroke="var(--duo-purple, #7c5cbf)" strokeWidth="2" strokeLinecap="round" />
        <line x1="21" y1="9" x2="16" y2="14" stroke="var(--duo-purple, #7c5cbf)" strokeWidth="2" strokeLinecap="round" />
      </>
    ) : (
      <>
        <path d="M15.5 8.5a5 5 0 010 7" stroke="var(--duo-purple, #7c5cbf)" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M18.5 6a8.5 8.5 0 010 12"
          stroke="var(--duo-purple, #7c5cbf)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="1.5 2"
        />
      </>
    )}
  </svg>
);

// Duo-Tone Heart / Favorite Track Icon
export const DuoHeart = ({ size = 16, liked = false, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
      stroke={liked ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
      strokeWidth="1.8"
      fill={liked ? 'var(--duo-purple, #7c5cbf)' : 'none'}
      strokeLinejoin="round"
    />
    {!liked && <circle cx="12" cy="11" r="2.2" fill="var(--duo-purple, #7c5cbf)" />}
  </svg>
);

// Duo-Tone Shuffle Play Icon
export const DuoShuffle = ({ size = 16, active = false, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <path d="M16 3h5v5" stroke="var(--duo-purple, #7c5cbf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 20l6.5-6.5M21 3l-7 7" stroke="var(--duo-purple, #7c5cbf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M4 4l16 16"
      stroke={active ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 16v5h-5"
      stroke={active ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Duo-Tone Repeat Cycle Icon
export const DuoRepeat = ({ size = 16, mode = 'off', className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <path d="M17 2l4 4-4 4" stroke="var(--duo-purple, #7c5cbf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 11V9a4 4 0 014-4h14" stroke="var(--duo-purple, #7c5cbf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M7 22l-4-4 4-4"
      stroke={mode !== 'off' ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 13v2a4 4 0 01-4 4H3"
      stroke={mode !== 'off' ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {mode === 'one' && (
      <text
        x="12"
        y="15"
        fill="var(--duo-purple, #7c5cbf)"
        fontSize="8"
        fontWeight="800"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        1
      </text>
    )}
  </svg>
);

// Duo-Tone Panel Collapse / Expand Icon
export const DuoPanelCollapse = ({ size = 18, collapsed = false, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="var(--duo-stroke, currentColor)" strokeWidth="1.8" />
    <line x1="9" y1="3" x2="9" y2="21" stroke="var(--duo-purple, #7c5cbf)" strokeWidth="2" />
    <path
      d={collapsed ? 'M13 10l2 2-2 2' : 'M15 10l-2 2 2 2'}
      stroke="var(--duo-stroke, currentColor)"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
