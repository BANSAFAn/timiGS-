$filePath = $args[0]
if ([string]::IsNullOrEmpty($filePath)) {
    Write-Error "No file specified for signing."
    exit 1
}

$pfxPath = $env:TAURI_WINDOWS_PFX
$password = $env:TAURI_WINDOWS_PFX_PASSWORD

if ([string]::IsNullOrEmpty($pfxPath) -or !(Test-Path $pfxPath)) {
    Write-Warning "TAURI_WINDOWS_PFX not set or file not found. Skipping code signing."
    exit 0
}

$signtool = "signtool.exe"
$signtoolFound = $false

if (Get-Command signtool -ErrorAction SilentlyContinue) {
    $signtoolFound = $true
} else {
    $sdkPaths = @(
        "C:\Program Files (x86)\Windows Kits\10\bin\*\x64\signtool.exe",
        "C:\Program Files (x86)\Windows Kits\10\bin\*\x86\signtool.exe",
        "C:\Program Files (x86)\Windows Kits\8.1\bin\x64\signtool.exe",
        "C:\Program Files (x86)\Windows Kits\8.1\bin\x86\signtool.exe"
    )
    foreach ($pattern in $sdkPaths) {
        $resolved = Resolve-Path $pattern -ErrorAction SilentlyContinue
        if ($resolved) {
            $signtool = $resolved[0].Path
            $signtoolFound = $true
            break
        }
    }
}

if (-not $signtoolFound) {
    Write-Error "signtool.exe not found on PATH or in Windows SDK directories."
    exit 1
}

$signArgs = @(
    "sign",
    "/f", $pfxPath
)

if (-not [string]::IsNullOrEmpty($password)) {
    $signArgs += @("/p", $password)
}

$signArgs += @(
    "/fd", "SHA256",
    "/tr", "http://timestamp.digicert.com",
    "/td", "SHA256",
    $filePath
)

& $signtool $signArgs
if ($LASTEXITCODE -ne 0) {
    Write-Error "Signing failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}
