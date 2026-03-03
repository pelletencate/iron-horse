# Architecture: Orchestration Layer

> Living document. Last updated: 2026-03-01

## Overview

The system has a two-tier execution model designed to match the shape of the work:

```
┌─────────────────────────────────────────────┐
│                   User                      │
│              (opencode CLI)                 │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│              Router / Classifier            │
│   Decides: big feature or small task?       │
└────────┬────────────────────────┬───────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌─────────────────────┐
│    Planner +    │    │     Executor        │
│  Orchestrator   │    │  (direct action)    │
│                 │    │                     │
│ - Decompose     │    │ - Read/write code   │
│ - Phase plan    │    │ - Run tests         │
│ - Delegate      │    │ - Apply skills      │
│ - Track progress│    │ - Delegate research │
│ - Validate      │    │   or deep-think     │
└────────┬────────┘    └─────────────────────┘
         │
         ▼
┌─────────────────┐
│  Executor Pool  │
│  (sub-agents)   │
│                 │
│ One per phase/  │
│ task in the plan│
└─────────────────┘
```

---

## Tier 1: Planner + Orchestrator

For multi-step features that span models, controllers, views, migrations, tests, etc.

### Planner Responsibilities

1. **Analyze the request** - Understand scope, affected layers, dependencies
2. **Survey the codebase** - Read relevant files, schema, routes, existing patterns
3. **Decompose into phases** - Ordered steps with clear inputs/outputs
4. **Identify risks** - Breaking changes, data migrations, dependency conflicts

### Convention-Lean Planning

Plans must be **minimal**. Rails convention eliminates the need to spell out standard patterns. The planner should:

- **Omit anything the executor already knows** (CRUD, RESTful routing, migration syntax, model boilerplate)
- **Only specify deviations** from convention and project-specific design decisions
- **Trust the executor's Rails knowledge** -- each phase is a "what", not a "how"
- **Treat phases as intentions** with constraints, not step-by-step instructions

A plan phase is essentially: *"Do X, but be aware of Y."*

### Plan Structure

Plans are intentionally terse. The executor fills in the Rails knowledge.

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
      type: research_then_execute
      depends_on: [1, 2]
      notes: "Use Current attributes pattern. Add tenant_id FK to all tenant-scoped models. Concern for default_scope vs explicit scoping -- research tradeoffs."

    - id: 4
      name: "Tests"
      depends_on: [1, 2, 3]
      notes: "Ensure tenant isolation. Test subdomain resolution. Test scoping doesn't leak."
```

Notice: no mention of `rails generate`, `validates`, `add_index`, migration syntax, or any other Rails boilerplate. The executor knows all of that.

### Orchestrator Responsibilities

1. **Execute phases in order** - Respect `depends_on` relationships
2. **Spawn executor agents** - One per phase/task
3. **Pass context forward** - Each phase gets results from its dependencies
4. **Validate between phases** - Run validation step before proceeding
5. **Handle failures** - Retry, rollback, or ask user for guidance
6. **Report progress** - Stream status updates to user

### Failure Handling

| Scenario | Strategy |
|----------|----------|
| Validation fails | Retry phase with error context (max 2 retries) |
| Phase produces unexpected output | Pause and ask user |
| Dependency conflict between phases | Re-plan from the conflicting phase |
| Test failures | Analyze, fix, re-run (up to 3 attempts) |

---

## Tier 2: Executor

The workhorse. Handles direct code changes for small tasks, or acts as the hands of the orchestrator for individual phases.

### Capabilities

- Read and write files
- Run shell commands (tests, migrations, linters)
- Apply skills (load and follow skill instructions)
- Use plugins (invoke plugin capabilities)
- **Delegate to sub-agents** for specific needs:

### Executor Delegation

The executor is not just a dumb code writer. It can spin up focused sub-agents:

| Sub-agent Type | Purpose | Example |
|----------------|---------|---------|
| **Research** | Deep codebase exploration, gem docs, pattern analysis | "How does Devise integrate with this app?" |
| **Deep Think** | Complex problem solving, architecture decisions | "What's the best way to handle polymorphic tenant ownership?" |
| **Verify** | Run tests, check linting, validate schema | "Do all specs pass after this change?" |

```
┌──────────────────────────────┐
│          Executor            │
│                              │
│  "Add caching to User model" │
│                              │
│  1. Read user.rb             │
│  2. Hmm, complex caching... │
│     ┌──────────────────┐     │
│     │ Research Agent    │     │
│     │ "What caching     │     │
│     │  strategy does    │     │
│     │  this app use?"   │     │
│     └──────┬───────────┘     │
│            │ "Redis + Rails  │
│            │  fragment cache" │
│  3. Apply caching pattern    │
│  4. Write test               │
│     ┌──────────────────┐     │
│     │ Verify Agent      │     │
│     │ "Run affected     │     │
│     │  specs"           │     │
│     └──────┬───────────���     │
│            │ "All green"     │
│  5. Done                     │
└──────────────────────────────┘
```

---

## Router / Classifier

Decides which tier handles a request. Heuristics:

### Routes to Orchestrator (Planner)
- Request mentions multiple models/tables
- Involves new migrations + controllers + views
- Keywords: "feature", "system", "module", "workflow"
- Estimated file changes > 5
- Cross-cutting concerns (auth, multi-tenancy, permissions)

### Routes to Executor (Direct)
- Single model/file changes
- Bug fixes with clear scope
- Adding methods, scopes, validations
- Writing or fixing specific tests
- Refactoring within a single file/class

### Ambiguous Cases
- Ask the user: "This looks like it could be a quick change or a larger feature. Should I plan it out or jump straight in?"

---

## Context Management

### What context is passed to each agent

| Agent | Context |
|-------|---------|
| Planner | Full user request, project structure, schema, routes, relevant models |
| Orchestrator | Plan document, phase results so far |
| Executor (standalone) | User request, relevant files, detected conventions |
| Executor (in plan) | Phase spec, dependency outputs, relevant files |
| Research sub-agent | Specific question, relevant file paths, codebase access |
| Deep Think sub-agent | Problem statement, constraints, options discovered |

---

## Default Stack & AGENTS.md

All agents assume a **default stack** (see [PRD - Default Stack](./PRD.md#default-stack)). When working with a target Rails project:

- The agent reads the project's `AGENTS.md` for deviations from the default
- If no `AGENTS.md` exists, all defaults apply
- `AGENTS.md` should be minimal -- only listing what's different

This means the planner and executor don't need to be told "use Minitest" or "use Hotwire" -- those are assumed. Only deviations like `Database: PostgreSQL` or `Testing: RSpec` need to be stated.

---

## Open Design Questions

- [ ] Should the planner be a separate model call or same model with different system prompt?
- [ ] How to persist plan state across opencode sessions?
- [ ] Should we use opencode's native Task tool for sub-agents or build our own?
- [ ] How to handle long-running plans that span multiple user interactions?
- [ ] Should the router classification be LLM-based or heuristic-based?
