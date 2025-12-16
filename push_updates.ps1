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
# Using conventional commit so Release Please understands this feature
git commit -m "feat: add tools tab, fix alignment, and setup ci/cd"

Write-Host "4. Pushing to GitHub..."
git push -u origin nexting

Write-Host "---------------------------------------------------"
Write-Host "Success! Now go to GitHub Actions tab to see the workflows running."
Write-Host "The Release Please PR will appear shortly after."
