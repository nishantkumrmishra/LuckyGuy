// Global Search Index & Navigation Handler for LuckyGuy Documentation
const docsSearchIndex = [
  // 1. Architecture & Privacy
  {
    title: "Neutral Core Architecture",
    category: "Architecture",
    url: "about.html#neutral-core",
    keywords: "neutral core offline local baseline privacy security telemetry zero scrapers",
    desc: "Offline-first base client containing zero proprietary scrapers, adult sources, or telemetry."
  },
  {
    title: "Disabled-by-Default Security Model",
    category: "Security",
    url: "about.html#disabled-default",
    keywords: "disabled by default enabled false security permissions isolation consent",
    desc: "Every newly installed extension defaults to inactive until explicitly enabled by user."
  },
  {
    title: "Local-First Storage & Cache",
    category: "Storage",
    url: "about.html#storage",
    keywords: "storage localstorage sqlite database music folder genre sorting offline cache",
    desc: "All track indexing, playlists, tags, and preferences stay 100% on your local Windows PC."
  },

  // 2. Plugin & Extension SDK
  {
    title: "Plugin Manifest Specification (manifest.json)",
    category: "Plugin SDK",
    url: "plugins.html#manifest-spec",
    keywords: "manifest json id name version rating type tab adBlockRules capabilities schema",
    desc: "Complete JSON structure defining plugin identity, rating, capabilities, and tabs."
  },
  {
    title: "Runtime Implementation (index.js)",
    category: "Plugin SDK",
    url: "plugins.html#runtime-spec",
    keywords: "index js isSupported resolve crawlPage single stream resolver crawler",
    desc: "Asynchronous JavaScript methods for URL matching, stream extraction, and batch crawling."
  },
  {
    title: "Dynamic Sidebar Tabs",
    category: "Plugin SDK",
    url: "plugins.html#dynamic-tabs",
    keywords: "dynamic tab sidebar title icon badge portal isolated container",
    desc: "Declare custom tabs in manifest.json to spawn dedicated sidebar media views."
  },
  {
    title: "Integrated Back-End AdBlocker",
    category: "Plugin SDK",
    url: "plugins.html#adblock-rules",
    keywords: "adblock rules popunder ads tracker blocking redirect filter popcash",
    desc: "Hooking network requests against regex/glob blacklist patterns to strip annoying ads."
  },
  {
    title: "Batch Webpage Crawler (crawlPage)",
    category: "Plugin SDK",
    url: "plugins.html#batch-crawler",
    keywords: "crawlPage batch crawler 50 100 200 media files multi select download",
    desc: "Scan category pages in seconds and queue dozens of streams for concurrent downloading."
  },

  // 3. Appearance & Theme Studio
  {
    title: "In-App Appearance & Theme Studio",
    category: "Themes",
    url: "themes.html#theme-studio",
    keywords: "appearance studio light dark mode fonts palette colors corner radius",
    desc: "Live customization of themes, typography, swatches, and interface roundings in Settings."
  },
  {
    title: "Theme JSON Specification (theme.json)",
    category: "Themes",
    url: "themes.html#theme-json",
    keywords: "theme json accentColor fontFamily borderRadius mode preset paste export",
    desc: "Standard JSON object for sharing, exporting, and pasting custom UI color presets."
  },
  {
    title: "Interactive Live Web Theme Sandbox",
    category: "Themes",
    url: "themes.html#live-sandbox",
    keywords: "sandbox preview live test color font radius generate theme json",
    desc: "Web playground to design palettes with instant preview and copy-paste theme JSON."
  },

  // 4. AI Website Scanner
  {
    title: "Master AI Website Scanner Prompt",
    category: "AI Tools",
    url: "ai-scanner.html#master-prompt",
    keywords: "ai prompt scanner chatgpt claude gemini deepseek website scraper generator",
    desc: "Copy-paste developer prompt to feed any website into an AI to build a 100% working extension."
  },
  {
    title: "Step-by-Step AI Extension Creation",
    category: "AI Tools",
    url: "ai-scanner.html#ai-steps",
    keywords: "how to create extension ai steps prompt paste settings test save script",
    desc: "Zero-friction workflow to generate, paste, test, and run plugins without coding."
  },

  // 5. Downloads & Releases
  {
    title: "LuckyGuy Setup Installer (.exe)",
    category: "Downloads",
    url: "downloads.html#setup-installer",
    keywords: "download setup exe windows 10 11 installer desktop shortcut auto update",
    desc: "Recommended standard Windows installer with Start Menu integration and updater."
  },
  {
    title: "LuckyGuy Portable Edition (.exe)",
    category: "Downloads",
    url: "downloads.html#portable-edition",
    keywords: "download portable exe single file standalone usb flash drive no install",
    desc: "Standalone executable requiring zero installation. Run anywhere from USB or folder."
  },
  {
    title: "System Requirements & Compatibility",
    category: "Downloads",
    url: "downloads.html#system-requirements",
    keywords: "requirements windows 10 11 64-bit ram disk broadband compatibility",
    desc: "Minimum specs and hardware recommendations for high-speed audio downloading."
  },
  {
    title: "Building LuckyGuy from Source",
    category: "Developers",
    url: "downloads.html#build-source",
    keywords: "git clone npm install npm run dev source code build github electron vite",
    desc: "Full instructions to clone the repository and run developer builds locally."
  },

  // 6. Community Extensions
  {
    title: "Archive Cinema & Open Movies Sample",
    category: "Sample Plugins",
    url: "plugins.html#sample-archive",
    keywords: "sample archive movies cinema public domain documentary 100 crawler",
    desc: "Public domain cinema streaming portal with ad-blocker and 100-video batch crawler."
  },
  {
    title: "Worldwide Live Radio Hub Sample",
    category: "Sample Plugins",
    url: "plugins.html#sample-radio",
    keywords: "sample radio browser live worldwide stations icecast mp3 streams podcasts",
    desc: "30,000+ live stations and podcasts streaming worldwide via Icecast."
  },
  {
    title: "Pornhub Portal & AdBlock Sample",
    category: "Sample Plugins",
    url: "plugins.html#sample-pornhub",
    keywords: "sample adult 18+ portal adblock popunder resolver crawler",
    desc: "18+ sandboxed portal with popup adblocker, stream resolver, and category crawler."
  }
];

