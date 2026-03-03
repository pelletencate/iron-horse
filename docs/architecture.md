# Architecture: Two-Layer Design

> Living document. Last updated: 2026-03-03

## Overview

rails-ai uses a two-layer architecture that separates **process** from **domain**:

```
┌─────────────────────────────────────────────┐
│                   User                      │
│              (opencode CLI)                 │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│           Superpowers Layer                 │
│          (process skills)                   │
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
│          rails-ai Domain Layer              │
│          (domain skills)                    │
│                                             │
│  - Rails 8 conventions & patterns           │
│  - Model / controller / view knowledge      │
│  - Testing patterns (Minitest, RSpec)        │
│  - Hotwire / Stimulus / Turbo               │
│  - Authentication & authorization           │
│  - Plugin bootstrap (rails-ai.js)           │
└─────────────────────────────────────────────┘
```

The key insight: **Superpowers already solves orchestration, planning, debugging, and verification.** We do not rebuild any of that. rails-ai focuses purely on encoding Rails domain knowledge as skills.

---

## Superpowers Layer (Process)

[Superpowers](https://github.com/obra/superpowers) provides process-level capabilities that are framework-agnostic. These include:

| Capability | Superpowers Skill | What It Does |
|------------|-------------------|--------------|
| **Planning** | `writing-plans` | Decomposes large features into phased plans |
| **Orchestration** | `subagent-driven-development` | Spawns focused sub-agents for plan phases |
| **Brainstorming** | `brainstorming` | Agent-driven discovery and requirements gathering |
| **TDD** | `tdd` | Test-driven development methodology |
| **Debugging** | `systematic-debugging` | Structured approach to finding and fixing bugs |
| **Code Review** | `code-review` | Review process with verification |
| **Verification** | `verification-before-completion` | Ensures work is actually complete before declaring done |

**We do NOT rebuild any of this.** Superpowers handles:
- Deciding when to plan vs. execute directly
- Breaking work into phases
- Spawning sub-agents for phases
- Tracking plan state across execution
- Failure handling (retry, debug, ask user)
- Verifying completeness

---

## rails-ai Domain Layer

rails-ai adds **Rails-specific domain knowledge** as skills that compose with Superpowers' process skills. When Superpowers plans a feature, it uses rails-ai skills to understand *how* Rails does things. When it debugs, it uses rails-ai skills to understand Rails-specific error patterns.

### What rails-ai Provides

1. **Skills** — Markdown-based knowledge packages (see [Skills Spec](../specs/skills.md))
   - Rails 8 conventions, patterns, and best practices
   - Adapted from community knowledge + original content
   - Loaded via OpenCode's native `skill` tool

2. **Plugin bootstrap** — `rails-ai.js` (see [Plugins Spec](../specs/plugins.md))
   - Injects `using-rails-ai/SKILL.md` into system prompt at session start
   - Gives the agent baseline Rails awareness before any explicit skill loading

3. **Installation** — `install.sh` script
   - Symlinks plugin and skills into OpenCode's config directory
   - No `opencode.json` needed

---

## Plugin Bootstrap Mechanism

The `rails-ai.js` plugin uses OpenCode's `experimental.chat.system.transform` hook to inject Rails context at session start:

```
Session starts
    │
    ▼
rails-ai.js plugin fires (system.transform hook)
    │
    ▼
Reads using-rails-ai/SKILL.md from skills directory
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

Skills are discovered via the filesystem. OpenCode's native `skill` tool finds them based on symlinked directories.

**Priority order** (highest wins):

| Priority | Location | Example |
|----------|----------|---------|
| 1. Project | `.opencode/skills/` in project root | Project-specific conventions |
| 2. Personal | `~/.config/opencode/skills/` | User preferences |
| 3. Superpowers | `~/.config/opencode/skills/superpowers/` (symlinked) | Process skills |
| 4. rails-ai | `~/.config/opencode/skills/rails-ai/` (symlinked) | Domain skills |

If a project defines a skill with the same name as a rails-ai skill, the project's version wins. This means projects can override any rails-ai advice with their own conventions.

---

## How They Compose

Superpowers process skills and rails-ai domain skills work **independently** — there is no hard coupling between them.

**Example: Adding a multi-tenant system**

```
User: "Add a multi-tenant system with subdomain routing"

1. Superpowers' writing-plans skill activates
   → Decomposes into phases (tenant model, routing, scoping, tests)
   → Plan is terse: "what" not "how" (Convention Over Specification)

2. Superpowers' subagent-driven-development spawns phase agents

3. Each phase agent uses rails-ai domain skills:
   → rails-model skill: knows about Current attributes pattern
   → rails-testing skill: knows Minitest conventions
   → Agent's baseline Rails knowledge (from bootstrap plugin)

4. Superpowers' verification-before-completion checks work
   → Tests pass, code quality verified

5. Done
```

Neither layer knows about the other's internals. Superpowers doesn't know it's working on Rails; rails-ai doesn't know Superpowers is orchestrating.

---

## Convention-Lean Planning

Plans must be **minimal**. Rails convention eliminates the need to spell out standard patterns. Whether written by a human or by Superpowers' `writing-plans` skill, plans should:

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

Is there a using-rails-ai/ directory in the project?
├── Yes → Project has custom rails-ai configuration
└── No  → Use standard rails-ai skills

Does the task need planning?
├── Yes → Superpowers' writing-plans + subagent-driven-development handle it
└── No  → Agent executes directly, using rails-ai skills as needed
```

---

## Default Stack & AGENTS.md

All agents assume a **default stack** (see [PRD — Default Stack](./PRD.md#default-stack)). When working with a target Rails project:

- The agent reads the project's `AGENTS.md` for deviations from the default
- If no `AGENTS.md` exists, all defaults apply
- `AGENTS.md` should be minimal — only listing what's different

This means the agent doesn't need to be told "use Minitest" or "use Hotwire" — those are assumed. Only deviations like `Database: PostgreSQL` or `Testing: RSpec` need to be stated.
