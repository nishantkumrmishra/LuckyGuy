import React, { useEffect, useState, useRef } from 'react';
import {
  Home,
  Search,
  X,
  Music2,
  Menu,
  ChevronDown,
  Library,
  ListMusic,
  Heart,
  Download,
  Settings,
  Compass,
} from 'lucide-react';
import WindowControls from './WindowControls';

export default function TitleBar({
  searchQuery = '',
  onSearch,
  libraryTracks = [],
  onPlayTrack,
  onNavigateHome,
  onNavigate,
  activeTab = 'home',
  pluginTabs = []
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const dropdownRef = useRef(null);
  const navMenuRef = useRef(null);

  const handleNav = (tab) => {
    if (tab === 'home' && onNavigateHome) {
      onNavigateHome();
    } else if (onNavigate) {
      onNavigate(tab);
    } else if (onNavigateHome) {
      onNavigateHome();
    }
    setIsNavMenuOpen(false);
  };

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
        setIsNavMenuOpen(false);
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
      if (
        navMenuRef.current &&
        !navMenuRef.current.contains(target)
      ) {
        setIsNavMenuOpen(false);
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

  return (
    <header className="titlebar">
      {/* Left side: Navigation Dropdown Menu & Quick Home */}
      <div className="titlebar-left">
        <div className="titlebar-nav-dropdown-wrapper" ref={navMenuRef}>
          <button
            type="button"
            className={`titlebar-menu-btn ${isNavMenuOpen ? 'active' : ''}`}
            onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
            title="Navigation Menu"
          >
            <Menu size={15} />
            <span className="titlebar-menu-text">Menu</span>
            <ChevronDown
              size={13}
              style={{
                transform: isNavMenuOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s ease',
              }}
            />
          </button>

          {isNavMenuOpen && (
            <div className="titlebar-dropdown-menu">
              <div className="titlebar-dropdown-header">Navigation</div>
              <button
                type="button"
                className={`titlebar-dropdown-item ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => handleNav('home')}
              >
                <Home size={15} />
                <span>Home</span>
              </button>
              <button
                type="button"
                className={`titlebar-dropdown-item ${activeTab === 'library' ? 'active' : ''}`}
                onClick={() => handleNav('library')}
              >
                <Library size={15} />
                <span>Music Library</span>
              </button>
              <button
                type="button"
                className={`titlebar-dropdown-item ${activeTab === 'playlists' ? 'active' : ''}`}
                onClick={() => handleNav('playlists')}
              >
                <ListMusic size={15} />
                <span>Playlists</span>
              </button>
              <button
                type="button"
                className={`titlebar-dropdown-item ${activeTab === 'liked' ? 'active' : ''}`}
                onClick={() => handleNav('liked')}
              >
                <Heart size={15} />
                <span>Liked Songs</span>
              </button>
              <button
                type="button"
                className={`titlebar-dropdown-item ${activeTab === 'downloads' ? 'active' : ''}`}
                onClick={() => handleNav('downloads')}
              >
                <Download size={15} />
                <span>Downloads</span>
              </button>

              {pluginTabs && pluginTabs.length > 0 && (
                <>
                  <div className="titlebar-dropdown-divider" />
                  <div className="titlebar-dropdown-header">Plugins</div>
                  {pluginTabs.map((pt) => (
                    <button
                      key={pt.id}
                      type="button"
                      className={`titlebar-dropdown-item ${activeTab === `plugin-${pt.id}` ? 'active' : ''}`}
                      onClick={() => handleNav(`plugin-${pt.id}`)}
                    >
                      <Compass size={15} />
                      <span>{pt.tab?.title || pt.name}</span>
                    </button>
                  ))}
                </>
              )}

              <div className="titlebar-dropdown-divider" />
              <button
                type="button"
                className={`titlebar-dropdown-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => handleNav('settings')}
              >
                <Settings size={15} />
                <span>Settings & Appearance</span>
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className="titlebar-home-btn"
          onClick={() => handleNav('home')}
          title="Go to Home"
        >
          <Home size={15} />
        </button>
      </div>

      {/* Center: Clean Simple Search Bar (sharp non-rounded edges) */}
      <div className="titlebar-search-wrapper" ref={searchContainerRef}>
        <div className={`titlebar-search-container ${isFocused ? 'focused' : ''}`}>
          <Search className="titlebar-search-icon" size={14} />
          <input
            ref={inputRef}
            id="global-search-input"
            type="text"
            className="titlebar-search-input"
            placeholder="Search tracks, artists, albums... (Ctrl+L)"
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
              type="button"
              className="titlebar-search-clear-btn"
              onClick={() => {
                if (onSearch) onSearch('');
                inputRef.current?.focus();
              }}
              title="Clear search"
            >
              <X size={13} />
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
                              <Music2 size={16} />
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
                      Clear Recent Searches
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
                            <Music2 size={16} />
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
