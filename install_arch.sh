#!/bin/bash
set -e

# Colors for nice output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TimiGS Arch Linux Installer ===${NC}"

# Check if we are running on Arch Linux
if [ ! -f /etc/arch-release ]; then
    echo -e "${RED}Error: This script is only for Arch Linux or Arch-based distributions (Manjaro, EndeavourOS, etc.)${NC}"
    exit 1
fi

echo -e "${BLUE}Checking and installing system dependencies...${NC}"

DEPS=(
  nodejs
  npm
  rust
  cargo
  git
  make
  gcc
  pkgconf
  webkit2gtk-4.1
  gtk3
  libappindicator-gtk3
  librsvg
  patchelf
  alsa-lib
  clang
  llvm
  curl
  openssl
  xdotool
  wmctrl
  xdg-utils
  file
  binutils
  fuse2
  bzip2
  squashfs-tools
  zsync
  desktop-file-utils
  gdk-pixbuf2
  libxcb
  xcb-util
  xcb-util-image
  xcb-util-keysyms
  xcb-util-renderutil
  xcb-util-wm
)

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

echo -e "${BLUE}Installing Node modules...${NC}"
npm install

echo -e "${BLUE}Building TimiGS client and backend...${NC}"
npm run build
export APPIMAGE_EXTRACT_AND_RUN=1
export NO_STRIP=true
export LINUXDEPLOY_PLUGIN_GTK_SKIP_GLIB_SCHEMAS=1
export LINUXDEPLOY_PLUGIN_GTK_SKIP_PIXBUF=1
npm run tauri build -- --bundles appimage

# Find the AppImage
APPIMAGE_PATH=$(find src-tauri/target/release/bundle/appimage -name "*.AppImage" | head -n 1)

if [ -z "$APPIMAGE_PATH" ]; then
    echo -e "${RED}Error: Could not find built AppImage! Check build logs.${NC}"
    exit 1
fi

echo -e "${BLUE}Installing TimiGS to your user path...${NC}"
# Create local bin and application directories if they don't exist
mkdir -p "$HOME/.local/bin"
mkdir -p "$HOME/.local/share/applications"
mkdir -p "$HOME/.local/share/icons/hicolor/128x128/apps"

# Copy AppImage to local bin
cp "$APPIMAGE_PATH" "$HOME/.local/bin/timigs"
chmod +x "$HOME/.local/bin/timigs"

# Copy application icon
if [ -f "src-tauri/icons/128x128.png" ]; then
    cp "src-tauri/icons/128x128.png" "$HOME/.local/share/icons/hicolor/128x128/apps/timigs.png"
fi

# Create desktop entry
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

# Check if ~/.local/bin is in PATH
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo -e "${RED}Warning: $HOME/.local/bin is not in your PATH!${NC}"
    echo -e "To launch it from shell, add this to your .bashrc/.zshrc:"
    echo -e "  export PATH=\$PATH:\$HOME/.local/bin"
fi

echo -e "${GREEN}=== TimiGS Installed Successfully! ===${NC}"
echo -e "You can now run TimiGS from your application launcher or by running 'timigs' in terminal."
