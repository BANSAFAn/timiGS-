$ErrorActionPreference = "Stop"

Write-Host "1. Switching to nexting branch..."
# Check if branch exists locally, if not create it, if yes switch to it
if (git branch --list nexting) {
    git checkout nexting
} else {
    git checkout -b nexting
}

Write-Host "2. Adding all files..."
git add .

Write-Host "3. Committing changes..."
$msg = $args[0]
if (-not $msg) {
    $msg = Read-Host "Enter commit message"
}
if (-not $msg) {
    Write-Host "Commit message is required!"
    exit 1
}

Write-Host "3. Committing changes..."
git commit -m "$msg"

Write-Host "4. Pushing to GitHub..."
git push -u origin nexting

Write-Host "---------------------------------------------------"
Write-Host "Success! Now go to GitHub Actions tab to see the workflows running."
Write-Host "The Release Please PR will appear shortly after."
