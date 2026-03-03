# Iron Horse Workspace - Product Requirements Document

> Living document. Last updated: 2026-03-03

## Vision

An opencode workspace purpose-built for Ruby on Rails development. It layers Rails-specific domain knowledge (skills + plugin) on top of [Superpowers](https://github.com/obra/superpowers)' process capabilities (planning, orchestration, debugging, verification).

## Goals

- **Rails-native intelligence**: Deep understanding of Rails conventions, patterns, and ecosystem
- **Composable skills**: Modular, reusable skills that encode Rails best practices
- **Superpowers integration**: Leverage existing process layer — planning, orchestration, TDD, debugging — without rebuilding it
- **Convention over specification**: Plans are terse because Rails conventions eliminate boilerplate

## Core Principle: Convention Over Specification

Rails lives by "convention over configuration" — our planning should too. Because both the agent and Rails share a deep understanding of standard patterns, plans should be **short, sparse, and focused on what's non-obvious**.

**What this means in practice:**

- Plans should NOT describe standard Rails patterns (RESTful routes, model validations, migration syntax)
- Plans should only specify **deviations** from convention, **project-specific decisions**, and **non-obvious requirements**
- A phase like "Create User model with name, email" needs zero implementation detail — Rails conventions handle the rest
- A phase like "Create multi-tenant scoping with Current attributes" needs detail because the approach is a design decision

**Anti-pattern (too verbose):**
```
Phase 1: Create User model
- Run `rails generate model User name:string email:string`
- Add validates :email, presence: true, uniqueness: true to model
- Add index on email column in migration
- Run rails db:migrate
```

**Correct (convention-lean):**
```
Phase 1: User model (name, email)
- email: unique, required
```

Everything else is implied by Rails convention. The agent already knows how to create a model.

## Default Stack

The workspace assumes a **default stack** unless the project's `AGENTS.md` says otherwise. This keeps project docs short — only deviations need documenting.

| Layer | Default | Notes |
|-------|---------|-------|
| Framework | Rails 8 (latest stable) | |
| Frontend | Hotwire (Stimulus + Turbo) | No React/Vue unless specified |
| Database | SQLite | Production-ready in Rails 8 with Solid adapters |
| Cache/Queue/Cable | Solid Cache, Solid Queue, Solid Cable | The "Solid stack" |
| CSS | Stock Rails (Propshaft + vanilla CSS or Tailwind) | Per project |
| Testing | Minitest (Rails default) | RSpec if project uses it |
| Auth | Built-in Rails `has_secure_password` | Devise if project uses it |

**AGENTS.md should only document deviations from this default.** For example, if a project uses PostgreSQL instead of SQLite, AGENTS.md says `Database: PostgreSQL` and nothing else about the database layer.

## Non-Goals (for now)

- Supporting non-Ruby/Rails ecosystems
- GUI or web interface
- Team collaboration features

---

## Core Concepts

### 1. Plugin: `iron-horse.js` Bootstrap

The plugin is the entry point that gives the agent Rails awareness. It uses OpenCode's `experimental.chat.system.transform` hook to inject the `using-iron-horse/SKILL.md` content into the system prompt at session start.

- **What it does**: Reads the bootstrap skill, strips YAML frontmatter, pushes content to `output.system`
- **What it does NOT do**: Auto-load all skills, define custom tools, or modify agent behavior beyond context injection
- **Installation**: `install.sh` symlinks the plugin into `~/.config/opencode/plugins/`

See [Plugins Spec](../specs/plugins.md) for implementation details.

### 2. Skills: Domain Knowledge

Skills are packaged units of Rails knowledge — markdown files that teach the agent how to perform specific tasks correctly. They encode best practices, conventions, and decision trees.

- **Format**: Directory with `SKILL.md` + optional examples/scripts (see [Skills Spec](../specs/skills.md))
- **Discovery**: Filesystem-based via OpenCode's native `skill` tool
- **Priority**: Project skills > Personal skills > Superpowers skills > iron-horse skills
- **Content**: Mix of adapted community knowledge and original content

### 3. Superpowers Integration: Process Layer

[Superpowers](https://github.com/obra/superpowers) provides the process layer — everything about *how* to work. iron-horse provides the domain layer — everything about *what* Rails convention expects.

| Superpowers Provides | iron-horse Provides |
|----------------------|-------------------|
| Planning & decomposition | Rails conventions & patterns |
| Sub-agent orchestration | Model/controller/view knowledge |
| TDD methodology | Testing patterns (Minitest, RSpec) |
| Systematic debugging | Rails-specific error patterns |
| Code review process | Hotwire / Stimulus / Turbo guidance |
| Verification before completion | Authentication & authorization patterns |

The two layers compose without hard coupling. Superpowers doesn't know it's working on Rails; iron-horse doesn't know Superpowers is orchestrating.

See [Architecture](./architecture.md) for the full two-layer design.

---

## User Workflows

### Big Feature (Superpowers-Orchestrated)

```
User: "Add a multi-tenant system with subdomain routing"

1. Superpowers' writing-plans skill decomposes into phases:
   - Phase 1: Tenant model + migration
   - Phase 2: Subdomain routing middleware
   - Phase 3: Scoping queries to current tenant
   - Phase 4: Tests
2. Superpowers' subagent-driven-development executes each phase
3. Each phase agent uses iron-horse skills for Rails-specific guidance
4. Superpowers' verification-before-completion validates the result
```

### Small Task (Direct Execution)

```
User: "Add a cached_full_name method to the User model"

1. Agent reads User model
2. Adds method with memoization
3. Adds corresponding test
4. Done
```

### Debugging (Superpowers Process + iron-horse Domain)

```
User: "Why is this N+1 happening in the orders index?"

1. Superpowers' systematic-debugging skill structures the investigation
2. Agent uses Rails knowledge to identify eager loading patterns
3. Traces the query chain, applies fix (includes/preload)
4. Superpowers' verification-before-completion confirms fix works
```

---

## Quality Bar

- Every generated migration must be reversible
- Every model change must include tests
- Generated code must pass Rubocop (or project linter)
- No raw SQL unless explicitly requested
- Follow project conventions (detected from existing code)

---

## Resolved Questions

These questions from the original design have been resolved by adopting Superpowers:

| Question | Resolution |
|----------|------------|
| How should the orchestrator handle failures mid-plan? | Superpowers' `systematic-debugging` + `verification-before-completion` skills handle this. Retry, debug, or ask user. |
| Should skills be versioned per Rails version (6, 7, 8)? | Not for v1. Skills target Rails 8. Version-specific skills can be added in v2 if needed. |
| How to detect and adapt to project-specific conventions? | The Skill Adaptation pattern in [Skills Spec](../specs/skills.md) — skills include decision trees that inspect the project. |
| Should there be a "dry run" mode for the orchestrator? | Not for v1. Superpowers' planning phase serves as a preview; execution can be paused between phases. |
| How to handle gems that change Rails behavior? | Skills include gem-aware decision trees (e.g., "if Devise is present, do X; otherwise use has_secure_password"). |
| How should the planner work? | Superpowers' `writing-plans` skill handles plan creation. |
| How to persist plan state across sessions? | Superpowers handles plan state management. |
| How to handle sub-agents? | Superpowers' `subagent-driven-development` skill manages sub-agent spawning. |
| Should routing be LLM-based or heuristic-based? | Superpowers handles task routing — we don't need a custom router. |

---

See [IDEAS.md](./IDEAS.md) for the ideas backlog.
