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

// Duo-Tone Video Navigation Icon (for Videos Tab & Video Library)
export const DuoVideo = ({ size = 20, active = false, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <rect
      x="2.5"
      y="4.5"
      width="13.5"
      height="15"
      rx="3"
      stroke={active ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
      strokeWidth="1.8"
      fill={active ? 'rgba(124, 92, 191, 0.15)' : 'none'}
    />
    <path
      d="M16 9.5l5-3v11l-5-3v-5z"
      stroke={active ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={active ? 'var(--duo-purple, #7c5cbf)' : 'rgba(124, 92, 191, 0.25)'}
    />
    <circle cx="9.25" cy="12" r="2.2" fill="var(--duo-purple, #7c5cbf)" />
  </svg>
);

// Duo-Tone Pornhub Icon matching the App's UI Layout & Design System
export const DuoPornhub = ({ size = 18, active = false, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <rect
      x="2.5"
      y="4.5"
      width="19"
      height="15"
      rx="3.5"
      stroke={active ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
      strokeWidth="1.8"
      fill={active ? 'rgba(124, 92, 191, 0.12)' : 'none'}
    />
    <path
      d="M6 8.5v7M6 8.5h3.2a1.8 1.8 0 010 3.6H6"
      stroke={active ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect
      x="12"
      y="7"
      width="7.5"
      height="10"
      rx="2"
      fill="var(--duo-purple, #7c5cbf)"
    />
    <path
      d="M14 9.5v5M14 12h3.5M17.5 9.5v5"
      stroke="#ffffff"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Duo-Tone YouTube Icon matching the App UI Layout & Design System
export const DuoYoutube = ({ size = 18, active = false, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <rect
      x="2.5"
      y="4.5"
      width="19"
      height="15"
      rx="4.5"
      stroke={active ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
      strokeWidth="1.8"
      fill={active ? 'rgba(124, 92, 191, 0.12)' : 'none'}
    />
    <polygon
      points="10,8 16,12 10,16"
      fill={active ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
    />
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

// Duo-Tone Play Button (Recreated with Duo-Tone Geometry & Accents)
export const DuoPlay = ({ size = 20, inButton = false, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M8 5.14v13.72a1 1 0 001.52.85l11.43-6.86a1 1 0 000-1.7L9.52 4.29A1 1 0 008 5.14z"
      fill={inButton ? "currentColor" : "var(--duo-purple, #7c5cbf)"}
      stroke={inButton ? "none" : "var(--duo-stroke, currentColor)"}
      strokeWidth="1"
      strokeLinejoin="round"
    />
    <circle
      cx="11.5"
      cy="12"
      r="1.8"
      fill={inButton ? "var(--duo-purple, #7c5cbf)" : "#ffffff"}
    />
  </svg>
);

// Duo-Tone Pause Button (Recreated with Duo-Tone Dual-Pill Geometry)
export const DuoPause = ({ size = 20, inButton = false, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <rect
      x="6"
      y="5"
      width="3.8"
      height="14"
      rx="1.9"
      fill={inButton ? "currentColor" : "var(--duo-purple, #7c5cbf)"}
    />
    <rect
      x="14.2"
      y="5"
      width="3.8"
      height="14"
      rx="1.9"
      fill={inButton ? "currentColor" : "var(--duo-purple-light, #c084fc)"}
      opacity={inButton ? "0.9" : "1"}
    />
  </svg>
);

// Duo-Tone Skip Next Button (Recreated with Duo-Tone Layered Chevrons & Pill Stop)
export const DuoSkipNext = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    {/* First rear triangle */}
    <path
      d="M4.5 6.5L12 12l-7.5 5.5v-11z"
      stroke="var(--duo-stroke, currentColor)"
      strokeWidth="1.6"
      strokeLinejoin="round"
      fill="rgba(124, 92, 191, 0.15)"
    />
    {/* Second forward triangle */}
    <path
      d="M11.5 6.5L18.5 12l-7 5.5v-11z"
      fill="var(--duo-purple, #7c5cbf)"
      stroke="var(--duo-purple, #7c5cbf)"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    {/* Stop bar */}
    <rect
      x="18"
      y="5.5"
      width="2.5"
      height="13"
      rx="1.2"
      fill="var(--duo-purple, #7c5cbf)"
    />
  </svg>
);

// Duo-Tone Skip Previous Button (Recreated with Duo-Tone Layered Chevrons & Pill Stop)
export const DuoSkipPrev = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    {/* Stop bar */}
    <rect
      x="3.5"
      y="5.5"
      width="2.5"
      height="13"
      rx="1.2"
      fill="var(--duo-purple, #7c5cbf)"
    />
    {/* First back triangle */}
    <path
      d="M19.5 17.5L12 12l7.5-5.5v11z"
      stroke="var(--duo-stroke, currentColor)"
      strokeWidth="1.6"
      strokeLinejoin="round"
      fill="rgba(124, 92, 191, 0.15)"
    />
    {/* Second front triangle */}
    <path
      d="M12.5 17.5L5.5 12l7-5.5v11z"
      fill="var(--duo-purple, #7c5cbf)"
      stroke="var(--duo-purple, #7c5cbf)"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);

// Duo-Tone Volume Speaker Icon (Recreated with Speaker Body & Purple Acoustic Waves)
export const DuoVolume = ({ size = 18, muted = false, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    {/* Speaker Body */}
    <path
      d="M11 5L6 9H3.5A1.5 1.5 0 002 10.5v3A1.5 1.5 0 003.5 15H6l5 4V5z"
      stroke="var(--duo-stroke, currentColor)"
      strokeWidth="1.8"
      strokeLinejoin="round"
      fill="rgba(124, 92, 191, 0.15)"
    />
    <circle cx="6" cy="12" r="1.5" fill="var(--duo-purple, #7c5cbf)" />
    {muted ? (
      <>
        <line x1="15.5" y1="9.5" x2="21.5" y2="15.5" stroke="var(--duo-purple, #7c5cbf)" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="21.5" y1="9.5" x2="15.5" y2="15.5" stroke="var(--duo-purple, #7c5cbf)" strokeWidth="2.2" strokeLinecap="round" />
      </>
    ) : (
      <>
        {/* Inner Wave */}
        <path
          d="M15 9a4.5 4.5 0 010 6"
          stroke="var(--duo-purple, #7c5cbf)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Outer Wave */}
        <path
          d="M18.5 6.5a8 8 0 010 11"
          stroke="var(--duo-purple, #7c5cbf)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    )}
  </svg>
);

// Duo-Tone Heart / Favorite Track Icon (Recreated with Floating Glow Dot)
export const DuoHeart = ({ size = 16, liked = false, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
      stroke={liked ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
      strokeWidth="1.8"
      fill={liked ? 'var(--duo-purple, #7c5cbf)' : 'rgba(124, 92, 191, 0.08)'}
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="10.5"
      r="2"
      fill={liked ? '#ffffff' : 'var(--duo-purple, #7c5cbf)'}
    />
  </svg>
);

// Duo-Tone Sleep Timer Stopwatch Icon
export const DuoTimer = ({ size = 16, active = false, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <circle
      cx="12"
      cy="13"
      r="8"
      stroke={active ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
      strokeWidth="1.8"
      fill={active ? 'rgba(124, 92, 191, 0.15)' : 'none'}
    />
    {/* Crown Button */}
    <path
      d="M12 2v3M10 2h4"
      stroke="var(--duo-purple, #7c5cbf)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Side Trigger */}
    <path
      d="M18.5 6.5l-1.5 1.5"
      stroke="var(--duo-purple, #7c5cbf)"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    {/* Hands */}
    <line
      x1="12"
      y1="13"
      x2="12"
      y2="8.5"
      stroke={active ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="12"
      y1="13"
      x2="15.5"
      y2="13"
      stroke="var(--duo-purple, #7c5cbf)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="12" cy="13" r="1.5" fill="var(--duo-purple, #7c5cbf)" />
  </svg>
);

// Duo-Tone Queue Drawer Icon with Eighth Note Badge
export const DuoQueue = ({ size = 16, active = false, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    {/* List bars */}
    <line
      x1="3"
      y1="6"
      x2="13"
      y2="6"
      stroke={active ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="3"
      y1="12"
      x2="11"
      y2="12"
      stroke={active ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="3"
      y1="18"
      x2="13"
      y2="18"
      stroke={active ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Duo-tone Musical Note on right */}
    <path
      d="M16 16.5V7.5a1 1 0 011-1h3.5v2.5H18v7.5a2.5 2.5 0 11-2-2.45z"
      fill="var(--duo-purple, #7c5cbf)"
    />
    <circle cx="15.5" cy="17.5" r="2" fill="var(--duo-purple, #7c5cbf)" stroke="var(--duo-stroke, currentColor)" strokeWidth="0.8" />
  </svg>
);

// Duo-Tone Shuffle Play Icon (Recreated with Intersection Curve & Center Dot)
export const DuoShuffle = ({ size = 16, active = false, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M16 3h5v5"
      stroke="var(--duo-purple, #7c5cbf)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 20l6.5-6.5M21 3l-7 7"
      stroke={active ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 4l16 16"
      stroke={active ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 16v5h-5"
      stroke="var(--duo-purple, #7c5cbf)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {active && <circle cx="12" cy="12" r="2" fill="var(--duo-purple, #7c5cbf)" />}
  </svg>
);

// Duo-Tone Repeat Cycle Icon (Recreated with Smooth Looping Arrows & One-Badge)
export const DuoRepeat = ({ size = 16, mode = 'off', className = '' }) => {
  const active = mode !== 'off';
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M17 2l4 4-4 4"
        stroke="var(--duo-purple, #7c5cbf)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 11V9a4 4 0 014-4h14"
        stroke={active ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 22l-4-4 4-4"
        stroke="var(--duo-purple, #7c5cbf)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 13v2a4 4 0 01-4 4H3"
        stroke={active ? 'var(--duo-purple, #7c5cbf)' : 'var(--duo-stroke, currentColor)'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {mode === 'one' ? (
        <text
          x="12"
          y="15.5"
          fill="var(--duo-purple, #7c5cbf)"
          fontSize="9"
          fontWeight="900"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          1
        </text>
      ) : active ? (
        <circle cx="12" cy="12" r="2" fill="var(--duo-purple, #7c5cbf)" />
      ) : null}
    </svg>
  );
};

// Duo-Tone Maximize / Fullscreen Icon
export const DuoMaximize = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    {/* Top Left */}
    <path
      d="M9 3H4a1 1 0 00-1 1v5"
      stroke="var(--duo-stroke, currentColor)"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="5" cy="5" r="1.2" fill="var(--duo-purple, #7c5cbf)" />
    {/* Top Right */}
    <path
      d="M15 3h5a1 1 0 011 1v5"
      stroke="var(--duo-purple, #7c5cbf)"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="19" cy="5" r="1.2" fill="var(--duo-purple, #7c5cbf)" />
    {/* Bottom Right */}
    <path
      d="M15 21h5a1 1 0 001-1v-5"
      stroke="var(--duo-stroke, currentColor)"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="19" cy="19" r="1.2" fill="var(--duo-purple, #7c5cbf)" />
    {/* Bottom Left */}
    <path
      d="M9 21H4a1 1 0 01-1-1v-5"
      stroke="var(--duo-purple, #7c5cbf)"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="5" cy="19" r="1.2" fill="var(--duo-purple, #7c5cbf)" />
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


// Duo-Tone Smart Auto Mode Icon
export const DuoAuto = ({ size = 15, active = false, className = "" }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2L14.2 8.3L20.5 10.5L14.2 12.7L12 19L9.8 12.7L3.5 10.5L9.8 8.3L12 2Z"
      stroke={active ? "var(--duo-purple, #7c5cbf)" : "var(--duo-stroke, currentColor)"}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={active ? "rgba(124, 92, 191, 0.22)" : "none"}
    />
    <path
      d="M19 16L19.8 18.2L22 19L19.8 19.8L19 22L18.2 19.8L16 19L18.2 18.2L19 16Z"
      stroke="var(--duo-purple, #7c5cbf)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="var(--duo-purple, #7c5cbf)"
    />
    <circle cx="5" cy="5" r="1.5" fill="var(--duo-purple, #7c5cbf)" />
  </svg>
);

// Duo-Tone Download Action Arrow for buttons
export const DuoDownloadAction = ({ size = 14, className = "", color = "currentColor" }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 10l5 5 5-5"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="12"
      y1="15"
      x2="12"
      y2="3"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

// Duo-Tone Download Centerpiece for Empty State
export const DuoDownloadEmpty = ({ size = 44, className = "" }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 48 48" fill="none">
    <rect
      x="6"
      y="32"
      width="36"
      height="11"
      rx="5.5"
      stroke="var(--duo-stroke, currentColor)"
      strokeWidth="2.2"
      fill="rgba(124, 92, 191, 0.12)"
    />
    <path
      d="M24 7v19m0 0l-6.5-6.5m6.5 6.5l6.5-6.5"
      stroke="var(--duo-purple, #7c5cbf)"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="13" cy="37.5" r="2" fill="var(--duo-purple, #7c5cbf)" />
    <circle cx="35" cy="37.5" r="2" fill="var(--duo-purple, #7c5cbf)" />
    <path
      d="M38 10l1.2 2.5L42 13.7l-2.8 1.2L38 17.5l-1.2-2.6L34 13.7l2.8-1.2L38 10z"
      fill="var(--duo-purple, #7c5cbf)"
    />
  </svg>
);
