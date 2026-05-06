# Build script for TimiGS Windows XP/2000 Legacy
# This script builds the legacy version of TimiGS for Windows XP SP3 and Windows 2000 SP4

Write-Host "Building TimiGS for Windows XP/2000 (Legacy)..." -ForegroundColor Cyan
Write-Host "WARNING: This is an experimental build with limited functionality!" -ForegroundColor Yellow

# Check if Rust is installed
if (-not (Get-Command rustc -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Rust is not installed. Please install Rust from https://rustup.rs/" -ForegroundColor Red
    exit 1
}

# Check Rust version (XP requires specific toolchain)
$rustVersion = rustc --version
Write-Host "Rust version: $rustVersion" -ForegroundColor Gray

# Check if the 32-bit target is installed
$target = "i686-pc-windows-msvc"
$installedTargets = rustup target list --installed
if ($installedTargets -notcontains $target) {
    Write-Host "Installing $target target..." -ForegroundColor Yellow
    rustup target add $target
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install $target target" -ForegroundColor Red
        exit 1
    }
}

# Navigate to project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptPath)
Set-Location $projectRoot

Write-Host "Project root: $projectRoot" -ForegroundColor Gray

# Build frontend
Write-Host "`nBuilding frontend..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Frontend build failed" -ForegroundColor Red
    exit 1
}

# Backup original files
Write-Host "`nPreparing legacy configuration..." -ForegroundColor Cyan
$backupConfig = "$projectRoot\src-tauri\tauri.conf.json.backup"
$backupCargo = "$projectRoot\src-tauri\Cargo.toml.backup"
$originalConfig = "$projectRoot\src-tauri\tauri.conf.json"
$originalCargo = "$projectRoot\src-tauri\Cargo.toml"
$legacyConfig = "$projectRoot\legacy-builds\winxp\tauri.conf.json"
$legacyCargo = "$projectRoot\legacy-builds\winxp\Cargo.toml"

Copy-Item $originalConfig $backupConfig -Force
Copy-Item $originalCargo $backupCargo -Force
Copy-Item $legacyConfig $originalConfig -Force
Copy-Item $legacyCargo $originalCargo -Force

# Set environment variables for XP compatibility
Write-Host "`nSetting XP compatibility flags..." -ForegroundColor Cyan
$env:RUSTFLAGS = "-C target-feature=+crt-static"

# Build Rust backend for 32-bit XP
Write-Host "`nBuilding Rust backend for Windows XP..." -ForegroundColor Cyan
Set-Location "$projectRoot\src-tauri"

cargo build --release --target $target
$buildResult = $LASTEXITCODE

# Restore original files
Write-Host "`nRestoring original configuration..." -ForegroundColor Cyan
Copy-Item $backupConfig $originalConfig -Force
Copy-Item $backupCargo $originalCargo -Force
Remove-Item $backupConfig -Force
Remove-Item $backupCargo -Force

if ($buildResult -ne 0) {
    Write-Host "Error: Rust build failed" -ForegroundColor Red
    Set-Location $projectRoot
    exit 1
}

# Create bundle
Write-Host "`nCreating installer bundle..." -ForegroundColor Cyan
cargo tauri build --target $target
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Bundle creation failed" -ForegroundColor Red
    Set-Location $projectRoot
    exit 1
}

Set-Location $projectRoot

Write-Host "`n✓ Build completed successfully!" -ForegroundColor Green
Write-Host "Output location: src-tauri\target\$target\release\bundle\" -ForegroundColor Gray
Write-Host "`nInstaller files:" -ForegroundColor Cyan
Get-ChildItem "src-tauri\target\$target\release\bundle" -Recurse -Include "*.exe" | ForEach-Object {
    Write-Host "  - $($_.FullName)" -ForegroundColor Gray
}

Write-Host "`n⚠️  IMPORTANT NOTES FOR WINDOWS XP:" -ForegroundColor Yellow
Write-Host "  - Test on actual XP hardware or VM before distribution" -ForegroundColor Gray
Write-Host "  - Some features are disabled (auto-update, Discord, P2P sync)" -ForegroundColor Gray
Write-Host "  - Requires .NET Framework 2.0 or higher on target system" -ForegroundColor Gray
Write-Host "  - May require Visual C++ 2015-2022 Redistributable (x86)" -ForegroundColor Gray
