# Build script for TimiGS 32-bit Windows (Win7+)
# This script builds the 32-bit version of TimiGS for Windows 7, 8, 8.1, and 10

Write-Host "Building TimiGS for Windows 32-bit (Win7+)..." -ForegroundColor Cyan

# Check if Rust is installed
if (-not (Get-Command rustc -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Rust is not installed. Please install Rust from https://rustup.rs/" -ForegroundColor Red
    exit 1
}

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

# Copy legacy config to src-tauri temporarily
Write-Host "`nPreparing legacy configuration..." -ForegroundColor Cyan
$backupConfig = "$projectRoot\src-tauri\tauri.conf.json.backup"
$originalConfig = "$projectRoot\src-tauri\tauri.conf.json"
$legacyConfig = "$projectRoot\legacy-builds\win32\tauri.conf.json"

Copy-Item $originalConfig $backupConfig -Force
Copy-Item $legacyConfig $originalConfig -Force

# Build Rust backend for 32-bit
Write-Host "`nBuilding Rust backend for 32-bit Windows..." -ForegroundColor Cyan
Set-Location "$projectRoot\src-tauri"

cargo build --release --target $target
$buildResult = $LASTEXITCODE

# Restore original config
Write-Host "`nRestoring original configuration..." -ForegroundColor Cyan
Copy-Item $backupConfig $originalConfig -Force
Remove-Item $backupConfig -Force

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
Get-ChildItem "src-tauri\target\$target\release\bundle" -Recurse -Include "*.exe","*.msi" | ForEach-Object {
    Write-Host "  - $($_.FullName)" -ForegroundColor Gray
}
