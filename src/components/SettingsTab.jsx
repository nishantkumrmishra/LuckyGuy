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
  FileCode,
  Check,
  X,
  Eye,
  EyeOff,
  SlidersHorizontal
} from 'lucide-react';
import { CustomIcon } from './DuoIcons';

export default function SettingsTab({
  category = 'downloads',
  onSelectCategory,
  preferences,
  onSavePreferences,
  theme = 'light',
  onToggleTheme,
  setTheme,
  appearance = { accentColor: '#7c5cbf', fontFamily: 'Inter', borderRadius: '8px' },
  onUpdateAppearance,
  onOpenSetupWizard,
  installedExtensions = [],
  onUpdateExtensions,
  onNavigateTab,
}) {
  const [downloadFolder, setDownloadFolder] = useState(preferences?.downloadFolder || 'C:\\Users\
ishant\\Music');
  const [defaultFormat, setDefaultFormat] = useState(preferences?.format || 'mp3');
  const [defaultQuality, setDefaultQuality] = useState(preferences?.bitrate || '320k');
  const [chunkCount, setChunkCount] = useState(8);
  const [savedNotice, setSavedNotice] = useState(false);
  const [updateChecking, setUpdateChecking] = useState(false);
  const [updateResult, setUpdateResult] = useState(null);
  const [downloadingUpdate, setDownloadingUpdate] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(null);
  const [updateError, setUpdateError] = useState('');

  const handleSetTheme = (newMode) => {
    if (setTheme) {
      setTheme(newMode);
    } else if (onToggleTheme) {
      if (theme !== newMode) onToggleTheme();
    }
  };

  useEffect(() => {
    if (window.electronAPI?.onUpdateDownloadProgress) {
      return window.electronAPI.onUpdateDownloadProgress((prog) => {
        setUpdateProgress(prog.percent || 0);
      });
    }
  }, []);

  const handleInstallUpdate = async (info) => {
    if (!info?.downloadUrl) {
      if (info?.releaseUrl && window.electronAPI?.openExternal) {
        window.electronAPI.openExternal(info.releaseUrl);
      }
      return;
    }
    setDownloadingUpdate(true);
    setUpdateProgress(0);
    setUpdateError('');
    try {
      const res = await window.electronAPI.downloadAndInstallUpdate(info.downloadUrl, info.assetName);
      if (res?.error) {
        setUpdateError(res.error);
        setDownloadingUpdate(false);
      }
    } catch (e) {
      setUpdateError(e.message);
      setDownloadingUpdate(false);
    }
  };

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

  const [accentColor, setAccentColor] = useState(appearance?.accentColor || '#7c5cbf');
  const [fontFamily, setFontFamily] = useState(appearance?.fontFamily || 'Inter');
  const [borderRadius, setBorderRadius] = useState(appearance?.borderRadius || '8px');
  const [themePaste, setThemePaste] = useState('');
  const [themeMsg, setThemeMsg] = useState('');
  const [isCustomThemeModalOpen, setIsCustomThemeModalOpen] = useState(false);

  const THEME_PRESETS = [
    { id: 'royal-velvet', name: 'Royal Velvet', mode: 'light', accentColor: '#7c5cbf', fontFamily: 'Inter', borderRadius: '8px', desc: 'Light • Violet • Inter' },
    { id: 'cyberpunk-matrix', name: 'Cyberpunk Matrix', mode: 'dark', accentColor: '#10b981', fontFamily: 'JetBrains Mono', borderRadius: '4px', desc: 'Dark • Emerald • Mono' },
    { id: 'deep-ocean', name: 'Deep Ocean', mode: 'dark', accentColor: '#0ea5e9', fontFamily: 'Geist Sans', borderRadius: '14px', desc: 'Dark • Ocean • Geist' },
    { id: 'neon-flamingo', name: 'Neon Flamingo', mode: 'light', accentColor: '#f43f5e', fontFamily: 'Inter', borderRadius: '20px', desc: 'Light • Ruby • Pill' },
    { id: 'sunset-amber', name: 'Sunset Amber', mode: 'dark', accentColor: '#f97316', fontFamily: 'Inter', borderRadius: '8px', desc: 'Dark • Orange • Smooth' },
  ];

  const currentPresetId = (() => {
    const matched = THEME_PRESETS.find(
      (p) =>
        p.accentColor.toLowerCase() === (accentColor || '').toLowerCase() &&
        p.mode === theme &&
        p.borderRadius === borderRadius &&
        p.fontFamily === fontFamily
    );
    return matched ? matched.id : 'custom';
  })();

  useEffect(() => {
    if (appearance?.accentColor) setAccentColor(appearance.accentColor);
    if (appearance?.fontFamily) setFontFamily(appearance.fontFamily);
    if (appearance?.borderRadius) setBorderRadius(appearance.borderRadius);
  }, [appearance]);

  const updateAppearanceSetting = (key, value) => {
    const next = {
      accentColor: key === 'accentColor' ? value : accentColor,
      fontFamily: key === 'fontFamily' ? value : fontFamily,
      borderRadius: key === 'borderRadius' ? value : borderRadius,
    };
    if (key === 'accentColor') setAccentColor(value);
    if (key === 'fontFamily') setFontFamily(value);
    if (key === 'borderRadius') setBorderRadius(value);
    flashSaved();
    if (onUpdateAppearance) onUpdateAppearance(next);
  };

  const applyPresetTheme = (preset) => {
    setAccentColor(preset.accentColor);
    setFontFamily(preset.fontFamily);
    setBorderRadius(preset.borderRadius);
    flashSaved();
    if (preset.mode) {
      handleSetTheme(preset.mode);
    }
    if (onUpdateAppearance) onUpdateAppearance({
      accentColor: preset.accentColor,
      fontFamily: preset.fontFamily,
      borderRadius: preset.borderRadius
    });
    setThemeMsg(`Preset "${preset.name}" applied!`);
    setTimeout(() => setThemeMsg(''), 3000);
  };

  const handleApplyPastedTheme = (e) => {
    e.preventDefault();
    if (!themePaste.trim()) return;
    try {
      let raw = themePaste.trim();
      raw = raw.replace(/^\`\`\`[a-zA-Z]*\s*/i, '').replace(/\s*\`\`\`$/i, '').trim();
      const parsed = JSON.parse(raw);
      const nextAccent = parsed.accentColor || accentColor;
      const nextFont = parsed.fontFamily || fontFamily;
      const nextRadius = parsed.borderRadius || borderRadius;
      if (parsed.accentColor) setAccentColor(nextAccent);
      if (parsed.fontFamily) setFontFamily(nextFont);
      if (parsed.borderRadius) setBorderRadius(nextRadius);
      if (parsed.mode) handleSetTheme(parsed.mode);
      if (onUpdateAppearance) {
        onUpdateAppearance({
          accentColor: nextAccent,
          fontFamily: nextFont,
          borderRadius: nextRadius
        });
      }
      flashSaved();
      setThemeMsg(`Theme "${parsed.name || 'Custom Theme'}" applied successfully!`);
      setThemePaste('');
      setTimeout(() => setThemeMsg(''), 4000);
    } catch (err) {
      setThemeMsg(`Theme parse error: ${err.message}`);
    }
  };

  const handleExportTheme = () => {
    const exportObj = {
      name: "My LuckyGuy Custom Theme",
      mode: theme,
      accentColor,
      fontFamily,
      borderRadius,
      version: "1.0.0"
    };
    navigator.clipboard?.writeText(JSON.stringify(exportObj, null, 2));
    setThemeMsg('Theme JSON copied to clipboard!');
    setTimeout(() => setThemeMsg(''), 3000);
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

    // Sync customExtensions with installedExtensions prop
  useEffect(() => {
    if (installedExtensions && Array.isArray(installedExtensions) && installedExtensions.length > 0) {
      setCustomExtensions(installedExtensions);
    }
  }, [installedExtensions]);

  const activePluginId = category.startsWith('plugin-') ? category.replace('plugin-', '') : null;
  const activePluginSettings = activePluginId ? customExtensions.find((e) => e.id === activePluginId) : null;

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
      version: "2.1.0",
      type: "portal",
      rating: "all",
      description: "Custom streaming portal tab with multi-quality video player, crawler, and ad-blocker.",
      author: "Community Developer",
      mediaTypes: ["video", "audio"],
      tab: {
        title: "Stream Hub",
        icon: "Youtube",
        url: "https://archive.org/details/movies",
        viewLayout: "grid",
        themeColor: "#7c5cbf",
        badge: "HD"
      },
      capabilities: ["stream", "crawlPage", "download", "videoPlayer", "metadata", "adblock"],
      supportedUrls: ["*://archive.org/*"],
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
    e?.preventDefault();
    setInstallError('');
    setInstallSuccess('');

    let trimmed = extensionUrl.trim();
    if (!trimmed) {
      setInstallError('Please enter a valid plugin repository or manifest URL.');
      return;
    }

    if (trimmed.includes('LuckyGuy-extensions')) {
      trimmed = trimmed.replace('LuckyGuy-extensions', 'LuckyGuy--extensions');
    }

    try {
      const parsed = new URL(trimmed);
      if (!parsed.protocol.startsWith('http')) {
        setInstallError('URL must use http:// or https://');
        return;
      }

      let resp;
      try {
        resp = await fetch(trimmed);
      } catch (netErr) {
        setInstallError('Network error reaching manifest URL: ' + netErr.message);
        return;
      }

      if (!resp.ok) {
        setInstallError(`Failed to fetch extension manifest (HTTP ${resp.status}). Please check URL.`);
        return;
      }

      const manifestObj = await resp.json();

      // Check if this is a Registry Index containing an array of extensions
      const extList = (manifestObj && Array.isArray(manifestObj.extensions))
        ? manifestObj.extensions
        : (Array.isArray(manifestObj) ? manifestObj : null);

      if (extList && extList.length > 0) {
        let addedCount = 0;
        let updatedCount = 0;
        let nextExtensions = customExtensions.filter((item) => item.name !== 'Custom Extension' && !item.id.startsWith('ext-dummy'));

        for (const item of extList) {
          const id = item.id || ('ext-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6));
          const source = item.downloadUrl || item.source || trimmed;
          const existingIdx = nextExtensions.findIndex((ext) => ext.id === id || ext.source === source);

          const extData = {
            id,
            name: item.name || 'Unnamed Extension',
            category: item.category || (item.type === 'audio' ? 'Audio Engine' : 'Extension Engine'),
            description: item.description || '',
            source,
            version: item.version || '1.0.0',
            author: item.author || parsed.hostname,
            type: item.type || (item.capabilities?.includes('stream') ? 'audio' : 'portal'),
            rating: item.rating || 'all',
            tab: item.tab || null,
            capabilities: item.capabilities || [],
            supportedUrls: item.supportedUrls || [],
            adBlockRules: item.adBlockRules || [],
            enabled: existingIdx !== -1 ? nextExtensions[existingIdx].enabled : (item.enabled === true ? true : false),
          };

          if (existingIdx !== -1) {
            nextExtensions[existingIdx] = extData;
            updatedCount++;
          } else {
            nextExtensions.push(extData);
            addedCount++;
          }
        }

        setCustomExtensions(nextExtensions);
        try {
          localStorage.setItem('luckyguy-extensions', JSON.stringify(nextExtensions));
        } catch (e) {}
        if (onUpdateExtensions) onUpdateExtensions(nextExtensions);

        setExtensionUrl('');
        setInstallSuccess(`Repository indexed! Loaded ${nextExtensions.length} extensions. Toggle each one ON/OFF as desired below.`);
        flashSaved();
        setTimeout(() => setInstallSuccess(''), 4500);
        return;
      }

      // Standalone single extension manifest
      let extName = manifestObj.name || 'Custom Extension';
      let extDesc = manifestObj.description || 'Custom media resolver plugin loaded from extension URL.';
      let extVersion = manifestObj.version || '1.0.0';
      let extCategory = manifestObj.category || (manifestObj.type === 'audio' ? 'Audio Engine' : 'Extension Engine');

      const newExt = {
        id: manifestObj.id || ('ext-' + Date.now()),
        name: extName,
        category: extCategory,
        description: extDesc,
        source: trimmed,
        version: extVersion,
        author: manifestObj.author || parsed.hostname,
        type: manifestObj.type || (manifestObj.capabilities?.includes('stream') ? 'audio' : 'portal'),
        rating: manifestObj.rating || 'all',
        tab: manifestObj.tab || null,
        capabilities: manifestObj.capabilities || [],
        supportedUrls: manifestObj.supportedUrls || [],
        adBlockRules: manifestObj.adBlockRules || [],
        enabled: false,
      };

      const updated = [newExt, ...customExtensions.filter(e => e.id !== newExt.id && e.name !== 'Custom Extension')];
      setCustomExtensions(updated);
      try {
        localStorage.setItem('luckyguy-extensions', JSON.stringify(updated));
      } catch (e) {}
      if (onUpdateExtensions) onUpdateExtensions(updated);

      setExtensionUrl('');
      setInstallSuccess(`Extension "${newExt.name}" loaded successfully! Toggle below to activate.`);
      flashSaved();
      setTimeout(() => setInstallSuccess(''), 3500);
    } catch (err) {
      setInstallError('Invalid URL or manifest error: ' + err.message);
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
              {category.startsWith('plugin-') && (activePluginSettings?.settings?.title || `${activePluginSettings?.name || 'Plugin'} Setup`)}
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
            {category.startsWith('plugin-') && (activePluginSettings?.settings?.description || 'Configure custom plugin parameters, API tokens, and download folders.')}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleCheckUpdates}
                    disabled={updateChecking || downloadingUpdate}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: 'var(--bg-main)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: (updateChecking || downloadingUpdate) ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <RefreshCw size={12} className={updateChecking ? 'spin' : ''} />
                    <span>{updateChecking ? 'Checking...' : 'Check for Updates'}</span>
                  </button>
                  {updateResult && !updateResult.available && (
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      {updateResult.message || 'Up to date.'}
                    </span>
                  )}
                </div>

                {updateResult?.available && (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#10b981' }}>
                        ✨ New Version v{updateResult.latestVersion} is Available!
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Current: v{updateResult.currentVersion}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleInstallUpdate(updateResult)}
                        disabled={downloadingUpdate}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: 'var(--primary, #7c5cbf)',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: downloadingUpdate ? 'wait' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <DownloadCloud size={13} />
                        <span>{downloadingUpdate ? `Downloading (${updateProgress ?? 0}%)...` : 'Download & Install Now'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (updateResult.releaseUrl && window.electronAPI?.openExternal) {
                            window.electronAPI.openExternal(updateResult.releaseUrl);
                          }
                        }}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-medium)',
                          backgroundColor: 'transparent',
                          color: 'var(--text-secondary)',
                          fontSize: '11.5px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <ExternalLink size={12} />
                        <span>View Release Notes</span>
                      </button>
                    </div>

                    {downloadingUpdate && updateProgress !== null && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                          <span>Downloading setup installer...</span>
                          <span>{updateProgress}%</span>
                        </div>
                        <div style={{ width: '100%', height: '5px', borderRadius: '3px', backgroundColor: 'var(--border-medium)', overflow: 'hidden' }}>
                          <div style={{ width: `${updateProgress}%`, height: '100%', backgroundColor: 'var(--primary, #7c5cbf)', transition: 'width 0.2s ease' }} />
                        </div>
                      </div>
                    )}

                    {updateError && (
                      <span style={{ fontSize: '11px', color: '#ef4444' }}>
                        Update failed: {updateError}
                      </span>
                    )}
                  </div>
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

      {/* SUBTAB 2: APPEARANCE SETTINGS (Clean, Minimalist, Compact Space Utilization) */}
      {category === 'appearance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '840px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Palette size={16} color="var(--primary, #7c5cbf)" />
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Appearance & Theme Studio
              </h2>
            </div>
            {themeMsg && (
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> {themeMsg}
              </span>
            )}
          </div>

          {/* Unified Compact Settings Card */}
          <div
            style={{
              padding: '20px 22px',
              borderRadius: '8px',
              border: '1px solid var(--border-medium, #e2e8f0)',
              backgroundColor: 'var(--bg-card, #ffffff)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            {/* ROW 1: Theme Presets Dropdown & Add Custom Theme Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Theme Preset
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Select a curated theme preset or load custom CSS / JSON.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsCustomThemeModalOpen(true)}
                    style={{
                      height: '32px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--primary, #7c5cbf)',
                      backgroundColor: 'rgba(124, 92, 191, 0.08)',
                      color: 'var(--primary, #7c5cbf)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease',
                    }}
                    title="Open modal pop-up to paste custom Theme JSON or CSS"
                  >
                    <Plus size={14} />
                    <span>+ New Theme / CSS</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportTheme}
                    style={{
                      height: '32px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: 'var(--bg-main)',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                    title="Export current palette to clipboard"
                  >
                    <Code size={13} />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* Preset Selector Dropdown */}
              <select
                value={currentPresetId}
                onChange={(e) => {
                  const matched = THEME_PRESETS.find((p) => p.id === e.target.value);
                  if (matched) applyPresetTheme(matched);
                }}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-medium, #e2e8f0)',
                  backgroundColor: 'var(--bg-main, #f8fafc)',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {THEME_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.desc})
                  </option>
                ))}
                <option value="custom">Custom Theme (User Configured)</option>
              </select>
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--border-light, #f1f5f9)' }} />

            {/* ROW 2: Theme Mode & Accent Color in a compact 2-column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Theme Mode Segmented Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Theme Mode
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleSetTheme('light')}
                    style={{
                      flex: 1,
                      height: '34px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      borderRadius: '6px',
                      border: theme === 'light' ? '2px solid var(--primary, #7c5cbf)' : '1px solid var(--border-medium)',
                      backgroundColor: theme === 'light' ? 'rgba(124, 92, 191, 0.08)' : 'var(--bg-main)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: '12.5px',
                    }}
                  >
                    <Sun size={15} color={theme === 'light' ? 'var(--primary, #7c5cbf)' : '#f59e0b'} />
                    <span>Light Mode</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetTheme('dark')}
                    style={{
                      flex: 1,
                      height: '34px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      borderRadius: '6px',
                      border: theme === 'dark' ? '2px solid var(--primary, #7c5cbf)' : '1px solid var(--border-medium)',
                      backgroundColor: theme === 'dark' ? 'rgba(124, 92, 191, 0.12)' : 'var(--bg-main)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: '12.5px',
                    }}
                  >
                    <Moon size={15} color={theme === 'dark' ? 'var(--primary, #7c5cbf)' : '#94a3b8'} />
                    <span>Obsidian Dark</span>
                  </button>
                </div>
              </div>

              {/* Accent Color Swatches & Custom Picker */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Primary Accent Color
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => updateAppearanceSetting('accentColor', e.target.value)}
                      style={{ width: '22px', height: '22px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'none' }}
                      title="Custom hex color picker"
                    />
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      {accentColor}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                  {[
                    { name: 'Violet', color: '#7c5cbf' },
                    { name: 'Emerald', color: '#10b981' },
                    { name: 'Ocean', color: '#0ea5e9' },
                    { name: 'Ruby', color: '#f43f5e' },
                    { name: 'Sunset', color: '#f97316' },
                    { name: 'Amber', color: '#eab308' },
                    { name: 'Indigo', color: '#6366f1' },
                    { name: 'Slate', color: '#64748b' },
                  ].map((swatch) => {
                    const isSelected = accentColor.toLowerCase() === swatch.color.toLowerCase();
                    return (
                      <button
                        key={swatch.color}
                        type="button"
                        onClick={() => updateAppearanceSetting('accentColor', swatch.color)}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          border: isSelected ? '2px solid var(--text-primary)' : '2px solid transparent',
                          backgroundColor: swatch.color,
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 0 0 2px var(--bg-card)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          transition: 'transform 0.1s ease',
                        }}
                        title={swatch.name}
                      >
                        {isSelected && <Check size={13} color="#ffffff" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--border-light, #f1f5f9)' }} />

            {/* ROW 3: Typography & Interface Corner Rounding */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Typography Font Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Typography
                </div>
                <select
                  value={fontFamily}
                  onChange={(e) => updateAppearanceSetting('fontFamily', e.target.value)}
                  style={{
                    height: '34px',
                    padding: '0 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-medium, #e2e8f0)',
                    backgroundColor: 'var(--bg-main, #f8fafc)',
                    fontSize: '12.5px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="Inter">Inter (Clean Modern Sans - Default)</option>
                  <option value="System UI">System UI (Native Windows / Segoe UI)</option>
                  <option value="JetBrains Mono">JetBrains Mono (Developer Monospace)</option>
                  <option value="Geist Sans">Geist Sans (High-Precision Tech)</option>
                  <option value="Merriweather">Merriweather (Classic Editorial Serif)</option>
                </select>
              </div>

              {/* Corner Rounding Segmented Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Interface Curvature
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { label: 'Sharp', value: '4px' },
                    { label: 'Default', value: '8px' },
                    { label: 'Curved', value: '14px' },
                    { label: 'Pill', value: '20px' },
                  ].map((r) => {
                    const isSelected = borderRadius === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => updateAppearanceSetting('borderRadius', r.value)}
                        style={{
                          flex: 1,
                          height: '34px',
                          borderRadius: '6px',
                          border: isSelected ? '2px solid var(--primary, #7c5cbf)' : '1px solid var(--border-medium)',
                          backgroundColor: isSelected ? 'rgba(124, 92, 191, 0.08)' : 'var(--bg-main)',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                          fontWeight: isSelected ? 600 : 400,
                          cursor: 'pointer',
                        }}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Clean Pop-up Modal for Custom Theme / CSS / JSON Code */}
          {isCustomThemeModalOpen && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px',
              }}
              onClick={() => setIsCustomThemeModalOpen(false)}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: '520px',
                  backgroundColor: 'var(--bg-card, #ffffff)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-medium)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                  padding: '22px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Code size={17} color="var(--primary, #7c5cbf)" />
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Custom Theme & CSS / JSON
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCustomThemeModalOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Paste any Theme JSON generated by AI or community themes to instantly configure LuckyGuy.
                </p>

                <form
                  onSubmit={(e) => {
                    handleApplyPastedTheme(e);
                    setIsCustomThemeModalOpen(false);
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                >
                  <textarea
                    rows={6}
                    placeholder={`// Paste Theme JSON generated by AI, e.g.:
{
  "name": "Custom Theme",
  "accentColor": "#0ea5e9",
  "fontFamily": "JetBrains Mono",
  "borderRadius": "6px",
  "mode": "dark"
}`}
                    value={themePaste}
                    onChange={(e) => setThemePaste(e.target.value)}
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

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setThemePaste(JSON.stringify({
                          name: "Midnight Indigo",
                          accentColor: "#6366f1",
                          fontFamily: "Geist Sans",
                          borderRadius: "6px",
                          mode: "dark"
                        }, null, 2));
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary, #7c5cbf)',
                        fontSize: '11.5px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Insert Sample Theme
                    </button>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setIsCustomThemeModalOpen(false)}
                        style={{
                          height: '32px',
                          padding: '0 14px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-medium)',
                          backgroundColor: 'var(--bg-main)',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={{
                          height: '32px',
                          padding: '0 16px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: 'var(--primary, #7c5cbf)',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Apply Theme
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
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
                ? 'Input any extension manifest or repository index URL from GitHub or any host. LuckyGuy registers the plugin safely.'
                : 'Simply paste any plugin JSON manifest or script code generated by AI or yourself to test and run it immediately.'}
            </p>

            {activeInputMode === 'url' ? (
              <>
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
              
              </>
            ) : (
              <form onSubmit={handleInstallSnippet} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea
                  rows={5}
                  placeholder={`// Paste plugin manifest JSON (SDK v2.1), e.g.:
{
  "id": "my-plugin",
  "name": "Custom Streamer",
  "type": "portal",
  "tab": { "title": "Stream Hub", "url": "https://example.com", "viewLayout": "grid" },
  "capabilities": ["stream", "download", "videoPlayer", "crawlPage"]
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
                  LuckyGuy is an offline-first player. Paste an extension manifest or repository index URL above to install custom streaming or media portal engines.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 4: DYNAMIC PLUGIN DEDICATED SETTINGS TAB */}
      {category.startsWith('plugin-') && activePluginSettings && (
        <PluginSettingsView
          plugin={activePluginSettings}
          onFlashSaved={flashSaved}
          onNavigateTab={onNavigateTab}
          onSelectCategory={onSelectCategory}
        />
      )}
    </div>
  );
}

function PluginSettingsView({ plugin, onFlashSaved, onNavigateTab, onSelectCategory }) {
  const [values, setValues] = useState(() => {
    try {
      const saved = localStorage.getItem(`luckyguy-plugin-settings-${plugin.id}`);
      const parsed = saved ? JSON.parse(saved) : {};
      const initial = {};
      if (plugin.settings?.fields && Array.isArray(plugin.settings.fields)) {
        plugin.settings.fields.forEach((f) => {
          initial[f.id] = parsed[f.id] !== undefined ? parsed[f.id] : (f.defaultValue !== undefined ? f.defaultValue : '');
        });
      }
      return { ...initial, ...parsed };
    } catch {
      return {};
    }
  });

  const [showPasswords, setShowPasswords] = useState({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const handleChange = (id, val) => {
    setValues((prev) => ({ ...prev, [id]: val }));
  };

  const handleSave = (e) => {
    e?.preventDefault();
    try {
      localStorage.setItem(`luckyguy-plugin-settings-${plugin.id}`, JSON.stringify(values));
    } catch (e) {}
    onFlashSaved?.();
    setSaveSuccessMsg(`Settings saved for ${plugin.name}!`);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleReset = () => {
    const initial = {};
    if (plugin.settings?.fields && Array.isArray(plugin.settings.fields)) {
      plugin.settings.fields.forEach((f) => {
        initial[f.id] = f.defaultValue !== undefined ? f.defaultValue : '';
      });
    }
    setValues(initial);
    try {
      localStorage.setItem(`luckyguy-plugin-settings-${plugin.id}`, JSON.stringify(initial));
    } catch (e) {}
    onFlashSaved?.();
    setSaveSuccessMsg('Reset to default values.');
    setTimeout(() => setSaveSuccessMsg(''), 2500);
  };

  const handleBrowseFolder = async (fieldId) => {
    if (window.electronAPI?.selectFolder) {
      try {
        const selected = await window.electronAPI.selectFolder();
        if (selected) handleChange(fieldId, selected);
      } catch (e) {}
    }
  };

  const fields = plugin.settings?.fields || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Plugin Header Banner */}
      <div
        style={{
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid var(--border-medium, #e2e8f0)',
          backgroundColor: 'var(--bg-card, #ffffff)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(124, 92, 191, 0.12)',
              color: 'var(--primary, #7c5cbf)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            <SlidersHorizontal size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {plugin.settings?.title || `${plugin.name} Settings`}
              </h2>
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--primary, #7c5cbf)',
                  backgroundColor: 'rgba(124, 92, 191, 0.08)',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                {plugin.category || 'Plugin Engine'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                v{plugin.version || '1.0.0'}
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              {plugin.settings?.description || plugin.description || 'Configure parameters for this extension.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {plugin.tab && (
            <button
              type="button"
              onClick={() => onNavigateTab?.('plugin-' + plugin.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '6px',
                border: '1px solid var(--primary, #7c5cbf)',
                backgroundColor: 'rgba(124, 92, 191, 0.08)',
                color: 'var(--primary, #7c5cbf)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ExternalLink size={13} />
              <span>Open Plugin Tab</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onSelectCategory?.('plugins')}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Back to Plugins
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#10b981',
            fontSize: '12.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Form Fields Card */}
      <form
        onSubmit={handleSave}
        style={{
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid var(--border-medium, #e2e8f0)',
          backgroundColor: 'var(--bg-card, #ffffff)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {fields.length > 0 ? (
          fields.map((field) => {
            const val = values[field.id] !== undefined ? values[field.id] : '';
            return (
              <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {field.label}
                  </label>
                  {field.type === 'password' && (
                    <button
                      type="button"
                      onClick={() => setShowPasswords((prev) => ({ ...prev, [field.id]: !prev[field.id] }))}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                    >
                      {showPasswords[field.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{showPasswords[field.id] ? 'Hide' : 'Show'}</span>
                    </button>
                  )}
                </div>

                {field.description && (
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {field.description}
                  </span>
                )}

                {/* Field Controls by Type */}
                {field.type === 'select' ? (
                  <select
                    value={val}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    style={{
                      height: '36px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: 'var(--bg-main)',
                      color: 'var(--text-primary)',
                      fontSize: '12.5px',
                      outline: 'none',
                    }}
                  >
                    {(field.options || []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'boolean' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                    <div
                      onClick={() => handleChange(field.id, !val)}
                      style={{
                        width: '42px',
                        height: '22px',
                        borderRadius: '999px',
                        backgroundColor: val ? 'var(--primary, #7c5cbf)' : '#cbd5e1',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: '#ffffff',
                          position: 'absolute',
                          top: '2px',
                          left: val ? '22px' : '2px',
                          transition: 'left 0.2s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                      {val ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                ) : field.type === 'folder' ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      placeholder={field.placeholder || 'Directory path...'}
                      style={{
                        flex: 1,
                        height: '36px',
                        padding: '0 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-medium)',
                        backgroundColor: 'var(--bg-main)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleBrowseFolder(field.id)}
                      style={{
                        padding: '0 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-medium)',
                        backgroundColor: 'var(--bg-main)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Browse...
                    </button>
                  </div>
                ) : field.type === 'code' || field.type === 'textarea' ? (
                  <textarea
                    rows={5}
                    value={val}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    placeholder={field.placeholder || '// Enter custom JavaScript...'}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: 'var(--bg-main)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      lineHeight: '1.4',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                ) : (
                  <input
                    type={field.type === 'password' && !showPasswords[field.id] ? 'password' : 'text'}
                    value={val}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    placeholder={field.placeholder || ''}
                    style={{
                      height: '36px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: 'var(--bg-main)',
                      color: 'var(--text-primary)',
                      fontSize: '12.5px',
                    }}
                  />
                )}
              </div>
            );
          })
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No specialized configuration schema provided by this plugin.
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-medium)' }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Reset Defaults
          </button>
          <button
            type="submit"
            style={{
              padding: '8px 20px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--primary, #7c5cbf)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Save Plugin Settings
          </button>
        </div>
      </form>
    </div>
  );
}
