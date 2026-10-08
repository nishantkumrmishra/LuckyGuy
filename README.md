# Turbo Local - Windows Desktop Edition

High-performance Electron desktop application for Windows, featuring the sleek desktop design system inspired by NorthTracks, tailored with our high-speed media downloader, stream engine, and local music manager.

---

## ⚡ Overview & Architectural Analysis

Designed with a **desktop-first light mode layout**, **NorthTracks design system**, **strict Manrope font hierarchy**, **custom modified SVG icons**, and a **single Blue accent**.

### 🌟 Key Feature Matrix

| Feature Domain | Windows Desktop App (`localguy`) |
| :--- | :--- |
| **Design Language** | **NorthTracks Design System** (Titlebar with Ctrl+L quick search, smooth resizable sidebar, docked 3-column player bar) |
| **Theme & UI** | **Clean Light Mode** with crisp borders and single **Blue** accent (`#2563eb`) |
| **Menu & Sidebar** | **Drag-resizable sidebar** (52px icon rail to 220px expanded) with custom SVG glyphs (Home, Music stream, Library, Settings, Collapse) |
| **Media Downloader** | Multi-engine downloader with parallel range chunk acceleration (1-16 chunks) |
| **YouTube Engine** | Innertube resolver with 1080p, 720p progressive MP4 and audio streams |
| **Spotify Engine** | Track, playlist & album parser with 320kbps resolution |
| **JioSaavn Engine** | Native Node.js `crypto` DES-ECB decipher for 320kbps studio AAC/MP3 CDN streams |
| **Music Library** | Comprehensive local library table, ID3 editor, deduplication audit, custom playlists |
| **Music Player** | 3-column docked player bar, shuffle, repeat, seekbar, speed popover, sleep timer countdown, sliding queue drawer |

---

## 🎨 Design System

### 1. Light Mode & Single Accent Color
- **Base Background**: Clean white (`#ffffff`) and slate-50 (`#f8fafc`)
- **Accent Color**: Pure Blue (`#2563eb` / `blue-600`) for all actions, highlights, sliders, and active tabs
- **Borders & Dividers**: Crisp light slate (`#e2e8f0` / `rgba(0, 0, 0, 0.08)`)

### 2. Iconography
- **Custom Modified SVG Icons** for navigation:
  - `Home`: Clean geometric home with subtle portal detail
  - `Music stream`: Modified eighth notes with radial streaming soundwaves
  - `Library`: Music collection sleeve & vinyl disc
  - `Settings`: High-precision cog with audio tuner slider
  - `Collapse`: Sidebar toggle frame

---

## 🚀 Running the Application

### Prerequisites
- Node.js (v18+)
- npm

### Launch
```bash
# Navigate to project folder
cd D:\Devs\Active\localguy

# Launch the desktop app directly
npm run dev
```

---

## 📁 Project Structure

```
D:\Devs\Active\localguy\
├── electron/
│   ├── main.js                 # Electron main process & IPC handlers (Light mode window)
│   ├── preload.js              # Safe ContextBridge API
│   ├── downloader.js           # Multi-chunk parallel downloader with pause/resume
│   ├── libraryManager.js       # Local file scanner & duplicate detector
│   └── extractors/             # YouTube, Spotify, JioSaavn extractors
├── src/
│   ├── components/
│   │   ├── CustomIcons.jsx     # Bespoke SVG icons for navigation
│   │   ├── TitleBar.jsx        # NorthTracks-styled titlebar with live search & window controls
│   │   ├── Sidebar.jsx         # Resizable sidebar (Home, Music stream, Library, Settings, Collapse)
│   │   ├── PlayerBar.jsx       # NorthTracks 3-column docked media player bar
│   │   ├── DownloaderTab.jsx   # Home view with greeting stats & media downloader
│   │   ├── StreamTab.jsx       # Music stream view with curated live feeds
│   │   ├── LibraryTab.jsx      # Library view with desktop songs table & ID3 editor
│   │   ├── SettingsTab.jsx     # Settings view with engine toggles & directory picker
│   │   ├── SleepTimerModal.jsx # Sleep timer dialog
│   │   └── QueueDrawer.jsx     # Sliding play queue drawer
│   ├── App.jsx                 # Main application controller
│   ├── index.css               # NorthTracks design system tokens & styles
│   └── main.jsx                # React root
├── index.html                  # Light mode HTML entry
├── package.json
└── vite.config.js
```
