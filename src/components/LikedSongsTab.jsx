import React, { useState } from 'react';
import {
  ChevronLeft,
  Play,
  Pause,
  Heart,
  Music2,
  Clock,
  Shuffle,
  Trash2,
  FolderOpen
} from 'lucide-react';
import { CustomIcon } from './DuoIcons';

export default function LikedSongsTab({
  songs = [],
  likedTracks = [],
  onToggleLike,
  onPlayTrack,
  currentTrack,
  isPlaying,
  onTogglePlay,
  onBack,
  onTrashSong,
  onOpenFolder,
  downloadFolder,
  onNavigateToHome,
}) {
  const [failedImages, setFailedImages] = useState({});

  // Derive full list of liked songs directly from likedTracks
  const likedSongs = React.useMemo(() => {
    if (!Array.isArray(likedTracks)) return [];
    return likedTracks.map((item) => {
      if (!item) return null;
      if (typeof item === 'object') {
        const matched = (songs || []).find(
          (s) =>
            (s.id && item.id && s.id === item.id) ||
            (s.filePath && item.filePath && s.filePath === item.filePath) ||
            (s.title && item.title && s.title === item.title)
        );
        return matched ? { ...item, ...matched } : item;
      }
      const found = (songs || []).find((s) => s.id === item || s.filePath === item || s.title === item);
      return found || { id: item, title: item, filePath: item };
    }).filter(Boolean);
  }, [likedTracks, songs]);

  const formatTime = (secs) => {
    if (isNaN(secs) || secs === Infinity || secs <= 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePlayClick = (track) => {
    if (currentTrack && (currentTrack.id === track.id || currentTrack.filePath === track.filePath)) {
      if (onTogglePlay) onTogglePlay();
    } else {
      if (onPlayTrack) onPlayTrack(track, likedSongs);
    }
  };

  const handlePlayAll = () => {
    if (likedSongs.length > 0 && onPlayTrack) {
      onPlayTrack(likedSongs[0], likedSongs);
    }
  };

  const handleShuffleAll = () => {
    if (likedSongs.length > 0 && onPlayTrack) {
      const shuffled = [...likedSongs].sort(() => Math.random() - 0.5);
      onPlayTrack(shuffled[0], shuffled);
    }
  };

  return (
    <div
      className="content-area fade-in"
      style={{
        padding: 0,
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-main, #f5f5f5)',
      }}
    >
      {/* 220px tall Hero Header banner */}
      <div
        className="genre-header"
        style={{
          position: 'relative',
          height: '220px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '24px 32px',
          flexShrink: 0,
        }}
      >
        {/* Background gradient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #0f172a 100%)',
            zIndex: 1,
          }}
        />

        {/* Dark overlay gradient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.75))',
            zIndex: 2,
          }}
        />

        {/* Back Button */}
        <button
          onClick={onBack || onNavigateToHome}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(0, 0, 0, 0.45)',
            border: 'none',
            color: 'white',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 3,
            transition: 'background-color 0.2s',
          }}
          className="back-btn"
          title="Back"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Header Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 3,
            display: 'flex',
            gap: '24px',
            alignItems: 'flex-end',
            width: '100%',
          }}
        >
          {/* Greater Heart Cover Art (110x110px) */}
          <div
            style={{
              position: 'relative',
              width: '110px',
              height: '110px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7c5cbf 0%, #9061f9 50%, #6366f1 100%)',
              boxShadow: '0 8px 24px rgba(124, 92, 191, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <Heart
              size={50}
              fill="white"
              color="white"
              style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))' }}
            />
          </div>

          {/* Title and Action Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: '40px',
                fontWeight: 800,
                color: 'white',
                margin: 0,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              Liked Songs
            </h1>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '12px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>
                {likedSongs.length} {likedSongs.length === 1 ? 'song' : 'songs'}
              </span>

              {likedSongs.length > 0 && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handlePlayAll}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'var(--primary, #7c5cbf)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 20px',
                      borderRadius: '24px',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'transform 0.15s, background-color 0.2s',
                    }}
                  >
                    <Play size={15} fill="white" />
                    <span>Play</span>
                  </button>

                  <button
                    onClick={handleShuffleAll}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      padding: '8px 20px',
                      borderRadius: '24px',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <Shuffle size={15} />
                    <span>Shuffle</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ padding: '24px 32px 40px 32px', flex: 1 }}>
        {likedSongs.length === 0 ? (
          /* NorthTracks Exact Empty State */
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '300px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
                padding: '40px 48px',
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-medium, rgba(0,0,0,0.08))',
                borderRadius: '16px',
                maxWidth: '420px',
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(124, 92, 191, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Heart size={36} color="var(--primary, #7c5cbf)" strokeWidth={2} />
              </div>

              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--text-primary, #111111)',
                }}
              >
                No Liked Songs
              </div>

              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary, #555555)',
                  lineHeight: '1.5',
                }}
              >
                Go to the library or home page to add songs you love to your liked collection.
              </div>
            </div>
          </div>
        ) : (
          /* NorthTracks Exact Tracks Table */
          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              borderRadius: '10px',
              border: '1px solid var(--border-medium, rgba(0,0,0,0.08))',
              overflow: 'hidden',
            }}
          >
            <table className="tracks-table">
              <thead>
                <tr>
                  <th style={{ width: '48px', textAlign: 'center' }}>#</th>
                  <th>Title</th>
                  <th>Artist</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>
                    <Clock size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
                  </th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {likedSongs.map((track, idx) => {
                  const isCurrent =
                    currentTrack &&
                    (currentTrack.id === track.id || currentTrack.filePath === track.filePath);
                  const isTrackPlaying = isCurrent && isPlaying;
                  const imgKey = track.id || track.filePath || idx;
                  const hasCover = (track.artworkUrl || track.coverArt) && !failedImages[imgKey];

                  return (
                    <tr
                      key={imgKey}
                      className={isCurrent ? 'playing-row' : ''}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handlePlayClick(track)}
                    >
                      {/* Track Number / Play Indicator */}
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        {isTrackPlaying ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <span
                              style={{
                                width: '3px',
                                height: '12px',
                                backgroundColor: '#7c5cbf',
                                borderRadius: '1px',
                                animation: 'bounce 0.8s infinite',
                              }}
                            />
                            <span
                              style={{
                                width: '3px',
                                height: '16px',
                                backgroundColor: '#7c5cbf',
                                borderRadius: '1px',
                                animation: 'bounce 0.8s infinite 0.2s',
                              }}
                            />
                            <span
                              style={{
                                width: '3px',
                                height: '10px',
                                backgroundColor: '#7c5cbf',
                                borderRadius: '1px',
                                animation: 'bounce 0.8s infinite 0.4s',
                              }}
                            />
                          </div>
                        ) : (
                          idx + 1
                        )}
                      </td>

                      {/* Title & Cover Thumbnail */}
                      <td className="track-title-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--bg-main, #f5f5f5)',
                              border: '1px solid var(--border-light, rgba(0,0,0,0.05))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              flexShrink: 0,
                            }}
                          >
                            {hasCover ? (
                              <img
                                src={track.artworkUrl || track.coverArt}
                                alt=""
                                onError={() => setFailedImages((prev) => ({ ...prev, [imgKey]: true }))}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <CustomIcon size={18} stroke="var(--primary, #7c5cbf)" />
                            )}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: '13px',
                                color: isCurrent ? '#7c5cbf' : 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {track.title}
                            </span>
                            {track.album && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  color: 'var(--text-muted)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {track.album}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Artist */}
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {track.artist || 'Unknown Artist'}
                      </td>

                      {/* Duration */}
                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                        {formatTime(track.duration)}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'center' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            justifyContent: 'center',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Heart Toggle */}
                          <button
                            onClick={() => onToggleLike && onToggleLike(track)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              color: '#a78bfa',
                            }}
                            title="Unlike Track"
                          >
                            <Heart size={16} fill="#a78bfa" color="#a78bfa" />
                          </button>

                          {/* Play Button */}
                          <button
                            onClick={() => handlePlayClick(track)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              color: isCurrent ? '#7c5cbf' : 'var(--text-muted)',
                            }}
                            title={isTrackPlaying ? 'Pause' : 'Play'}
                          >
                            {isTrackPlaying ? <Pause size={15} /> : <Play size={15} />}
                          </button>

                          {/* Trash Button */}
                          {onTrashSong && (
                            <button
                              onClick={() => onTrashSong(track)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                color: 'var(--text-muted)',
                              }}
                              title="Move to Trash"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
