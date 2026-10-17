# GitHub Installer

> **The friendly, one-click Windows desktop app that lets anyone search, download, and install software from GitHub.**

![GitHub Installer](https://img.shields.io/badge/Platform-Windows%2010%2F11-0284c7)
![Electron](https://img.shields.io/badge/Runtime-Electron%2033-0ea5e9)
![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-38bdf8)
![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-0284c7)
![License](https://img.shields.io/badge/License-MIT-emerald)

---

## Overview

**GitHub Installer** removes all technical friction for discovering and installing open-source software on Windows:
* **One-Click Installs**: Automatically detects your OS architecture (`x64`, `x86`, `arm64`) and resolves the proper `.exe`, `.msi`, or portable `.zip` binary.
* **Intelligent Setup**: Silent/unattended execution for standard installers, and automatic portable extraction to `%LOCALAPPDATA%\GitHubInstaller\Apps\` with Windows Desktop and Start Menu shortcut generation.
* **Safety First**: Clear **Verified** / **Community** badges based on community adoption, releases, and SHA256 checksum verification. Prompts with a human-friendly confirmation warning before installing unverified tools.
* **My Apps Manager**: View installed applications, track version updates, one-click "Update All", and clean uninstallations.
* **Paste-a-Link**: Paste any GitHub repository URL (e.g., `https://github.com/obsproject/obs-studio`) to inspect and install in seconds.
* **Zero Technical Jargon**: Friendly, accessible language throughout ("Ready to install", "Checking updates...").
* **Keyboard Shortcut**: `Ctrl + K` focuses global search instantly from anywhere.

---

## Project Structure

```
github-installer/
├── electron/
│   ├── main.ts                     # Main Electron process and IPC handlers
│   ├── preload.ts                  # Secure contextBridge API for React
│   └── services/
│       ├── assetResolver.ts        # Smart Windows asset & architecture matching
│       ├── downloadService.ts      # Chunk stream downloader with speed/abort
│       ├── githubService.ts        # GitHub REST API client with cache & token
│       ├── installerService.ts     # Silent installer runner & portable shortcuts
│       ├── safetyService.ts        # Community verification & checksum validator
│       └── storeService.ts         # Persistent store for apps, favorites & settings
├── src/
│   ├── components/
│   │   ├── AppCard.tsx             # Clean card with verification & install action
│   │   ├── AppDetailModal.tsx      # README preview, versions, asset chooser
│   │   ├── CategoryChips.tsx       # Filter chips (Tools, Media, Games, etc.)
│   │   ├── EmptyState.tsx          # Friendly illustration & empty state screen
│   │   ├── InstallProgressDrawer.tsx # Floating progress, speed & cancel bar
│   │   ├── Navbar.tsx              # Search bar, Ctrl+K shortcut, status badge
│   │   ├── Sidebar.tsx             # Navigation: Explore, My Apps, Favorites, Settings
│   │   └── SkeletonCard.tsx        # Loading skeletons
│   ├── views/
│   │   ├── ExploreView.tsx         # Curated apps, search, and category browsing
│   │   ├── MyAppsView.tsx          # Installed apps list, version badges, Update All
│   │   ├── FavoritesView.tsx       # Starred apps & download history log
│   │   └── SettingsView.tsx        # Install directory, GitHub token, clear cache
│   ├── types/
│   │   └── index.ts                # TypeScript models and interfaces
│   ├── App.tsx                     # Main application layout and coordinator
│   ├── main.tsx                    # React DOM entry point
│   └── index.css                   # Tailwind CSS styling and animations
├── scripts/
│   └── dev.js                      # Dev orchestrator for Vite + Electron
├── package.json                    # Dependencies and build scripts
└── vite.config.ts                  # Vite bundler configuration
```

---

## Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18.0.0 or higher)
* Windows 10 or 11 (64-bit recommended)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
Starts the Vite dev server and spawns the Electron desktop app with hot-reload enabled:
```bash
npm run dev
```

### 3. Build Production Bundle
Compiles the React frontend into `dist/` and compiles Electron TypeScript into `dist-electron/`:
```bash
npm run build
```

### 4. Build Windows Installer (.exe)
Packages the complete standalone Windows installer (.exe) into the `release/` folder using `electron-builder`:
```bash
npm run dist
```

The resulting files will be generated in `release/`:
* `GitHub Installer Setup 1.0.0.exe` (One-click NSIS Windows installer)
* `GitHub Installer 1.0.0.exe` (Portable executable)

---

## Features & Usage

### 1. Explore & Search
* Type in any tool name (e.g. `OBS`, `ShareX`, `Rufus`, `PowerToys`) or click a category chip (*Tools*, *Media*, *Developer*, *Security*, *Games*, *Utilities*).
* Press `Ctrl + K` anytime to jump into the search bar.
* Paste any direct GitHub URL (e.g. `https://github.com/microsoft/PowerToys`) to immediately view and install it.

### 2. One-Click Installation
* Click **Install** on any card.
* The app automatically picks the right 64-bit Windows binary (`.exe`, `.msi`, or portable `.zip`).
* Track progress in real-time with download speed (MB/s), percentage, and an instant **Cancel** option.
* Portable apps are automatically unpacked to `%LOCALAPPDATA%\GitHubInstaller\Apps\` with Windows Desktop and Start Menu shortcuts created for you.

### 3. Managing "My Apps"
* Switch to **My Apps** in the sidebar to view all your installed software.
* Click **Open** to launch any app instantly.
* Click **Check for Updates** or **Update All** to download the latest releases in one click.
* Click **Uninstall** to cleanly remove portable files and shortcuts.

### 4. GitHub Rate Limits (Optional)
* By default, the app uses GitHub's anonymous public API (60 requests/hour).
* If you browse heavily, navigate to **Settings** and add a free Personal Access Token to raise your limit to 5,000 requests/hour.
