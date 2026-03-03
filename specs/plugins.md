# Plugins Specification

> Living document. Last updated: 2026-03-03

## What is a Plugin?

In the rails-ai context, a plugin is a JavaScript ES module that uses OpenCode's plugin hooks to inject context or modify behavior at runtime. The primary plugin is `rails-ai.js`, which bootstraps Rails awareness into the agent's system prompt.

## Plugin vs Skill

| Aspect | Skill | Plugin |
|--------|-------|--------|
| Nature | Knowledge (markdown) | Runtime code (JavaScript) |
| Format | `SKILL.md` + examples | `.js` ES module |
| Invocation | Loaded via `skill` tool on demand | Fires automatically via hooks |
| Output | Guides agent behavior when loaded | Injects context at session start |
| Example | "How to write a Rails migration" | "Inject Rails baseline knowledge into system prompt" |

## The rails-ai Plugin

### File Location

```
.opencode/plugins/rails-ai.js
```

Installed via symlink to `~/.config/opencode/plugins/rails-ai.js`.

### Hook: `experimental.chat.system.transform`

The plugin registers a single hook — `experimental.chat.system.transform` — which fires when a chat session starts and allows modifying the system prompt.

### What It Does

1. Locates the `using-rails-ai/SKILL.md` file in the skills directory
2. Reads the file content
3. Strips YAML frontmatter (the `---` delimited header)
4. Pushes the remaining content to `output.system`

This gives the agent baseline Rails awareness before any explicit skill loading occurs.

### What It Does NOT Do

- **Does not auto-load all skills** — only the bootstrap skill (`using-rails-ai/SKILL.md`) is injected. Other skills are loaded on-demand via OpenCode's native `skill` tool.
- **Does not define custom tools** — the plugin only injects context; it doesn't add new tools or commands.
- **Does not modify agent behavior** beyond injecting the bootstrap content into the system prompt.

### Implementation Pattern

The plugin follows the same pattern as the [Superpowers plugin](https://github.com/obra/superpowers/blob/main/.opencode/plugins/superpowers.js):

```javascript
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const RailsAIPlugin = async ({ client, directory }) => {
  // Locate using-rails-ai/SKILL.md
  // Read and strip frontmatter
  // Return hook registration

  return {
    name: "rails-ai",
    hooks: {
      "experimental.chat.system.transform": async (input, output) => {
        // Push bootstrap content to output.system
      }
    }
  };
};
```

## Plugin Discovery

OpenCode discovers plugins from the filesystem:

```
~/.config/opencode/plugins/
├── superpowers.js    → symlink to superpowers repo
└── rails-ai.js      → symlink to rails-ai repo
```

Plugins are JavaScript ES modules that export an async factory function.

## Installation

The `install.sh` script handles plugin installation:

1. Symlinks `rails-ai.js` into `~/.config/opencode/plugins/`
2. Symlinks the `skills/` directory into `~/.config/opencode/skills/rails-ai/`
3. No `opencode.json` configuration file is needed

```bash
# What install.sh does:
mkdir -p ~/.config/opencode/plugins
ln -s /path/to/rails-ai/.opencode/plugins/rails-ai.js ~/.config/opencode/plugins/rails-ai.js

mkdir -p ~/.config/opencode/skills
ln -s /path/to/rails-ai/skills ~/.config/opencode/skills/rails-ai
```

## Relationship to Superpowers Plugin

rails-ai's plugin follows the same architecture as Superpowers' plugin:

| Aspect | Superpowers Plugin | rails-ai Plugin |
|--------|-------------------|-----------------|
| Bootstrap skill | `using-superpowers/SKILL.md` | `using-rails-ai/SKILL.md` |
| Hook | `experimental.chat.system.transform` | `experimental.chat.system.transform` |
| Skills directory | `~/.config/opencode/skills/superpowers/` | `~/.config/opencode/skills/rails-ai/` |
| Purpose | Process awareness | Rails domain awareness |

Both plugins can run simultaneously — they each inject their own context into the system prompt.
