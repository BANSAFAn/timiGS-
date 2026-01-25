# Google Drive Integration

TimiGS provides powerful Google Drive integration for cloud backup, data synchronization, and file transfer. Connect multiple Google accounts and manage your data across devices seamlessly.

## Overview

The Google Drive integration allows you to:
- **Backup** your activity data and settings to the cloud
- **Restore** data from previous backups
- **Sync** across multiple devices
- **Transfer** files between your computer and Google Drive
- **Manage** multiple Google accounts simultaneously

## Getting Started

### Prerequisites

- A Google account
- Internet connection
- TimiGS installed and running

### Initial Setup

1. Open **Settings** in TimiGS
2. Scroll to the **Google Drive** section
3. Click **Connect Account**
4. Sign in with your Google account in the browser window
5. Grant TimiGS the requested permissions
6. Your account will appear in the connected accounts list

> [!IMPORTANT]
> TimiGS requests only the minimum permissions needed to manage files in your Google Drive. We never access files outside of the TimiGS backup folder.

## Multi-Account Support

TimiGS supports connecting multiple Google accounts simultaneously. This is useful for:
- Separating personal and work backups
- Redundant backups across different accounts
- Sharing data between team members
- Testing and development purposes

### Adding Additional Accounts

Simply click **Connect Account** again and sign in with a different Google account. Each account is managed independently with its own:
- Target folder selection
- Backup files
- Transfer capabilities

## Folder Management

### Browsing Folders

1. Click the **📁 Browse Folders** button next to your connected account
2. A modal will display all folders in your Google Drive
3. Click on a folder to select it as the target for backups
4. The selected folder is saved automatically

> [!TIP]
> Create a dedicated "TimiGS Backups" folder in your Google Drive to keep your backups organized.

### Creating Folders

1. Click the **➕ Create Folder** button
2. Enter a name for the new folder
3. The folder is created in your Google Drive root directory
4. You can then select it as your backup target

## Backup & Restore

### Creating a Backup (Export)

**Automatic Backup:**
- Enable **Auto Sync** in Settings
- TimiGS will automatically backup every 30 minutes
- Backups are saved to your selected target folder

**Manual Backup:**
1. Select a target folder using **Browse Folders**
2. Click the **⬆️ Export** button
3. TimiGS creates a backup file containing:
   - Activity tracking database
   - User settings and preferences
   - Configuration data
4. The backup is uploaded to Google Drive

> [!NOTE]
> Backup files are named with timestamps (e.g., `timigs_backup_2026-01-25_19-00.db`) for easy identification.

### Restoring from Backup (Import)

1. Click the **⬇️ Import** button on the account with your backup
2. Select the backup file from the list
3. Confirm the restoration
4. TimiGS downloads and restores your data
5. The app may restart to apply the restored settings

> [!CAUTION]
> Importing a backup will **overwrite** your current data. Always create a backup of your current state before importing if you want to preserve it.

## File Transfer

The File Transfer feature allows you to upload and download files to/from Google Drive directly from TimiGS.

### Opening File Transfer

1. Click the **📤 File Transfer** button next to your account
2. A modal opens showing files in your selected folder
3. You can upload new files or download existing ones

### Uploading Files

1. In the File Transfer modal, click **Upload File**
2. Select a file from your computer
3. The file is uploaded to your selected Google Drive folder
4. Upload progress is shown during the transfer

### Downloading Files

1. Browse the file list in the File Transfer modal
2. Click the **⬇️ Download** button next to any file
3. Choose where to save the file on your computer
4. The file is downloaded from Google Drive

> [!TIP]
> File Transfer is useful for moving large activity databases between devices or sharing configuration files with team members.

## Account Management

### Viewing Account Information

For each connected account, you can see:
- **Email address** - The Google account email
- **Connection date** - When the account was connected
- **Target folder** - The currently selected backup folder (if set)

### Unlinking an Account

