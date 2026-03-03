# Rails AI Workspace - Product Requirements Document

> Living document. Last updated: 2026-03-01

## Vision

An opencode workspace purpose-built for Ruby on Rails development. It combines a planner/orchestrator for large features with a highly capable executor for smaller tasks, backed by Rails-specific skills and plugins.

## Goals

- **Rails-native intelligence**: Deep understanding of Rails conventions, patterns, and ecosystem
- **Two-tier task execution**: Orchestrated planning for big features, fast execution for small tasks
- **Composable skills**: Modular, reusable skills that encode Rails best practices
- **Plugin ecosystem**: Extensible plugins for common Rails workflows

## Core Principle: Convention Over Specification

Rails lives by "convention over configuration" -- our planning should too. Because both the agent and Rails share a deep understanding of standard patterns, plans should be **short, sparse, and focused on what's non-obvious**.

**What this means in practice:**

- Plans should NOT describe standard Rails patterns (RESTful routes, model validations, migration syntax)
- Plans should only specify **deviations** from convention, **project-specific decisions**, and **non-obvious requirements**
- A phase like "Create User model with name, email" needs zero implementation detail -- Rails conventions handle the rest
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

Everything else is implied by Rails convention. The executor already knows how to create a model.

## Default Stack

The workspace assumes a **default stack** unless the project's `AGENTS.md` says otherwise. This keeps project docs short -- only deviations need documenting.

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

### 1. Orchestration Layer

Two distinct modes of operation:

| Mode | Trigger | Description |
|------|---------|-------------|
| **Planner + Orchestrator** | Multi-file features, migrations, large refactors | Breaks work into phases, delegates to executor agents, tracks progress |
| **Executor** | Single-file changes, bug fixes, quick tasks | Direct execution with ability to delegate research or deep-think subtasks |

See [Architecture](./architecture.md) for details.

### 2. Skills

Packaged knowledge about Rails patterns. Each skill is a folder with a `SKILL.md` and optional scripts/examples. See [Skills Spec](../specs/skills.md) for the format definition. Specific skills will be added as we identify concrete needs.

### 3. Plugins

Runtime extensions that add executable capabilities (as opposed to skills which are knowledge). See [Plugins Spec](../specs/plugins.md) for the format definition. Specific plugins will be added as we identify concrete needs.

---

## User Workflows

### Big Feature (Orchestrated)

```
User: "Add a multi-tenant system with subdomain routing"

1. Planner analyzes the request
2. Breaks into phases:
   - Phase 1: Tenant model + migration
   - Phase 2: Subdomain routing middleware
   - Phase 3: Scoping queries to current tenant
   - Phase 4: Tests
3. Orchestrator executes each phase via executor agents
4. Progress tracked, results validated between phases
```

### Small Task (Direct Execution)

```
User: "Add a cached_full_name method to the User model"

1. Executor reads User model
2. Adds method with memoization
3. Adds corresponding test
4. Done
```

### Small Task with Research Delegation

```
User: "Why is this N+1 happening in the orders index?"

1. Executor identifies the query pattern
2. Delegates deep analysis to a research subtask
3. Research agent traces the eager loading chain
4. Executor applies the fix (includes/preload)
```

---

## Quality Bar

- Every generated migration must be reversible
- Every model change must include tests
- Generated code must pass Rubocop (or project linter)
- No raw SQL unless explicitly requested
- Follow project conventions (detected from existing code)

---

## Open Questions

- [ ] How should the orchestrator handle failures mid-plan?
- [ ] Should skills be versioned per Rails version (6, 7, 8)?
- [ ] How to detect and adapt to project-specific conventions (RSpec vs Minitest, etc.)?
- [ ] Should there be a "dry run" mode for the orchestrator?
- [ ] How to handle gems that change Rails behavior (Devise, Pundit, etc.)?

---

See [IDEAS.md](./IDEAS.md) for the ideas backlog.
