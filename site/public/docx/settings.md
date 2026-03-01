# Settings

Customize TimiGS to match your preferences and workflow. The Settings page provides comprehensive control over appearance, system behavior, cloud synchronization, and integrations.

## Appearance

### 🌐 Language

Choose your preferred interface language:
- **English** (en)
- **Українська** (uk) - Ukrainian
- **Deutsch** (de) - German
- **Français** (fr) - French
- **中文 (简体)** (zh-CN) - Simplified Chinese
- **العربية** (ar) - Arabic

The interface updates immediately when you select a new language.

### 🌓 Theme

Switch between visual themes:
- **Dark Mode** 🌙 - Easy on the eyes, perfect for extended use
- **Light Mode** ☀️ - Bright and clean interface

> [!TIP]
> Dark mode is recommended for reduced eye strain during long tracking sessions.

## System Settings

### 📊 Activity Tracking

Control the core tracking functionality:
- **Start Tracking** - Begin monitoring your application usage
- **Stop Tracking** - Pause tracking temporarily
- **Status Display** - See if tracking is currently active or paused

> [!IMPORTANT]
> On Android devices, TimiGS requires "Usage Access" permission to track app activity. You'll be prompted to grant this permission when enabling tracking for the first time.

### 🚀 Autostart

**Launch TimiGS on system startup**

When enabled, TimiGS will automatically start when you log into your computer, ensuring continuous activity tracking without manual intervention.

### 📌 Minimize to Tray

**Keep running in background**

When enabled, closing the main window minimizes TimiGS to the system tray instead of quitting the application. This allows tracking to continue while keeping your taskbar clean.

> [!NOTE]
> You can restore the window by clicking the TimiGS icon in the system tray.

### 🎮 Discord Rich Presence

**Show activity on Discord profile**

Enable Discord integration to display your current activity on your Discord profile:
- Shows the app you're currently using
- Displays elapsed time
- Updates in real-time
- Respects Discord's privacy settings

> [!CAUTION]
> Make sure Discord is running for Rich Presence to work. The integration connects automatically when both applications are active.

## Cloud & Data

### 🔄 Auto Sync

**Automatically backup data every 30 minutes**

When enabled, TimiGS will automatically back up your settings and activity database to your connected cloud storage:
- Runs every 30 minutes
- Works in the background
- Requires at least one connected Google Drive account
- Minimal performance impact

> [!WARNING]
> Auto Sync requires an active internet connection and a connected Google Drive account. Make sure you've set up cloud storage before enabling this feature.

## Google Drive Integration

Connect multiple Google accounts for cloud backup and file transfer capabilities.

### Connecting an Account

1. Click **Connect Account** button
2. Sign in with your Google account
3. Grant TimiGS permission to access Google Drive
4. Your account appears in the connected accounts list

### Managing Connected Accounts

For each connected account, you can:

- **📁 Browse Folders** - View and select target folders for backups
- **➕ Create Folder** - Create a new folder in Google Drive
- **⬆️ Export** - Backup your data to the selected folder
- **⬇️ Import** - Restore data from a previous backup
- **📤 File Transfer** - Upload and download files
- **🗑️ Unlink** - Remove the account connection

> [!TIP]
> You can connect multiple Google accounts and choose different backup folders for each one. This is useful for separating personal and work backups.

### Backup/Export Process

1. Select a target folder using **Browse Folders**
2. Click **Export** button
3. TimiGS creates a backup file with your settings and database
4. The backup is uploaded to your selected Google Drive folder

### Restore/Import Process

1. Click **Import** button on the account containing your backup
2. Select the backup file from the list
3. Confirm the restoration
4. TimiGS restores your settings and activity data

> [!CAUTION]
> Importing a backup will overwrite your current settings and activity data. Make sure to export your current data first if you want to keep it.

## GitHub Integration

Connect your GitHub account to track coding activity and view repository statistics.

### Setup

1. Navigate to Settings
2. Find the **GitHub** section
3. Click **Connect** button
4. You'll be redirected to GitHub authentication

> [!NOTE]
> GitHub integration requires a Personal Access Token. See the [GitHub Integration](github-api.md) documentation for detailed setup instructions.

## Updates

### 🚀 Version Information

The Settings page displays your current TimiGS version. Stay up to date with the latest features and improvements.

### Check for Updates

Click **Check for Updates** to:
- See if a new version is available
- View release notes
- Install updates directly from the app

> [!IMPORTANT]
> TimiGS will automatically check for updates on startup. You can also manually check at any time from the Settings page.

## About & License

### Developer Information

TimiGS is developed by **[BANSAFAn](https://github.com/BANSAFAn)**

### License

Licensed under **TimiGS Public License**

> [!NOTE]
> The name "TimiGS" is a protected trademark. Copyright © 2026. See the LICENSE file for full terms.

## Platform-Specific Features

### Android Permissions

On Android, TimiGS requires special permissions:

**Usage Access Permission**
- Required for tracking app activity
- Granted through Android Settings
- TimiGS will guide you through the permission process

### Desktop Features

Desktop versions (Windows, macOS, Linux) include:
- System tray integration
- Autostart functionality
- Native window management
- Full Discord Rich Presence support

## Data Privacy

> [!IMPORTANT]
> All settings are stored locally on your device. When using cloud sync, data is encrypted and sent only to your personal Google Drive account. TimiGS never sends your data to third-party servers.

**What's Stored Locally:**
- Language preference
- Theme selection
- System settings (autostart, minimize to tray, etc.)
- Connected account tokens (encrypted)
- Activity tracking data

**What's Synced to Cloud (if enabled):**
- Settings configuration
- Activity database
- User preferences

## Troubleshooting

### Settings Not Saving

If your settings aren't persisting:
1. Check file system permissions
2. Ensure the app has write access to its data directory
3. Try restarting TimiGS
4. Check for error messages in the console

### Cloud Sync Not Working

If auto-sync fails:
1. Verify internet connection
2. Check that Google Drive account is still connected
3. Ensure you have storage space available
4. Try manually exporting to test the connection

### Discord Rich Presence Not Showing

If Discord integration isn't working:
1. Make sure Discord is running
2. Check that Discord Rich Presence is enabled in Discord settings
3. Restart both TimiGS and Discord
4. Verify the setting is enabled in TimiGS Settings