// Search logic & DOM initialization
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('docsSearchInput');
  const resultsContainer = document.getElementById('docsSearchResults');

  if (!searchInput || !resultsContainer) return;

  function performSearch(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
      resultsContainer.style.display = 'none';
      resultsContainer.innerHTML = '';
      return;
    }

    const matches = docsSearchIndex.filter(item => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q)
      );
    });

    if (matches.length === 0) {
      resultsContainer.innerHTML = `
        <div style="padding: 16px; text-align: center; color: #71717a; font-size: 0.88em;">
          No matching documentation found for "<strong>${escapeHtml(query)}</strong>"
        </div>
      `;
      resultsContainer.style.display = 'flex';
      return;
    }

    resultsContainer.innerHTML = matches.slice(0, 7).map(item => `
      <a href="${item.url}" class="search-result-row">
        <div class="search-row-title">
          <span>${highlightMatch(item.title, q)}</span>
          <span class="search-row-badge">${item.category}</span>
        </div>
        <div class="search-row-desc">${item.desc}</div>
      </a>
    `).join('');

    resultsContainer.style.display = 'flex';
  }

  function highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return escapeHtml(text);
    const before = text.substring(0, idx);
    const match = text.substring(idx, idx + query.length);
    const after = text.substring(idx + query.length);
    return `${escapeHtml(before)}<strong style="color: #18181b; background: #e4e4e7; border-radius: 2px; padding: 0 2px;">${escapeHtml(match)}</strong>${escapeHtml(after)}`;
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  searchInput.addEventListener('input', (e) => {
    performSearch(e.target.value);
  });

  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim()) {
      performSearch(searchInput.value);
    }
  });

  // Keyboard shortcut Ctrl+K or / to focus search
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      searchInput.focus();
    } else if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    } else if (e.key === 'Escape') {
      resultsContainer.style.display = 'none';
      searchInput.blur();
    }
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
      resultsContainer.style.display = 'none';
    }
  });
});
