import React, { useRef, useState, useEffect } from 'react';
import {
  DuoPlay,
  DuoPause,
  DuoSkipNext,
  DuoSkipPrev,
  DuoVolume,
  DuoHeart,
  DuoShuffle,
  DuoRepeat,
  DuoTimer,
  DuoQueue,
  DuoMaximize,
  CustomIcon
} from './DuoIcons';

export default function PlayerBar({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrevious,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
  isShuffle,
  onToggleShuffle,
  repeatMode,
  onToggleRepeat,
  playbackSpeed,
  onChangePlaybackSpeed,
  onOpenSleepTimer,
  sleepTimerRemaining,
  onToggleQueue,
  isQueueOpen,
  isLiked,
  onToggleLike,
  onOpenFullScreen,
}) {
  const [playerImageFailed, setPlayerImageFailed] = useState(false);

  // Progress Bar Scrubbing
  const progressContainerRef = useRef(null);
  const [isProgressHovered, setIsProgressHovered] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPosition, setScrubPosition] = useState(0);
  const scrubPositionRef = useRef(0);

  // Volume Slider Dragging
  const volumeContainerRef = useRef(null);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [isVolumeDragging, setIsVolumeDragging] = useState(false);

  useEffect(() => {
    setPlayerImageFailed(false);
  }, [currentTrack]);

  const formatTime = (secs) => {
    if (isNaN(secs) || secs === Infinity || secs <= 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getScrubTimeFromX = (clientX) => {
    if (!progressContainerRef.current || duration <= 0) return 0;
    const rect = progressContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const rawTime = percentage * duration;
    if (isNaN(rawTime) || !isFinite(rawTime)) return 0;
    return Math.max(0, Math.min(duration, rawTime));
  };

  const handleProgressStart = (clientX) => {
    if (!progressContainerRef.current || duration <= 0) return;
    const initialTime = getScrubTimeFromX(clientX);
    setIsScrubbing(true);
    setScrubPosition(initialTime);
    scrubPositionRef.current = initialTime;
    onSeek(initialTime);
  };

  const handleProgressMove = (clientX) => {
    if (!progressContainerRef.current || duration <= 0) return;
    const newTime = getScrubTimeFromX(clientX);
    setScrubPosition(newTime);
    scrubPositionRef.current = newTime;
  };

  useEffect(() => {
    if (!isScrubbing) return;

    const handleMouseMove = (e) => {
      handleProgressMove(e.clientX);
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      onSeek(scrubPositionRef.current);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isScrubbing]);

  // Volume Handlers
  const handleVolumeStart = (clientX) => {
    if (!volumeContainerRef.current) return;
    setIsVolumeDragging(true);
    updateVolumeFromX(clientX);
  };

  const updateVolumeFromX = (clientX) => {
    if (!volumeContainerRef.current) return;
    const rect = volumeContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const newVolume = Math.max(0, Math.min(1, x / rect.width));
    onVolumeChange(newVolume);
  };

  useEffect(() => {
    if (!isVolumeDragging) return;

    const handleMouseMove = (e) => {
      updateVolumeFromX(e.clientX);
    };

    const handleMouseUp = () => {
      setIsVolumeDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isVolumeDragging]);

  const displayTime = isScrubbing ? scrubPosition : currentTime;

  // Absolute Progress Bar on top border
  const progressContainerStyle = {
    position: 'absolute',
    top: '-3px',
    left: 0,
    right: 0,
    height: '10px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    zIndex: 10,
  };

  const progressTrackStyle = {
    width: '100%',
    height: isProgressHovered || isScrubbing ? '4px' : '2px',
    backgroundColor: 'var(--border-medium, rgba(0,0,0,0.1))',
    position: 'relative',
    overflow: 'visible',
    transition: 'height 0.1s ease',
  };

  const progressFillStyle = {
    height: '100%',
    width: `${duration > 0 ? (displayTime / duration) * 100 : 0}%`,
    backgroundColor: 'var(--primary, #7c5cbf)',
    position: 'absolute',
    left: 0,
    top: 0,
  };

  const progressThumbStyle = {
    position: 'absolute',
    top: '50%',
    left: `${duration > 0 ? (displayTime / duration) * 100 : 0}%`,
    transform: 'translate(-50%, -50%)',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary, #7c5cbf)',
    opacity: isProgressHovered || isScrubbing ? 1 : 0,
    transition: 'opacity 0.1s ease',
    pointerEvents: 'none',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
  };

  // Compact Volume Slider Styling
  const volumeContainerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '75px',
    height: '20px',
    cursor: 'pointer',
    userSelect: 'none',
    flexShrink: 0,
  };

  const volumeTrackStyle = {
    width: '100%',
    height: '4px',
    backgroundColor: 'var(--border-medium, rgba(0,0,0,0.1))',
    borderRadius: '2px',
    position: 'relative',
    overflow: 'visible',
    transition: 'height 0.15s ease',
  };

  const activeVol = isMuted ? 0 : volume;

  const volumeFillStyle = {
    height: '100%',
    width: `${activeVol * 100}%`,
    backgroundColor: 'var(--primary, #7c5cbf)',
    borderRadius: '2px',
    position: 'absolute',
    left: 0,
    top: 0,
  };

  const volumeThumbStyle = {
    position: 'absolute',
    top: '50%',
    left: `${activeVol * 100}%`,
    transform: 'translate(-50%, -50%)',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary, #7c5cbf)',
    opacity: isVolumeHovered || isVolumeDragging ? 1 : 0,
    transition: 'opacity 0.1s ease',
    pointerEvents: 'none',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
  };

  const toggleFullscreen = () => {
    if (window.electronAPI?.toggleFullscreen) {
      window.electronAPI.toggleFullscreen();
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div
      className="player-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '80px',
        padding: '0 20px',
        borderTop: '1px solid var(--border-medium)',
        backgroundColor: 'var(--player-bg, #ffffff)',
        position: 'relative',
        zIndex: 100,
        width: '100%',
        boxSizing: 'border-box',
        userSelect: 'none',
      }}
    >
      {/* Absolute Progress Bar at the top edge */}
      <div
        ref={progressContainerRef}
        style={progressContainerStyle}
        onMouseDown={(e) => handleProgressStart(e.clientX)}
        onMouseEnter={() => setIsProgressHovered(true)}
        onMouseLeave={() => setIsProgressHovered(false)}
      >
        <div style={progressTrackStyle}>
          <div style={progressFillStyle} />
          <div style={progressThumbStyle} />
        </div>
      </div>

      {/* 1. Left Section: Playback Controls & Time Display (Per NorthTracks Layout) */}
      <div
        className="player-controls-left"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
        }}
      >
        <button
          className="player-btn control-btn-prev"
          onClick={onPrevious}
          disabled={!currentTrack}
          title="Previous Track"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            color: 'var(--text-secondary)',
          }}
        >
          <DuoSkipPrev size={18} />
        </button>

        <button
          className="player-btn play-pause-btn control-btn-play"
          onClick={onTogglePlay}
          disabled={!currentTrack}
          title={isPlaying ? 'Pause' : 'Play'}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: 'rgba(124, 92, 191, 0.1)',
            border: '1.5px solid var(--play-btn-border, #18181b)',
            color: 'var(--primary, #7c5cbf)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '0 2px 10px rgba(124, 92, 191, 0.22)',
            transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary, #7c5cbf)';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = 'var(--primary, #7c5cbf)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(124, 92, 191, 0.1)';
            e.currentTarget.style.color = 'var(--primary, #7c5cbf)';
            e.currentTarget.style.borderColor = 'var(--play-btn-border, #18181b)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isPlaying ? (
            <DuoPause size={18} inButton={false} />
          ) : (
            <DuoPlay size={18} inButton={false} />
          )}
        </button>

        <button
          className="player-btn control-btn-next"
          onClick={onNext}
          disabled={!currentTrack}
          title="Next Track"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            color: 'var(--text-secondary)',
          }}
        >
          <DuoSkipNext size={18} />
        </button>

        <div
          className="player-time-display"
          style={{
            fontSize: '11.5px',
            color: 'var(--text-secondary)',
            marginLeft: '6px',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {formatTime(displayTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* 2. Center Section: Track Artwork & Title/Artist (Per NorthTracks Layout) */}
      <div
        className="player-track-info-center"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          minWidth: 0,
          overflow: 'hidden',
          padding: '0 12px',
        }}
      >
        <div
          className="player-album-art"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            border: '1px solid var(--border-medium)',
            flexShrink: 0,
          }}
        >
          {currentTrack && (currentTrack.artworkUrl || currentTrack.coverArt) && !playerImageFailed ? (
            <img
              src={currentTrack.artworkUrl || currentTrack.coverArt}
              alt=""
              onError={() => setPlayerImageFailed(true)}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '6px',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <CustomIcon size={16} stroke="var(--primary, #7c5cbf)" />
          )}
        </div>

        <div
          className="player-metadata"
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '6px',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <div
            className="player-track-title"
            title={currentTrack ? currentTrack.title : 'No Track Selected'}
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '220px',
            }}
          >
            {currentTrack ? currentTrack.title : 'No Track Selected'}
          </div>
          {currentTrack?.artist && currentTrack.artist !== 'LocalGuy' && (
            <div
              className="player-track-artist"
              title={currentTrack.artist}
              style={{
                fontSize: '11.5px',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '120px',
              }}
            >
              • {currentTrack.artist}
            </div>
          )}
        </div>

        {currentTrack && (
          <button
            onClick={() => onToggleLike && onToggleLike(currentTrack)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '50%',
              flexShrink: 0,
              outline: 'none',
              color: 'var(--text-secondary)',
            }}
            title={isLiked ? 'Remove from Liked' : 'Like Track'}
          >
            <DuoHeart size={16} liked={isLiked} />
          </button>
        )}
      </div>

      {/* 3. Right Section: Volume Slider & Utilities (Per NorthTracks Layout) */}
      <div
        className="player-utilities-right"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          justifyContent: 'flex-end',
          flexShrink: 0,
        }}
      >
        {/* Volume Mute Toggle */}
        <button
          onClick={onToggleMute}
          title={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            color: 'var(--text-secondary)',
            flexShrink: 0,
          }}
        >
          <DuoVolume size={18} muted={isMuted || volume === 0} />
        </button>

        {/* Volume Scrub Track */}
        <div
          ref={volumeContainerRef}
          style={volumeContainerStyle}
          onMouseDown={(e) => handleVolumeStart(e.clientX)}
          onMouseEnter={() => setIsVolumeHovered(true)}
          onMouseLeave={() => setIsVolumeHovered(false)}
        >
          <div style={volumeTrackStyle}>
            <div style={volumeFillStyle} />
            <div style={volumeThumbStyle} />
          </div>
        </div>

        {/* Sleep Timer */}
        <button
          className={`player-btn ${sleepTimerRemaining ? 'active' : ''}`}
          onClick={onOpenSleepTimer}
          title={sleepTimerRemaining ? `Sleep in ${Math.ceil(sleepTimerRemaining / 60)}m` : 'Sleep Timer'}
          style={{
            background: 'transparent',
            border: 'none',
            color: sleepTimerRemaining ? 'var(--primary, #7c5cbf)' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            flexShrink: 0,
          }}
        >
          <DuoTimer size={16} active={!!sleepTimerRemaining} />
        </button>

        {/* Queue Drawer Button */}
        <button
          className={`player-btn ${isQueueOpen ? 'active' : ''}`}
          onClick={onToggleQueue}
          title="Play Queue"
          style={{
            background: 'transparent',
            border: 'none',
            color: isQueueOpen ? 'var(--primary, #7c5cbf)' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            flexShrink: 0,
          }}
        >
          <DuoQueue size={16} active={isQueueOpen} />
        </button>

        {/* Repeat Button */}
        <button
          className={`player-btn repeat-btn ${repeatMode !== 'off' ? 'active' : ''}`}
          onClick={onToggleRepeat}
          title={`Repeat: ${repeatMode}`}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            flexShrink: 0,
          }}
        >
          <DuoRepeat size={16} mode={repeatMode} />
        </button>

        {/* Shuffle Button */}
        <button
          className={`player-btn ${isShuffle ? 'active' : ''}`}
          onClick={onToggleShuffle}
          title={isShuffle ? 'Shuffle On' : 'Shuffle Off'}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            flexShrink: 0,
          }}
        >
          <DuoShuffle size={16} active={isShuffle} />
        </button>

        {/* Fullscreen Player Button */}
        <button
          className="player-btn"
          onClick={onOpenFullScreen || toggleFullscreen}
          title="Full Screen Music Player (F)"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            flexShrink: 0,
          }}
        >
          <DuoMaximize size={16} />
        </button>
      </div>
    </div>
  );
}
