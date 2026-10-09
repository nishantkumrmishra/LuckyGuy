# LuckyGuy 🎵

<div align="center">

<img src="electron/icon.png" width="120" height="120" alt="LuckyGuy Logo" />

### High-Performance Media Downloader, Streamer & Music Manager for Windows

[![Release](https://img.shields.io/github/v/release/nishantkumrmishra/LuckyGuy?style=for-the-badge&color=7c5cbf)](https://github.com/nishantkumrmishra/LuckyGuy/releases/latest)
[![Website](https://img.shields.io/badge/Documentation-GitHub_Pages-blue?style=for-the-badge&logo=github)](https://nishantkumrmishra.github.io/LuckyGuy/)
[![Platform](https://img.shields.io/badge/Platform-Windows_10_%7C_11-0078D6?style=for-the-badge&logo=windows)](https://github.com/nishantkumrmishra/LuckyGuy/releases)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[**🌐 Live Documentation Website**](https://nishantkumrmishra.github.io/LuckyGuy/) • [**📦 Download Releases**](https://github.com/nishantkumrmishra/LuckyGuy/releases/latest)

</div>

---

## ⚡ Overview

**LuckyGuy** is an advanced desktop music hub crafted for Windows. It combines multi-threaded media downloading with automatic 320kbps audio resolution, seamless 200+ Spotify playlist extraction, self-organizing genre folder libraries, embedded cover artwork, and a built-in music player.

---

## 📥 Downloads & Installation

| Package | Type | Description | Link |
| :--- | :--- | :--- | :--- |
| **LuckyGuy Setup** | Installer (`.exe`) | Standard Windows installer with desktop and Start Menu shortcuts | [Download Setup](https://github.com/nishantkumrmishra/LuckyGuy/releases/latest) |
| **LuckyGuy Portable** | Standalone (`.exe`) | Zero-installation, single-file executable. Runs directly from USB or local drive | [Download Portable](https://github.com/nishantkumrmishra/LuckyGuy/releases/latest) |

---

## ✨ Key Features

### 1. 🧙‍♂️ First-Time Setup Wizard
- Automatically greets you on a new PC or clean install.
- Walkthrough to configure:
  - **Music Library Location** (Defaults to `C:\Users\<User>\Music`).
  - **Auto-Organize by Genre** toggle.
  - **Visual Theme** (Clean Light Mode or Obsidian Dark).
- Can be re-launched anytime from **Settings → Downloads & Storage**.

### 2. ⚡ Frictionless Downloads Manager
- **Zero Configuration Needed**: Automatically extracts and downloads audio at the highest possible fidelity (320kbps / lossless AAC).
- **Multi-Threaded Queue**: Download individual songs or entire 200+ track playlists in an orderly, parallel pipeline.
- **Infinite Scroll Table**: Clean, unbounded download table displaying real-time download speeds, percentage, and file size.
- **Direct Folder Access**: One-click **"Open Folder"** header button to view files directly in Windows File Explorer.

### 3. 📁 Smart Genre Folder Organization
- Automatically categorizes downloaded songs into clean physical subfolders based on artist & track metadata:
  - `Music\Bollywood\`
  - `Music\Pop\`
  - `Music\Rock\`
  - `Music\Hip-Hop\`
  - `Music\Electronic\`
  - `Music\K-Pop\`
- Automatically downloads and caches `folder.jpg` in each directory so Windows File Explorer displays rich folder artwork previews.

### 4. 🎨 Embedded Lossless Metadata & Artwork
- Stamped with genuine song cover art, album name, artist, and year directly into Apple M4A metadata atoms and ID3v2.4 frames.
- Instant artwork recognition in Windows Media Player, Groove, and VLC.

### 5. 🔓 200+ Track Spotify Playlist Extraction
- Bypasses public 100-track embed limits via an internal Pathfinder GraphQL session that rapidly paginates 500+ track playlists in seconds.
- Zero login or developer credentials required out-of-the-box.
- Optional custom Spotify Developer credentials (`Client ID`, `Client Secret`, and `sp_dc` cookie) can be entered under **Settings → Plugins & Extensions**.

### 6. 🔄 Integrated Auto-Updater
- Checks GitHub Releases in the background on startup.
- Displays an in-app update notification banner when a newer release is published.
- On-demand **"Check for Updates"** button available in Settings.

---

## 🛠️ Development & Building

### Prerequisites
- Node.js (v18 or higher)
- npm

### Run in Development
```bash
# Clone the repository
git clone https://github.com/nishantkumrmishra/LuckyGuy.git
cd LuckyGuy

# Install dependencies
npm install

# Start Vite + Electron
npm run dev
```

### Build Distribution Binaries
```bash
# Build both Installer and Portable EXE
npm run dist:all

# Build only Windows Setup Installer
npm run dist:installer

# Build only Windows Portable EXE
npm run dist:portable
```

Outputs will be saved directly into `dist-release/`:
- `dist-release/LuckyGuy-Setup-1.0.0.exe`
- `dist-release/LuckyGuy-Portable-1.0.0.exe`

---

## 🌐 Documentation Website

A dedicated showcase site mirroring LuckyGuy's desktop UI design is hosted on GitHub Pages:
- **URL**: [https://nishantkumrmishra.github.io/LuckyGuy/](https://nishantkumrmishra.github.io/LuckyGuy/)
- **Source**: [`docs/index.html`](docs/index.html)

---

## 📄 License

LuckyGuy is released under the [MIT License](LICENSE).
