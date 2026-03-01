# TimiGS Android - Changelog

## Version 1.0.0 (Initial Release)

### Features
- ✅ **Activity Tracking**: Real-time Android app usage monitoring
- ✅ **Dashboard**: Current app, today's stats, top applications
- ✅ **Timeline**: Historical session view with date picker
- ✅ **Analytics**: Pie charts and bar charts for usage visualization
- ✅ **Tasks & Goals**: Set and track app usage goals
- ✅ **Settings**: Language, theme, tracking controls
- ✅ **Internationalization**: English and Ukrainian support
- ✅ **Themes**: Dark and Light mode
- ✅ **Database**: Local SQLite storage with export functionality
- ✅ **Background Tracking**: WorkManager integration

### Technical Details
- **Min SDK**: Android 6.0 (API 23)
- **Target SDK**: Android 14 (API 34)
- **Framework**: Flutter 3.x
- **Database**: SQLite (sqflite)
- **Charts**: fl_chart
- **State Management**: Provider

### Permissions Required
- `PACKAGE_USAGE_STATS` - For app usage tracking (must be granted manually)
- `INTERNET` - For future Google Drive sync
- `FOREGROUND_SERVICE` - For background tracking
- `POST_NOTIFICATIONS` - For tracking notifications
- `WAKE_LOCK` - Keep tracking active
- `RECEIVE_BOOT_COMPLETED` - Auto-start after reboot

### Known Limitations
- Google Drive sync requires manual OAuth setup
- Notepad feature not yet implemented
- Weather widget not available (desktop-only feature)
- P2P file transfer not available (desktop-only feature)

### Build Information
- **APK Size**: ~40-50 MB (release)
- **Supported ABIs**: armeabi-v7a, arm64-v8a, x86_64

---

## Roadmap

### Version 1.1.0 (Planned)
- [ ] Google Drive OAuth implementation
- [ ] Foreground service notification
- [ ] Notepad functionality
- [ ] App icon customization
- [ ] Export to CSV/JSON

### Version 1.2.0 (Future)
- [ ] Widget support
- [ ] Focus mode
- [ ] App blocking
- [ ] Custom categories
- [ ] Statistics export

---

## Installation

1. Download `app-release.apk`
2. Enable "Install from Unknown Sources" in Android settings
3. Install the APK
4. Grant "Usage Stats" permission in Settings → Apps → Special app access → Usage access
5. Start tracking!

For detailed build instructions, see [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md)
