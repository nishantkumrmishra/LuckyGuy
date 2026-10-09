import React, { useState, useEffect, useRef } from 'react';
import AppIcon from './AppIcon';
import {
  DuoHome,
  DuoLibrary,
  DuoDownload,
  DuoTrash,
  DuoSettings,
  DuoPanelCollapse
} from './DuoIcons';
import {
  Sun,
  Moon,
  ListMusic,
  Heart,
  ChevronLeft,
  FolderDown,
  Palette,
  Blocks,
  Sparkles,
  SlidersHorizontal,
  Film,
  DownloadCloud,
  Image as ImageIcon,
  Send
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  settingsCategory = 'downloads',
  setSettingsCategory,
  isCollapsed = false,
  setIsCollapsed,
  activeDownloadCount = 0,
  trashCount = 0,
  likedCount = 0,
  theme = 'light',
  onToggleTheme,
  pluginTabs = [],
}) {
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem('localguy-sidebar-width');
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed)) {
        if (parsed <= 52) return 52;
        return Math.max(180, Math.min(280, parsed));
      }
    }
    return 220;
  });

  const [lastWidth, setLastWidth] = useState(() => {
    const saved = localStorage.getItem('localguy-sidebar-width');
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 180 && parsed <= 280) return parsed;
    }
    return 220;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isHandleHovered, setIsHandleHovered] = useState(false);
  const [transitionEnabled, setTransitionEnabled] = useState(true);

  const widthRef = useRef(width);
  const releaseXRef = useRef(width);

  const updateWidth = (newWidth) => {
    widthRef.current = newWidth;
    setWidth(newWidth);
    if (setIsCollapsed) {
      setIsCollapsed(newWidth <= 52);
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setTransitionEnabled(false);
    releaseXRef.current = widthRef.current;
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const clientX = e.clientX;
      const minWidth = 180;
      const maxWidth = 280;

      releaseXRef.current = clientX;
      const currentW = widthRef.current;

      if (clientX < minWidth) {
        if (currentW !== 52) {
          setTransitionEnabled(true);
          updateWidth(52);
          localStorage.setItem('localguy-sidebar-width', '52');
        }
      } else {
        const targetWidth = Math.min(maxWidth, clientX);
        if (currentW === 52) {
          setTransitionEnabled(true);
          updateWidth(targetWidth);
          setLastWidth(targetWidth);
          localStorage.setItem('localguy-sidebar-width', String(targetWidth));
        } else {
          setTransitionEnabled(false);
          updateWidth(targetWidth);
          setLastWidth(targetWidth);
          localStorage.setItem('localguy-sidebar-width', String(targetWidth));
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setTransitionEnabled(true);
      const finalX = releaseXRef.current;
      if (finalX < 180) {
        updateWidth(52);
        localStorage.setItem('localguy-sidebar-width', '52');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const toggleSidebar = (e) => {
    e?.stopPropagation();
    setTransitionEnabled(true);
    if (widthRef.current > 52) {
      updateWidth(52);
      localStorage.setItem('localguy-sidebar-width', '52');
    } else {
      updateWidth(lastWidth);
      localStorage.setItem('localguy-sidebar-width', String(lastWidth));
    }
  };

  const isMini = width <= 52;
  const isSettingsMode = activeTab === 'settings';

  const getPluginIcon = (iconName, isActive) => {
    const color = isActive ? 'var(--primary, #7c5cbf)' : 'var(--duo-stroke, currentColor)';
    const name = (iconName || '').toLowerCase();
    if (name.includes('telegram') || name.includes('send') || name.includes('paper-plane') || name.includes('plane')) {
      return <Send size={17} color={color} />;
    }
    if (name.includes('download')) return <DownloadCloud size={17} color={color} />;
    if (name.includes('image') || name.includes('photo')) return <ImageIcon size={17} color={color} />;
    if (name.includes('film') || name.includes('video')) return <Film size={17} color={color} />;
    return <Sparkles size={17} color={color} />;
  };

  const navItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: isMini ? 'center' : 'space-between',
    padding: isMini ? '0' : '8px 12px',
    height: '38px',
    borderRadius: isMini ? '8px' : '6px',
    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
    backgroundColor: isActive
      ? (isMini ? 'rgba(124, 92, 191, 0.12)' : 'var(--bg-card)')
      : 'transparent',
    border: isMini
      ? (isActive ? '2px solid var(--primary, #7c5cbf)' : '2px solid transparent')
      : 'none',
    borderLeft: !isMini
      ? (isActive ? '2.5px solid var(--primary, #7c5cbf)' : '2.5px solid transparent')
      : undefined,
    borderTopLeftRadius: !isMini && isActive ? '2px' : '6px',
    borderBottomLeftRadius: !isMini && isActive ? '2px' : '6px',
    boxShadow: isMini && isActive
      ? '0 0 0 1px var(--primary, #7c5cbf), 0 2px 8px rgba(124, 92, 191, 0.25)'
      : (isActive ? '0 1px 3px rgba(0, 0, 0, 0.04)' : 'none'),
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    width: isMini ? '38px' : '100%',
    margin: isMini ? '0 auto' : '0',
    boxSizing: 'border-box',
    userSelect: 'none',
  });

  const labelStyle = {
    opacity: isMini ? 0 : 1,
    width: isMini ? '0px' : 'auto',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    transition: 'opacity 180ms ease, width 180ms ease',
    marginLeft: isMini ? '0px' : '10px',
    display: 'inline-block',
    fontSize: '13px',
    fontWeight: 500,
    color: 'inherit',
  };

  const handleBackFromSettings = () => {
    setActiveTab('home');
  };

  return (
    <aside
      className={'sidebar ' + (!isMini ? 'sidebar-expanded' : 'sidebar-collapsed')}
      style={{
        width: width + 'px',
        transition: transitionEnabled ? 'width 200ms ease' : 'none',
        position: 'relative',
        padding: 0,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        backgroundColor: 'var(--bg-titlebar)',
        borderRight: '1px solid var(--border-medium)',
        userSelect: 'none',
      }}
    >
      {/* Drag Resize Handle */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '4px',
          height: '100%',
          cursor: 'col-resize',
          zIndex: 1000,
          backgroundColor: isHandleHovered || isDragging ? 'var(--primary, #7c5cbf)' : 'transparent',
          opacity: isHandleHovered || isDragging ? 0.6 : 0,
          transition: 'background-color 0.2s ease, opacity 0.2s ease',
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHandleHovered(true)}
        onMouseLeave={() => setIsHandleHovered(false)}
      />

      {/* Main Upper Section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: isMini ? '14px 4px 0 4px' : '14px 10px 0 10px',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        {/* Brand Header */}
        <div
          onClick={() => setActiveTab('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isMini ? 'center' : 'flex-start',
            gap: isMini ? '0px' : '10px',
            padding: isMini ? '4px 0 12px 0' : '4px 8px 12px 8px',
            overflow: 'hidden',
            height: '40px',
            flexShrink: 0,
            WebkitAppRegion: 'drag',
            width: '100%',
            cursor: 'pointer',
            boxSizing: 'border-box',
          }}
        >
          <AppIcon size={22} />
          {!isMini && (
            <span
              className="logo-text"
              style={{
                fontSize: '14px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                display: 'inline-block',
              }}
            >
              LuckyGuy
            </span>
          )}
        </div>

        {/* Subtle Divider under Header */}
        <div style={{ height: '1px', backgroundColor: 'var(--border-light, rgba(255,255,255,0.06))', margin: isMini ? '4px 2px 10px 2px' : '4px 6px 10px 6px' }} />

        {/* Top Navigation Group: Conditional on isSettingsMode */}
        {isSettingsMode ? (
          /* SETTINGS / PREFERENCES NAVIGATION VIEW (NorthTracks Pattern) */
          <nav
            className="sidebar-nav sidebar-preferences-nav"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              width: '100%',
            }}
          >
            {/* Category 1: Downloads & Storage */}
            <div
              style={navItemStyle(settingsCategory === 'downloads')}
              onClick={() => setSettingsCategory?.('downloads')}
              title={isMini ? 'Downloads & Storage' : ''}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '20px' }}>
                  <FolderDown size={17} color={settingsCategory === 'downloads' ? 'var(--primary, #7c5cbf)' : 'var(--duo-stroke, currentColor)'} />
                </div>
                <span style={labelStyle}>Downloads</span>
              </div>
            </div>

            {/* Category 2: Appearance & Theme */}
            <div
              style={navItemStyle(settingsCategory === 'appearance')}
              onClick={() => setSettingsCategory?.('appearance')}
              title={isMini ? 'Appearance' : ''}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '20px' }}>
                  <Palette size={17} color={settingsCategory === 'appearance' ? 'var(--primary, #7c5cbf)' : 'var(--duo-stroke, currentColor)'} />
                </div>
                <span style={labelStyle}>Appearance</span>
              </div>
            </div>

            {/* Category 3: Plugins & Extensions */}
            <div
              style={navItemStyle(settingsCategory === 'plugins')}
              onClick={() => setSettingsCategory?.('plugins')}
              title={isMini ? 'Plugins & Extensions' : ''}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '20px' }}>
                  <Blocks size={17} color={settingsCategory === 'plugins' ? 'var(--primary, #7c5cbf)' : 'var(--duo-stroke, currentColor)'} />
                </div>
                <span style={labelStyle}>Plugins</span>
              </div>
            </div>

            {/* Dynamic Plugin Settings Tabs */}
            {pluginTabs.filter((p) => p.settings).length > 0 && (
              <>
                <div style={{ height: '1px', backgroundColor: 'var(--border-light, rgba(255,255,255,0.06))', margin: isMini ? '4px 2px' : '4px 6px' }} />
                {!isMini && (
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '4px 8px', letterSpacing: '0.5px' }}>
                    Plugin Setup
                  </span>
                )}
                {pluginTabs.filter((p) => p.settings).map((plugin) => {
                  const targetCat = 'plugin-' + plugin.id;
                  const isSelected = settingsCategory === targetCat;
                  const label = plugin.settings.title || (plugin.name + ' Setup');
                  return (
                    <div
                      key={plugin.id}
                      style={navItemStyle(isSelected)}
                      onClick={() => setSettingsCategory?.(targetCat)}
                      title={isMini ? label : ''}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '20px' }}>
                          <SlidersHorizontal size={16} color={isSelected ? 'var(--primary, #7c5cbf)' : 'var(--duo-stroke, currentColor)'} />
                        </div>
                        <span style={labelStyle}>{(plugin.name || "").split(/\s+/).slice(0, 2).join(" ")}</span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </nav>
        ) : (
          /* STANDARD APP MAIN NAVIGATION VIEW */
          <nav
            className="sidebar-nav"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              width: '100%',
            }}
          >
            {/* 1. Home */}
            <div
              style={navItemStyle(activeTab === 'home')}
              onClick={() => setActiveTab('home')}
              title={isMini ? 'Home' : ''}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '20px' }}>
                  <DuoHome size={18} active={activeTab === 'home'} />
                </div>
                <span style={labelStyle}>Home</span>
              </div>
            </div>

            {/* 2. Library */}
            <div
              style={navItemStyle(activeTab === 'library')}
              onClick={() => setActiveTab('library')}
              title={isMini ? 'Library' : ''}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '20px' }}>
                  <DuoLibrary size={18} active={activeTab === 'library'} />
                </div>
                <span style={labelStyle}>Library</span>
              </div>
            </div>



            {/* Section Divider */}
            <div style={{ height: '1px', backgroundColor: 'var(--border-light, rgba(255,255,255,0.06))', margin: isMini ? '6px 2px' : '6px 4px' }} />

            {/* 3. Playlists */}
            <div
              style={navItemStyle(activeTab === 'playlists')}
              onClick={() => setActiveTab('playlists')}
              title={isMini ? 'Playlists' : ''}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '20px' }}>
                  <ListMusic size={18} color={activeTab === 'playlists' ? 'var(--primary, #7c5cbf)' : 'var(--duo-stroke, currentColor)'} />
                </div>
                <span style={labelStyle}>Playlists</span>
              </div>
            </div>

            {/* 4. Liked Songs */}
            <div
              style={navItemStyle(activeTab === 'liked')}
              onClick={() => setActiveTab('liked')}
              title={isMini ? 'Liked Songs' : ''}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '20px' }}>
                  <Heart size={17} color={activeTab === 'liked' ? 'var(--primary, #7c5cbf)' : 'var(--duo-stroke, currentColor)'} fill={activeTab === 'liked' ? 'rgba(124, 92, 191, 0.2)' : 'none'} />
                </div>
                <span style={labelStyle}>Liked Songs</span>
              </div>
              {likedCount > 0 && !isMini && (
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 500,
                    padding: '1px 6px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(124, 92, 191, 0.1)',
                    color: 'var(--primary, #7c5cbf)',
                  }}
                >
                  {likedCount}
                </span>
              )}
            </div>

            {/* 5. Downloads */}
            <div
              style={navItemStyle(activeTab === 'downloads')}
              onClick={() => setActiveTab('downloads')}
              title={isMini ? 'Downloads' : ''}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '20px' }}>
                  <DuoDownload size={18} active={activeTab === 'downloads'} />
                </div>
                <span style={labelStyle}>Downloads</span>
              </div>

              {activeDownloadCount > 0 && !isMini && (
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--primary, #7c5cbf)',
                    color: '#ffffff',
                  }}
                >
                  {activeDownloadCount}
                </span>
              )}
            </div>

            {/* DYNAMIC PLUGIN-DECLARED TABS */}
            {pluginTabs.length > 0 && (
              <>
                <div style={{ height: '1px', backgroundColor: 'var(--border-light, rgba(255,255,255,0.06))', margin: isMini ? '6px 2px' : '6px 4px' }} />
                {pluginTabs.map((plugin) => {
                  const tabId = 'plugin-' + plugin.id;
                  const isTabActive = activeTab === tabId;
                  const rawTitle = plugin.tab?.title || plugin.name || "";
                  const tabTitle = rawTitle.split(/\s+/).slice(0, 2).join(" ");
                  return (
                    <div
                      key={plugin.id}
                      style={navItemStyle(isTabActive)}
                      onClick={() => setActiveTab(tabId)}
                      title={isMini ? tabTitle : ''}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '20px', flexShrink: 0 }}>
                          {getPluginIcon(plugin.tab?.icon, isTabActive)}
                        </div>
                        <span style={{ ...labelStyle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{tabTitle}</span>
                      </div>
                      {plugin.rating && plugin.rating !== "all" && !isMini && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 4px',
                            borderRadius: '3px',
                            backgroundColor: plugin.rating === '18+' || plugin.rating === 'mature' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(124, 92, 191, 0.15)',
                            color: plugin.rating === '18+' || plugin.rating === 'mature' ? '#ef4444' : 'var(--primary, #7c5cbf)',
                          }}
                        >
                          {plugin.rating}
                        </span>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            </nav>
        )}
      </div>

      {/* Spacious Middle Spacer */}
      <div style={{ flex: 1 }} />

      {/* Lower Navigation Group: Collapse / Go Back + Settings */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          padding: isMini ? '0 4px 34px 4px' : '0 10px 34px 10px',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        <div style={{ height: '1px', backgroundColor: 'var(--border-light, rgba(255,255,255,0.06))', margin: isMini ? '6px 2px' : '6px 4px' }} />

        {/* If in Settings mode, give Go Back option here or Collapse */}
        {isSettingsMode ? (
          <div
            onClick={handleBackFromSettings}
            title={isMini ? 'Go Back to Main' : 'Return to App'}
            style={navItemStyle(false)}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '20px' }}>
                <ChevronLeft size={18} color="var(--primary, #7c5cbf)" />
              </div>
              <span style={{ ...labelStyle, color: 'var(--primary, #7c5cbf)', fontWeight: 600 }}>Go Back</span>
            </div>
          </div>
        ) : (
          <div
            onClick={toggleSidebar}
            title={isMini ? 'Expand Sidebar' : 'Collapse Sidebar'}
            style={navItemStyle(false)}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '20px' }}>
                <DuoPanelCollapse size={18} collapsed={isMini} />
              </div>
              <span style={labelStyle}>Collapse</span>
            </div>
          </div>
        )}

        <div
          style={navItemStyle(activeTab === 'settings')}
          onClick={() => {
            if (activeTab === 'settings') {
              setActiveTab('home');
            } else {
              setActiveTab('settings');
            }
          }}
          title={isMini ? 'Settings' : ''}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '20px' }}>
              <DuoSettings size={18} active={activeTab === 'settings'} />
            </div>
            <span style={labelStyle}>Settings</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