1. Click the **🗑️ Unlink** button next to the account
2. Confirm the action
3. The account is removed from TimiGS
4. Your files remain in Google Drive

> [!WARNING]
> Unlinking an account removes the connection but does NOT delete your backup files from Google Drive. You can reconnect the same account later to access your backups.

## Security & Privacy

### Authentication

TimiGS uses **OAuth 2.0** for secure authentication:
- No passwords are stored in TimiGS
- Authentication tokens are encrypted
- Tokens are stored securely in your system keychain
- You can revoke access at any time from your Google Account settings

**How OAuth Works in TimiGS:**

```typescript
// Settings.vue - OAuth flow
async function handleGoogleAuth() {
  isConnecting.value = true;
  try {
    // Calls Rust backend which opens browser for OAuth
    const res = await invoke("login_google");
    
    // Backend handles OAuth flow:
    // 1. Opens browser to Google's OAuth page
    // 2. User grants permissions
    // 3. Google redirects with auth code
    // 4. Backend exchanges code for access token
    // 5. Token stored in system keychain (encrypted)
    
    setTimeout(fetchCloudAccounts, 2000);
  } catch (e) {
    console.error("Auth error:", e);
  }
}
```

**Token Storage (Rust Backend):**

```rust
// Simplified example - actual implementation uses keyring crate
use keyring::Entry;

// Store token securely in system keychain
let entry = Entry::new("timigs", &account_email)?;
entry.set_password(&access_token)?;

// Retrieve token when needed
let token = entry.get_password()?;
```

**Security Guarantees:**
- 🔐 Tokens encrypted by OS keychain (Windows Credential Manager, macOS Keychain, Linux Secret Service)
- 🔐 Never stored in plain text
- 🔐 Isolated per user account
- 🔐 Requires OS-level authentication to access

### Permissions

TimiGS requests the following Google Drive permissions:
- **Read/Write access** to files created by TimiGS
- **Folder browsing** to select backup locations
- **File upload/download** for backup and transfer operations

> [!IMPORTANT]
> TimiGS can only access files it creates. It cannot read or modify other files in your Google Drive.

**OAuth Scopes Requested:**

```rust
// Rust backend - OAuth scopes
const SCOPES: &[&str] = &[
    "https://www.googleapis.com/auth/drive.file",  // Access only TimiGS files
    "https://www.googleapis.com/auth/drive.metadata.readonly",  // Browse folders
];
```

**What `drive.file` Scope Means:**
- ✅ Can create new files
- ✅ Can read/write files created by TimiGS
- ✅ Can delete files created by TimiGS
- ❌ **Cannot** access files created by other apps
- ❌ **Cannot** access your documents, photos, etc.
- ❌ **Cannot** see your entire Drive contents

