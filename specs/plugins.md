# Plugins Specification

> Living document. Last updated: 2026-03-03

## What is a Plugin?

In the iron-horse context, a plugin is a JavaScript ES module that uses OpenCode's plugin hooks to inject context or modify behavior at runtime. The primary plugin is `plugin.js`, which bootstraps Rails awareness into the agent's system prompt.

## Plugin vs Skill

| Aspect | Skill | Plugin |
|--------|-------|--------|
| Nature | Knowledge (markdown) | Runtime code (JavaScript) |
| Format | `SKILL.md` + examples | `.js` ES module |
| Invocation | Loaded via `skill` tool on demand | Fires automatically via hooks |
| Output | Guides agent behavior when loaded | Injects context at session start |
| Example | "How to write a Rails migration" | "Inject Rails baseline knowledge into system prompt" |

## The iron-horse Plugin

### Distribution

Iron Horse is published to npm as `iron-horse`. The package serves two roles:

1. **Plugin** — `plugin.js` is the entry point OpenCode imports at runtime
2. **CLI** — `bunx iron-horse install` configures your `opencode.json`

### Hook: `experimental.chat.system.transform`

The plugin registers a single hook — `experimental.chat.system.transform` — which fires when a chat session starts and allows modifying the system prompt.

### What It Does

1. Locates the `using-iron-horse/SKILL.md` file in the package's `skills/` directory
2. Reads the file content
3. Strips YAML frontmatter (the `---` delimited header)
4. Pushes the remaining content to `output.system`

This gives the agent baseline Rails awareness before any explicit skill loading occurs.

### What It Does NOT Do

- **Does not auto-load all skills** — only the bootstrap skill (`using-iron-horse/SKILL.md`) is injected. Other skills are loaded on-demand via OpenCode's native `skill` tool.
- **Does not define custom tools** — the plugin only injects context; it doesn't add new tools or commands.
- **Does not modify agent behavior** beyond injecting the bootstrap content into the system prompt.

### Implementation

```javascript
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function stripFrontmatter(content) {
  return content.replace(/^---[\s\S]*?---\n/, '');
}

function getBootstrapContent() {
  const skillPath = join(__dirname, 'skills', 'using-iron-horse', 'SKILL.md');
  const raw = readFileSync(skillPath, 'utf8');
  return stripFrontmatter(raw);
}

export default function IronHorsePlugin({ client, directory }) {
  return {
    name: 'iron-horse',
    hooks: {
      'experimental.chat.system.transform': async (input, output) => {
        const content = getBootstrapContent();
        output.system.push(content);
      },
    },
  };
}
```

## Skill Discovery

Skills are served via OpenCode's `skills.urls` mechanism. The `skills/index.json` manifest in the repo lists all 23 skills with their names, descriptions, and files. OpenCode fetches and caches these at startup.

The skills URL points to the GitHub-hosted raw content:

```
https://raw.githubusercontent.com/pelletencate/iron-horse/main/skills/
```

OpenCode reads `index.json` from that URL, then downloads each skill's `SKILL.md` into its local cache.

## Installation

```sh
bunx iron-horse install
```

This adds two entries to the project's `opencode.json`:

```json
{
  "plugin": ["iron-horse"],
  "skills": {
    "urls": ["https://raw.githubusercontent.com/pelletencate/iron-horse/main/skills/"]
  }
}
```

- `plugin` — tells OpenCode to install `iron-horse` from npm and load its plugin hooks
- `skills.urls` — tells OpenCode to fetch the skill catalog from GitHub and make them available via the `skill` tool

### Local Development

For development, the `.opencode/plugins/iron-horse.js` file provides the same plugin behavior but resolves skills relative to the repo root. This fires automatically when running OpenCode from the iron-horse repo directory.

## Relationship to Process Layer

Iron Horse provides **domain** skills only. The process layer (planning, TDD, debugging, orchestration) comes from your agent harness. Iron Horse skills compose with any process layer — there is no hard coupling.
