<div align="center">

# ⏱️ TimiGS — Intelligent Activity Tracker

[![Release](https://img.shields.io/github/v/release/BANSAFAn/timiGS-?style=for-the-badge&color=8b5cf6)](https://github.com/BANSAFAn/timiGS-/releases)
[![License](https://img.shields.io/badge/License-TPL_1.0-blue?style=for-the-badge)](LICENSE)
[![Stars](https://img.shields.io/github/stars/BANSAFAn/timiGS-?style=for-the-badge&color=fbbf24)](https://github.com/BANSAFAn/timiGS-/stargazers)
[![CI](https://img.shields.io/github/actions/workflow/status/BANSAFAn/timiGS-/release.yml?style=for-the-badge&label=Desktop%20CI)](https://github.com/BANSAFAn/timiGS-/actions/workflows/release.yml)

**A modern, privacy-first activity tracker for Desktop.**
Track your app usage, visualize productivity, manage tasks, and stay focused — all with your data stored locally.

[📥 Download](https://github.com/BANSAFAn/timiGS-/releases)  · [🐛 Report Bug](https://github.com/BANSAFAn/timiGS-/issues) · [💬 Discord](https://discord.gg/78V2c4bdpj)

</div>


## ⚠ The project is very rough, but there are already several versions available.

---

## 📱 Platforms

<!-- STATUS_TABLE_START -->
| Platform    | Technology                    | Status        |
| ----------- | ----------------------------- | ------------- |
| **Windows** | Tauri v2 + Rust + Vue 3       | ✅ Passing |
| **macOS**   | Tauri v2 + Rust + Vue 3       | ✅ Passing |
| **Linux**   | Tauri v2 + Rust + Vue 3       | ✅ Passing |
<!-- STATUS_TABLE_END -->

---

## 🚀 Features

### 📊 Tracking & Analytics
- **Real-time Activity Tracking** — automatically tracks active windows and apps with duration
- **Analytics Dashboard** — Donut, Pie, and Bar charts powered by Chart.js
- **Timeline View** — browse your activity history day-by-day with detailed breakdowns
- **Compare Mode** — compare your usage across different days and periods
- **Coding Tracker** — tracks time spent in editors (VS Code, JetBrains, etc.) with language and project detection

### 🎯 Productivity
- **Focus Mode** — lock your PC to a single application; blocks all other apps from opening (password-protected)
- **Time OUT** — enforced break reminders with fullscreen overlay, always-on-top blocking (hours/minutes/seconds configurable)
- **Doctor Mode** — monitors PC usage time and enforces healthy break habits with a lock screen
- **Tasks & Goals** — set app usage goals and track progress
- **Shutdown Timer** — schedule automatic system shutdown

### ☁️ Sync & Transfer
- **P2P Transfer** — direct peer-to-peer file transfer between devices via WebRTC (PeerJS)
- **Team Sync** — view team members' activity and sync data across devices
- **Data Export/Import** — export to CSV, JSON, HTML, Markdown; import database for backup

### 🔧 Tools
- **Weather Widget** — integrated weather display with 5-day forecast
- **Screen Share Picker** — custom screen/window picker for sharing
- **Discord Rich Presence** — show your current activity status in Discord
- **Auto-updater** — built-in update mechanism via GitHub Releases

### 🌍 Localization & Themes
- **Multi-language** — English, Ukrainian, German, French, Spanish, Portuguese, Polish, Arabic, Chinese
- **Dark & Light Modes** — choose your preferred theme
- **System Tray** — minimize to tray with popup widget

---

## 🛠️ Technology Stack

### Backend — Rust (`src-tauri/src/`)
| Crate | Version | Purpose |
| ----- | ------- | ------- |
| [tauri](https://v2.tauri.app/) | 2.1 | Desktop framework, IPC, window management |
| [rusqlite](https://github.com/rusqlite/rusqlite) | 0.32 | SQLite database (bundled) |
| [tokio](https://tokio.rs/) | 1 | Async runtime |
| [serde](https://serde.rs/) / serde_json | 1 | Serialization / JSON |
| [reqwest](https://docs.rs/reqwest) | 0.11 | HTTP client for P2P and API calls |
| [tiny_http](https://github.com/tiny-http/tiny-http) | 0.12 | Lightweight HTTP server for P2P |
| [rodio](https://github.com/RustAudio/rodio) | 0.20 | Audio playback |
| [chrono](https://github.com/chronotope/chrono) | 0.4 | Date and time |
| [image](https://github.com/image-rs/image) | 0.25 | Icon extraction and processing |
| [discord-rich-presence](https://github.com/vionya/discord-rich-presence) | 0.2 | Discord RPC |
| [parking_lot](https://github.com/Amanieu/parking_lot) | 0.12 | Fast Mutex / RwLock |
| [dirs](https://github.com/dirs-dev/dirs-rs) | 5.0 | Platform-specific paths |
| [base64](https://github.com/marshallpierce/rust-base64) | 0.22 | Base64 encoding |
| [csv](https://github.com/BurntSushi/rust-csv) | 1.4 | CSV export |
| [windows](https://github.com/microsoft/windows-rs) | 0.58 | Win32 API (tracking, icons, focus) |
| tauri-plugin-autostart | 2.1 | Launch on system startup |
| tauri-plugin-updater | 2.1 | Auto-update via GitHub Releases |
| tauri-plugin-cli | 2.1 | CLI argument parsing (`--minimized`) |
| tauri-plugin-fs / dialog / shell / process | 2.1 | File system, dialogs, shell, process |

### Frontend — Vue 3 (`src/`)
| Package | Version | Purpose |
| ------- | ------- | ------- |
| [vue](https://vuejs.org/) | 3.5 | UI framework |
| [vite](https://vitejs.dev/) | 6 | Build tool and dev server |
| [typescript](https://www.typescriptlang.org/) | 5.6 | Type safety |
| [pinia](https://pinia.vuejs.org/) | 3 | State management |
| [vue-router](https://router.vuejs.org/) | 4.6 | Client-side routing |
| [vue-i18n](https://vue-i18n.intlify.dev/) | 9.14 | Internationalization (9 languages) |
| [chart.js](https://www.chartjs.org/) + [vue-chartjs](https://vue-chartjs.org/) | 4.5 / 5.3 | Analytics charts (Donut, Bar, Pie) |
| [peerjs](https://peerjs.com/) | 1.5 | WebRTC P2P file transfer |
| [@vueuse/core](https://vueuse.org/) | 14 | Composable utilities |
| [marked](https://marked.js.org/) | 17 | Markdown rendering |
| [highlight.js](https://highlightjs.org/) | 11 | Syntax highlighting |
| @tauri-apps/api | 2.11 | Tauri JS bridge |

### Website (`site/`)
| Technology | Purpose |
| ---------- | ------- |
| [Astro](https://astro.build/) | Static site framework |
| [React](https://react.dev/) | Interactive islands |

---

## 💻 Getting Started — Desktop

### Prerequisites

- **Node.js** v18+ — [Download](https://nodejs.org/)
- **Rust** (latest stable) — [Download](https://www.rust-lang.org/tools/install)
- **C++ Build Tools** — Visual Studio Build Tools (Windows) / `build-essential` (Linux)
- **Linux only**: `libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libasound2-dev`

### Install & Run

```bash
git clone https://github.com/BANSAFAn/timiGS-.git
cd timiGS-
npm install
npm run tauri dev
npm run tauri build
```

Build output: `src-tauri/target/release/bundle/`

---

## 📂 Project Structure

```
timiGS-/
├── src/                        # Frontend (Vue 3 + TypeScript)
│   ├── components/             # FocusMode, TimeOut, DoctorMode, ShutdownTimer, CodingTracker...
│   ├── views/                  # Dashboard, Analytics, Timeline, Compare, Tools, Weather, Team, Transfer...
│   ├── locales/                # en, uk, de, fr, es, pt, pl, ar, zh
│   ├── stores/                 # Pinia state stores
│   ├── composables/            # Vue composables
│   ├── utils/                  # Utility functions
│   └── router.ts               # Vue Router config
│
├── src-tauri/                  # Backend (Rust)
│   └── src/
│       ├── lib.rs              # App entry & plugin setup
│       ├── commands.rs         # Tauri IPC commands
│       ├── db.rs               # SQLite database
│       ├── tracker.rs          # Active window tracking (Win32 API / Linux)
│       ├── focus.rs            # Focus Mode (app blocking)
│       ├── timeout.rs          # Time OUT (break enforcement)
│       ├── discord.rs          # Discord Rich Presence
│       ├── p2p.rs              # P2P file transfer server
│       ├── music.rs            # Audio playback (rodio)
│       ├── notifications.rs    # System notifications
│       ├── timer.rs            # Shutdown timer
│       ├── tasks.rs            # Task/goal management
│       ├── icons.rs            # App icon extraction
│       ├── tray.rs             # System tray icon & menu
│       └── picker.rs           # Screen share picker
│
├── site/                       # Marketing Website (Astro + React)
├── .github/workflows/          # CI/CD (release.yml, ci.yml, update-readme-status.yml)
├── legacy-builds/              # Win32 / WinXP legacy build scripts
└── package.json                # v1.6.0
```

---

## 🌍 Localization

TimiGS supports **9 languages**: English, Ukrainian, German, French, Spanish, Portuguese, Polish, Arabic, Chinese.

### Adding a New Language

1. Create `src/locales/{lang}.json` based on `en.json`
2. Register in `src/i18n.ts`
3. Add selector option in `src/views/Settings.vue`

---

## 🔒 Privacy

**All data stays on your device.** TimiGS stores activity data in a local SQLite database at `%APPDATA%\TimiGS\activity.db`. Nothing is transmitted to any server.

---

## 📜 License

Licensed under the [TimiGS Public License (TPL) v1.0](LICENSE).

- ✅ Free to use, modify, and distribute
- ✅ Must include attribution to **BANSAFAn**
- ❌ Cannot rename/rebrand the software for redistribution

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Commit your changes
4. Open a Pull Request

For issues and feature requests, use [GitHub Issues](https://github.com/BANSAFAn/timiGS-/issues).

---

<div align="center">

**Made with ❤️ by [BANSAFAn](https://github.com/BANSAFAn)**

</div>
