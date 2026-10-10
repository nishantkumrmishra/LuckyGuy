import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Minimize2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  Music,
  ListMusic,
  Disc3,
  Sparkles,
} from 'lucide-react';
import { CustomIcon } from './DuoIcons';

export default function FullScreenPlayer({
  isOpen = false,
  onClose,
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrevious,
  onSeek,
  currentTime = 0,
  duration = 0,
  volume = 0.8,
  onVolumeChange,
  isMuted = false,
  onToggleMute,
  isShuffle = false,
  onToggleShuffle,
  repeatMode = 'off',
  onToggleRepeat,
  isLiked = false,
  onToggleLike,
  onToggleQueue,
}) {
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekVal, setSeekVal] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const pulseRef = useRef(null);

  useEffect(() => {
    if (!isSeeking) {
      setSeekVal(currentTime);
    }
  }, [currentTime, isSeeking]);

  // Keyboard shortcut listener (Esc to close, Space to toggle play)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        onClose?.();
      } else if (e.code === 'Space') {
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          onTogglePlay?.();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onSeek?.(Math.min((duration || 0), currentTime + 5));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onSeek?.(Math.max(0, currentTime - 5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onTogglePlay, onSeek, currentTime, duration]);

  if (!isOpen || !currentTrack) return null;

  const art = currentTrack.artworkUrl || currentTrack.coverArt;
  const progressPercent = duration > 0 ? (seekVal / duration) * 100 : 0;

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        backgroundColor: '#0a0a0f',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        userSelect: 'none',
        animation: 'fadeIn 0.25s ease-out forwards',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Blurred Ambient Backdrop Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '-15%',
          width: '130%',
          height: '130%',
          backgroundImage: art ? `url("${art}")` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(70px) brightness(0.28) saturate(1.4)',
          transform: isPlaying ? 'scale(1.08)' : 'scale(1)',
          transition: 'transform 4s ease-in-out',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Dark Gradient Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(124, 92, 191, 0.12) 0%, rgba(10, 10, 15, 0.85) 75%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* TOP HEADER */}
      <header
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 36px',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            color: '#f8fafc',
            borderRadius: '9999px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.16)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
          }}
          title="Exit Full Screen (Esc)"
        >
          <ChevronDown size={18} />
          <span>Exit Full Screen</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.75, fontSize: '13px', fontWeight: 500 }}>
          <Sparkles size={15} color="#c084fc" />
          <span>LuckyGuy Immersion Mode</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}
          title="Minimize Player (Esc)"
        >
          <Minimize2 size={16} />
        </button>
      </header>

      {/* CENTER STAGE: ALBUM ART & SOUND PULSE */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '28px',
          padding: '0 24px',
        }}
      >
        {/* Pulsing Visualizer Frame */}
        <div
          ref={pulseRef}
          style={{
            position: 'relative',
            width: 'min(340px, 42vh)',
            height: 'min(340px, 42vh)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Animated Ambient Pulse Glow Rings */}
          {isPlaying && (
            <>
              <div
                style={{
                  position: 'absolute',
                  inset: '-12px',
                  borderRadius: '32px',
                  border: '1.5px solid rgba(124, 92, 191, 0.35)',
                  animation: 'pulseRing 2.4s cubic-bezier(0.22, 1, 0.36, 1) infinite',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: '-24px',
                  borderRadius: '40px',
                  border: '1px solid rgba(124, 92, 191, 0.18)',
                  animation: 'pulseRing 2.4s cubic-bezier(0.22, 1, 0.36, 1) infinite 0.7s',
                  pointerEvents: 'none',
                }}
              />
            </>
          )}

          {/* Main Album Artwork */}
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: isPlaying
                ? '0 24px 60px rgba(0, 0, 0, 0.65), 0 0 40px rgba(124, 92, 191, 0.35)'
                : '0 16px 40px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: '#18181b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'box-shadow 0.4s ease, transform 0.4s ease',
              transform: isPlaying ? 'scale(1.02)' : 'scale(0.98)',
            }}
          >
            {art ? (
              <img
                src={art}
                alt={currentTrack.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <CustomIcon size={64} stroke="#c084fc" />
            )}
          </div>
        </div>

        {/* Track Metadata & Badges */}
        <div style={{ textAlign: 'center', maxWidth: '640px', width: '100%' }}>
          <div
            style={{
              fontSize: 'clamp(20px, 3.2vw, 32px)',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
              textShadow: '0 2px 12px rgba(0,0,0,0.4)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentTrack.title || 'Unknown Title'}
          </div>

          <div
            style={{
              fontSize: 'clamp(14px, 1.8vw, 18px)',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.75)',
              marginTop: '6px',
              textShadow: '0 1px 8px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentTrack.artist || 'Unknown Artist'}
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '12px',
              padding: '3px 10px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(124, 92, 191, 0.2)',
              border: '1px solid rgba(124, 92, 191, 0.4)',
              fontSize: '11px',
              fontWeight: 600,
              color: '#d8b4fe',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <span>{currentTrack.bitrate || '320 KBPS'}</span>
            <span>&bull;</span>
            <span>{currentTrack.genre || 'HIGH FIDELITY'}</span>
          </div>
        </div>
      </div>

      {/* BOTTOM CONTROLS & SCRUBBER */}
      <footer
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '24px 36px 36px 36px',
          maxWidth: '820px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Scrubber Progress Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '12px', fontVariantNumeric: 'tabular-nums', color: 'rgba(255, 255, 255, 0.65)', width: '38px', textAlign: 'right' }}>
            {formatTime(seekVal)}
          </span>

          <div
            style={{
              position: 'relative',
              flex: 1,
              height: '6px',
              borderRadius: '3px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              cursor: 'pointer',
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              const targetTime = pct * (duration || 0);
              onSeek?.(targetTime);
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                borderRadius: '3px',
                backgroundColor: 'var(--primary, #7c5cbf)',
                boxShadow: '0 0 12px rgba(124, 92, 191, 0.6)',
                transition: isSeeking ? 'none' : 'width 0.15s ease',
              }}
            />
          </div>

          <span style={{ fontSize: '12px', fontVariantNumeric: 'tabular-nums', color: 'rgba(255, 255, 255, 0.65)', width: '38px' }}>
            {formatTime(duration)}
          </span>
        </div>

        {/* Action Controls Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: Like & Queue Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '140px' }}>
            <button
              type="button"
              onClick={onToggleLike}
              style={{
                background: 'transparent',
                border: 'none',
                color: isLiked ? '#ef4444' : 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'transform 0.15s ease, color 0.15s ease',
              }}
              title={isLiked ? 'Unlike Song' : 'Like Song'}
            >
              <Heart size={20} fill={isLiked ? '#ef4444' : 'none'} />
            </button>

            {onToggleQueue && (
              <button
                type="button"
                onClick={onToggleQueue}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                }}
                title="Play Queue"
              >
                <ListMusic size={20} />
              </button>
            )}
          </div>

          {/* Center: Shuffle, Previous, Play/Pause (Outlined with Purple Accent!), Next, Repeat */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              type="button"
              onClick={onToggleShuffle}
              style={{
                background: 'transparent',
                border: 'none',
                color: isShuffle ? 'var(--primary, #7c5cbf)' : 'rgba(255, 255, 255, 0.55)',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Shuffle"
            >
              <Shuffle size={18} />
            </button>

            <button
              type="button"
              onClick={onPrevious}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Previous"
            >
              <SkipBack size={24} />
            </button>

            {/* Redesigned Play Button: Black Outline with Purple Accent */}
            <button
              type="button"
              onClick={onTogglePlay}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(124, 92, 191, 0.16)',
                border: '2px solid #18181b',
                color: 'var(--primary, #7c5cbf)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(124, 92, 191, 0.35)',
                transition: 'transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.06)';
                e.currentTarget.style.backgroundColor = 'var(--primary, #7c5cbf)';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = 'var(--primary, #7c5cbf)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = 'rgba(124, 92, 191, 0.16)';
                e.currentTarget.style.color = 'var(--primary, #7c5cbf)';
                e.currentTarget.style.borderColor = '#18181b';
              }}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: '3px' }} />}
            </button>

            <button
              type="button"
              onClick={onNext}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Next"
            >
              <SkipForward size={24} />
            </button>

            <button
              type="button"
              onClick={onToggleRepeat}
              style={{
                background: 'transparent',
                border: 'none',
                color: repeatMode !== 'off' ? 'var(--primary, #7c5cbf)' : 'rgba(255, 255, 255, 0.55)',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
              }}
              title={`Repeat: ${repeatMode}`}
            >
              <Repeat size={18} />
            </button>
          </div>

          {/* Right: Volume Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '140px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onToggleMute}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange?.(parseFloat(e.target.value))}
              style={{
                width: '80px',
                height: '4px',
                borderRadius: '2px',
                accentColor: 'var(--primary, #7c5cbf)',
                cursor: 'pointer',
              }}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
