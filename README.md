<div align="center">

# ⏱️ TimiGS — Intelligent Activity Tracker

[![Release](https://img.shields.io/github/v/release/BANSAFAn/timiGS-?style=for-the-badge&color=8b5cf6)](https://github.com/BANSAFAn/timiGS-/releases)
[![License](https://img.shields.io/badge/License-TPL_1.0-blue?style=for-the-badge)](LICENSE)
[![Stars](https://img.shields.io/github/stars/BANSAFAn/timiGS-?style=for-the-badge&color=fbbf24)](https://github.com/BANSAFAn/timiGS-/stargazers)
[![CI](https://img.shields.io/github/actions/workflow/status/BANSAFAn/timiGS-/release.yml?style=for-the-badge&label=Desktop%20CI&color=10b981)](https://github.com/BANSAFAn/timiGS-/actions/workflows/release.yml)

**A modern, privacy-first activity tracker for Desktop.**  
Track your app usage, visualize productivity, manage tasks, and stay focused — all with your data stored safely and locally.

[📥 Download Releases](https://github.com/BANSAFAn/timiGS-/releases) · [🐛 Report Bug](https://github.com/BANSAFAn/timiGS-/issues) · [💬 Join Discord](https://discord.gg/78V2c4bdpj)

</div>

---

## 📱 Platforms

TimiGS runs natively on all major desktop operating systems, built on a unified high-performance stack:

| Platform | Architecture Stack | Status |
| :--- | :--- | :--- |
| **Windows** | 🦀 Rust (Tauri v2) + Vue 3 | `✅ Passing` |
| **macOS** | 🦀 Rust (Tauri v2) + Vue 3 | `✅ Passing` |
| **Linux** | 🦀 Rust (Tauri v2) + Vue 3 | `✅ Passing` |

---

## 🚀 Features

### 📊 Tracking & Analytics
* **Real-time Activity Tracking** — Automatically detects active windows and captured applications with absolute precision.
* **Analytics Dashboard** — Dynamic, interactive Donut, Pie, and Bar charts powered by **Chart.js** displaying productivity metrics.
* **Timeline Logbook** — Review a granular chronological breakdown of your daily footprint, minute-by-minute.
* **Compare Mode** — Evaluate and contrast activity levels between different days or weeks to optimize your schedule.
* **Coding Tracker** — Autodetects major IDEs and text editors (VS Code, JetBrains) with precise language and project capture.

### 🎯 Core Productivity
* **Focus Mode** — Programmatically locks your PC to a single designated application, aggressively minimizing distracting apps.
* **Time OUT Rest Loops** — Pomodoro-style screen lock overlays that play ambient lofi music to guarantee you rest.
* **Doctor Mode** — A smart health assistant reminding you to rest your eyes (20-20-20 rule) and stand up.
* **Tasks & Daily Goals** — Set custom app usage caps/goals and track progress with interactive status cards.
* **Shutdown Timer** — Schedule system shutdowns to enforce a hard stop to your workday.

### ☁️ Sync & Transfer
* **P2P Transfer & Sync** — Direct, high-speed Peer-to-Peer database syncing between devices via **WebRTC** (PeerJS).
* **Team Accountability** — Join secure peer-to-peer study rooms to sync online states and compete in friendly focus leaderboards.
* **Flexible Data Exporter** — Export data to CSV, JSON, HTML, or Markdown; easily import/export databases for total control.

### 🌍 Localization & Themes
* **9 Languages Supported** — English, Ukrainian, German, French, Spanish, Portuguese, Polish, Arabic, Chinese.
* **Harmonious Dark & Light Themes** — Gorgeous custom HSL color palettes that look stunning on modern displays.
* **System Tray Widget** — Minimizes perfectly to the tray with a lightweight interactive popup.

---

## 🛠️ Technology Stack

TimiGS leverages a cutting-edge, high-performance tech stack designed for speed, safety, and a minimal memory footprint.

### 🦀 Backend Engine (Rust)
Housed inside `src-tauri/src/`, our native layer connects directly with operating system APIs for zero-overhead window capturing and focus enforcement.

| Technology | Category | Purpose |
| :--- | :--- | :--- |
| **[Tauri v2](https://v2.tauri.app/)** | Desktop Framework | System IPC, native window bindings, and shell control |
| **[Tokio](https://tokio.rs/)** | Async Runtime | Blazing-fast asynchronous execution |
| **[Rusqlite](https://github.com/rusqlite/rusqlite)** | Database | Bundled, high-performance SQLite engine |
| **[Windows-rs](https://github.com/microsoft/windows-rs)** | System API | Deep integration with Win32 APIs for tracking & focus control |
| **[Rodio](https://github.com/RustAudio/rodio)** | Audio Playback | Native audio playing for ambient rest noises |
| **[Tiny-HTTP](https://github.com/tiny-http/tiny-http)** | Networking | Local lightweight HTTP server for Peer-to-Peer handshakes |
| **[Reqwest](https://docs.rs/reqwest)** | HTTP Client | API calls and network communication |
| **[Serde](https://serde.rs/)** | Serialization | Zero-cost JSON data parsing |
| **[Chrono](https://github.com/chronotope/chrono)** | Time Management | Extremely precise date/time math |

### ⚡ Frontend Interface (Vue 3)
Our reactive user interface is built using modern paradigms, delivering fluid transitions and gorgeous micro-animations.

| Technology | Category | Purpose |
| :--- | :--- | :--- |
| **[Vue 3](https://vuejs.org/)** | UI Framework | Declarative component architecture |
| **[Vite](https://vitejs.dev/)** | Bundler & Dev Server | Blazing-fast development loops and optimized production builds |
| **[TypeScript](https://www.typescriptlang.org/)** | Programming Language | Core structural type safety across the client codebase |
| **[Pinia](https://pinia.vuejs.org/)** | State Management | Highly reactive, unified settings and tracking stores |
| **[Chart.js](https://www.chartjs.org/)** | Data Visualization | Renders high-fidelity analytics graphs and charts |
| **[PeerJS](https://peerjs.com/)** | WebRTC Protocol | Direct peer-to-peer file transfer and team syncing |
| **[Vue I18n](https://vue-i18n.intlify.dev/)** | Localization | Dynamic multi-language translation injection |
| **[Marked](https://marked.js.org/)** | Text Rendering | Fast local markdown document formatting |

### 🌐 Marketing & Web Docs (Astro)
The public documentation and landing site (in `site/`) are built for maximum SEO and performance.

- **[Astro](https://astro.build/)** — Highly optimized static site framework.
- **[React](https://react.dev/)** — Interactive elements and responsive components.

---

## 💻 Getting Started

### Prerequisites

* **Node.js** v18+ — [Download](https://nodejs.org/)
* **Rust** (latest stable) — [Download](https://www.rust-lang.org/tools/install)
* **C++ Build Tools** — Visual Studio Build Tools (Windows) or `build-essential` (Linux)
* **Linux only**: `libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libasound2-dev`

### Install & Run

```bash
git clone https://github.com/BANSAFAn/timiGS-.git
cd timiGS-
npm install
npm run tauri dev
```

To build a production package:
```bash
npm run tauri build
```
Build output is saved to: `src-tauri/target/release/bundle/`

---

## 📂 Project Structure

```
timiGS-/
├── src/                        # Frontend (Vue 3 + TypeScript)
│   ├── components/             # FocusMode, TimeOut, DoctorMode, ShutdownTimer, CodingTracker...
│   ├── views/                  # Dashboard, Analytics, Timeline, Compare, Tools, Weather, Team, Transfer...
│   ├── locales/                # Multi-language files (en, uk, de, fr, es, pt, pl, ar, zh)
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
├── .github/workflows/          # CI/CD (release.yml, legacy-builds.yml)
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

> [!IMPORTANT]  
> **All your data stays completely private and local.** TimiGS stores activity data in a local SQLite database at `%APPDATA%\TimiGS\activity.db`. No data is transmitted to external servers.

---

## 📜 License

Licensed under the [TimiGS Public License (TPL) v1.0](LICENSE).

* ✅ Free to use, modify, and distribute
* ✅ Must include attribution to **BANSAFAn**
* ❌ Cannot rename/rebrand the software for redistribution

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
