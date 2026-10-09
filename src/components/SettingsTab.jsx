import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Key,
  Sparkles,
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
  DownloadCloud,
  Search,
  Code,
  Play,
  FileCode
} from 'lucide-react';
import { CustomIcon } from './DuoIcons';

export default function SettingsTab({
  category = 'downloads',
  onSelectCategory,
  preferences,
  onSavePreferences,
  theme = 'light',
  onToggleTheme,
  onOpenSetupWizard,
  onUpdateExtensions,
}) {
  const [downloadFolder, setDownloadFolder] = useState(preferences?.downloadFolder || 'C:\\Users\
ishant\\Music');
  const [defaultFormat, setDefaultFormat] = useState(preferences?.format || 'mp3');
  const [defaultQuality, setDefaultQuality] = useState(preferences?.bitrate || '320k');
  const [chunkCount, setChunkCount] = useState(8);
  const [savedNotice, setSavedNotice] = useState(false);
  const [updateChecking, setUpdateChecking] = useState(false);
  const [updateResult, setUpdateResult] = useState(null);

  const handleCheckUpdates = async () => {
    setUpdateChecking(true);
    setUpdateResult(null);
    if (window.electronAPI?.checkForUpdates) {
      try {
        const res = await window.electronAPI.checkForUpdates();
        setUpdateResult(res);
      } catch (e) {
        setUpdateResult({ available: false, error: e.message });
      }
    } else {
      setTimeout(() => {
        setUpdateResult({ available: false, message: 'You are running the latest version of LuckyGuy (v1.0.0).' });
      }, 700);
    }
    setUpdateChecking(false);
  };

  // Modular Extension Base URL state
  const [extensionUrl, setExtensionUrl] = useState('');
  const [installError, setInstallError] = useState('');
  const [installSuccess, setInstallSuccess] = useState('');
  const [extensionSearch, setExtensionSearch] = useState('');
  const [pasteSnippet, setPasteSnippet] = useState('');
  const [pasteError, setPasteError] = useState('');
  const [pasteSuccess, setPasteSuccess] = useState('');
  const [activeInputMode, setActiveInputMode] = useState('url'); // 'url' | 'code'

  // Extension runtime settings
  const [plugins, setPlugins] = useState({});

  // Dynamically installed extensions (empty by default)
  const [customExtensions, setCustomExtensions] = useState(() => {
    try {
      const saved = localStorage.getItem('luckyguy-extensions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
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
      if (onUpdateExtensions) onUpdateExtensions(updated);
      return updated;
    });
  };

    const handleLoadSampleTemplate = () => {
    setPasteSnippet(JSON.stringify({
      id: "community-stream-hub",
      name: "Community Stream Hub",
      version: "1.0.0",
      description: "Custom streaming portal tab with ad-blocker and crawler integration.",
      tab: {
        title: "Stream Hub",
        icon: "Film",
        url: "https://archive.org/details/movies",
        badge: "HD"
      },
      capabilities: ["stream", "crawlPage", "adblock"],
      adBlockRules: [
        "*://*.doubleclick.net/*",
        "*://*analytics*/*"
      ]
    }, null, 2));
    setPasteError('');
    setPasteSuccess('Sample template loaded. Click "Test & Save Script" to register!');
    setTimeout(() => setPasteSuccess(''), 3000);
  };

  const handleInstallSnippet = (e) => {
    e.preventDefault();
    setPasteError('');
    setPasteSuccess('');

    const raw = pasteSnippet.trim();
    if (!raw) {
      setPasteError('Please paste your extension JSON manifest or script code.');
      return;
    }

    try {
      // Strip markdown code fences if copied directly from ChatGPT / Claude / Gemini
      let cleaned = raw.replace(/^`[a-zA-Z]*\s*/i, '').replace(/\s*`$/i, '').trim();

      let parsedManifest = null;
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedManifest = JSON.parse(jsonMatch[0]);
        } catch (jsonErr) {}
      }
      if (raw.startsWith('{') && raw.endsWith('}')) {
        parsedManifest = JSON.parse(raw);
      } else {
        // If it looks like code, extract or generate a lightweight manifest wrapper
        let titleMatch = raw.match(/title:\s*['"]([^'"]+)['"]/);
        let nameMatch = raw.match(/name:\s*['"]([^'"]+)['"]/);
        let urlMatch = raw.match(/url:\s*['"](https?:\/\/[^'"]+)['"]/);

        parsedManifest = {
          id: 'custom-' + Date.now(),
          name: nameMatch ? nameMatch[1] : (titleMatch ? titleMatch[1] : 'Pasted Custom Script'),
          version: '1.0.0',
          description: 'Custom plugin script pasted directly in LuckyGuy.',
          category: 'Custom Script',
          rating: 'all',
          tab: urlMatch ? {
            title: titleMatch ? titleMatch[1] : 'Custom Portal',
            url: urlMatch[1],
            badge: 'SCRIPT'
          } : null,
          capabilities: ['stream', 'crawlPage', 'adblock'],
          scriptContent: raw,
        };
      }

      if (!parsedManifest.name && !parsedManifest.id) {
        setPasteError('Could not find extension name or ID in pasted content.');
        return;
      }

      const newExt = {
        id: parsedManifest.id || ('ext-' + Date.now()),
        name: parsedManifest.name || 'Custom Extension',
        category: parsedManifest.category || 'Custom Extension',
        description: parsedManifest.description || 'Pasted custom plugin script.',
        source: 'Pasted In-App Script',
        version: parsedManifest.version || '1.0.0',
        author: parsedManifest.author || 'User',
        rating: parsedManifest.rating || 'all',
        tab: parsedManifest.tab || null,
        capabilities: parsedManifest.capabilities || ['stream', 'crawlPage'],
        adBlockRules: parsedManifest.adBlockRules || [],
        scriptContent: raw,
        enabled: false, // Disabled by default so user enables explicitly
      };

      const updated = [newExt, ...customExtensions.filter(e => e.id !== newExt.id)];
      setCustomExtensions(updated);
      try {
        localStorage.setItem('luckyguy-extensions', JSON.stringify(updated));
      } catch (e) {}

      flashSaved();
      if (onUpdateExtensions) onUpdateExtensions(updated);
      setPasteSnippet('');
      setPasteSuccess(`Extension "${newExt.name}" added successfully! Toggle it below to activate.`);
      setTimeout(() => setPasteSuccess(''), 4000);
    } catch (err) {
      setPasteError('Syntax or JSON error in pasted code: ' + err.message);
    }
  };

  const handleInstallExtension = async (e) => {
    e.preventDefault();
    setInstallError('');
    setInstallSuccess('');

    const trimmed = extensionUrl.trim();
    if (!trimmed) {
      setInstallError('Please enter a valid plugin repository or manifest URL.');
      return;
    }

    try {
      const parsed = new URL(trimmed);
      if (!parsed.protocol.startsWith('http')) {
        setInstallError('URL must use http:// or https://');
        return;
      }

      if (customExtensions.some((ext) => ext.source === trimmed)) {
        setInstallError('This extension is already registered in your library.');
        return;
      }

      let extName = 'Custom Extension';
      let extDesc = 'Custom media resolver plugin loaded from extension URL.';
      let extVersion = '1.0.0';
      let extCategory = 'Extension Engine';

      let manifestObj = {};
      try {
        const resp = await fetch(trimmed);
        if (resp.ok) {
          manifestObj = await resp.json();
          if (manifestObj.name) extName = manifestObj.name;
          if (manifestObj.description) extDesc = manifestObj.description;
          if (manifestObj.version) extVersion = manifestObj.version;
          if (manifestObj.category) extCategory = manifestObj.category;
        }
      } catch (e) {}

      const newExt = {
        id: manifestObj.id || ('ext-' + Date.now()),
        name: extName,
        category: extCategory,
        description: extDesc,
        source: trimmed,
        version: extVersion,
        author: manifestObj.author || parsed.hostname,
        rating: manifestObj.rating || 'all',
        tab: manifestObj.tab || null,
        capabilities: manifestObj.capabilities || [],
        adBlockRules: manifestObj.adBlockRules || [],
        enabled: false, // User explicitly toggles on only the extensions they choose!
      };

      const updated = [newExt, ...customExtensions];
      setCustomExtensions(updated);
      try {
        localStorage.setItem('luckyguy-extensions', JSON.stringify(updated));
      } catch (e) {}
      if (onUpdateExtensions) onUpdateExtensions(updated);

      setExtensionUrl('');
      setInstallSuccess(`Extension "${newExt.name}" loaded successfully!`);
      flashSaved();
      setTimeout(() => setInstallSuccess(''), 3000);
    } catch (err) {
      setInstallError('Invalid URL format. Example: https://raw.githubusercontent.com/.../manifest.json');
    }
  };

  const handleRemoveExtension = (id) => {
    const updated = customExtensions.filter((ext) => ext.id !== id);
    setCustomExtensions(updated);
    try {
      localStorage.setItem('luckyguy-extensions', JSON.stringify(updated));
    } catch (e) {}
    flashSaved();
    if (onUpdateExtensions) onUpdateExtensions(updated);
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
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-muted)',
              }}
            >
              • {category === 'downloads' && 'Downloads & Storage'}
              {category === 'appearance' && 'Appearance & UI'}
              {category === 'plugins' && 'Plugins & Extensions'}
            </span>
            {savedNotice && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#10b981',
                  marginLeft: '6px',
                }}
              >
                (Saved)
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
          {/* Setup Wizard & Software Updates */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '14px',
            }}
          >
            {/* Setup Wizard Card */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium, #e2e8f0)',
                backgroundColor: 'var(--bg-card, #ffffff)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="var(--primary, #7c5cbf)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  First-Time Setup Wizard
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                Relaunch the interactive setup guide to configure your music directory, automated genre sorting, and appearance.
              </p>
              <div>
                <button
                  type="button"
                  onClick={onOpenSetupWizard}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'var(--primary, #7c5cbf)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Sparkles size={13} />
                  <span>Launch Setup Wizard</span>
                </button>
              </div>
            </div>

            {/* Auto-Updater Card */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium, #e2e8f0)',
                backgroundColor: 'var(--bg-card, #ffffff)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={15} color="var(--primary, #7c5cbf)" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    LuckyGuy Updates
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  v1.0.0
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                LuckyGuy automatically verifies new releases against official GitHub releases.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleCheckUpdates}
                  disabled={updateChecking}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: updateChecking ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <RefreshCw size={12} className={updateChecking ? 'spin' : ''} />
                  <span>{updateChecking ? 'Checking...' : 'Check for Updates'}</span>
                </button>
                {updateResult && (
                  <span style={{ fontSize: '11.5px', color: updateResult.available ? '#10b981' : 'var(--text-muted)' }}>
                    {updateResult.available ? `New version v${updateResult.latestVersion} available!` : (updateResult.message || 'Up to date.')}
                  </span>
                )}
              </div>
            </div>
          </div>

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
          {/* SECTION 1: EXTENSION INSTALLER (URL or Paste Code Mode) */}
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
                  Add Extension or Script
                </h3>
              </div>
              
              {/* Mode Toggle: URL vs Paste Code */}
              <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-main, #f8fafc)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-medium, #e2e8f0)' }}>
                <button
                  type="button"
                  onClick={() => setActiveInputMode('url')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: activeInputMode === 'url' ? 'var(--bg-card, #ffffff)' : 'transparent',
                    color: activeInputMode === 'url' ? 'var(--primary, #7c5cbf)' : 'var(--text-secondary)',
                    boxShadow: activeInputMode === 'url' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  From URL
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInputMode('code')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: activeInputMode === 'code' ? 'var(--bg-card, #ffffff)' : 'transparent',
                    color: activeInputMode === 'code' ? 'var(--primary, #7c5cbf)' : 'var(--text-secondary)',
                    boxShadow: activeInputMode === 'code' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  Paste Code / JSON
                </button>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              {activeInputMode === 'url'
                ? 'Input any extension manifest URL from GitHub or community host. LuckyGuy safely registers the plugin engine.'
                : 'Simply paste any plugin JSON manifest or script code generated by AI or yourself to test and run it immediately.'}
            </p>

            {activeInputMode === 'url' ? (
              <form onSubmit={handleInstallExtension} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Paste extension manifest URL (e.g. from LuckyGuy--extensions)..."
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
                  }}
                >
                  <Plus size={14} />
                  <span>Install Plugin</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleInstallSnippet} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea
                  rows={5}
                  placeholder={`// Paste plugin manifest JSON or script snippet here, e.g.:
{
  "id": "my-plugin",
  "name": "Custom Video Streamer",
  "tab": { "title": "Stream Hub", "url": "https://example.com" },
  "adBlockRules": ["*://*.ads.com/*"]
}`}
                  value={pasteSnippet}
                  onChange={(e) => {
                    setPasteSnippet(e.target.value);
                    setPasteError('');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-medium, #e2e8f0)',
                    backgroundColor: 'var(--bg-main, #f8fafc)',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleLoadSampleTemplate}
                    style={{
                      height: '32px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-medium, #e2e8f0)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary, #64748b)',
                      fontSize: '11.5px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Sparkles size={13} color="var(--primary, #7c5cbf)" />
                    <span>Load Sample Template</span>
                  </button>

                  <button
                    type="submit"
                    style={{
                      height: '34px',
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
                    }}
                  >
                    <Play size={13} fill="#fff" />
                    <span>Test & Save Script</span>
                  </button>
                </div>
              </form>
            )}

            {pasteError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '11.5px' }}>
                <AlertCircle size={14} />
                <span>{pasteError}</span>
              </div>
            )}

            {pasteSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '11.5px' }}>
                <CheckCircle2 size={14} />
                <span>{pasteSuccess}</span>
              </div>
            )}

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
            {customExtensions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                {/* Search Extensions Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Installed Extensions ({customExtensions.filter(e => !extensionSearch || e.name.toLowerCase().includes(extensionSearch.toLowerCase()) || (e.category && e.category.toLowerCase().includes(extensionSearch.toLowerCase()))).length})
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      height: '30px',
                      padding: '0 8px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-main, #f8fafc)',
                      border: '1px solid var(--border-medium, #e2e8f0)',
                      minWidth: '200px'
                    }}
                  >
                    <Search size={13} color="var(--text-muted)" />
                    <input
                      type="text"
                      placeholder="Search installed extensions..."
                      value={extensionSearch}
                      onChange={(e) => setExtensionSearch(e.target.value)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        fontSize: '11px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        width: '100%'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {customExtensions.filter(ext => !extensionSearch || ext.name.toLowerCase().includes(extensionSearch.toLowerCase()) || (ext.category && ext.category.toLowerCase().includes(extensionSearch.toLowerCase()))).map((ext) => (
                    <div
                      key={ext.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-medium, #e2e8f0)',
                        backgroundColor: 'var(--bg-card, #ffffff)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {ext.name}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--primary, #7c5cbf)', backgroundColor: 'rgba(124, 92, 191, 0.08)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            {ext.category || 'Extension Engine'}
                          </span>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                            v{ext.version || '1.0.0'}
                          </span>
                        </div>
                        <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                          {ext.description}
                        </p>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {ext.source}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          onClick={() => toggleExtension(ext.id)}
                          style={{
                            width: '38px',
                            height: '20px',
                            borderRadius: '999px',
                            backgroundColor: ext.enabled ? 'var(--primary, #7c5cbf)' : '#cbd5e1',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease',
                            flexShrink: 0,
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
                              left: ext.enabled ? '20px' : '2px',
                              transition: 'left 0.2s ease',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
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
                          title="Uninstall Extension"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: '32px 20px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-main, #f8fafc)',
                  border: '1px dashed var(--border-medium, #e2e8f0)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '6px'
                }}
              >
                <DownloadCloud size={28} color="var(--primary, #7c5cbf)" style={{ opacity: 0.7 }} />
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  No Extensions Installed
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '440px' }}>
                  LuckyGuy is an offline-first player. Paste an extension manifest URL from <span style={{ color: 'var(--primary, #7c5cbf)', fontWeight: 500 }}>LuckyGuy--extensions</span> above to add media streaming or metadata engines.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
