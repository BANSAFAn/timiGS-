# Legacy Builds Configuration

This folder contains configurations for building TimiGS versions for legacy operating systems and architectures.

## Supported Platforms

### Windows

#### Windows 32-bit (Win7+)
- **Folder:** `win32/`
- **Architecture:** i686 (32-bit)
- **Support:** Windows 7, 8, 8.1, 10 (32-bit)
- **Features:**
  - ✅ Activity tracking
  - ✅ Auto updates
  - ✅ P2P sync
  - ✅ Music player
- **Formats:** NSIS (.exe), MSI (.msi)

#### Windows XP/2000 (Legacy)
- **Folder:** `winxp/`
- **Architecture:** i686 (32-bit)
- **Support:** Windows XP SP3, Windows 2000 SP4
- **Features:**
  - ✅ Activity tracking
  - ❌ Auto updates (not supported)
  - ❌ P2P sync (not supported)
  - ❌ Music player (limited)
- **Notes:**
  - Requires .NET Framework 2.0+
  - May require Visual C++ Redistributable (x86)
  - Limited functionality
- **Formats:** NSIS (.exe)

### Linux

#### Linux 32-bit (Legacy)
- **Folder:** `linux32/`
- **Architecture:** i686 (32-bit)
- **Support:** Ubuntu 18.04+, Debian 9+, Fedora 28+
- **Features:**
  - ✅ Activity tracking
  - ❌ Auto updates (not supported)
  - ❌ P2P sync (not supported)
  - ❌ Music player (limited)
- **Requirements:**
  - GTK 3
  - WebKit2GTK
  - libappindicator
- **Notes:** May require additional libraries on older distributions
- **Formats:** DEB, RPM, AppImage

### macOS

#### macOS Intel (x64)
- **Folder:** `macos-x64/`
- **Architecture:** x86_64 (64-bit)
- **Support:** macOS 10.15+, 11, 12, 13
- **Features:**
  - ✅ Activity tracking
  - ✅ Auto updates
  - ✅ P2P sync
  - ✅ Music player
- **Notes:**
  - For Intel-based Macs only
  - Not compatible with Apple Silicon (use universal or arm64 version)
- **Formats:** DMG, APP

## CI/CD Configuration

Legacy builds are automated via GitHub Actions in `.github/workflows/legacy-builds.yml`.

### Triggers

Automatic:
- On new GitHub release publication

Manual:
- Via GitHub Actions → Legacy Builds → Run workflow
- Can specify version to build

### Build Matrix

| Platform | Runner | Target | Formats |
|----------|--------|--------|---------|
| Win32 | windows-latest | i686-pc-windows-msvc | NSIS, MSI |
| WinXP | windows-latest | i686-pc-windows-msvc | NSIS |
| Linux32 | ubuntu-latest | i686-unknown-linux-gnu | DEB, RPM, AppImage |
| macOS-x64 | macos-13 | x86_64-apple-darwin | DMG, APP |

## Local Build Instructions

### Windows (32-bit)

```powershell
# Backup original config
cp src-tauri\tauri.conf.json src-tauri\tauri.conf.json.backup
cp src-tauri\Cargo.toml src-tauri\Cargo.toml.backup

# Copy legacy config
cp legacy-builds\win32\tauri.conf.json src-tauri\tauri.conf.json
cp legacy-builds\win32\Cargo.toml src-tauri\Cargo.toml

# Build
cd src-tauri
cargo tauri build --target i686-pc-windows-msvc

# Restore original files
cd ..
cp src-tauri\tauri.conf.json.backup src-tauri\tauri.conf.json
cp src-tauri\Cargo.toml.backup src-tauri\Cargo.toml
```

### Linux (32-bit)

```bash
# Install dependencies
sudo apt-get install -y \
    libgtk-3-dev \
    libwebkit2gtk-4.0-dev \
    libappindicator3-dev \
    librsvg2-dev \
    libssl-dev \
    pkg-config \
    gcc-multilib \
    g++-multilib

# Backup original files
cp src-tauri/tauri.conf.json src-tauri/tauri.conf.json.backup
cp src-tauri/Cargo.toml src-tauri/Cargo.toml.backup

# Copy legacy config
cp legacy-builds/linux32/tauri.conf.json src-tauri/tauri.conf.json
cp legacy-builds/linux32/Cargo.toml src-tauri/Cargo.toml

# Build
cd src-tauri
cargo tauri build --target i686-unknown-linux-gnu

# Restore original files
cd ..
cp src-tauri/tauri.conf.json.backup src-tauri/tauri.conf.json
cp src-tauri/Cargo.toml.backup src-tauri/Cargo.toml
```

### macOS (Intel x64)

```bash
# Backup original files
cp src-tauri/tauri.conf.json src-tauri/tauri.conf.json.backup
cp src-tauri/Cargo.toml src-tauri/Cargo.toml.backup

# Copy legacy config
cp legacy-builds/macos-x64/tauri.conf.json src-tauri/tauri.conf.json
cp legacy-builds/macos-x64/Cargo.toml src-tauri/Cargo.toml

# Build
cd src-tauri
cargo tauri build --target x86_64-apple-darwin

# Restore original files
cd ..
cp src-tauri/tauri.conf.json.backup src-tauri/tauri.conf.json
cp src-tauri/Cargo.toml.backup src-tauri/Cargo.toml
```

## File Structure

```
legacy-builds/
├── win32/
│   ├── Cargo.toml          # Rust config for Win32
│   ├── tauri.conf.json     # Tauri config for Win32
│   └── build.ps1           # Build script (PowerShell)
├── winxp/
│   ├── Cargo.toml          # Rust config for WinXP
│   ├── tauri.conf.json     # Tauri config for WinXP
│   └── build.ps1           # Build script (PowerShell)
├── linux32/
│   ├── Cargo.toml          # Rust config for Linux 32-bit
│   └── tauri.conf.json     # Tauri config for Linux 32-bit
└── macos-x64/
    ├── Cargo.toml          # Rust config for macOS Intel
    └── tauri.conf.json     # Tauri config for macOS Intel
```

## Manifest

After each release, a `legacy-manifest.json` is created containing information about all available legacy builds, their features, and notes.

## Limitations

1. **Auto updates** not supported on:
   - Windows XP/2000
   - Linux 32-bit
   
2. **P2P sync** not supported on:
   - Windows XP/2000
   - Linux 32-bit

3. **Music player** limited or unavailable on:
   - Windows XP/2000
   - Linux 32-bit

4. **Apple Silicon** not supported in `macos-x64` - use separate arm64 build.

## Troubleshooting

### Linux 32-bit compilation errors
Ensure all 32-bit libraries are installed:
```bash
sudo apt-get install gcc-multilib g++-multilib
```

### macOS errors
Ensure you're using macOS 13 (Ventura) or newer runner for builds.

### Windows XP issues
For maximum compatibility, use the flag:
```bash
RUSTFLAGS="-C target-feature=+crt-static"
```

## License

Legacy build configurations are distributed under the same license as the main project.
