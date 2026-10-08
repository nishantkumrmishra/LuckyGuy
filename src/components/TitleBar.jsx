import React, { useEffect, useState, useRef } from 'react';
import { Home, Search, X, Music2 } from 'lucide-react';
import WindowControls from './WindowControls';

export default function TitleBar({
  searchQuery = '',
  onSearch,
  libraryTracks = [],
  onPlayTrack,
  onNavigateHome,
  activeTab = 'home'
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Scroll detection for glassmorphism
  useEffect(() => {
    const handleScroll = (e) => {
      const target = e.target;
      if (target && typeof target.scrollTop === 'number') {
        const classes = target.classList;
        if (
          classes &&
          (classes.contains('app-content') ||
            classes.contains('scrollable') ||
            classes.contains('content-area'))
        ) {
          setIsScrolled(target.scrollTop > 0);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  // Recent searches
  useEffect(() => {
    try {
      const saved = localStorage.getItem('localguy-recent-searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (err) {}
  }, []);

  const saveToRecentSearches = (track) => {
    let updated = [track, ...recentSearches.filter((t) => t.filePath !== track.filePath)];
    if (updated.length > 8) {
      updated = updated.slice(0, 8);
    }
    setRecentSearches(updated);
    try {
      localStorage.setItem('localguy-recent-searches', JSON.stringify(updated));
    } catch (err) {}
  };

  const handleClearRecent = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem('localguy-recent-searches');
    } catch (err) {}
  };

  // Keyboard shortcut Ctrl+L to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsDropdownOpen(true);
      } else if (e.key === 'Escape') {
        inputRef.current?.blur();
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handle outside clicks
  useEffect(() => {
    const handleOutsideClick = (e) => {
      const target = e.target;
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Filter local tracks
  const filteredTracks = searchQuery.trim()
    ? libraryTracks.filter((track) => {
        const q = searchQuery.toLowerCase().trim();
        const title = (track.title || '').toLowerCase();
        const artist = (track.artist || '').toLowerCase();
        const album = (track.album || '').toLowerCase();
        return title.includes(q) || artist.includes(q) || album.includes(q);
      })
    : [];

  const handleSelectTrack = (track) => {
    if (onPlayTrack) onPlayTrack(track);
    saveToRecentSearches(track);
    setIsDropdownOpen(false);
  };

  const headerStyle = {
    height: '62px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    position: 'relative',
    padding: '0 16px',
    width: '100%',
    WebkitAppRegion: 'drag',
    flexShrink: 0,
    zIndex: 50,
    transition: 'background-color 0.25s ease, border-color 0.25s ease, backdrop-filter 0.25s ease, box-shadow 0.25s ease',
    backgroundColor: isScrolled ? 'rgba(245, 245, 245, 0.75)' : 'transparent',
    borderBottom: isScrolled ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid transparent',
    backdropFilter: isScrolled ? 'blur(12px)' : 'none',
    WebkitBackdropFilter: isScrolled ? 'blur(12px)' : 'none',
    boxShadow: isScrolled ? '0 4px 20px rgba(0, 0, 0, 0.03)' : 'none',
  };

  return (
    <header className="titlebar" style={headerStyle}>
      {/* Home navigation button */}
      <button
        className="titlebar-home-btn"
        onClick={onNavigateHome}
        title="Go to Home"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          transition: 'all 0.2s ease',
          WebkitAppRegion: 'no-drag'
        }}
      >
        <Home size={20} />
      </button>

      {/* Central Search pill container */}
      <div className="titlebar-search-wrapper" ref={searchContainerRef}>
        <div
          className="titlebar-search-container"
          style={{
            border: 'none',
            backgroundColor: isFocused ? 'rgba(0, 0, 0, 0.06)' : 'rgba(0, 0, 0, 0.04)',
            height: '36px',
            borderRadius: '18px',
            boxShadow: isFocused ? '0 0 0 2px rgba(124, 92, 191, 0.25)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <Search className="titlebar-search-icon" size={14} />
          <input
            ref={inputRef}
            id="global-search-input"
            type="text"
            className="titlebar-search-input"
            placeholder="What do you want to play?"
            value={searchQuery}
            onFocus={() => {
              setIsDropdownOpen(true);
              setIsFocused(true);
            }}
            onBlur={() => {
              setIsFocused(false);
            }}
            onChange={(e) => {
              if (onSearch) onSearch(e.target.value);
              setIsDropdownOpen(true);
            }}
          />
          {searchQuery ? (
            <button
              className="titlebar-search-clear-btn"
              onClick={() => {
                if (onSearch) onSearch('');
                inputRef.current?.focus();
              }}
              title="Clear search"
            >
              <X size={12} />
            </button>
          ) : (
            <div className="titlebar-shortcut-hint">
              <kbd>Ctrl</kbd> <kbd>L</kbd>
            </div>
          )}
        </div>

        {/* Dropdown search panel */}
        {isDropdownOpen && (
          <div className="titlebar-search-dropdown" ref={dropdownRef}>
            {!searchQuery.trim() ? (
              <div className="dropdown-section">
                <div className="dropdown-section-header">Recent Searches</div>
                {recentSearches.length === 0 ? (
                  <div className="dropdown-empty-state">No recent searches</div>
                ) : (
                  <>
                    <div className="dropdown-list">
                      {recentSearches.map((track, i) => (
                        <div
                          key={`recent-${track.id || track.filePath || i}`}
                          className="dropdown-row"
                          onClick={() => handleSelectTrack(track)}
                        >
                          <div className="dropdown-row-cover">
                            {track.artworkUrl || track.coverArt ? (
                              <img src={track.artworkUrl || track.coverArt} alt="" />
                            ) : (
                              <Music2 size={18} />
                            )}
                          </div>
                          <div className="dropdown-row-meta">
                            <div className="dropdown-row-title">{track.title}</div>
                            <div className="dropdown-row-subtitle">{track.artist || 'Unknown'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="dropdown-clear-btn" onClick={handleClearRecent}>
                      Clear Recent
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="dropdown-section">
                <div className="dropdown-section-header">Matching Tracks</div>
                {filteredTracks.length === 0 ? (
                  <div className="dropdown-empty-state">No matching tracks found</div>
                ) : (
                  <div className="dropdown-list">
                    {filteredTracks.slice(0, 8).map((track, i) => (
                      <div
                        key={`match-${track.id || track.filePath || i}`}
                        className="dropdown-row"
                        onClick={() => handleSelectTrack(track)}
                      >
                        <div className="dropdown-row-cover">
                          {track.artworkUrl || track.coverArt ? (
                            <img src={track.artworkUrl || track.coverArt} alt="" />
                          ) : (
                            <Music2 size={18} />
                          )}
                        </div>
                        <div className="dropdown-row-meta">
                          <div className="dropdown-row-title">{track.title}</div>
                          <div className="dropdown-row-subtitle">{track.artist || 'Unknown'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Windows window controls on top right */}
      <WindowControls />
    </header>
  );
}
