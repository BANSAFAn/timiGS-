# Build Verification Script
$ErrorActionPreference = "Stop"

Write-Host "1. Installing Frontend Dependencies..." -ForegroundColor Cyan
npm install

Write-Host "2. Building Tauri Application (Windows)..." -ForegroundColor Cyan
# This builds the Windows executable/installer
npm run tauri build

Write-Host "3. Verifying Artifacts..." -ForegroundColor Cyan
$targetDir = "src-tauri/target/release/bundle/nsis"
if (Test-Path "$targetDir/*.exe") {
    Write-Host "SUCCESS: Windows Installer (.exe) found in $targetDir" -ForegroundColor Green
    Get-ChildItem "$targetDir/*.exe" | Select-Object Name, Length, LastWriteTime
} else {
    Write-Host "ERROR: No .exe found in $targetDir" -ForegroundColor Red
    exit 1
}

$msiDir = "src-tauri/target/release/bundle/msi"
if (Test-Path "$msiDir/*.msi") {
    Write-Host "SUCCESS: Windows Installer (.msi) found in $msiDir" -ForegroundColor Green
}
