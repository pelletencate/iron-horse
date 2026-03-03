#!/bin/sh
set -e

# Determine rails-ai source directory (absolute path of where install.sh lives)
RAILS_AI_DIR="$(cd "$(dirname "$0")" && pwd)"

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

# Symlink rails-ai plugin
ln -sf "$RAILS_AI_DIR/.opencode/plugins/rails-ai.js" \
  "$HOME/.config/opencode/plugins/rails-ai.js"

# Symlink rails-ai skills
ln -sfn "$RAILS_AI_DIR/skills" \
  "$HOME/.config/opencode/skills/rails-ai"

echo ""
echo "rails-ai installation complete!"
echo ""
echo "Installed:"
echo "  Superpowers: $SUPERPOWERS_DIR"
echo "  Plugin: $HOME/.config/opencode/plugins/rails-ai.js"
echo "  Skills: $HOME/.config/opencode/skills/rails-ai"
