# TimiGS - Intelligent Activity Tracker

![TimiGS Banner](https://via.placeholder.com/1200x400?text=TimiGS+Activity+Tracker)

**TimiGS** is a modern, privacy-focused activity tracking application for **Desktop (Windows/macOS/Linux)** and **Android**. It helps you understand how you spend your time by tracking active windows/apps, generating detailed analytics, and visualizing your productivity trends.

> **Privacy First**: All data is stored locally on your device in an SQLite database. No personal data is ever sent to the cloud unless you explicitly choose to sync it.

---

## 📱 Platforms

| Platform | Technology | Status |
|----------|------------|--------|
| **Windows** | Tauri v2 + Rust + Vue 3 | ✅ Stable |
| **macOS** | Tauri v2 + Rust + Vue 3 | ✅ Stable |
| **Linux** | Tauri v2 + Rust + Vue 3 | ✅ Stable |
| **Android** | Flutter + Dart | ✅ Stable |

---

## 🚀 Key Features

### Desktop & Android
- 📊 **Real-time Tracking** - Automatically tracks active windows/apps and duration
- 📈 **Analytics Dashboard** - Visualize your data with Donut, Pie, and Bar charts
- 📅 **Timeline View** - Browse your activity history day-by-day
- 🎯 **Tasks & Goals** - Set app usage goals and track progress
- 🌍 **Multi-language** - English and Ukrainian support
- 🎨 **Dark & Light Modes** - Choose the theme that fits your workflow
- 💾 **Local Database** - All data stored locally with SQLite
- 📤 **Data Export** - Export your data for backup

### Desktop Only
- 🖥️ **Window Title Tracking** - Track specific window titles, not just apps
- ☁️ **Google Drive Sync** - Cloud backup and sync
- 🔔 **Discord RPC** - Show your activity status in Discord
- ⏰ **Shutdown Timer** - Schedule automatic shutdown

### Android Only
- 📲 **Usage Stats API** - Native Android app usage tracking
- 🔄 **Background Service** - Continuous tracking with foreground notification

---

## 🛠️ Technology Stack

### Desktop (src-tauri)
- **Core**: [Tauri v2](https://v2.tauri.app/) (Rust)
- **Frontend**: [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Database**: [SQLite](https://www.sqlite.org/) (via `rusqlite`)
- **Visualizations**: [Chart.js](https://www.chartjs.org/) + [vue-chartjs](https://vue-chartjs.org/)

### Android (timigs-android)
- **Framework**: Flutter 3.x
- **Language**: Dart
- **Database**: SQLite (sqflite)
- **Charts**: fl_chart
- **State Management**: Provider
- **Background Tasks**: WorkManager

---

## 💻 Getting Started - Desktop

### Prerequisites

1. **Node.js** (v18 or newer) - [Download](https://nodejs.org/)
2. **Rust** (latest stable) - [Download](https://www.rust-lang.org/tools/install)
3. **C++ Build Tools** (Visual Studio Build Tools for Windows)

### Installation

```bash
git clone https://github.com/BANSAFAn/timiGS-.git
cd timiGS-
npm install
```

### Running

```bash
# Development mode
npm run tauri dev

# Production build
npm run tauri build
```

Output artifacts will be in `src-tauri/target/release/bundle/`.

---

## 📱 Getting Started - Android

### Requirements

- **Android 6.0 (API 23) or higher**
- **Usage Stats Permission** (granted manually in Settings)

### Installation from APK

1. Download the latest `app-release.apk` from [Releases](../../releases)
2. Enable "Install from Unknown Sources" in your Android settings
3. Install the APK
4. Open the app and grant Usage Stats permission when prompted

### Building from Source

```bash
cd timigs-android
flutter pub get
flutter build apk --release
```

See [timigs-android/BUILD_INSTRUCTIONS.md](timigs-android/BUILD_INSTRUCTIONS.md) for detailed instructions.

### Android Permissions

| Permission | Purpose |
|------------|---------|
| `PACKAGE_USAGE_STATS` | Required for tracking app usage |
| `INTERNET` | For Google Drive sync feature |
| `FOREGROUND_SERVICE` | For background tracking |
| `POST_NOTIFICATIONS` | For tracking status notifications |

**To grant Usage Stats permission**: Settings → Apps → Special app access → Usage access → Enable for TimiGS

---

## 📂 Project Structure

```
timiGS-/
├── src/                    # Desktop Frontend (Vue 3)
│   ├── assets/            # Images and static assets
│   ├── components/        # Reusable UI components
│   ├── locales/           # Translation JSON files
│   ├── stores/            # Pinia state stores
│   ├── styles/            # Global CSS variables & themes
│   ├── views/             # Main application pages
│   ├── App.vue            # Root component
│   └── main.ts            # Entry point
│
├── src-tauri/              # Desktop Backend (Rust)
│   ├── src/
│   │   ├── commands.rs    # Tauri commands
│   │   ├── db.rs          # Database schema & queries
│   │   ├── tracker.rs     # Active window tracking logic
│   │   └── lib.rs         # Application entry & setup
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
│
├── timigs-android/         # Android App (Flutter)
│   ├── lib/
│   │   ├── models/        # Data models
│   │   ├── screens/       # UI screens
│   │   ├── services/      # Business logic
│   │   └── widgets/       # Reusable widgets
│   ├── android/           # Android-specific config
│   └── pubspec.yaml       # Flutter dependencies
│
├── site/                   # Marketing website (Astro)
│
└── package.json            # Node.js dependencies
```

---

## 🌍 Localization

TimiGS supports English and Ukrainian. To add a new language:

### Desktop
1. Create `src/locales/{lang}.json`
2. Register in `src/i18n.ts`
3. Add option to `src/views/Settings.vue`

### Android
1. Create `timigs-android/lib/l10n/app_{lang}.arb`
2. Update `pubspec.yaml` generate settings

---

## 🗺️ Roadmap

### Desktop
- [ ] macOS native notifications
- [ ] Linux system tray improvements
- [ ] More chart types

### Android
- [ ] Google Drive sync implementation
- [ ] Home screen widget
- [ ] Focus mode
- [ ] App blocking

---

## 📜 License

[Your License Here]

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

For issues and feature requests, please use the [GitHub Issues](../../issues) page.