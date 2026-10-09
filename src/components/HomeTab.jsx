import React, { useMemo } from 'react';
import {
  Folder,
  Heart,
  ListMusic,
  ArrowDownToLine,
  Play,
  Pause,
  ArrowRight,
  Music2,
  Clock,
  Disc3,
  Layers,
  Sparkles,
  Headphones,
  Radio,
  FolderTree
} from 'lucide-react';
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
    if (!secs || isNaN(secs)) return '3:20';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  };

  const getDisplayPath = (filePath) => {
    if (!filePath) return 'Music';
    const normalized = filePath.replace(/\\/g, '/');
    const parts = normalized.split('/');
    if (parts.length >= 2) {
      const folder = parts[parts.length - 2];
      return folder !== 'Music' ? `Music > ${folder}` : 'Music';
    }
    return 'Music';
  };

  const recentTracks = useMemo(() => songs.slice(0, 7), [songs]);

  // Aggregate music categories / sections
  const musicSections = useMemo(() => {
    const map = {};
    songs.forEach((s) => {
      let g = s.genre;
      if (!g || g === 'undefined' || g === 'Music') {
        const parts = (s.filePath || '').split(/[\\/]/);
        if (parts.length >= 2 && parts[parts.length - 2] !== 'Music') {
          g = parts[parts.length - 2];
        }
      }
      g = g || 'Pop';
      if (!map[g]) {
        map[g] = { name: g, count: 0, sampleTracks: [] };
      }
      map[g].count++;
      if (map[g].sampleTracks.length < 4) {
        map[g].sampleTracks.push(s);
      }
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [songs]);

  const categoryIcons = [
    { icon: Sparkles, bg: 'rgba(124, 92, 191, 0.12)', color: '#7c5cbf' },
    { icon: Headphones, bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' },
    { icon: Disc3, bg: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9' },
    { icon: Radio, bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981' },
    { icon: Layers, bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' },
    { icon: Music2, bg: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' },
    { icon: FolderTree, bg: 'rgba(236, 72, 153, 0.12)', color: '#ec4899' },
  ];

  return (
    <div
      className="content-area fade-in"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 36px 40px 36px',
        backgroundColor: 'var(--bg-main)',
        fontFamily: 'inherit',
        overflowY: 'auto',
        gap: '28px',
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

        {/* Card 4: Downloads */}
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

      {/* 2. Main Tracks Table with Clean Aligned Layout */}
      {songs.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Recent Tracks
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-medium)',
                }}
              >
                {songs.length} indexed
              </span>
            </div>
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
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
            }}
          >
            <table
              className="tracks-table"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border-medium)',
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <th style={{ width: '44px', textAlign: 'center', padding: '12px 0', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>#</th>
                  <th style={{ width: '28%', textAlign: 'left', padding: '12px 14px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>TITLE</th>
                  <th style={{ width: '15%', textAlign: 'left', padding: '12px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>CATEGORY</th>
                  <th style={{ width: '23%', textAlign: 'left', padding: '12px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>SCANNED PATH</th>
                  <th style={{ width: '18%', textAlign: 'left', padding: '12px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ARTIST</th>
                  <th style={{ width: '65px', textAlign: 'center', padding: '12px 6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                  </th>
                  <th style={{ width: '50px', textAlign: 'center', padding: '12px 8px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>PLAY</th>
                </tr>
              </thead>
              <tbody>
                {recentTracks.map((track, idx) => {
                  const isCurrent =
                    currentTrack &&
                    (currentTrack.id === track.id || currentTrack.filePath === track.filePath);
                  const isTrackPlaying = isCurrent && isPlaying;
                  const art = track.artworkUrl || track.coverArt;
                  const categoryName = track.genre || track.folder || 'Pop';
                  const pathDisplay = getDisplayPath(track.filePath);

                  return (
                    <tr
                      key={track.id || track.filePath || idx}
                      className={isCurrent ? 'playing-row' : ''}
                      style={{
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-medium)',
                        backgroundColor: isCurrent ? 'rgba(124, 92, 191, 0.08)' : 'transparent',
                        transition: 'background-color 0.12s ease',
                      }}
                      onClick={() => onPlaySong && onPlaySong(track, songs)}
                    >
                      {/* # Index or Equalizer */}
                      <td style={{ textAlign: 'center', color: isCurrent ? 'var(--primary)' : 'var(--text-muted)', padding: '10px 0' }}>
                        {isTrackPlaying ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', height: '14px' }}>
                            <span style={{ width: '3px', height: '14px', backgroundColor: 'var(--primary, #7c5cbf)', borderRadius: '2px', animation: 'bounce 0.8s infinite alternate' }} />
                            <span style={{ width: '3px', height: '10px', backgroundColor: 'var(--primary, #7c5cbf)', borderRadius: '2px', animation: 'bounce 0.8s infinite alternate 0.2s' }} />
                            <span style={{ width: '3px', height: '12px', backgroundColor: 'var(--primary, #7c5cbf)', borderRadius: '2px', animation: 'bounce 0.8s infinite alternate 0.4s' }} />
                          </div>
                        ) : (
                          <span style={{ fontSize: '12.5px', fontWeight: 500 }}>{idx + 1}</span>
                        )}
                      </td>

                      {/* Title + Artwork */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              backgroundColor: 'var(--bg-main)',
                              border: '1px solid var(--border-medium)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              flexShrink: 0,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
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
                            title={track.title}
                          >
                            {track.title}
                          </span>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            backgroundColor: 'rgba(124, 92, 191, 0.08)',
                            color: 'var(--primary, #7c5cbf)',
                            border: '1px solid rgba(124, 92, 191, 0.16)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                          }}
                          title={categoryName}
                        >
                          {categoryName}
                        </span>
                      </td>

                      {/* Scanned Folder Path */}
                      <td style={{ padding: '10px 12px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={track.filePath || pathDisplay}
                        >
                          <Folder size={13} style={{ flexShrink: 0, opacity: 0.65, color: 'var(--primary)' }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {pathDisplay}
                          </span>
                        </div>
                      </td>

                      {/* Artist */}
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            color: 'var(--text-secondary)',
                            fontSize: '12.5px',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'block',
                          }}
                          title={track.artist || 'Unknown Artist'}
                        >
                          {track.artist || 'Unknown Artist'}
                        </span>
                      </td>

                      {/* Duration */}
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '10px 6px' }}>
                        {formatTime(track.durationSeconds || track.duration)}
                      </td>

                      {/* Play Action */}
                      <td style={{ textAlign: 'center', padding: '10px 8px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlaySong && onPlaySong(track, songs);
                          }}
                          style={{
                            background: isCurrent ? 'var(--primary, #7c5cbf)' : 'transparent',
                            color: isCurrent ? '#ffffff' : 'var(--text-muted)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          title={isTrackPlaying ? 'Pause' : 'Play'}
                        >
                          {isTrackPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: '1px' }} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* 3. Bottom "Music Sections & Categories" Shelf with spacing */}
      {musicSections.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--primary, #7c5cbf)" />
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Music Sections & Categories
              </h2>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
              {musicSections.length} Sections Available
            </span>
          </div>

          {/* Bracket / Spaced Shelf of Category Cards (Matching user layout) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '14px',
              width: '100%',
            }}
          >
            {musicSections.slice(0, 10).map((sec, idx) => {
              const iconMeta = categoryIcons[idx % categoryIcons.length];
              const IconComp = iconMeta.icon;
              const firstTrack = sec.sampleTracks[0];

              return (
                <div
                  key={sec.name}
                  onClick={() => {
                    if (firstTrack && onPlaySong) {
                      onPlaySong(firstTrack, songs);
                    } else if (onNavigateToLibrary) {
                      onNavigateToLibrary();
                    }
                  }}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '12px',
                    padding: '16px 14px',
                    border: '1px solid var(--border-medium)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'all 0.18s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                  }}
                  title={`Play ${sec.name} (${sec.count} tracks)`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '9px',
                        backgroundColor: iconMeta.bg,
                        color: iconMeta.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconComp size={18} />
                    </div>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--bg-main)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <Play size={10} style={{ marginLeft: '1px' }} />
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {sec.name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {sec.count} {sec.count === 1 ? 'track' : 'tracks'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
