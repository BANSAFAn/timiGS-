<div align="center">

# ⏱️ TimiGS — Intelligent Activity Tracker

[![Release](https://img.shields.io/github/v/release/BANSAFAn/timiGS-?style=for-the-badge&color=8b5cf6)](https://github.com/BANSAFAn/timiGS-/releases)
[![License](https://img.shields.io/badge/License-TPL_1.0-blue?style=for-the-badge)](LICENSE)
[![Stars](https://img.shields.io/github/stars/BANSAFAn/timiGS-?style=for-the-badge&color=fbbf24)](https://github.com/BANSAFAn/timiGS-/stargazers)
[![CI](https://img.shields.io/github/actions/workflow/status/BANSAFAn/timiGS-/release.yml?style=for-the-badge&label=Desktop%20CI)](https://github.com/BANSAFAn/timiGS-/actions/workflows/release.yml)
[![Flutter CI](https://img.shields.io/github/actions/workflow/status/BANSAFAn/timiGS-/flutter-android.yml?style=for-the-badge&label=Android%20CI)](https://github.com/BANSAFAn/timiGS-/actions/workflows/flutter-android.yml)

**A modern, privacy-first activity tracker for Desktop & Android.**
Track your app usage, visualize productivity, manage tasks, and stay focused — all with your data stored locally.

[📥 Download](https://github.com/BANSAFAn/timiGS-/releases) · [🌐 Website](https://bansafan.github.io/timiGS-/) · [🐛 Report Bug](https://github.com/BANSAFAn/timiGS-/issues)

</div>


## ⚠ The project is very rough, but there are already several versions available.

---

## 📱 Platforms

<!-- STATUS_TABLE_START -->
| Platform    | Technology                    | Status        |
| ----------- | ----------------------------- | ------------- |
| **Windows** | Tauri v2 + Rust + Vue 3       | ✅ Passing |
| **macOS**   | Tauri v2 + Rust + Vue 3       | ❌ Failing |
| **Linux**   | Tauri v2 + Rust + Vue 3       | ❌ Failing |
| **Android** | Flutter 3.24 + Dart + Rust    | ✅ Passing |
<!-- STATUS_TABLE_END -->

---

## 🚀 Features

### 📊 Tracking & Analytics
- **Real-time Activity Tracking** — automatically tracks active windows and apps with duration
- **Analytics Dashboard** — Donut, Pie, and Bar charts powered by Chart.js
- **Timeline View** — browse your activity history day-by-day with detailed breakdowns
- **Compare Mode** — compare your usage across different days and periods

### 🎯 Productivity
- **Focus Mode** — lock your PC to a single application; blocks all other apps from opening (password-protected)
- **Time OUT** — enforced break reminders with fullscreen overlay, always-on-top blocking (hours/minutes/seconds configurable)
- **Tasks & Goals** — set app usage goals and track progress
- **Shutdown Timer** — schedule automatic system shutdown

### ☁️ Sync & Transfer
- **P2P Transfer** — direct peer-to-peer file transfer between devices via WebRTC (PeerJS)
- **Data Export/Import** — export and import your database for manual backup

### 🔧 Tools
- **Weather Widget** — integrated weather display with 5-day forecast
- **Notepad** — quick notes directly in the app
- **Screen Share Picker** — custom screen/window picker for sharing
- **Discord Rich Presence** — show your current activity status in Discord

### 🌍 Localization & Themes
- **Multi-language** — English and Ukrainian
- **Dark & Light Modes** — choose your preferred theme
- **System Tray** — minimize to tray with popup widget

### 📱 Android-Specific
- **Native Usage Stats API** — real-time Android app usage tracking
- **Background Tracking** — WorkManager-based continuous tracking with foreground notification
- **Focus Mode & Time OUT** — visual timer modes with password-protected cancellation

---

## 🛠️ Technology Stack

### Desktop (`src-tauri/`)
| Layer       | Technology                                                                 |
| ----------- | -------------------------------------------------------------------------- |
| **Backend** | [Tauri v2](https://v2.tauri.app/) · [Rust](https://www.rust-lang.org/)     |
| **Frontend**| [Vue 3](https://vuejs.org/) · [TypeScript](https://www.typescriptlang.org/) · [Vite](https://vitejs.dev/) |
| **State**   | [Pinia](https://pinia.vuejs.org/)                                          |
| **Charts**  | [Chart.js](https://www.chartjs.org/) + [vue-chartjs](https://vue-chartjs.org/) |
| **Database**| [SQLite](https://www.sqlite.org/) via `rusqlite`                           |
| **i18n**    | [vue-i18n](https://vue-i18n.intlify.dev/)                                 |
| **P2P**     | [PeerJS](https://peerjs.com/) (WebRTC)                                    |

### Android (`timigs-android/`)
| Layer       | Technology                                                                 |
| ----------- | -------------------------------------------------------------------------- |
| **Framework** | [Flutter 3.24](https://flutter.dev/) · [Dart](https://dart.dev/)        |
| **Native**  | [Rust](https://www.rust-lang.org/) via [flutter_rust_bridge](https://github.com/aspect-build/aspect-cli) |
| **Database**| SQLite via `rusqlite` (Rust backend)                                       |
| **Charts**  | [fl_chart](https://pub.dev/packages/fl_chart)                             |
| **State**   | [Provider](https://pub.dev/packages/provider)                             |
| **Background** | [WorkManager](https://pub.dev/packages/workmanager)                    |

### Website (`site/`)
| Layer       | Technology                                                                 |
| ----------- | -------------------------------------------------------------------------- |
| **Framework** | [Astro](https://astro.build/)                                           |
| **Components** | [React](https://react.dev/) (interactive islands)                     |

---

## 💻 Getting Started — Desktop

### Prerequisites

- **Node.js** v18+ — [Download](https://nodejs.org/)
- **Rust** (latest stable) — [Download](https://www.rust-lang.org/tools/install)
- **C++ Build Tools** — Visual Studio Build Tools (Windows) / `build-essential` (Linux)
- **Linux only**: `libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf`

### Install & Run

```bash
# Clone
git clone https://github.com/BANSAFAn/timiGS-.git
cd timiGS-

# Install frontend dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

Build output: `src-tauri/target/release/bundle/`

---

## 📱 Getting Started — Android

### Install from APK

1. Download the latest APK from [Releases](https://github.com/BANSAFAn/timiGS-/releases)
2. Enable "Install from Unknown Sources" in Android settings
3. Install and grant **Usage Stats** permission when prompted

### Build from Source

**Prerequisites:** Flutter 3.24+, Rust (stable), Android NDK r26b, Java 17

```bash
cd timigs-android

# Install Rust Android targets
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android
cargo install cargo-ndk

# Build Rust native library
cd rust
cargo ndk -t arm64-v8a -t armeabi-v7a -t x86_64 -t x86 -o ../android/app/src/main/jniLibs build --release
cd ..

# Build Flutter APK
flutter pub get
flutter build apk --release
```

See [BUILD_INSTRUCTIONS.md](timigs-android/BUILD_INSTRUCTIONS.md) for detailed instructions.

### Android Permissions

| Permission             | Purpose                              |
| ---------------------- | ------------------------------------ |
| `PACKAGE_USAGE_STATS`  | Required for tracking app usage      |
| `INTERNET`             | Weather widget                       |
| `FOREGROUND_SERVICE`   | Background activity tracking         |
| `POST_NOTIFICATIONS`   | Tracking status notifications        |

> **Usage Stats**: Settings → Apps → Special app access → Usage access → Enable for TimiGS

---

## 📂 Project Structure

```
timiGS-/
├── src/                        # Desktop Frontend (Vue 3 + TypeScript)
│   ├── components/             # FocusMode, TimeOut, ShutdownTimer, Tasks...
│   ├── views/                  # Dashboard, Analytics, Timeline, Tools, Weather...
│   ├── locales/                # en.json, uk.json
│   ├── stores/                 # Pinia state stores
│   ├── styles/                 # Global CSS & themes
│   └── router.ts               # Vue Router config
│
├── src-tauri/                  # Desktop Backend (Rust)
│   └── src/
│       ├── lib.rs              # App entry & plugin setup
│       ├── commands.rs         # Tauri IPC commands
│       ├── db.rs               # SQLite database
│       ├── tracker.rs          # Active window tracking (Win32 API)
│       ├── focus.rs            # Focus Mode (app blocking)
│       ├── timeout.rs          # Time OUT (break enforcement)
│       ├── discord.rs          # Discord Rich Presence
│       ├── p2p.rs              # P2P file transfer server
│       ├── timer.rs            # Shutdown timer
│       ├── tasks.rs            # Task/goal management
│       ├── icons.rs            # App icon extraction
│       └── picker.rs           # Screen share picker
│
├── timigs-android/             # Android App (Flutter + Dart + Rust)
│   ├── lib/
│   │   ├── screens/            # 13 screens (Dashboard, Focus, TimeOut, Weather...)
│   │   ├── models/             # Data models
│   │   ├── services/           # Business logic
│   │   └── l10n/               # Localization (en, uk)
│   ├── rust/                   # Rust native backend (flutter_rust_bridge)
│   └── android/                # Android-specific config & Gradle
│
├── site/                       # Marketing Website (Astro + React)
│   └── src/
│       ├── layouts/            # Astro layouts
│       ├── components/         # React interactive components
│       └── pages/              # Docs, Releases, About...
│
├── .github/workflows/          # CI/CD
│   ├── release.yml             # Desktop builds (Win/Mac/Linux)
│   ├── flutter-android.yml     # Android APK builds
│   └── ci.yml                  # Lint, format, security audit
│
└── package.json                # v1.21.0
```

---

## 🌍 Localization

TimiGS supports **English** and **Ukrainian** on both platforms.

### Adding a New Language

**Desktop:**
1. Create `src/locales/{lang}.json` based on `en.json`
2. Register in `src/i18n.ts`
3. Add selector option in `src/views/Settings.vue`

**Android:**
1. Create `timigs-android/lib/l10n/app_localizations_{lang}.dart`
2. Add the locale to `app_localizations.dart`

---

## 🔒 Privacy

**All data stays on your device.** TimiGS stores activity data in a local SQLite database. Nothing is transmitted to any server. See [Privacy Policy](timigs-android/PRIVACY.md) for details.

---

## 📜 License

Licensed under the [TimiGS Public License (TPL) v1.0](LICENSE).

- ✅ Free to use, modify, and distribute
- ✅ Must include attribution to **BANSAFAn**
- ❌ Cannot rename/rebrand the software for redistribution

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Commit your changes
4. Open a Pull Request

For issues and feature requests, use [GitHub Issues](https://github.com/BANSAFAn/timiGS-/issues).

---

<div align="center">

**Made with ❤️ by [BANSAFAn](https://github.com/BANSAFAn)**

</div>
