# Plugins Specification

> Living document. Last updated: 2026-03-03

## What is a Plugin?

In the iron-horse context, a plugin is a JavaScript ES module that uses OpenCode's plugin hooks to inject context or modify behavior at runtime. The primary plugin is `iron-horse.js`, which bootstraps Rails awareness into the agent's system prompt.

## Plugin vs Skill

| Aspect | Skill | Plugin |
|--------|-------|--------|
| Nature | Knowledge (markdown) | Runtime code (JavaScript) |
| Format | `SKILL.md` + examples | `.js` ES module |
| Invocation | Loaded via `skill` tool on demand | Fires automatically via hooks |
| Output | Guides agent behavior when loaded | Injects context at session start |
| Example | "How to write a Rails migration" | "Inject Rails baseline knowledge into system prompt" |

## The iron-horse Plugin

### File Location

```
.opencode/plugins/iron-horse.js
```

Installed via symlink to `~/.config/opencode/plugins/iron-horse.js`.

### Hook: `experimental.chat.system.transform`

The plugin registers a single hook — `experimental.chat.system.transform` — which fires when a chat session starts and allows modifying the system prompt.

### What It Does

1. Locates the `using-iron-horse/SKILL.md` file in the skills directory
2. Reads the file content
3. Strips YAML frontmatter (the `---` delimited header)
4. Pushes the remaining content to `output.system`

This gives the agent baseline Rails awareness before any explicit skill loading occurs.

### What It Does NOT Do

- **Does not auto-load all skills** — only the bootstrap skill (`using-iron-horse/SKILL.md`) is injected. Other skills are loaded on-demand via OpenCode's native `skill` tool.
- **Does not define custom tools** — the plugin only injects context; it doesn't add new tools or commands.
- **Does not modify agent behavior** beyond injecting the bootstrap content into the system prompt.

### Implementation Pattern

The plugin follows the same pattern as the [Superpowers plugin](https://github.com/obra/superpowers/blob/main/.opencode/plugins/superpowers.js):

```javascript
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const IronHorsePlugin = async ({ client, directory }) => {
  // Locate using-iron-horse/SKILL.md
  // Read and strip frontmatter
  // Return hook registration

  return {
    name: "iron-horse",
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
└── iron-horse.js      → symlink to iron-horse repo
```

Plugins are JavaScript ES modules that export an async factory function.

## Installation

The `install.sh` script handles plugin installation:

1. Symlinks `iron-horse.js` into `~/.config/opencode/plugins/`
2. Symlinks the `skills/` directory into `~/.config/opencode/skills/iron-horse/`
3. No `opencode.json` configuration file is needed

```bash
# What install.sh does:
mkdir -p ~/.config/opencode/plugins
ln -s /path/to/iron-horse/.opencode/plugins/iron-horse.js ~/.config/opencode/plugins/iron-horse.js

mkdir -p ~/.config/opencode/skills
ln -s /path/to/iron-horse/skills ~/.config/opencode/skills/iron-horse
```

## Relationship to Superpowers Plugin

iron-horse's plugin follows the same architecture as Superpowers' plugin:

| Aspect | Superpowers Plugin | iron-horse Plugin |
|--------|-------------------|-----------------|
| Bootstrap skill | `using-superpowers/SKILL.md` | `using-iron-horse/SKILL.md` |
| Hook | `experimental.chat.system.transform` | `experimental.chat.system.transform` |
| Skills directory | `~/.config/opencode/skills/superpowers/` | `~/.config/opencode/skills/iron-horse/` |
| Purpose | Process awareness | Rails domain awareness |

Both plugins can run simultaneously — they each inject their own context into the system prompt.
