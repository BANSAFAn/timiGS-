#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TimiGS Arch Linux Binary Installer ===${NC}"

# 1. Check if running on Arch Linux
if [ ! -f /etc/arch-release ]; then
    echo -e "${RED}Error: This script is designed for Arch Linux or Arch-based distributions (Manjaro, EndeavourOS, etc.)${NC}"
    exit 1
fi

# 2. Install dependencies via pacman
echo -e "${BLUE}Checking and installing system dependencies...${NC}"
DEPS=(webkit2gtk-4.1 gtk3 libappindicator-gtk3 librsvg alsa-lib xdotool wmctrl curl)
MISSING_DEPS=()

for dep in "${DEPS[@]}"; do
    if ! pacman -Qi "$dep" &> /dev/null; then
        MISSING_DEPS+=("$dep")
    fi
done

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo -e "${BLUE}Installing missing dependencies: ${MISSING_DEPS[*]}...${NC}"
    sudo pacman -S --needed --noconfirm "${MISSING_DEPS[@]}"
else
    echo -e "${GREEN}All system dependencies are already installed.${NC}"
fi

# 3. Create target directories
echo -e "${BLUE}Creating installation directories...${NC}"
mkdir -p "$HOME/.local/bin"
mkdir -p "$HOME/.local/share/applications"
mkdir -p "$HOME/.local/share/icons/hicolor/128x128/apps"

# 4. Fetch the latest AppImage download URL from GitHub API
echo -e "${BLUE}Fetching latest release info...${NC}"
DOWNLOAD_URL=$(curl -s https://api.github.com/repos/BANSAFAn/timiGS-/releases/latest | grep "browser_download_url" | grep -i "appimage" | head -n 1 | cut -d '"' -f 4)

if [ -z "$DOWNLOAD_URL" ]; then
    echo -e "${RED}Error: Could not retrieve the latest AppImage download link. Please check your internet connection or try again later.${NC}"
    exit 1
fi

echo -e "${BLUE}Downloading latest TimiGS AppImage...${NC}"
curl -L -o "$HOME/.local/bin/timigs" "$DOWNLOAD_URL"
chmod +x "$HOME/.local/bin/timigs"

# 5. Download application icon
echo -e "${BLUE}Downloading application icon...${NC}"
curl -L -o "$HOME/.local/share/icons/hicolor/128x128/apps/timigs.png" \
  "https://raw.githubusercontent.com/BANSAFAn/timiGS-/main/src-tauri/icons/128x128.png"

# 6. Create desktop launcher entry
echo -e "${BLUE}Creating application shortcut...${NC}"
cat <<EOF > "$HOME/.local/share/applications/timigs.desktop"
[Desktop Entry]
Name=TimiGS
Comment=Track your PC activity
Exec=$HOME/.local/bin/timigs
Icon=timigs
Terminal=false
Type=Application
Categories=Utility;
EOF

chmod +x "$HOME/.local/share/applications/timigs.desktop"

# Update desktop application database if utility exists
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database "$HOME/.local/share/applications" &> /dev/null || true
fi

# Check if bin folder is in user's PATH
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo -e "${RED}Warning: $HOME/.local/bin is not in your system PATH!${NC}"
    echo -e "To launch TimiGS directly from your terminal, append the following line to your ~/.bashrc or ~/.zshrc:"
    echo -e "  export PATH=\$PATH:\$HOME/.local/bin"
fi

echo -e "${GREEN}=== TimiGS Installed Successfully! ===${NC}"
echo -e "You can now launch TimiGS from your desktop launcher/applications menu or by running 'timigs' in the terminal."
