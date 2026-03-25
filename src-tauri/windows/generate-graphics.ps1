# Generate NSIS Installer Graphics for TimiGS
# This script creates the required bitmap files for the NSIS installer

param(
    [string]$IconPath = "icons\icon.png",
    [string]$OutputDir = "windows"
)

Write-Host "Generating NSIS installer graphics..." -ForegroundColor Cyan

# Check if ImageMagick is available
try {
    $convertPath = Get-Command convert -ErrorAction Stop | Select-Object -ExpandProperty Source
    Write-Host "Found ImageMagick: $convertPath" -ForegroundColor Green
} catch {
    Write-Host "ImageMagick not found. Please install from: https://imagemagick.org/" -ForegroundColor Red
    Write-Host "Alternatively, create these files manually:" -ForegroundColor Yellow
    Write-Host "  - installer-header.bmp (150x57)" -ForegroundColor Yellow
    Write-Host "  - installer-sidebar.bmp (164x314)" -ForegroundColor Yellow
    Write-Host "  - installer-finish.bmp (150x57)" -ForegroundColor Yellow
    exit 1
}

# Color scheme
$primaryBlue = "#002D5C"
$secondaryBlue = "#004080"
$accentBlue = "#0066CC"
$white = "#FFFFFF"

# Create header bitmap (150x57)
Write-Host "Creating header bitmap..." -ForegroundColor Cyan
$headerPath = Join-Path $OutputDir "installer-header.bmp"
& convert -size 150x57 gradient:"$primaryBlue-$secondaryBlue" `
    -gravity center `
    -pointsize 18 `
    -fill $white `
    -font "Arial-Bold" `
    -annotate 0 "TimiGS" `
    $headerPath
Write-Host "  Created: $headerPath" -ForegroundColor Green

# Create sidebar bitmap (164x314)
Write-Host "Creating sidebar bitmap..." -ForegroundColor Cyan
$sidebarPath = Join-Path $OutputDir "installer-sidebar.bmp"
& convert -size 164x314 xc:$primaryBlue `
    -gravity north `
    -pointsize 20 `
    -fill $white `
    -font "Arial-Bold" `
    -annotate 0+20 "TimiGS" `
    -pointsize 12 `
    -annotate 0+50 "Activity Tracker" `
    -gravity center `
    -pointsize 10 `
    -annotate 0+20 "Monitor your PC usage" `
    -annotate 0+40 "Track applications" `
    -annotate 0+60 "View analytics" `
    $sidebarPath
Write-Host "  Created: $sidebarPath" -ForegroundColor Green

# Create finish bitmap (150x57)
Write-Host "Creating finish bitmap..." -ForegroundColor Cyan
$finishPath = Join-Path $OutputDir "installer-finish.bmp"
& convert -size 150x57 gradient:"$primaryBlue-$secondaryBlue" `
    -gravity center `
    -pointsize 16 `
    -fill $white `
    -font "Arial-Bold" `
    -annotate 0 "Installation" `
    -pointsize 14 `
    -annotate 0+20 "Complete!" `
    $finishPath
Write-Host "  Created: $finishPath" -ForegroundColor Green

Write-Host "`nGraphics generation complete!" -ForegroundColor Green
Write-Host "Files created in: $OutputDir" -ForegroundColor Cyan
