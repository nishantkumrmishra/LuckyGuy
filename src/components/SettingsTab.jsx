import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Sliders,
  Cpu,
  CheckCircle2,
  HardDrive,
  ExternalLink,
  Palette,
  Sun,
  Moon,
  Blocks,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  DownloadCloud
} from 'lucide-react';
import { CustomIcon } from './DuoIcons';

export default function SettingsTab({
  category = 'downloads',
  onSelectCategory,
  preferences,
  onSavePreferences,
  theme = 'light',
  onToggleTheme,
}) {
  const [downloadFolder, setDownloadFolder] = useState(preferences?.downloadFolder || 'C:\\Users\
ishant\\Music');
  const [defaultFormat, setDefaultFormat] = useState(preferences?.format || 'mp3');
  const [defaultQuality, setDefaultQuality] = useState(preferences?.bitrate || '320k');
  const [chunkCount, setChunkCount] = useState(8);
  const [savedNotice, setSavedNotice] = useState(false);

  // Modular Extension Base URL state
  const [extensionUrl, setExtensionUrl] = useState('');
  const [installError, setInstallError] = useState('');
  const [installSuccess, setInstallSuccess] = useState('');
  const [extensionSearch, setExtensionSearch] = useState('');

  // Built-in core engines (can be toggled)
  const [plugins, setPlugins] = useState(() => {
    try {
      const saved = localStorage.getItem('luckyguy-plugins');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      youtube: true,
      spotify: true,
      jiosaavn: true,
      soundcloud: true,
      autoscan: true,
      discord: false,
    };
  });

  // Dynamically installed extensions
  const [customExtensions, setCustomExtensions] = useState(() => {
    try {
      const saved = localStorage.getItem('luckyguy-extensions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'ext-youtube',
        name: 'YouTube Stream Engine',
        category: 'Media Resolver',
        description: 'Resolves audio streams and master tracks via community extension.',
        source: 'https://raw.githubusercontent.com/nishantkumrmishra/LuckyGuy--extensions/main/extensions/youtube/manifest.json',
        version: '1.0.0',
        author: 'LuckyGuy Community',
        enabled: true,
      },
      {
        id: 'ext-spotify',
        name: 'Spotify Metadata Scraper',
        category: 'Tags & Artwork',
        description: 'Extracts official album cover artwork and track metadata via community extension.',
        source: 'https://raw.githubusercontent.com/nishantkumrmishra/LuckyGuy--extensions/main/extensions/spotify/manifest.json',
        version: '1.0.0',
        author: 'LuckyGuy Community',
        enabled: true,
      },
      {
        id: 'ext-jiosaavn',
        name: 'JioSaavn 320k Studio CDN',
        category: 'Lossless CDN',
        description: 'Direct pristine 320kbps MP3/AAC CDN media resolver with native decryption.',
        source: 'https://raw.githubusercontent.com/nishantkumrmishra/LuckyGuy--extensions/main/extensions/jiosaavn/manifest.json',
        version: '1.0.0',
        author: 'LuckyGuy Community',
        enabled: true,
      },
      {
        id: 'ext-soundcloud',
        name: 'SoundCloud Stream Engine',
        category: 'Streaming',
        description: 'Resolves artist mixes, live sets, and indie streaming releases.',
        source: 'https://raw.githubusercontent.com/nishantkumrmishra/LuckyGuy--extensions/main/extensions/soundcloud/manifest.json',
        version: '1.0.0',
        author: 'LuckyGuy Community',
        enabled: true,
      }
    ];
  });

  useEffect(() => {
    if (preferences?.downloadFolder) {
      setDownloadFolder(preferences.downloadFolder);
    }
  }, [preferences]);

  const flashSaved = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1500);
  };

  const togglePlugin = (id) => {
    setPlugins((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('luckyguy-plugins', JSON.stringify(updated));
      } catch (e) {}
      flashSaved();
      if (onSavePreferences) {
        onSavePreferences({ plugins: updated, downloadFolder, defaultFormat, defaultQuality, chunkCount });
      }
      return updated;
    });
  };

  const toggleExtension = (id) => {
    setCustomExtensions((prev) => {
      const updated = prev.map((ext) => (ext.id === id ? { ...ext, enabled: !ext.enabled } : ext));
      try {
        localStorage.setItem('luckyguy-extensions', JSON.stringify(updated));
      } catch (e) {}
      flashSaved();
      return updated;
    });
  };

  const handleInstallExtension = (e) => {
    e.preventDefault();
    setInstallError('');
    setInstallSuccess('');

    const trimmed = extensionUrl.trim();
    if (!trimmed) {
      setInstallError('Please enter a valid plugin repository or manifest URL.');
      return;
    }

    // Safe validation to never crash or break the application
    try {
      const parsed = new URL(trimmed);
      if (!parsed.protocol.startsWith('http')) {
        setInstallError('URL must use http:// or https://');
        return;
      }

      // Extract a friendly name from URL
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      const rawName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'custom-plugin';
      const cleanName = rawName.replace(/\.git$/i, '').replace(/[-_]/g, ' ');
      const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

      const newExt = {
        id: 'ext-' + Date.now(),
        name: capitalized + ' Engine',
        source: trimmed,
        version: '1.0.0',
        author: parsed.hostname,
        enabled: true,
      };

      const updated = [newExt, ...customExtensions];
      setCustomExtensions(updated);
      try {
        localStorage.setItem('luckyguy-extensions', JSON.stringify(updated));
      } catch (e) {}

      setExtensionUrl('');
      setInstallSuccess(`Extension "${newExt.name}" registered successfully!`);
      flashSaved();
      setTimeout(() => setInstallSuccess(''), 3000);
    } catch (err) {
      setInstallError('Invalid URL format. Example: https://github.com/user/plugin-name');
    }
  };

  const handleRemoveExtension = (id) => {
    const updated = customExtensions.filter((ext) => ext.id !== id);
    setCustomExtensions(updated);
    try {
      localStorage.setItem('luckyguy-extensions', JSON.stringify(updated));
    } catch (e) {}
    flashSaved();
  };

  const handlePickFolder = async () => {
    if (window.electronAPI?.pickFolder) {
      const chosen = await window.electronAPI.pickFolder();
      if (chosen) {
        setDownloadFolder(chosen);
        flashSaved();
        if (onSavePreferences) {
          onSavePreferences({ plugins, downloadFolder: chosen, defaultFormat, defaultQuality, chunkCount });
        }
      }
    }
  };

  const handleOpenFolder = () => {
    if (window.electronAPI?.openInFolder) {
      window.electronAPI.openInFolder(downloadFolder);
    }
  };

  const corePluginsList = [
    {
      id: 'youtube',
      name: 'YouTube Stream Engine',
      category: 'Media Resolver',
      description: 'Resolves YouTube streams and downloads high fidelity master audio files.',
    },
    {
      id: 'spotify',
      name: 'Spotify Metadata Scraper',
      category: 'Tags & Artwork',
      description: 'Extracts track metadata, album cover artwork, and official ID3 tags.',
    },
    {
      id: 'jiosaavn',
      name: 'JioSaavn 320k Studio Engine',
      category: 'Lossless CDN',
      description: 'Direct 320kbps pristine AAC/MP3 CDN streams with real-time DES decryption.',
    },
    {
      id: 'soundcloud',
      name: 'SoundCloud Stream Resolver',
      category: 'Streaming',
      description: 'Resolves artist mixes, live sets, and indie streaming releases.',
    },
    {
      id: 'autoscan',
      name: 'Local Library Auto-Sync',
      category: 'System Watcher',
      description: 'Automatically detects and indexes audio files placed in your music folder.',
    },
    {
      id: 'discord',
      name: 'Discord Rich Presence',
      category: 'Integration',
      description: 'Displays your current playing track on your Discord profile.',
    },
  ];

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 36px',
        backgroundColor: 'var(--bg-main, #ffffff)',
        overflowY: 'auto',
        gap: '24px',
        fontFamily: 'inherit',
        color: 'var(--text-primary)',
      }}
    >
      {/* Header with Title and Category indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-light, #f1f5f9)',
          paddingBottom: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                margin: 0,
              }}
            >
              Preferences
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: 'rgba(124, 92, 191, 0.1)',
                color: 'var(--primary, #7c5cbf)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {category === 'downloads' && 'Downloads & Storage'}
              {category === 'appearance' && 'Appearance & UI'}
              {category === 'plugins' && 'Plugins & Extensions'}
            </span>
            {savedNotice && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                Saved
              </span>
            )}
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary, #64748b)', marginTop: '4px', margin: 0, fontWeight: 400 }}>
            {category === 'downloads' && 'Configure download folder paths, audio export bitrate, and storage behavior.'}
            {category === 'appearance' && 'Customize theme mode, UI colors, and visual layout preferences.'}
            {category === 'plugins' && 'Install external plugin modules via URL and manage audio streaming engines.'}
          </p>
        </div>
      </div>

      {/* SUBTAB 1: DOWNLOAD & STORAGE SETTINGS */}
      {category === 'downloads' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOpen size={16} color="var(--primary, #7c5cbf)" />
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Download & Storage Settings
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '14px',
            }}
          >
            {/* Destination Folder Card */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium, #e2e8f0)',
                backgroundColor: 'var(--bg-card, #ffffff)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Default Download Location
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  readOnly
                  value={downloadFolder}
                  style={{
                    flex: 1,
                    height: '36px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-medium, #e2e8f0)',
                    backgroundColor: 'var(--bg-main, #f8fafc)',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handlePickFolder}
                  style={{
                    height: '36px',
                    padding: '0 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'var(--text-primary, #0f172a)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                >
                  <FolderOpen size={13} color="#c084fc" />
                  <span>Browse</span>
                </button>

                <button
                  onClick={handleOpenFolder}
                  style={{
                    height: '36px',
                    padding: '0 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-medium, #e2e8f0)',
                    backgroundColor: 'var(--bg-card, #ffffff)',
                    color: 'var(--text-secondary, #64748b)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                  title="Open folder in Windows Explorer"
                >
                  <ExternalLink size={13} />
                  <span>Open</span>
                </button>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #94a3b8)', fontWeight: 400 }}>
                Downloaded music will be saved into this folder and automatically indexed in your Library.
              </span>
            </div>

            {/* Quality & Format Card */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium, #e2e8f0)',
                backgroundColor: 'var(--bg-card, #ffffff)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Audio Quality & Bitrate
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary, #64748b)', display: 'block', marginBottom: '4px' }}>
                    Format
                  </label>
                  <select
                    value={defaultFormat}
                    onChange={(e) => {
                      setDefaultFormat(e.target.value);
                      flashSaved();
                      if (onSavePreferences) {
                        onSavePreferences({ plugins, downloadFolder, defaultFormat: e.target.value, defaultQuality, chunkCount });
                      }
                    }}
                    style={{
                      width: '100%',
                      height: '34px',
                      padding: '0 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-medium, #e2e8f0)',
                      backgroundColor: 'var(--bg-main, #f8fafc)',
                      fontSize: '12px',
                      fontWeight: 400,
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  >
                    <option value="mp3">MP3 (Standard)</option>
                    <option value="flac">FLAC (Lossless)</option>
                    <option value="m4a">M4A (Apple AAC)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary, #64748b)', display: 'block', marginBottom: '4px' }}>
                    Bitrate
                  </label>
                  <select
                    value={defaultQuality}
                    onChange={(e) => {
                      setDefaultQuality(e.target.value);
                      flashSaved();
                      if (onSavePreferences) {
                        onSavePreferences({ plugins, downloadFolder, defaultFormat, defaultQuality: e.target.value, chunkCount });
                      }
                    }}
                    style={{
                      width: '100%',
                      height: '34px',
                      padding: '0 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-medium, #e2e8f0)',
                      backgroundColor: 'var(--bg-main, #f8fafc)',
                      fontSize: '12px',
                      fontWeight: 400,
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  >
                    <option value="320k">320 kbps (Studio Master)</option>
                    <option value="256k">256 kbps (High Quality)</option>
                    <option value="192k">192 kbps (Standard)</option>
                  </select>
                </div>
              </div>

              <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #94a3b8)', fontWeight: 400 }}>
                Files download with studio 320 kbps bitrates automatically with ID3 embedded artwork.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: APPEARANCE SETTINGS */}
      {category === 'appearance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={16} color="var(--primary, #7c5cbf)" />
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Appearance & Theme
            </h2>
          </div>

          <div
            style={{
              padding: '18px 20px',
              borderRadius: '8px',
              border: '1px solid var(--border-medium, #e2e8f0)',
              backgroundColor: 'var(--bg-card, #ffffff)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxWidth: '600px',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Application Theme Mode
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Toggle between Light and Deep Obsidian Dark mode.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  if (theme !== 'light') onToggleTheme?.();
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  border: theme === 'light' ? '2px solid var(--primary, #7c5cbf)' : '1px solid var(--border-medium)',
                  backgroundColor: theme === 'light' ? 'rgba(124, 92, 191, 0.08)' : 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '13px',
                }}
              >
                <Sun size={18} color={theme === 'light' ? 'var(--primary, #7c5cbf)' : '#f59e0b'} />
                <span>Light Mode</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (theme !== 'dark') onToggleTheme?.();
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  border: theme === 'dark' ? '2px solid var(--primary, #7c5cbf)' : '1px solid var(--border-medium)',
                  backgroundColor: theme === 'dark' ? 'rgba(124, 92, 191, 0.12)' : 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '13px',
                }}
              >
                <Moon size={18} color={theme === 'dark' ? 'var(--primary, #7c5cbf)' : '#94a3b8'} />
                <span>Obsidian Dark</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: PLUGINS & MODULAR EXTENSIONS */}
      {category === 'plugins' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* SECTION 1: EXTENSION INSTALLER (URL Input Field) */}
          <div
            style={{
              padding: '18px 20px',
              borderRadius: '8px',
              border: '1px solid var(--border-medium, #e2e8f0)',
              backgroundColor: 'var(--bg-card, #ffffff)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DownloadCloud size={16} color="var(--primary, #7c5cbf)" />
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Install Extension from URL
                </h3>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Modular Extensions Base
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              Input any external extension repository or manifest URL. LuckyGuy safely validates and integrates plugin engines without interrupting active audio.
            </p>

            <form onSubmit={handleInstallExtension} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Paste extension repository or manifest URL (e.g. from LuckyGuy--extensions)..."
                value={extensionUrl}
                onChange={(e) => {
                  setExtensionUrl(e.target.value);
                  setInstallError('');
                }}
                style={{
                  flex: 1,
                  height: '36px',
                  padding: '0 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-medium, #e2e8f0)',
                  backgroundColor: 'var(--bg-main, #f8fafc)',
                  fontSize: '12.5px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  height: '36px',
                  padding: '0 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'var(--primary, #7c5cbf)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                  transition: 'opacity 0.15s ease',
                }}
              >
                <Plus size={14} />
                <span>Install Plugin</span>
              </button>
            </form>

            {installError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '11.5px' }}>
                <AlertCircle size={14} />
                <span>{installError}</span>
              </div>
            )}

            {installSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '11.5px' }}>
                <CheckCircle2 size={14} />
                <span>{installSuccess}</span>
              </div>
            )}

            {/* Installed External Extensions */}
            {customExtensions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Installed User Extensions ({customExtensions.length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {customExtensions.filter(ext => !extensionSearch || ext.name.toLowerCase().includes(extensionSearch.toLowerCase()) || (ext.category && ext.category.toLowerCase().includes(extensionSearch.toLowerCase()))).map((ext) => (
                    <div
                      key={ext.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-light, #f1f5f9)',
                        backgroundColor: 'var(--bg-main, #fafafa)',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {ext.name}
                          </span>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)', padding: '1px 6px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                            v{ext.version}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {ext.source}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          onClick={() => toggleExtension(ext.id)}
                          style={{
                            width: '36px',
                            height: '20px',
                            borderRadius: '999px',
                            backgroundColor: ext.enabled ? 'var(--primary, #7c5cbf)' : '#cbd5e1',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease',
                          }}
                          title={ext.enabled ? 'Enabled' : 'Disabled'}
                        >
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              backgroundColor: '#ffffff',
                              position: 'absolute',
                              top: '2px',
                              left: ext.enabled ? '18px' : '2px',
                              transition: 'left 0.2s ease',
                            }}
                          />
                        </div>

                        <button
                          onClick={() => handleRemoveExtension(ext.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Remove Extension"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: CORE STREAMING & RESOLVER ENGINES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={16} color="var(--primary, #7c5cbf)" />
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Built-in Streaming Engines
                </h3>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 400 }}>
                Toggle engines on or off
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '10px',
              }}
            >
              {corePluginsList.map((plugin) => {
                const isEnabled = plugins[plugin.id] ?? true;

                return (
                  <div
                    key={plugin.id}
                    style={{
                      backgroundColor: 'var(--bg-card, #ffffff)',
                      border: isEnabled ? '1px solid var(--border-medium, #e2e8f0)' : '1px solid var(--border-light, #f1f5f9)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '8px',
                      opacity: isEnabled ? 1 : 0.6,
                      transition: 'opacity 0.15s ease',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '8px',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              color: 'var(--text-secondary, #64748b)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.4px',
                            }}
                          >
                            {plugin.category}
                          </div>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: 600,
                              color: 'var(--text-primary, #0f172a)',
                              marginTop: '2px',
                            }}
                          >
                            {plugin.name}
                          </div>
                        </div>

                        {/* LIVE TOGGLE SWITCH */}
                        <div
                          onClick={() => togglePlugin(plugin.id)}
                          style={{
                            width: '38px',
                            height: '20px',
                            borderRadius: '999px',
                            backgroundColor: isEnabled ? 'var(--primary, #7c5cbf)' : '#cbd5e1',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease',
                            flexShrink: 0,
                          }}
                          title={isEnabled ? 'Click to Disable' : 'Click to Enable'}
                        >
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              backgroundColor: '#ffffff',
                              position: 'absolute',
                              top: '2px',
                              left: isEnabled ? '20px' : '2px',
                              transition: 'left 0.2s ease',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            }}
                          />
                        </div>
                      </div>

                      <p
                        style={{
                          fontSize: '11.5px',
                          color: 'var(--text-secondary, #64748b)',
                          lineHeight: '1.4',
                          margin: '6px 0 0 0',
                          fontWeight: 400,
                        }}
                      >
                        {plugin.description}
                      </p>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid var(--border-light, #f8fafc)',
                        paddingTop: '6px',
                        fontSize: '11px',
                        color: isEnabled ? 'var(--primary, #7c5cbf)' : 'var(--text-muted, #94a3b8)',
                        fontWeight: 500,
                      }}
                    >
                      <span>{isEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
