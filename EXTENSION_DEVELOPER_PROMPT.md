# LuckyGuy Plugin SDK v2.1 Developer Guide & Prompt

Use this prompt to generate extensions for **LuckyGuy Desktop** using AI (ChatGPT, Claude, Gemini, DeepSeek).

---

## 📋 Copy & Paste This Prompt to Your AI

```markdown
You are an expert JavaScript extension developer for LuckyGuy Desktop (an Electron/React media manager, lossless downloader, and streaming platform).
Your task is to build a complete LuckyGuy extension based on SDK v2.1 specifications below.

### LuckyGuy Architecture Rules:
1. Every extension provides a `manifest.json` and an `index.js`.
2. The core platform is offline-first and neutral. All scrapers, stream decoders, video portals, and crawlers run via extensions.
3. Content Rating: Specify "all", "mature", or "18+" depending on content.
4. Dynamic Tab: If the extension provides a video portal or web interface, declare the `tab` object with title, icon, url, viewLayout, and themeColor.
5. AdBlock Rules: Include an array of regex/glob patterns under `adBlockRules` to strip out popunders, banners, and malicious redirects.
6. Multi-Quality Streams: Support multiple resolutions in `streams` dictionary (e.g. "1080p", "720p", "480p").
7. Separated Audio Tracks: When streaming DASH/separated formats, provide `audioStreamUrl` for perfect synchronized dual-track playback.
8. Persistent Thumbnails: Provide `thumbnail` / `artworkUrl` so the engine automatically downloads and persists companion `.jpg` images alongside offline video files.
9. Custom Destination: If the extension organizes downloads in a dedicated subfolder, declare `customFolder`.

### Plugin Manifest Template (manifest.json - SDK v2.1):
{
  "id": "unique-extension-id",
  "name": "Extension Display Name",
  "version": "2.1.0",
  "type": "portal", // "portal" | "audio" | "video" | "crawler"
  "rating": "all",  // "all" | "mature" | "18+"
  "description": "Short explanation of the plugin",
  "author": "Author Name",
  "entry": "index.js",
  "mediaTypes": ["video", "audio"],
  "tab": {
    "title": "Sidebar Label",
    "icon": "Youtube", // Youtube, Film, Sparkles, Send, Compass, Music
    "url": "https://example-source.com",
    "viewLayout": "grid", // "grid" | "list"
    "themeColor": "#FF0000",
    "badge": "HD"
  },
  "capabilities": [
    "stream",
    "crawlPage",
    "download",
    "videoPlayer",
    "metadata",
    "search",
    "adblock"
  ],
  "supportedUrls": [
    "*://example-source.com/*",
    "*://*.example-cdn.com/*"
  ],
  "adBlockRules": [
    "*://*.popunder-ad.com/*",
    "*://*.trackers.net/*"
  ]
}

### Plugin Implementation Template (index.js - SDK v2.1):
module.exports = {
  isSupported(url) {
    return url && (url.includes('example-source.com') || url.includes('example-cdn.com'));
  },

  // 1. Single Media / Stream Resolver
  async resolve(url, options = {}) {
    try {
      // Return single stream or multi-quality map with optional synchronized audio track
      return {
        id: 'stream-id',
        title: 'Video Title',
        author: 'Creator Name',
        thumbnail: 'https://example-cdn.com/posters/thumb.jpg',
        streamUrl: 'https://example-cdn.com/videos/1080p.mp4',
        streams: {
          '1080p': 'https://example-cdn.com/videos/1080p.mp4',
          '720p': 'https://example-cdn.com/videos/720p.mp4',
          '480p': 'https://example-cdn.com/videos/480p.mp4'
        },
        audioStreamUrl: null, // Set to audio track URL if video & audio are separated (DASH)
        format: 'MP4', // "MP4" | "HLS" | "WEBM"
        formatType: 'VIDEO', // "VIDEO" | "AUDIO"
        headers: {
          'Referer': 'https://example-source.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      };
    } catch (err) {
      return { error: `Resolution failed: ${err.message}` };
    }
  },

  // 2. Batch Webpage Crawler (Scan 20-100 cards from category/page)
  async crawlPage(pageUrl) {
    try {
      // Scrape media cards from the web portal
      return [
        {
          id: 'card-1',
          title: 'Card Title',
          author: 'Channel Name',
          thumbnail: 'https://example-cdn.com/thumbs/1.jpg',
          duration: '12:45',
          durationFormatted: '12:45',
          size: '~120 MB',
          url: 'https://example-source.com/watch?v=1',
          mediaType: 'video',
          quality: '1080p HD'
        }
      ];
    } catch (err) {
      return [];
    }
  },

  // 3. Optional Direct Search Integration
  async search(query, limit = 20) {
    try {
      // Perform direct search if supported
      return [];
    } catch (err) {
      return [];
    }
  }
};

Now, please write the complete manifest.json and index.js for:
[DESCRIBE YOUR STREAMING WEBSITE, AUDIO SOURCE, OR CUSTOM PORTAL HERE]
```

---

## 🚀 How to Test & Run in LuckyGuy (2 Simple Ways)

### Way 1: Paste Code Directly Inside LuckyGuy
1. Open **LuckyGuy** → **Settings** (⚙️) → **Plugins & Extensions**.
2. Click the **Paste Code / JSON** button.
3. Paste the `manifest.json` code generated by the AI.
4. Click **Test & Save Script**.
5. Your custom tab appears immediately in the left sidebar!

### Way 2: Install via GitHub URL
1. Push your `manifest.json` and `index.js` to any GitHub repository.
2. In LuckyGuy Settings, click **From URL** and paste:
   ```text
   https://raw.githubusercontent.com/<username>/<repo>/main/manifest.json
   ```
3. Click **Install Plugin**.
