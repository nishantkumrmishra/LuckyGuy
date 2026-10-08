import React from 'react';
import {
  Folder,
  Heart,
  ListMusic,
  ArrowDownToLine,
  Play,
  Pause,
  ArrowRight,
  Sparkles,
  Music2,
  Clock
} from 'lucide-react';
import AppIcon from './AppIcon';
import { CustomIcon } from './DuoIcons';

export default function HomeTab({
  songs = [],
  playlists = [],
  likedTracks = [],
  onPlaySong,
  currentTrack,
  isPlaying,
  onToggleLike,
  onNavigateToLibrary,
  onNavigateToPlaylists,
  onNavigateToLiked,
  onNavigateToDownloads,
}) {
  const formatTime = (secs) => {
    if (!secs) return '3:20';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  };

  const recentTracks = songs.slice(0, 6);

  return (
    <div
      className="content-area fade-in"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 36px 40px 36px',
        backgroundColor: 'var(--bg-main)',
        fontFamily: 'inherit',
        overflowY: 'auto',
        gap: '24px',
      }}
    >
      {/* 1. Quick Access Dashboard Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          width: '100%',
        }}
      >
        {/* Card 1: Music Library */}
        <div
          onClick={onNavigateToLibrary}
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '14px',
            padding: '18px 20px',
            border: '1px solid var(--border-medium)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
            e.currentTarget.style.borderColor = 'var(--primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
            e.currentTarget.style.borderColor = 'var(--border-medium)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(124, 92, 191, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Folder size={18} />
            </div>
            <ArrowRight size={15} color="var(--text-muted)" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Music Library
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {songs.length} {songs.length === 1 ? 'track available' : 'tracks available'}
            </div>
          </div>
        </div>

        {/* Card 2: Liked Songs */}
        <div
          onClick={onNavigateToLiked}
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '14px',
            padding: '18px 20px',
            border: '1px solid var(--border-medium)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
            e.currentTarget.style.borderColor = 'var(--primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
            e.currentTarget.style.borderColor = 'var(--border-medium)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
              }}
            >
              <Heart size={18} fill="#ef4444" />
            </div>
            <ArrowRight size={15} color="var(--text-muted)" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Liked Songs
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {likedTracks.length} {likedTracks.length === 1 ? 'favorite track' : 'favorite tracks'}
            </div>
          </div>
        </div>

        {/* Card 3: Playlists */}
        <div
          onClick={onNavigateToPlaylists}
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '14px',
            padding: '18px 20px',
            border: '1px solid var(--border-medium)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
            e.currentTarget.style.borderColor = 'var(--primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
            e.currentTarget.style.borderColor = 'var(--border-medium)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0ea5e9',
              }}
            >
              <ListMusic size={18} />
            </div>
            <ArrowRight size={15} color="var(--text-muted)" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Playlists
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
            </div>
          </div>
        </div>

        {/* Card 4: Downloads Hub */}
        <div
          onClick={onNavigateToDownloads}
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '14px',
            padding: '18px 20px',
            border: '1px solid var(--border-medium)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
            e.currentTarget.style.borderColor = 'var(--primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
            e.currentTarget.style.borderColor = 'var(--border-medium)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <ArrowDownToLine size={18} />
            </div>
            <ArrowRight size={15} color="var(--text-muted)" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Downloads
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Extension & URL Streamer
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content: Available Music or Empty State */}
      {songs.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Recent Tracks
            </h2>
            {onNavigateToLibrary && (
              <button
                onClick={onNavigateToLibrary}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <span>View all</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-medium)',
              overflow: 'hidden',
            }}
          >
            <table className="tracks-table">
              <thead>
                <tr>
                  <th style={{ width: '48px', textAlign: 'center' }}>#</th>
                  <th>Title</th>
                  <th>Artist</th>
                  <th>Album</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>
                    <Clock size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
                  </th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Play</th>
                </tr>
              </thead>
              <tbody>
                {recentTracks.map((track, idx) => {
                  const isCurrent =
                    currentTrack &&
                    (currentTrack.id === track.id || currentTrack.filePath === track.filePath);
                  const isTrackPlaying = isCurrent && isPlaying;
                  const art = track.artworkUrl || track.coverArt;

                  return (
                    <tr
                      key={track.id || track.filePath || idx}
                      className={isCurrent ? 'playing-row' : ''}
                      style={{ cursor: 'pointer' }}
                      onClick={() => onPlaySong && onPlaySong(track, songs)}
                    >
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        {isTrackPlaying ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <span style={{ width: '3px', height: '12px', backgroundColor: '#7c5cbf', borderRadius: '1px' }} />
                            <span style={{ width: '3px', height: '16px', backgroundColor: '#7c5cbf', borderRadius: '1px' }} />
                            <span style={{ width: '3px', height: '10px', backgroundColor: '#7c5cbf', borderRadius: '1px' }} />
                          </div>
                        ) : (
                          idx + 1
                        )}
                      </td>

                      <td className="track-title-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--bg-main)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              flexShrink: 0,
                            }}
                          >
                            {art ? (
                              <img src={art} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <CustomIcon size={18} stroke="var(--primary)" />
                            )}
                          </div>
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: '13px',
                              color: isCurrent ? 'var(--primary)' : 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {track.title}
                          </span>
                        </div>
                      </td>

                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {track.artist || 'Unknown Artist'}
                      </td>

                      <td style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>
                        {track.album || 'Single'}
                      </td>

                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                        {formatTime(track.duration)}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlaySong && onPlaySong(track, songs);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            color: isCurrent ? 'var(--primary)' : 'var(--text-muted)',
                          }}
                        >
                          {isTrackPlaying ? <Pause size={15} /> : <Play size={15} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '260px',
            padding: '40px 20px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-medium)',
            textAlign: 'center',
            gap: '12px',
          }}
        >
          <Music2 size={44} color="var(--primary)" style={{ opacity: 0.8 }} />
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            No tracks in your library yet
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '360px' }}>
            Download tracks via installed extensions in the Downloads tab, or import local audio files.
          </div>
          {onNavigateToDownloads && (
            <button
              onClick={onNavigateToDownloads}
              style={{
                marginTop: '6px',
                padding: '8px 20px',
                borderRadius: '20px',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Go to Downloads
            </button>
          )}
        </div>
      )}
    </div>
  );
}
