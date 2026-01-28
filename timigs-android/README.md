# TimiGS Android

Android version of TimiGS - Activity Tracker for monitoring app usage and productivity.

## Features

- 📊 **Real-time Activity Tracking** - Monitor which apps you use and for how long
- 📈 **Analytics Dashboard** - Visualize your usage with charts and statistics
- 📅 **Timeline View** - Browse historical activity by date
- 🎯 **Tasks & Goals** - Set app usage goals and track progress
- 🌍 **Multi-language** - English and Ukrainian support
- 🎨 **Themes** - Dark and Light mode
- 💾 **Local Database** - All data stored locally with SQLite
- 📤 **Data Export** - Export your data for backup

## Screenshots

<!-- Add screenshots here when available -->

## Requirements

- **Android 6.0 (API 23) or higher**
- **Usage Stats Permission** (must be granted manually in Settings)

## Installation

### From APK

1. Download the latest `app-release.apk` from [Releases](../../releases)
2. Enable "Install from Unknown Sources" in your Android settings
3. Install the APK
4. Open the app and grant Usage Stats permission when prompted

### From Source

See [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) for detailed build instructions.

```bash
flutter pub get
flutter build apk --release
```

## Permissions

The app requires the following permissions:

- **Usage Stats** (PACKAGE_USAGE_STATS) - Required for tracking app usage
  - Must be granted manually in Settings → Apps → Special app access → Usage access
- **Internet** - For future Google Drive sync feature
- **Foreground Service** - For background tracking
- **Notifications** - For tracking status notifications

## Usage

1. **Grant Permission**: Go to Settings → Apps → Special app access → Usage access → Enable for TimiGS
2. **Start Tracking**: Open the app and toggle tracking ON in Settings
3. **View Stats**: Check Dashboard for real-time stats, Timeline for history, Analytics for charts
4. **Set Goals**: Use Tools → Tasks to create app usage goals

## Documentation

- [Build Instructions](BUILD_INSTRUCTIONS.md) - How to build from source
- [Changelog](CHANGELOG.md) - Version history and updates
- [Contributing](CONTRIBUTING.md) - How to contribute to the project

## Technology Stack

- **Framework**: Flutter 3.x
- **Language**: Dart
- **Database**: SQLite (sqflite)
- **Charts**: fl_chart
- **State Management**: Provider
- **Background Tasks**: WorkManager

## Roadmap

- [ ] Google Drive sync implementation
- [ ] Foreground service notification
- [ ] Notepad feature
- [ ] Home screen widget
- [ ] Focus mode
- [ ] App blocking

## License

[Your License Here]

## Support

For issues and feature requests, please use the [GitHub Issues](../../issues) page.

## Credits

Based on the desktop version of TimiGS.
