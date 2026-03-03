# Ideas

> Dump ideas here. They'll be organized, discussed, and eventually promoted into specs/docs or discarded.

## Accepted (incorporated into docs)

- [x] **Convention Over Specification** -- Plans should be terse because Rails conventions eliminate boilerplate. The planner says *what* and *why*, never *how*. Executor already knows Rails. *(Added to PRD + architecture.md)*
- [x] **Default Stack in AGENTS.md** -- Define a sensible default stack (Rails 8, Hotwire, Solid stack, SQLite) so AGENTS.md only documents deviations. *(Added to AGENTS.md + PRD)*

## Under Consideration

### Planning & Orchestration

- [ ] Dry-run mode for the orchestrator -- preview plan without executing
- [ ] How to handle failures mid-plan (retry, rollback, ask user?)
- [ ] Long-running plans that span multiple sessions -- persist plan state?Then 
- [ ] Router classification: LLM-based vs heuristic-based?

### Skills & Plugins

- [ ] Skills versioned per Rails version (6, 7, 8)?
- [ ] Skills composability (e.g., `rails-model` + `rails-testing` = "create model with tests")
- [ ] Detect and adapt to gems that change Rails behavior (Devise, Pundit, etc.)
- [ ] Plugin registry -- installable from a central source?
- [ ] Standard output format for plugins (JSON schema?)

### Codebase Intelligence

- [ ] Auto-detect Rails version and adapt skill behavior
- [ ] Detect project conventions (RSpec vs Minitest, service objects, etc.) from existing code
- [ ] "Explain this codebase" mode for onboarding
- [ ] Dependency graph of models/services
- [ ] Schema visualization from migration history

### Developer Workflow

- [ ] Integration with `rails console` for live inspection
- [ ] Smart test selection: only run tests affected by changes
- [ ] Automatic Brakeman/security scan after changes
- [ ] Git-aware: understand branch context, PR scope

## Raw / Unsorted

_New ideas go here before being categorized._

- [ ] **AGENTS.md as deviation-only config** -- In target Rails projects, the AGENTS.md file should be minimal. The default stack is assumed; AGENTS.md only lists what's different. This keeps project-level config short and readable. Example: if the project uses PostgreSQL, AGENTS.md says `Database: PostgreSQL` -- nothing more about the database.
- [ ] **Brainstorm command** -- A skill (or command) that takes the lead in the conversation and asks the user questions to help identify what to build next. Agent-driven discovery: starts from the problem/user need, progressively narrows scope, and produces a feature brief the Planner can act on. Should constrain to ~8 questions max, summarize understanding along the way, and output a structured brief with scope, non-goals, key decisions, and complexity estimate.

