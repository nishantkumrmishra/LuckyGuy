import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  const albumsAreaRef = useRef(null);

  // Spring-back peek slider states (centered vertically at rest)
  const [thumbOffset, setThumbOffset] = useState(0); // Offset in px relative to center
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const [isHoveringTrack, setIsHoveringTrack] = useState(false);

  const dragStartY = useRef(0);
  const dragStartScrollTop = useRef(0);

  const toggleSection = (sectionName) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };


  // Defense-in-depth: Deduplicate songs by physical path and title+artist
  const safeSongs = useMemo(() => {
    if (!Array.isArray(songs)) return [];
    const seenPaths = new Set();
    const seenKeys = new Set();
    const seenIds = new Set();
    const result = [];
    for (const t of songs) {
      if (!t) continue;
      const rawPath = (t.filePath || t.destinationPath || "").replace(/[\\/]+/g, "/").toLowerCase().trim();
      const idKey = t.id ? String(t.id).trim() : "";
      const titleKey = (t.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const artistKey = (t.artist && t.artist !== "Unknown Artist" && t.artist !== "Various Artists")
        ? (t.artist || "").toLowerCase().replace(/[^a-z0-9]/g, "")
        : "";
      const songKey = `${titleKey}__${artistKey}`;

      if (rawPath && seenPaths.has(rawPath)) continue;
      if (idKey && seenIds.has(idKey)) continue;
      if (titleKey.length >= 2 && seenKeys.has(songKey)) continue;

      if (rawPath) seenPaths.add(rawPath);
      if (idKey) seenIds.add(idKey);
      if (titleKey.length >= 2) seenKeys.add(songKey);
      result.push(t);
    }
    return result;
  }, [songs]);

  // Group songs into folder / category sections
  const folderSections = useMemo(() => {
    const map = {};
    safeSongs.forEach((s) => {
      let folderName = s.folder || s.genre;
      if (!folderName || folderName === "undefined" || folderName === "Music") {
        const parts = (s.filePath || "").replace(/[\\/]+/g, "/").split("/");
        if (parts.length >= 2 && parts[parts.length - 2] !== "Music") {
          folderName = parts[parts.length - 2];
        }
      }
      folderName = folderName || "Other";

      let folderPath = "";
      if (s.filePath) {
        const norm = s.filePath.replace(/[\\/]+/g, "/");
        const lastSlash = norm.lastIndexOf("/");
        if (lastSlash !== -1) {
          folderPath = norm.substring(0, lastSlash).replace(/\//g, "\\");
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
          seenTrackPaths: new Set(),
        };
      }
      const normPath = (s.filePath || s.id || "").replace(/[\\/]+/g, "/").toLowerCase();
      if (!map[folderName].seenTrackPaths.has(normPath)) {
        map[folderName].seenTrackPaths.add(normPath);
        map[folderName].tracks.push(s);
      }
    });

    return Object.values(map).sort((a, b) => b.tracks.length - a.tracks.length);
  }, [safeSongs]);

  const handleOpenFolder = (folderPath) => {
    if (window.electronAPI?.openInFolder && folderPath) {
      window.electronAPI.openInFolder(folderPath);
    }
  };

  // Handle Dragging of the Center Slider Pill (Only scrolls the albums area!)
  const handleThumbMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setIsSnapping(false);
    dragStartY.current = e.clientY;
    dragStartScrollTop.current = albumsAreaRef.current ? albumsAreaRef.current.scrollTop : 0;
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!albumsAreaRef.current) return;
      const deltaY = e.clientY - dragStartY.current;
      const { scrollHeight, clientHeight } = albumsAreaRef.current;
      const maxScroll = scrollHeight - clientHeight;

      if (maxScroll <= 0) return;

      // Move ONLY the albums area smoothly as user drags down or up
      const scrollSpeedMultiplier = 2.4;
      const newScrollTop = Math.max(0, Math.min(dragStartScrollTop.current + deltaY * scrollSpeedMultiplier, maxScroll));
      albumsAreaRef.current.scrollTop = newScrollTop;

      // Allow pill to move up or down from center with subtle clamp (+/- 120px)
      const clampedOffset = Math.max(-120, Math.min(120, deltaY * 0.7));
      setThumbOffset(clampedOffset);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Spring back: scrollbar jumps/springs back to center, but albums area stays at current position
      setIsSnapping(true);
      setThumbOffset(0);
      setTimeout(() => {
        setIsSnapping(false);
      }, 450);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      className="content-area fade-in"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 32px 20px 32px',
        backgroundColor: 'var(--bg-main)',
        fontFamily: 'inherit',
        overflow: 'hidden', // Root stays fixed so top cards remain pinned
        gap: '20px',
        height: '100%',
        minHeight: 0,
      }}
    >
      {/* 1. Quick Access Dashboard Cards (Pinned at Top, Not Moved by Slider) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          width: '100%',
          flexShrink: 0,
        }}
      >
        {/* Card 1: Music Library */}
        <div
          onClick={onNavigateToLibrary}
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            padding: '14px 16px',
            border: '1px solid var(--border-medium)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
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
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'rgba(124, 92, 191, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Folder size={17} />
            </div>
            <ArrowRight size={14} color="var(--text-muted)" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Music Library
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {safeSongs.length} tracks available
            </div>
          </div>
        </div>

        {/* Card 2: Liked Songs */}
        <div
          onClick={onNavigateToLiked}
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            padding: '14px 16px',
            border: '1px solid var(--border-medium)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
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
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
              }}
            >
              <Heart size={17} fill="#ef4444" />
            </div>
            <ArrowRight size={14} color="var(--text-muted)" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Liked Songs
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {likedTracks.length} {likedTracks.length === 1 ? 'favorite track' : 'favorite tracks'}
            </div>
          </div>
        </div>

        {/* Card 3: Playlists */}
        <div
          onClick={onNavigateToPlaylists}
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            padding: '14px 16px',
            border: '1px solid var(--border-medium)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
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
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0ea5e9',
              }}
            >
              <ListMusic size={17} />
            </div>
            <ArrowRight size={14} color="var(--text-muted)" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Playlists
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
            </div>
          </div>
        </div>

        {/* Card 4: Downloads */}
        <div
          onClick={onNavigateToDownloads}
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            padding: '14px 16px',
            border: '1px solid var(--border-medium)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
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
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <ArrowDownToLine size={17} />
            </div>
            <ArrowRight size={14} color="var(--text-muted)" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Downloads
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Extension & URL Streamer
            </div>
          </div>
        </div>
      </div>

      {/* 2. Isolated Music & Albums Section with its own dedicated Right-Side Center Slider */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          minHeight: 0,
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {/* Scrollable Albums Container */}
        <div
          ref={albumsAreaRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingRight: '20px',
            paddingBottom: '32px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {folderSections.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {folderSections.map((sec) => {
                const isExpanded = !!expandedSections[sec.name];
                const visibleTracks = isExpanded ? sec.tracks : sec.tracks.slice(0, 20);
                const canExpand = sec.tracks.length > 20;

                return (
                  <section
                    key={sec.name}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                  >
                    {/* Top bar with lining: Music Type, File Location Beside It, View All */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid var(--border-medium)',
                        paddingBottom: '10px',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      {/* Left: Music Type & Plain Text File Location (Click opens File Explorer) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Disc3 size={17} color="var(--primary, #7c5cbf)" style={{ flexShrink: 0 }} />
                          <h2
                            style={{
                              fontSize: '17px',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              margin: 0,
                              letterSpacing: '-0.01em',
                            }}
                          >
                            {sec.name}
                          </h2>
                          <span
                            style={{
                              fontSize: '12.5px',
                              fontWeight: 500,
                              color: 'var(--text-muted)',
                              marginLeft: '2px',
                            }}
                          >
                            ({sec.tracks.length})
                          </span>
                        </div>

                        {/* Plain Text File Location */}
                        <span
                          onClick={() => handleOpenFolder(sec.folderPath)}
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'color 0.15s ease',
                            textDecoration: 'none',
                            maxWidth: '460px',
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
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            padding: '4px 10px',
                            borderRadius: '16px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span>{isExpanded ? 'Show less' : `View all (${sec.tracks.length})`}</span>
                          {isExpanded ? <ChevronDown size={13} /> : <ArrowRight size={13} />}
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

                    {/* Down: Horizontally scrollable 1-row shelf or full grid when expanded (Matching 130px Playlist Card sizing) */}
                    <div style={{ position: 'relative', width: '100%' }}>
                      <div
                        id={`shelf-row-${sec.name}`}
                        className="shelf-row-container"
                        style={
                          isExpanded
                            ? {
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                                gap: '12px',
                                width: '100%',
                                padding: '8px 2px 10px 2px',
                              }
                            : {
                                display: 'flex',
                                flexDirection: 'row',
                                gap: '12px',
                                width: '100%',
                                overflowX: 'auto',
                                overflowY: 'hidden',
                                padding: '8px 4px 10px 4px',
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                                scrollBehavior: 'smooth',
                              }
                        }
                      >
                        {visibleTracks.map((track) => {
                          const normCurrPath = currentTrack?.filePath ? currentTrack.filePath.replace(/[\\/]+/g, "/").toLowerCase() : "";
                          const normTrackPath = track?.filePath ? track.filePath.replace(/[\\/]+/g, "/").toLowerCase() : "";
                          const isCurrent =
                            currentTrack &&
                            ((normCurrPath && normTrackPath && normCurrPath === normTrackPath) ||
                             (currentTrack.id && track.id && currentTrack.id === track.id));
                          const isTrackPlaying = isCurrent && isPlaying;
                          const art = track.artworkUrl || track.coverArt;
                          const isTrackLiked = Array.isArray(likedTracks) && likedTracks.some(
                            (t) =>
                              (track.id && t.id && t.id === track.id) ||
                              (track.filePath && t.filePath && t.filePath === track.filePath) ||
                              (track.title && t.title && t.title === track.title)
                          );

                          return (
                            <div
                              key={track.filePath ? track.filePath.replace(/[\\/]+/g, "/") : (track.id || track.title)}
                              onClick={() => onPlaySong && onPlaySong(track, sec.tracks)}
                              style={{
                                backgroundColor: 'var(--bg-card)',
                                borderRadius: '12px',
                                border: isCurrent
                                  ? '1px solid var(--primary, #7c5cbf)'
                                  : '1px solid var(--border-medium)',
                                padding: '10px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                                flex: isExpanded ? 'none' : '0 0 130px',
                                width: isExpanded ? 'auto' : '130px',
                                boxShadow: isCurrent
                                  ? '0 4px 14px rgba(124, 92, 191, 0.18)'
                                  : '0 2px 8px rgba(0,0,0,0.03)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(124, 92, 191, 0.14)';
                                if (!isCurrent) e.currentTarget.style.borderColor = 'var(--primary, #7c5cbf)';
                                const playBtn = e.currentTarget.querySelector('.card-play-btn');
                                if (playBtn) playBtn.style.opacity = '1';
                                const likeBtn = e.currentTarget.querySelector('.card-like-btn');
                                if (likeBtn) likeBtn.style.opacity = '1';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = isCurrent
                                  ? '0 4px 14px rgba(124, 92, 191, 0.18)'
                                  : '0 2px 8px rgba(0,0,0,0.03)';
                                if (!isCurrent) e.currentTarget.style.borderColor = 'var(--border-medium)';
                                const playBtn = e.currentTarget.querySelector('.card-play-btn');
                                if (playBtn && !isTrackPlaying) playBtn.style.opacity = '0';
                                const likeBtn = e.currentTarget.querySelector('.card-like-btn');
                                if (likeBtn && !isTrackLiked) likeBtn.style.opacity = '0';
                              }}
                              title={`${track.title} • ${track.artist || 'Unknown'}`}
                            >
                              {/* Square Album Artwork (Exact 1:1 ratio matching playlists) */}
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
                                  <Music size={26} color="var(--primary)" style={{ opacity: 0.6 }} />
                                )}

                                {/* Hover Like Button on Artwork */}
                                <button
                                  className="card-like-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleLike && onToggleLike(track);
                                  }}
                                  style={{
                                    position: 'absolute',
                                    top: '6px',
                                    right: '6px',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(0, 0, 0, 0.55)',
                                    backdropFilter: 'blur(6px)',
                                    color: isTrackLiked ? '#ef4444' : '#ffffff',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                                    opacity: isTrackLiked ? 1 : 0,
                                    transition: 'opacity 0.15s ease, transform 0.15s ease',
                                    zIndex: 3,
                                  }}
                                  title={isTrackLiked ? 'Remove from Liked' : 'Save to Liked Songs'}
                                >
                                  <Heart size={14} fill={isTrackLiked ? '#ef4444' : 'none'} />
                                </button>

                                {/* Hover Play Button on Artwork */}
                                <button
                                  className="card-play-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onPlaySong && onPlaySong(track, sec.tracks);
                                  }}
                                  style={{
                                    position: 'absolute',
                                    bottom: '6px',
                                    right: '6px',
                                    width: '32px',
                                    height: '32px',
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
                                    transition: 'opacity 0.15s ease',
                                    zIndex: 2,
                                  }}
                                >
                                  {isTrackPlaying ? (
                                    <Pause size={14} />
                                  ) : (
                                    <Play size={14} style={{ marginLeft: '1px' }} />
                                  )}
                                </button>
                              </div>

                              {/* Title & Artist Info */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: '13.5px',
                                    fontWeight: 600,
                                    color: isCurrent ? 'var(--primary)' : 'var(--text-primary)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {track.title}
                                </div>
                                <div
                                  style={{
                                    fontSize: '12px',
                                    color: 'var(--text-secondary)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {track.artist || 'Unknown Artist'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Smooth Left / Right Nav Arrows for Horizontal Navigation */}
                      {!isExpanded && visibleTracks.length > 5 && (
                        <>
                          <button
                            onClick={() => {
                              const el = document.getElementById(`shelf-row-${sec.name}`);
                              if (el) el.scrollBy({ left: -280, behavior: 'smooth' });
                            }}
                            style={{
                              position: 'absolute',
                              left: '-14px',
                              top: '42%',
                              transform: 'translateY(-50%)',
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--bg-card)',
                              border: '1px solid var(--border-medium)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              zIndex: 10,
                              color: 'var(--text-primary)',
                            }}
                            title="Scroll left"
                          >
                            <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
                          </button>
                          <button
                            onClick={() => {
                              const el = document.getElementById(`shelf-row-${sec.name}`);
                              if (el) el.scrollBy({ left: 280, behavior: 'smooth' });
                            }}
                            style={{
                              position: 'absolute',
                              right: '-14px',
                              top: '42%',
                              transform: 'translateY(-50%)',
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--bg-card)',
                              border: '1px solid var(--border-medium)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              zIndex: 10,
                              color: 'var(--text-primary)',
                            }}
                            title="Scroll right"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                minHeight: '260px',
                gap: '12px',
              }}
            >
              <Music2 size={36} color="var(--primary)" />
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                No Tracks in Library
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                Download music or scan folders in your Music directory.
              </div>
            </div>
          )}
        </div>

        {/* Dedicated Center Slider Rail & Pill (Isolated on Right Side of Albums Only) */}
        {folderSections.length > 1 && (
          <div
            style={{
              position: 'relative',
              width: '28px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              userSelect: 'none',
            }}
          >
            {/* Subtle Vertical Rail Line */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                bottom: '20px',
                width: '3px',
                borderRadius: '999px',
                backgroundColor: 'var(--border-medium)',
                opacity: 0.7,
              }}
            />

            {/* Centered Spring-Back Slider Pill Handle */}
            <div
              onMouseDown={handleThumbMouseDown}
              style={{
                position: 'relative',
                transform: `translateY(${thumbOffset}px)`,
                transition: isSnapping ? 'transform 0.42s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none',
                width: '22px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: isDragging ? 'var(--primary)' : 'var(--bg-card)',
                border: isDragging ? '1px solid var(--primary)' : '1px solid var(--border-medium)',
                boxShadow: isDragging
                  ? '0 6px 18px rgba(124, 92, 191, 0.35)'
                  : '0 2px 8px rgba(0,0,0,0.1)',
                cursor: isDragging ? 'grabbing' : 'grab',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                zIndex: 20,
              }}
              title="Drag up or down to scroll albums (Springs back on release)"
            >
              <div
                style={{
                  width: '10px',
                  height: '2px',
                  borderRadius: '1px',
                  backgroundColor: isDragging ? '#ffffff' : 'var(--text-muted)',
                }}
              />
              <div
                style={{
                  width: '10px',
                  height: '2px',
                  borderRadius: '1px',
                  backgroundColor: isDragging ? '#ffffff' : 'var(--text-muted)',
                }}
              />
              <div
                style={{
                  width: '10px',
                  height: '2px',
                  borderRadius: '1px',
                  backgroundColor: isDragging ? '#ffffff' : 'var(--text-muted)',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
