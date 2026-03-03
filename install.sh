#!/bin/sh
set -e

# Determine iron-horse source directory (absolute path of where install.sh lives)
IRON_HORSE_DIR="$(cd "$(dirname "$0")" && pwd)"

# Setup directories
mkdir -p "$HOME/.config/opencode/plugins"
mkdir -p "$HOME/.config/opencode/skills"

# Install Superpowers (clone if not already present)
SUPERPOWERS_DIR="$HOME/.config/opencode/superpowers"
if [ ! -d "$SUPERPOWERS_DIR" ]; then
  echo "Installing Superpowers..."
  git clone https://github.com/obra/superpowers.git "$SUPERPOWERS_DIR"
else
  echo "Superpowers already installed at $SUPERPOWERS_DIR"
fi

# Symlink Superpowers plugin
ln -sf "$SUPERPOWERS_DIR/.opencode/plugins/superpowers.js" \
  "$HOME/.config/opencode/plugins/superpowers.js"

# Symlink Superpowers skills
# Note: use ln -sfn for directories to handle existing symlinks
ln -sfn "$SUPERPOWERS_DIR/skills" \
  "$HOME/.config/opencode/skills/superpowers"

# Symlink iron-horse plugin
ln -sf "$IRON_HORSE_DIR/.opencode/plugins/iron-horse.js" \
  "$HOME/.config/opencode/plugins/iron-horse.js"

# Symlink iron-horse skills
ln -sfn "$IRON_HORSE_DIR/skills" \
  "$HOME/.config/opencode/skills/iron-horse"

echo ""
echo "iron-horse installation complete!"
echo ""
echo "Installed:"
echo "  Superpowers: $SUPERPOWERS_DIR"
echo "  Plugin: $HOME/.config/opencode/plugins/iron-horse.js"
echo "  Skills: $HOME/.config/opencode/skills/iron-horse"
