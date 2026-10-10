// Documentation Search Index & Autocomplete Navigation
const searchDatabase = [
  {
    title: "Overview & Architecture",
    category: "Getting Started",
    url: "index.html",
    keywords: "overview architecture local-first electron react modular components high-res lossless design",
    desc: "Discover LuckyGuy's offline-first architecture, decoupled audio core, and modular extension runtime."
  },
  {
    title: "Installation & Setup",
    category: "Getting Started",
    url: "getting-started.html",
    keywords: "install setup requirements git clone npm dependencies launch package windows linux mac",
    desc: "Step-by-step setup guide for running LuckyGuy in development mode or building production desktop packages."
  },
  {
    title: "Core Features",
    category: "Getting Started",
    url: "features.html",
    keywords: "features queue playlists sleep timer hotkeys search metadata tagging volume normalize",
    desc: "Deep-dive into features including Smart Queue, Sleep Timer, Global Shortcuts, and Tag Editing."
  },
  {
    title: "Audio Engine & Formats",
    category: "Audio Engine",
    url: "audio-engine.html",
    keywords: "audio engine flac mp3 aac ogg wav gapless playback equalization 10-band dsp volume boost bit-perfect",
    desc: "Learn about the Web Audio API backend, gapless transitions, bit-perfect streaming, and format decoding."
  },
  {
    title: "Equalizer & Sound Effects",
    category: "Audio Engine",
    url: "audio-engine.html#equalizer",
    keywords: "eq equalizer presets bass boost vocal treble gain decibels frequency biquad filter",
    desc: "Details on the 10-band parametric equalizer, custom presets, and real-time audio shaping."
  },
  {
    title: "Downloader Pipeline",
    category: "Downloader",
    url: "download-manager.html",
    keywords: "downloader download manager queue chunked streaming resume progress speed limit retry concurrency",
    desc: "Technical documentation of the multi-stream downloader, range headers, and auto-resume logic."
  },
  {
    title: "Batch & Background Downloads",
    category: "Downloader",
    url: "download-manager.html#batch",
    keywords: "batch multiple parallel background downloads pause cancel restart active failed completed",
    desc: "Manage high-concurrency downloads, bandwidth throttling, and network recovery mechanisms."
  },
  {
    title: "Plugins & Extensions SDK",
    category: "Plugins",
    url: "plugins.html",
    keywords: "plugins extensions modular sdk sandbox manifest lifecycle stream resolver crawler adblock",
    desc: "Complete guide to developing, testing, and distributing modular plugins using JSON manifests and JavaScript."
  },
  {
    title: "Manifest Specification (schema.json)",
    category: "Plugins",
    url: "plugins.html#manifest-spec",
    keywords: "manifest schema.json format capabilities permissions entry id version author icon",
    desc: "Specification for manifest.json including declared tabs, settings categories, and stream capabilities."
  },
  {
    title: "Settings & Preferences Reference",
    category: "Configuration",
    url: "settings-reference.html",
    keywords: "settings preferences download directory theme dark light audio output format hotkeys reset",
    desc: "Comprehensive reference of all user preferences, cache directories, and audio device mappings."
  },
  {
    title: "Electron IPC API Reference",
    category: "Developer API",
    url: "api-reference.html",
    keywords: "electron ipc contextbridge preload api invoke send handle main renderer security",
    desc: "Reference for preload contextBridge methods exposing secure system capabilities to React."
  },
  {
    title: "Troubleshooting & FAQ",
    category: "Support",
    url: "troubleshooting.html",
    keywords: "troubleshooting errors fixes faq audio not playing download failed permission denied corrupt cache reset",
    desc: "Common errors, solutions, and diagnostic steps for playback issues, broken downloads, and corrupted metadata."
  },
  {
    title: "Universal Audio Engine Sample",
    category: "Sample Plugins",
    url: "plugins.html#sample-universal-audio",
    keywords: "sample universal audio youtube spotify jiosaavn soundcloud stream fallback 320k",
    desc: "All-in-one music engine combining YouTube, Spotify metadata, JioSaavn 320kbps CDN, and SoundCloud."
  },
  {
    title: "Archive Cinema & Movies Sample",
    category: "Sample Plugins",
    url: "plugins.html#sample-archive",
    keywords: "sample archive movies cinema public domain open culture video stream download",
    desc: "Stream public domain films, classic documentaries, and open culture videos with ad-blocker."
  },
  {
    title: "Worldwide Live Radio Hub Sample",
    category: "Sample Plugins",
    url: "plugins.html#sample-radio",
    keywords: "sample radio browser live worldwide stations icecast mp3 streams podcasts",
    desc: "30,000+ live stations and podcasts streaming worldwide via Icecast."
  },
  {
    title: "Pornhub",
    category: "Sample Plugins",
    url: "plugins.html#sample-pornhub",
    keywords: "sample adult 18+ pornhub video player adblock popunder resolver crawler",
    desc: "Video resolver and crawler extension with dedicated sidebar tab, multi-quality video player, and ad blocking."
  }
];

// Search logic & DOM initialization
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('docsSearchInput');
  const resultsContainer = document.getElementById('docsSearchResults');

  if (!searchInput || !resultsContainer) return;

  function performSearch(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      resultsContainer.style.display = 'none';
      resultsContainer.innerHTML = '';
      return;
    }

    const words = q.split(/\s+/).filter(Boolean);

    const matches = searchDatabase.filter(item => {
      const fullText = (item.title + ' ' + item.category + ' ' + item.keywords + ' ' + item.desc).toLowerCase();
      return words.every(w => fullText.includes(w));
    });

    if (matches.length === 0) {
      resultsContainer.innerHTML = '<div class="no-results">No matching documentation found</div>';
      resultsContainer.style.display = 'block';
      return;
    }

    resultsContainer.innerHTML = matches.slice(0, 7).map(item => `
      <a href="${item.url}" class="search-result-item">
        <div class="search-result-category">${item.category}</div>
        <div class="search-result-title">${item.title}</div>
        <div class="search-result-desc">${item.desc}</div>
      </a>
    `).join('');
    resultsContainer.style.display = 'block';
  }

  searchInput.addEventListener('input', (e) => {
    performSearch(e.target.value);
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
      resultsContainer.style.display = 'none';
    }
  });

  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim()) {
      resultsContainer.style.display = 'block';
    }
  });
});
