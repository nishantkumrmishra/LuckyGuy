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

  const [isPlaying, setIsPlaying] = useState(true);
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
  const [isLoading, setIsLoading] = useState(false);
  const [resolvedStreams, setResolvedStreams] = useState(video?.streams || {});
  const [currentStreamSrc, setCurrentStreamSrc] = useState(video?.streamUrl || '');
  const [useFallbackEmbed, setUseFallbackEmbed] = useState(false);

  // Format seconds into MM:SS
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Resolve direct streams if only website URL is provided
  useEffect(() => {
    let isMounted = true;
    setUseFallbackEmbed(false);

    if (video?.streams && Object.keys(video.streams).length > 0) {
      setResolvedStreams(video.streams);
      setCurrentStreamSrc(video.streams[selectedQuality] || video.streamUrl || Object.values(video.streams)[0]);
      return;
    }

    if (video?.url && window.electronAPI?.extractUrl) {
      setIsLoading(true);
      window.electronAPI.extractUrl(video.url)
        .then((res) => {
          if (!isMounted) return;
          if (res && !res.error) {
            if (res.streams && Object.keys(res.streams).length > 0) {
              setResolvedStreams(res.streams);
              const bestSrc = res.streams[selectedQuality] || res.streamUrl || Object.values(res.streams)[0];
              setCurrentStreamSrc(bestSrc);
            } else if (res.streamUrl) {
              setCurrentStreamSrc(res.streamUrl);
            }
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else if (video?.streamUrl) {
      setCurrentStreamSrc(video.streamUrl);
    }

    return () => {
      isMounted = false;
    };
  }, [video, selectedQuality]);

  // Video source resolution based on chosen quality
  const getVideoSource = useCallback(() => {
    if (resolvedStreams && resolvedStreams[selectedQuality]) {
      return resolvedStreams[selectedQuality];
    }
    return currentStreamSrc || video?.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  }, [resolvedStreams, selectedQuality, currentStreamSrc, video]);

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
          setPlaySplash('play');
          setTimeout(() => setPlaySplash(null), 600);
        })
        .catch(() => {});
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

  // Listen for fullscreen change events (e.g. Esc pressed)
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

  // Handle Playback error by falling back to embed if viewkey exists
  const handleVideoError = () => {
    const vkey = video?.url?.match(/viewkey=([a-zA-Z0-9_-]+)/)?.[1];
    if (vkey) {
      setUseFallbackEmbed(true);
    }
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const vkey = video?.url?.match(/viewkey=([a-zA-Z0-9_-]+)/)?.[1];

  // Available qualities list
  const availableQualities = Object.keys(resolvedStreams).length > 0
    ? Object.keys(resolvedStreams).sort((a, b) => parseInt(b) - parseInt(a))
    : ['1080p', '720p', '480p'];

  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
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
      {/* If native video had an error and viewkey is available, fallback to embed webview */}
      {useFallbackEmbed && vkey ? (
        <webview
          src={"https://www.pornhub.org/embed/" + vkey}
          style={{ width: "100%", height: "100%", border: "none" }}
          allowpopups="false"
        />
      ) : (
        <>
          {/* Native Video Element */}
          <video
            ref={videoRef}
            src={getVideoSource()}
            poster={video?.thumbnail}
            autoPlay
            playsInline
            onError={handleVideoError}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={(e) => {
              if (e.target.duration && !isNaN(e.target.duration)) {
                setDuration(e.target.duration);
              }
              setIsLoading(false);
            }}
            onWaiting={() => setIsLoading(true)}
            onPlaying={() => setIsLoading(false)}
            onClick={togglePlay}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              backgroundColor: '#000000',
              cursor: 'pointer',
            }}
          />

          {/* Loading Spinner */}
          {isLoading && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 15,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                padding: '14px',
                borderRadius: '50%',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Loader2 size={36} color="#a855f7" className="animate-spin" />
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
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              padding: '16px 20px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
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
              title={video?.title}
            >
              {video?.title}
            </span>

            {/* Video Quality Indicator Badge */}
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
              {selectedQuality}
            </span>
          </div>

          {/* Bottom Controls Bar Overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 60%, transparent 100%)',
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
        </>
      )}
    </div>
  );
}
