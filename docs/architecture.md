# Architecture: Two-Layer Design

> Living document. Last updated: 2026-03-03

## Overview

Iron Horse uses a two-layer architecture that separates **process** from **domain**:

```
┌─────────────────────────────────────────────┐
│                   User                      │
│              (opencode CLI)                 │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│            Process Layer                    │
│   (oh-my-opencode, Superpowers, or other)   │
│                                             │
│  - Brainstorming & discovery                │
│  - Plan writing & execution                 │
│  - TDD methodology                          │
│  - Systematic debugging                     │
│  - Code review                              │
│  - Subagent orchestration                   │
│  - Verification before completion           │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│          Iron Horse Domain Layer            │
│          (domain skills)                    │
│                                             │
│  - Rails 8 conventions & patterns           │
│  - Model / controller / view knowledge      │
│  - Testing patterns (Minitest, RSpec)        │
│  - Hotwire / Stimulus / Turbo               │
│  - Authentication & authorization           │
│  - Plugin bootstrap (iron-horse.js)         │
└─────────────────────────────────────────────┘
```

The key insight: **the process layer handles orchestration, planning, debugging, and verification.** We do not rebuild any of that. Iron Horse focuses purely on encoding Rails domain knowledge as skills.

---

## Process Layer

The process layer is provided by your agent harness. Iron Horse is compatible with oh-my-opencode (OmO) and [Superpowers](https://github.com/obra/superpowers) for vanilla OpenCode. Either one covers these framework-agnostic capabilities:

| Capability | Superpowers Skill (vanilla OpenCode) | What It Does |
|------------|--------------------------------------|--------------| 
| **Planning** | `writing-plans` | Decomposes large features into phased plans |
| **Orchestration** | `subagent-driven-development` | Spawns focused sub-agents for plan phases |
| **Brainstorming** | `brainstorming` | Agent-driven discovery and requirements gathering |
| **TDD** | `tdd` | Test-driven development methodology |
| **Debugging** | `systematic-debugging` | Structured approach to finding and fixing bugs |
| **Code Review** | `code-review` | Review process with verification |
| **Verification** | `verification-before-completion` | Ensures work is actually complete before declaring done |

OmO users get equivalent capabilities built into the harness. **We do NOT rebuild any of this.** The process layer handles:
- Deciding when to plan vs. execute directly
- Breaking work into phases
- Spawning sub-agents for phases
- Tracking plan state across execution
- Failure handling (retry, debug, ask user)
- Verifying completeness

---

## Iron Horse Domain Layer

Iron Horse adds **Rails-specific domain knowledge** as skills that compose with your process layer. When the process layer plans a feature, it uses Iron Horse skills to understand *how* Rails does things. When it debugs, it uses Iron Horse skills to understand Rails-specific error patterns.

### What Iron Horse Provides

1. **Skills** — Markdown-based knowledge packages (see [Skills Spec](../specs/skills.md))
   - Rails 8 conventions, patterns, and best practices
   - Adapted from community knowledge + original content
   - Loaded via OpenCode's native `skill` tool

2. **Plugin bootstrap** — `iron-horse.js` (see [Plugins Spec](../specs/plugins.md))
   - Injects `using-iron-horse/SKILL.md` into system prompt at session start
   - Gives the agent baseline Rails awareness before any explicit skill loading

3. **Installation** — `install.sh` script
   - For oh-my-opencode: registers in `~/.claude/plugins/installed_plugins.json` (no symlinks needed for skills)
   - For vanilla OpenCode: symlinks plugin and skills into OpenCode's config directory, installs Superpowers
   - No `opencode.json` needed

---

## Plugin Bootstrap Mechanism

The `iron-horse.js` plugin uses OpenCode's `experimental.chat.system.transform` hook to inject Rails context at session start:

```
Session starts
    │
    ▼
iron-horse.js plugin fires (system.transform hook)
    │
    ▼
Reads using-iron-horse/SKILL.md from skills directory
    │
    ▼
Strips YAML frontmatter
    │
    ▼
Pushes content to output.system
    │
    ▼
Agent now has Rails baseline knowledge
```

The plugin does **not**:
- Auto-load all skills (that's what the `skill` tool is for)
- Define custom tools
- Modify agent behavior beyond injecting context

---

## Skill Discovery & Priority

Skills are discovered via the filesystem. OpenCode's native `skill` tool finds them based on symlinked directories. For oh-my-opencode users, skills are auto-discovered from the plugin's `installPath` registered in `installed_plugins.json` — no symlinks needed.

**Priority order** (highest wins):

| Priority | Location | Example |
|----------|----------|---------| 
| 1. Project | `.opencode/skills/` in project root | Project-specific conventions |
| 2. Personal | `~/.config/opencode/skills/` | User preferences |
| 3. Process layer | `~/.config/opencode/skills/superpowers/` (vanilla OpenCode) or OmO built-ins | Process skills |
| 4. Iron Horse | `~/.config/opencode/skills/iron-horse/` (symlinked) or OmO auto-discovered | Domain skills |

If a project defines a skill with the same name as an Iron Horse skill, the project's version wins. This means projects can override any Iron Horse advice with their own conventions.

---

## How They Compose

Your process layer and Iron Horse domain skills work **independently** — there is no hard coupling between them.

**Example: Adding a multi-tenant system**

```
User: "Add a multi-tenant system with subdomain routing"

1. The process layer's planning capability activates
   → Decomposes into phases (tenant model, routing, scoping, tests)
   → Plan is terse: "what" not "how" (Convention Over Specification)

2. The process layer spawns phase agents

3. Each phase agent uses Iron Horse domain skills:
   → rails-model skill: knows about Current attributes pattern
   → rails-testing skill: knows Minitest conventions
   → Agent's baseline Rails knowledge (from bootstrap plugin)

4. The process layer's verification step checks work
   → Tests pass, code quality verified

5. Done
```

Neither layer knows about the other's internals. The process layer doesn't know it's working on Rails; Iron Horse doesn't know what harness is orchestrating.

---

## Convention-Lean Planning

Plans must be **minimal**. Rails convention eliminates the need to spell out standard patterns. Whether written by a human or by your process layer's planning capability, plans should:

- **Omit anything the agent already knows** (CRUD, RESTful routing, migration syntax, model boilerplate)
- **Only specify deviations** from convention and project-specific design decisions
- **Trust the agent's Rails knowledge** — each phase is a "what", not a "how"
- **Treat phases as intentions** with constraints, not step-by-step instructions

A plan phase is essentially: *"Do X, but be aware of Y."*

### Example: Convention-Lean Plan

```yaml
plan:
  title: "Add multi-tenant system"
  context: "App uses Pundit for authz, RSpec, no existing tenant concept"
  phases:
    - id: 1
      name: "Tenant model"
      notes: "name:string, slug:string (for subdomain). slug unique index."

    - id: 2
      name: "Subdomain routing"
      depends_on: [1]
      notes: "Rack middleware to resolve tenant from subdomain -> Current.tenant"

    - id: 3
      name: "Query scoping"
      depends_on: [1, 2]
      notes: "Use Current attributes pattern. Add tenant_id FK to all tenant-scoped models. Concern for default_scope vs explicit scoping -- research tradeoffs."

    - id: 4
      name: "Tests"
      depends_on: [1, 2, 3]
      notes: "Ensure tenant isolation. Test subdomain resolution. Test scoping doesn't leak."
```

Notice: no mention of `rails generate`, `validates`, `add_index`, migration syntax, or any other Rails boilerplate. The agent knows all of that.

---

## Architecture Decision Tree

When working on a target Rails project, the agent follows this decision tree:

```
Is there a project AGENTS.md?
├── Yes → Read it for deviations from default stack
│         (only deviations are documented)
└── No  → Use all defaults (Rails 8, Hotwire, SQLite, Minitest, etc.)

Is there a using-iron-horse/ directory in the project?
├── Yes → Project has custom Iron Horse configuration
└── No  → Use standard Iron Horse skills

Does the task need planning?
├── Yes → Your process layer's planning + orchestration capabilities handle it
└── No  → Agent executes directly, using Iron Horse skills as needed
```

---

## Default Stack & AGENTS.md

All agents assume a **default stack** (see [PRD — Default Stack](./PRD.md#default-stack)). When working with a target Rails project:

- The agent reads the project's `AGENTS.md` for deviations from the default
- If no `AGENTS.md` exists, all defaults apply
- `AGENTS.md` should be minimal — only listing what's different

This means the agent doesn't need to be told "use Minitest" or "use Hotwire" — those are assumed. Only deviations like `Database: PostgreSQL` or `Testing: RSpec` need to be stated.
