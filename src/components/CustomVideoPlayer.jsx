import Hls from 'hls.js';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  Download,
  Check,
  ChevronDown,
  Loader2,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

export default function CustomVideoPlayer({
  video,
  onDownload,
  onQualityChange,
  initialQuality = '1080p',
  onBack,
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const progressTrackRef = useRef(null);
  const hideControlsTimeoutRef = useRef(null);
  const lastExtractedUrlRef = useRef(null);
  const getFileUrl = (fp) => {
    if (!fp) return '';
    if (fp.startsWith('file://')) return fp;
    const normalized = fp.replace(/\\/g, '/');
    const segments = normalized.split('/').map((seg, i) => i === 0 && seg.includes(':') ? seg : encodeURIComponent(seg));
    return 'file:///' + segments.join('/');
  };

  const localSrc = video?.streamUrl && video.streamUrl.startsWith('file:')
    ? video.streamUrl
    : (video?.filePath ? getFileUrl(video.filePath) : '');
  const isLocalFile = Boolean(localSrc);


  const playerIdRef = useRef(null);
  if (!playerIdRef.current) {
    playerIdRef.current = 'player-' + (video?.id || Math.random().toString(36).substring(2, 9));
  }
  const playerId = playerIdRef.current;

  // Global Audio/Video Synchronization:
  // When another media (music track or another video in another tab) starts playing, pause this player
  useEffect(() => {
    const handleOtherMediaPlayback = (e) => {
      if (e.detail?.playerId && e.detail.playerId !== playerId) {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }
    };
    window.addEventListener('luckyguy-media-playback', handleOtherMediaPlayback);
    return () => {
      window.removeEventListener('luckyguy-media-playback', handleOtherMediaPlayback);
    };
  }, [playerId]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState(initialQuality);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [downloadQueued, setDownloadQueued] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [playSplash, setPlaySplash] = useState(null); // 'play' | 'pause' | null
  
  // Separation of initial URL resolution and in-playback buffering
  const [isResolving, setIsResolving] = useState(
    !localSrc && !video?.streamUrl && (!video?.streams || Object.keys(video.streams).length === 0)
  );
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);

  const getYouTubeVideoId = (url, id) => {
    if (id && String(id).startsWith("yt-")) return String(id).replace("yt-", "");
    if (!url) return null;
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
    return m ? m[1] : null;
  };

  const ytVideoId = getYouTubeVideoId(video?.url, video?.id);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  
  const [resolvedStreams, setResolvedStreams] = useState(video?.streams || {});
  const [currentStreamSrc, setCurrentStreamSrc] = useState(
    localSrc || (video?.streams && video?.streams[selectedQuality]) || video?.streamUrl || ''
  );
  const [displayTitle, setDisplayTitle] = useState(
    video?.title && !/^\d+:\d+(:\d+)?$/.test(video.title) ? video.title : ''
  );

  // Sync state if video prop updates externally from parent
  useEffect(() => {
    if (video?.title && !/^\d+:\d+(:\d+)?$/.test(video.title)) {
      setDisplayTitle(video.title);
    }
    if (video?.streams && Object.keys(video.streams).length > 0) {
      setResolvedStreams(video.streams);
      const chosen = video.streams[selectedQuality] || Object.values(video.streams)[0];
      if (chosen) {
        setCurrentStreamSrc(chosen);
        setIsResolving(false);
      }
    } else if (video?.streamUrl && !currentStreamSrc) {
      setCurrentStreamSrc(video.streamUrl);
      setIsResolving(false);
    }
  }, [video?.title, video?.streams, video?.streamUrl, selectedQuality, currentStreamSrc]);

  // Format seconds into MM:SS
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Resolve direct streams if needed
  const resolveStreams = useCallback(async () => {
    setHasError(false);

    if (localSrc || (video?.streamUrl && video.streamUrl.startsWith('file:'))) {
      const chosen = localSrc || video.streamUrl;
      setCurrentStreamSrc(chosen);
      setIsResolving(false);
      return;
    }

    if (video?.streams && Object.keys(video.streams).length > 0) {
      setResolvedStreams(video.streams);
      const chosen = video.streams[selectedQuality] || Object.values(video.streams)[0];
      if (chosen) {
        setCurrentStreamSrc(chosen);
        setIsResolving(false);
        return;
      }
    }

    if (video?.url && window.electronAPI?.extractUrl) {
      // Avoid duplicate extraction if already requested for this URL
      if (lastExtractedUrlRef.current === video.url && currentStreamSrc) {
        setIsResolving(false);
        return;
      }
      lastExtractedUrlRef.current = video.url;

      setIsResolving(true);
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Extraction timed out')), 8000)
        );
        const extractPromise = window.electronAPI.extractUrl(video.url);
        
        const res = await Promise.race([extractPromise, timeoutPromise]);
        if (res && !res.error) {
          if (res.title && !/^\d+:\d+(:\d+)?$/.test(res.title)) {
            setDisplayTitle(res.title);
          }
          if (res.streams && Object.keys(res.streams).length > 0) {
            setResolvedStreams(res.streams);
            const best = res.streams[selectedQuality] || Object.values(res.streams)[0] || res.streamUrl;
            setCurrentStreamSrc(best);
          } else if (res.streamUrl) {
            setCurrentStreamSrc(res.streamUrl);
          }
        } else if (video?.streamUrl) {
          setCurrentStreamSrc(video.streamUrl);
        }
      } catch (err) {
        console.warn('Stream extraction completed with fallback:', err.message);
        if (video?.streamUrl) {
          setCurrentStreamSrc(video.streamUrl);
        }
      } finally {
        setIsResolving(false);
      }
    } else if (video?.streamUrl) {
      setCurrentStreamSrc(video.streamUrl);
      setIsResolving(false);
    } else {
      setIsResolving(false);
    }
  }, [video?.url, video?.streams, video?.streamUrl, selectedQuality, currentStreamSrc]);

  useEffect(() => {
    resolveStreams();
  }, [resolveStreams]);

  // When currentStreamSrc changes, trigger load and attempt playback
  useEffect(() => {
    if (currentStreamSrc && videoRef.current) {
      setHasError(false);
      const v = videoRef.current;
      if (v.src !== currentStreamSrc) {
        v.src = currentStreamSrc;
      }
      v.load();
      v.play()
        .then(() => {
          setIsPlaying(true);
          setIsBuffering(false);
          setIsResolving(false);
        })
        .catch(() => {
          // If browser requires user click, remain paused with big play button visible
          setIsPlaying(false);
          setIsResolving(false);
        });
    }
  }, [currentStreamSrc]);

  // Auto-hide controls when mouse is inactive
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    if (isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        if (!showQualityMenu) {
          setShowControls(false);
        }
      }, 2800);
    }
  }, [isPlaying, showQualityMenu]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    };
  }, [resetHideTimer]);

  // Toggle Play / Pause
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;

    if (v.paused) {
      v.play()
        .then(() => {
          setIsPlaying(true);
          setIsBuffering(false);
          setIsResolving(false);
          setPlaySplash('play');
          setTimeout(() => setPlaySplash(null), 600);
        })
        .catch((err) => {
          console.warn('Play error:', err);
        });
    } else {
      v.pause();
      setIsPlaying(false);
      setPlaySplash('pause');
      setTimeout(() => setPlaySplash(null), 600);
      setShowControls(true);
    }
  };

  // Timeline Progress Update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        setDuration(videoRef.current.duration);
      }
      if (isBuffering) setIsBuffering(false);
    }
  };

  // Seeking on Scrubber Click / Drag
  const handleSeek = (e) => {
    if (!progressTrackRef.current || !videoRef.current || !duration) return;
    const rect = progressTrackRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Hover Preview over Timeline Scrubber
  const handleProgressMouseMove = (e) => {
    if (!progressTrackRef.current || !duration) return;
    const rect = progressTrackRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(pos * 100);
    setHoverTime(pos * duration);
  };

  // Volume Change
  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = volume || 0.8;
      }
    } else {
      setIsMuted(true);
      if (videoRef.current) {
        videoRef.current.muted = true;
      }
    }
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard Shortcuts (Space to play/pause, M to mute, F for fullscreen)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted]);

  // Quality Change
  const handleQualitySelect = (quality) => {
    setSelectedQuality(quality);
    setShowQualityMenu(false);
    if (onQualityChange) onQualityChange(quality);

    const targetSrc = resolvedStreams?.[quality];
    if (targetSrc && videoRef.current) {
      const savedTime = videoRef.current.currentTime;
      const wasPlaying = !videoRef.current.paused;
      setCurrentStreamSrc(targetSrc);
      videoRef.current.src = targetSrc;
      videoRef.current.currentTime = savedTime;
      if (wasPlaying) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  // Trigger Download from Inside Player
  const handleDownload = () => {
    if (onDownload) {
      onDownload(selectedQuality);
      setDownloadQueued(true);
      setTimeout(() => setDownloadQueued(false), 3000);
    }
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  // Available qualities list
  const availableQualities = Object.keys(resolvedStreams).length > 0
    ? Object.keys(resolvedStreams).sort((a, b) => parseInt(b) - parseInt(a))
    : ['1080p', '720p', '480p'];

  const titleToShow = displayTitle || (video?.title && !/^\d+:\d+(:\d+)?$/.test(video.title) ? video.title : 'High-Definition Video');

  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={useIframeFallback ? undefined : togglePlay}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        backgroundColor: '#000000',
        borderRadius: isFullscreen ? '0px' : '10px',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
        cursor: showControls ? 'default' : 'none',
        userSelect: 'none',
      }}
    >
      {useIframeFallback && ytVideoId ? (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <webview
            src={`https://www.youtube.com/embed/${ytVideoId}?autoplay=1&enablejsapi=1`}
            httpreferrer="https://www.youtube.com/"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
            }}
            allowpopups="false"
          />
        </div>
      ) : (
        /* Native Video Element */
        <video
          ref={videoRef}
          
          poster={video?.thumbnail}
          playsInline
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => {
            setIsPlaying(true);
            window.dispatchEvent(new CustomEvent('luckyguy-media-playback', {
              detail: { source: 'video', playerId }
            }));
          }}
          onLoadedMetadata={(e) => {
            if (e.target.duration && !isNaN(e.target.duration)) {
              setDuration(e.target.duration);
            }
            setIsResolving(false);
            setIsBuffering(false);
            setHasError(false);
          }}
          onCanPlay={() => {
            setIsResolving(false);
            setIsBuffering(false);
          }}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => {
            setIsResolving(false);
            setIsBuffering(false);
            setIsPlaying(true);
            setHasError(false);
          }}
          onError={() => {
            setIsResolving(false);
            setIsBuffering(false);
            if (ytVideoId) {
              setUseIframeFallback(true);
              setHasError(false);
            } else {
              setHasError(true);
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            backgroundColor: '#000000',
            cursor: 'pointer',
          }}
        />
      )}

      {/* Large Inviting Center Play Button (Shown when paused and ready) */}
      {!isPlaying && !isResolving && !hasError && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            backgroundColor: 'rgba(124, 92, 191, 0.9)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 4px rgba(255, 255, 255, 0.2)',
            transition: 'transform 0.15s ease, background-color 0.15s ease',
            zIndex: 14,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)')}
          title="Play Video"
        >
          <Play size={34} fill="#ffffff" style={{ marginLeft: '4px' }} />
        </div>
      )}

      {/* URL Resolving Spinner Overlay */}
      {isResolving && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            pointerEvents: 'none',
            zIndex: 15,
            gap: '12px',
          }}
        >
          <Loader2 size={38} color="#a855f7" className="animate-spin" />
          <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: 600, letterSpacing: '0.3px' }}>
            Resolving High-Definition Stream...
          </span>
        </div>
      )}

      {/* Subtle Buffering Spinner (When playing and waiting for chunks) */}
      {isPlaying && isBuffering && !isResolving && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 15,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: '12px',
            borderRadius: '50%',
          }}
        >
          <Loader2 size={32} color="#a855f7" className="animate-spin" />
        </div>
      )}

      {/* Playback Error Retry Overlay */}
      {hasError && !isResolving && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 16,
            gap: '14px',
            color: '#fff',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <AlertCircle size={36} color="#ef4444" />
          <div style={{ fontSize: '13px', fontWeight: 600 }}>Stream buffering or connection interrupted</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={resolveStreams}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--primary, #7c5cbf)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={14} />
              <span>Reload Stream</span>
            </button>
            {ytVideoId && (
              <button
                type="button"
                onClick={() => {
                  setUseIframeFallback(true);
                  setHasError(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Play size={14} fill="#fff" />
                <span>Play via YouTube Player</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Play/Pause Splash Ripple Animation in Center */}
      {playSplash && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            pointerEvents: 'none',
            zIndex: 12,
          }}
        >
          {playSplash === 'play' ? <Play size={32} fill="#ffffff" /> : <Pause size={32} fill="#ffffff" />}
        </div>
      )}

      {/* Top Gradient Header Overlay with Title */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px 20px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.25s ease',
          pointerEvents: showControls ? 'auto' : 'none',
          zIndex: 10,
        }}
      >
        <span
          style={{
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 600,
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
            maxWidth: '75%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={titleToShow}
        >
          {titleToShow}
        </span>

        {/* Video Quality Indicator Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {ytVideoId && !isLocalFile && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setUseIframeFallback(!useIframeFallback);
                setHasError(false);
              }}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(8px)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 9px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                cursor: 'pointer',
              }}
            >
              {useIframeFallback ? 'YouTube Player' : 'Direct Stream'}
            </button>
          )}
          <span
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            {useIframeFallback ? 'HD' : selectedQuality}
          </span>
        </div>
      </div>

      {!useIframeFallback && (
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.45) 60%, transparent 100%)',
          padding: '20px 18px 12px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.25s ease',
          pointerEvents: showControls ? 'auto' : 'none',
          zIndex: 10,
        }}
      >
        {/* Scrubber Timeline Bar */}
        <div
          ref={progressTrackRef}
          onClick={handleSeek}
          onMouseMove={handleProgressMouseMove}
          onMouseEnter={() => setIsHoveringProgress(true)}
          onMouseLeave={() => setIsHoveringProgress(false)}
          style={{
            position: 'relative',
            width: '100%',
            height: isHoveringProgress ? '7px' : '5px',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'height 0.15s ease',
          }}
        >
          {/* Played Progress Bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: `${progressPercent}%`,
              backgroundColor: '#a855f7',
              backgroundImage: 'linear-gradient(to right, #7c5cbf, #a855f7)',
              borderRadius: '4px',
            }}
          />

          {/* Scrubber Thumb */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `${progressPercent}%`,
              transform: 'translate(-50%, -50%)',
              width: isHoveringProgress ? '14px' : '10px',
              height: isHoveringProgress ? '14px' : '10px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 0 6px rgba(0,0,0,0.5)',
              transition: 'width 0.15s ease, height 0.15s ease',
            }}
          />

          {/* Hover Preview Tooltip */}
          {isHoveringProgress && hoverTime !== null && (
            <div
              style={{
                position: 'absolute',
                bottom: '14px',
                left: `${hoverPosition}%`,
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Bottom Controls Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          {/* Left Controls: Play/Pause, Volume, Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Play / Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.15s ease',
              }}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? (
                <Pause size={20} fill="#ffffff" />
              ) : (
                <Play size={20} fill="#ffffff" style={{ marginLeft: '2px' }} />
              )}
            </button>

            {/* Volume Icon & Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={toggleMute}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={18} />
                ) : volume < 0.5 ? (
                  <Volume1 size={18} />
                ) : (
                  <Volume2 size={18} />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                style={{
                  width: '64px',
                  height: '4px',
                  accentColor: '#a855f7',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* Current Time / Duration Counter */}
            <span
              style={{
                color: 'rgba(255, 255, 255, 0.85)',
                fontSize: '11.5px',
                fontFamily: 'monospace',
                marginLeft: '4px',
              }}
            >
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls: Quality Selector, In-Player Download Button, Fullscreen */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            {/* In-Player Quality Selector Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowQualityMenu((prev) => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '5px',
                  backgroundColor: showQualityMenu ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backdropFilter: 'blur(4px)',
                }}
                title="Select Video Quality"
              >
                <span>{selectedQuality}</span>
                <ChevronDown size={12} />
              </button>

              {/* Quality Menu Popup */}
              {showQualityMenu && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '32px',
                    right: 0,
                    backgroundColor: 'rgba(24, 24, 27, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '4px',
                    minWidth: '120px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', padding: '4px 8px', fontWeight: 700, textTransform: 'uppercase' }}>
                    Quality
                  </div>
                  {availableQualities.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleQualitySelect(q)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: selectedQuality === q ? 'rgba(168, 85, 247, 0.3)' : 'transparent',
                        color: selectedQuality === q ? '#a855f7' : '#ffffff',
                        fontSize: '11.5px',
                        fontWeight: selectedQuality === q ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span>{q} {q === '1080p' ? 'Full HD' : q === '720p' ? 'HD' : q === '480p' ? 'SD' : ''}</span>
                      {selectedQuality === q && <Check size={12} color="#a855f7" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* In-Player Clean Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '5px',
                backgroundColor: downloadQueued ? '#10b981' : 'var(--primary, #7c5cbf)',
                border: 'none',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                transition: 'all 0.15s ease',
              }}
              title={`Download in ${selectedQuality}`}
            >
              {downloadQueued ? (
                <>
                  <Check size={12} />
                  <span>Queued!</span>
                </>
              ) : (
                <>
                  <Download size={12} />
                  <span>Download {selectedQuality}</span>
                </>
              )}
            </button>

            {/* Fullscreen Toggle Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
