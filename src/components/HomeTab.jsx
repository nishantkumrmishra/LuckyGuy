import React, { useState, useMemo } from 'react';
import {
  Folder,
  Heart,
  ListMusic,
  ArrowDownToLine,
  Play,
  Pause,
  ArrowRight,
  Music2,
  FolderOpen,
  Disc3,
  Layers,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Music
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
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (sectionName) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  // Group songs into folder / category sections
  const folderSections = useMemo(() => {
    const map = {};
    songs.forEach((s) => {
      let folderName = s.folder || s.genre;
      if (!folderName || folderName === 'undefined' || folderName === 'Music') {
        const parts = (s.filePath || '').split(/[\\/]/);
        if (parts.length >= 2 && parts[parts.length - 2] !== 'Music') {
          folderName = parts[parts.length - 2];
        }
      }
      folderName = folderName || 'Other';

      let folderPath = '';
      if (s.filePath) {
        const lastSlash = Math.max(s.filePath.lastIndexOf('\\'), s.filePath.lastIndexOf('/'));
        if (lastSlash !== -1) {
          folderPath = s.filePath.substring(0, lastSlash);
        }
      }
      if (!folderPath) {
        folderPath = `C:\\Users\\nishant\\Music\\${folderName}`;
      }

      if (!map[folderName]) {
        map[folderName] = {
          name: folderName,
          folderPath,
          tracks: [],
        };
      }
      map[folderName].tracks.push(s);
    });

    return Object.values(map).sort((a, b) => b.tracks.length - a.tracks.length);
  }, [songs]);

  const handleOpenFolder = (folderPath) => {
    if (window.electronAPI?.openInFolder && folderPath) {
      window.electronAPI.openInFolder(folderPath);
    }
  };

  return (
    <div
      className="content-area fade-in"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 36px 48px 36px',
        backgroundColor: 'var(--bg-main)',
        fontFamily: 'inherit',
        overflowY: 'auto',
        gap: '32px',
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

      {/* 2. Endless Folder / Category Sections with 1-Row Grid & Expandable View All */}
      {folderSections.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
          {folderSections.map((sec) => {
            const isExpanded = !!expandedSections[sec.name];
            // Up to 20 entries in horizontal scrollable row; expand to full grid on View all
            const visibleTracks = isExpanded ? sec.tracks : sec.tracks.slice(0, 20);
            const canExpand = sec.tracks.length > 20;

            return (
              <section
                key={sec.name}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {/* Top bar with lining: Music Type, File Location Beside It, View All */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border-medium)',
                    paddingBottom: '12px',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Left: Music Type & Plain Text File Location (Click opens File Explorer) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Disc3 size={18} color="var(--primary, #7c5cbf)" style={{ flexShrink: 0 }} />
                      <h2
                        style={{
                          fontSize: '18px',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          margin: 0,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {sec.name}
                      </h2>
                    </div>

                    {/* Plain Text File Location without unnecessary boxes */}
                    <span
                      onClick={() => handleOpenFolder(sec.folderPath)}
                      style={{
                        fontSize: '12.5px',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'color 0.15s ease',
                        textDecoration: 'none',
                        maxWidth: '500px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--primary, #7c5cbf)';
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                      title={`Open folder in File Explorer: ${sec.folderPath}`}
                    >
                      {sec.folderPath}
                    </span>
                  </div>

                  {/* Right: View All / Show Less Toggle Button */}
                  {canExpand ? (
                    <button
                      onClick={() => toggleSection(sec.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary, #7c5cbf)',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <span>{isExpanded ? 'Show less' : `View all (${sec.tracks.length})`}</span>
                      {isExpanded ? <ChevronDown size={14} /> : <ArrowRight size={14} />}
                    </button>
                  ) : onNavigateToLibrary ? (
                    <button
                      onClick={onNavigateToLibrary}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <span>Library</span>
                      <ArrowRight size={13} />
                    </button>
                  ) : null}
                </div>

                {/* Down: Horizontally scrollable 1-row shelf (wheel scrolls side-wise) or full grid when expanded */}
                <div
                  className="shelf-row-container"
                  onWheel={(e) => {
                    if (!isExpanded && e.deltaY !== 0) {
                      e.currentTarget.scrollLeft += e.deltaY;
                    }
                  }}
                  style={
                    isExpanded
                      ? {
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                          gap: '16px',
                          width: '100%',
                        }
                      : {
                          display: 'flex',
                          flexDirection: 'row',
                          gap: '16px',
                          width: '100%',
                          overflowX: 'auto',
                          overflowY: 'hidden',
                          paddingBottom: '4px',
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none',
                        }
                  }
                >
                  {visibleTracks.map((track) => {
                    const isCurrent =
                      currentTrack &&
                      (currentTrack.id === track.id || currentTrack.filePath === track.filePath);
                    const isTrackPlaying = isCurrent && isPlaying;
                    const art = track.artworkUrl || track.coverArt;

                    return (
                      <div
                        key={track.id || track.filePath}
                        onClick={() => onPlaySong && onPlaySong(track, sec.tracks)}
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderRadius: '12px',
                          border: isCurrent
                            ? '1px solid var(--primary, #7c5cbf)'
                            : '1px solid var(--border-medium)',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.18s ease',
                          flex: isExpanded ? 'none' : '0 0 160px',
                          width: isExpanded ? 'auto' : '160px',
                          boxShadow: isCurrent
                            ? '0 4px 14px rgba(124, 92, 191, 0.18)'
                            : '0 2px 6px rgba(0,0,0,0.02)',
                        }}
                        onMouseEnter={(e) => {
                          if (!isCurrent) e.currentTarget.style.borderColor = 'var(--text-muted)';
                          const playBtn = e.currentTarget.querySelector('.card-play-btn');
                          if (playBtn) playBtn.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          if (!isCurrent) e.currentTarget.style.borderColor = 'var(--border-medium)';
                          const playBtn = e.currentTarget.querySelector('.card-play-btn');
                          if (playBtn && !isTrackPlaying) playBtn.style.opacity = '0';
                        }}
                        title={`${track.title} • ${track.artist || 'Unknown'}`}
                      >
                        {/* Square Album Artwork */}
                        <div
                          style={{
                            width: '100%',
                            aspectRatio: '1 / 1',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-main)',
                            border: '1px solid var(--border-medium)',
                            overflow: 'hidden',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {art ? (
                            <img
                              src={art}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <Music size={32} color="var(--primary)" style={{ opacity: 0.6 }} />
                          )}

                          {/* Hover Play Button on Artwork */}
                          <button
                            className="card-play-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlaySong && onPlaySong(track, sec.tracks);
                            }}
                            style={{
                              position: 'absolute',
                              bottom: '8px',
                              right: '8px',
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary, #7c5cbf)',
                              color: '#ffffff',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                              opacity: isTrackPlaying ? 1 : 0,
                              transition: 'all 0.15s ease',
                              zIndex: 2,
                            }}
                          >
                            {isTrackPlaying ? (
                              <Pause size={16} />
                            ) : (
                              <Play size={16} style={{ marginLeft: '1px' }} />
                            )}
                          </button>
                        </div>

                        {/* Title */}
                        <div
                          style={{
                            fontSize: '13.5px',
                            fontWeight: 600,
                            color: isCurrent ? 'var(--primary)' : 'var(--text-primary)',
                            marginTop: '10px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {track.title}
                        </div>

                        {/* Artist */}
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            marginTop: '3px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {track.artist || 'Unknown Artist'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
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
            No tracks found in library
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '360px' }}>
            Scan your music folder from the Library tab or download tracks using extension URLs.
          </div>
        </div>
      )}
    </div>
  );
}