**Verification:**
1. Go to [Google Account Permissions](https://myaccount.google.com/permissions)
2. Find "TimiGS" in the list
3. Click to see exact permissions granted
4. Revoke access anytime

### Data Encryption

- Backup files are stored in SQLite database format
- Connection tokens are encrypted using system-level encryption
- Data in transit uses HTTPS/TLS encryption
- No data is sent to third-party servers

**Implementation Details:**

```rust
// Backup process (Rust backend)
use google_drive3::DriveHub;

// 1. Read local SQLite database
let db_path = app_data_dir.join("timigs.db");
let db_bytes = std::fs::read(&db_path)?;

// 2. Upload directly to Google Drive
let drive = DriveHub::new(
    hyper::Client::builder().build(connector),
    auth  // OAuth token from keychain
);

let file = drive.files()
    .create(File {
        name: Some(format!("timigs_backup_{}.db", timestamp)),
        parents: Some(vec![folder_id.to_string()]),
        ..Default::default()
    })
    .upload_resumable(
        std::io::Cursor::new(db_bytes),
        "application/x-sqlite3".parse().unwrap()
    )
    .await?;
```

**Data Flow:**
1. **Local DB** → Read from disk (unencrypted locally)
2. **Upload** → HTTPS/TLS to Google Drive
3. **Google Drive** → Encrypted at rest by Google
4. **Download** → HTTPS/TLS from Google Drive
5. **Restore** → Write to local disk

**Encryption Layers:**
- 🔐 **In Transit:** TLS 1.3 encryption (HTTPS)
- 🔐 **At Rest (Google):** AES-256 encryption by Google
- 🔐 **OAuth Tokens:** OS keychain encryption
- 🔐 **Local DB:** Unencrypted (on your device only)

### Privacy Considerations

> [!NOTE]
> Your activity data is stored in your personal Google Drive account. Google's privacy policy applies to data stored in Google Drive. TimiGS developers never have access to your data.

## Troubleshooting

### Connection Failed

If you can't connect your Google account:
1. Check your internet connection
2. Ensure pop-ups are allowed for the authentication window
3. Try a different browser
4. Clear browser cache and cookies
5. Check Google's service status

### Upload/Download Errors

If file transfers fail:
1. Verify internet connection
2. Check Google Drive storage quota
3. Ensure the file isn't too large (max 100MB recommended)
4. Try reconnecting your account
5. Check file permissions in Google Drive

### Auto Sync Not Working

If automatic backups aren't happening:
1. Verify **Auto Sync** is enabled in Settings
2. Check that a target folder is selected
3. Ensure the account is still connected
4. Check for error messages in the app
5. Try a manual backup to test the connection

### "Permission Denied" Errors

If you see permission errors:
1. Unlink and reconnect your Google account
2. Ensure you granted all requested permissions during setup
3. Check that the target folder still exists
4. Verify the folder isn't restricted by organization policies

## API Details

### Google Drive API Usage

TimiGS uses the **Google Drive API v3** for all cloud operations:
- **Files API** - Upload, download, and manage backup files
- **Files: list** - Browse folders and files
- **Files: create** - Create new folders and upload backups
- **Files: get** - Download backup files
- **Files: delete** - Remove old backups (manual only)

### Rate Limits

Google Drive API has rate limits:
- **Queries per day:** 1,000,000,000
- **Queries per 100 seconds:** 1,000
- **Queries per user per 100 seconds:** 1,000

> [!NOTE]
> TimiGS operates well within these limits. Auto-sync runs every 30 minutes, using minimal API quota.

### Quota Management

To avoid hitting quota limits:
- Auto-sync runs at 30-minute intervals (not more frequently)
- Manual operations are throttled
- Failed uploads retry with exponential backoff
- Large files are uploaded in chunks

## Best Practices

> [!TIP]
> **Regular Backups** - Enable Auto Sync to ensure you never lose your activity data.

> [!TIP]
> **Multiple Accounts** - Use different Google accounts for different purposes (personal, work, backup redundancy).

> [!TIP]
> **Folder Organization** - Create a dedicated TimiGS folder in Google Drive to keep backups organized and easy to find.

> [!TIP]
> **Test Restores** - Periodically test restoring from a backup to ensure your data is recoverable.

## Advanced Usage

### Sharing Backups

You can share backup files with others:
1. Locate the backup file in Google Drive
2. Right-click and select "Share"
3. Add the recipient's email
4. They can download and import the backup in their TimiGS

> [!CAUTION]
> Backup files contain your complete activity history. Only share with trusted individuals.

### Backup Rotation

To manage storage space:
1. Periodically review old backups in Google Drive
2. Delete backups older than your retention period
3. Keep at least 2-3 recent backups for safety
4. Consider archiving important historical backups

### Cross-Device Sync

To sync data across multiple devices:
1. Create a backup on Device A
2. Install TimiGS on Device B
3. Connect the same Google account on Device B
4. Import the backup from Device A
5. Enable Auto Sync on both devices

> [!WARNING]
> Be careful with cross-device sync. If both devices auto-sync simultaneously, the last upload will overwrite the previous one. Consider using different accounts or folders for each device.
