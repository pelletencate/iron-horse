# Ideas

> Dump ideas here. They'll be organized, discussed, and eventually promoted into specs/docs or discarded.

## Accepted (incorporated into docs)

- [x] **Convention Over Specification** — Plans should be terse because Rails conventions eliminate boilerplate. The planner says *what* and *why*, never *how*. Executor already knows Rails. *(Added to PRD + architecture.md)*
- [x] **Default Stack in AGENTS.md** — Define a sensible default stack (Rails 8, Hotwire, Solid stack, SQLite) so AGENTS.md only documents deviations. *(Added to AGENTS.md + PRD)*
- [x] **Brainstorm command / skill** — Superseded by Superpowers' `brainstorming` skill, which provides agent-driven discovery with structured output.
- [x] **Two-layer architecture** — Superpowers handles process (planning, orchestration, debugging, verification); rails-ai handles domain (Rails knowledge, skills, plugin bootstrap). *(Added to architecture.md)*

## Under Consideration

### Skills & Knowledge

- [ ] Skills composability (e.g., `rails-model` + `rails-testing` = "create model with tests")
- [ ] Detect and adapt to gems that change Rails behavior (Devise, Pundit, etc.)
- [ ] Auto-detect Rails version and adapt skill behavior

### Codebase Intelligence

- [ ] "Explain this codebase" mode for onboarding
- [ ] Dependency graph of models/services
- [ ] Schema visualization from migration history

### Developer Workflow

- [ ] Integration with `rails console` for live inspection
- [ ] Smart test selection: only run tests affected by changes
- [ ] Automatic Brakeman/security scan after changes
- [ ] Git-aware: understand branch context, PR scope

---

## v2 Ideas

### Feature Recipes

- [ ] **Feature recipes directory (`recipes/`)** — Pre-built plans for common Rails features (authentication, multi-tenancy, API versioning, file uploads, etc.). A recipe is a plan template that Superpowers' `writing-plans` skill can use as a starting point. Saves time on well-understood patterns.

### Living Documentation

- [ ] **Post-commit audit hook runtime** — An agent that watches `git diff` after commits and automatically updates project knowledge files (`SCHEMA.md`, `BUSINESS_RULES.md`). Keeps documentation in sync with code changes without manual effort.

- [ ] **Living documentation auto-update system** — Project files like `SCHEMA.md` and `BUSINESS_RULES.md` that grow with the project. Agent maintains them as it works — adding new models to schema docs, documenting business rules as they're implemented. Documents become increasingly valuable over time.

### Skill Adaptation & Detection

- [ ] **Style-aware skill adaptation** — Detect whether a project follows 37signals/DHH style (concerns, Current attributes, callbacks) vs. Standard Ruby style (service objects, form objects, dry-rb). Adapt skill advice accordingly. Could inspect existing code patterns, Gemfile, or AGENTS.md hints.

### New Domain Skills

- [ ] **Deployment patterns skill** — Kamal 2 deployment configuration, Docker multi-stage builds, CI/CD pipeline setup (GitHub Actions, etc.), production environment configuration. Rails 8 makes deployment simpler — encode that knowledge.

- [ ] **Payments/Stripe skill** — Stripe integration patterns for Rails: checkout sessions, webhooks, subscription management, Pay gem usage. Common enough to warrant dedicated knowledge.

- [ ] **SEO/analytics skill** — Meta tags (via meta-tags gem), sitemap generation, Open Graph tags, Google Analytics / Plausible integration, structured data markup.

- [ ] **ViewComponent skill** — Component-based view architecture with ViewComponent gem. When to use components vs. partials, testing patterns, slots, previews.

- [ ] **Pundit/authorization skill** — Authorization patterns with Pundit: policies, scopes, controller integration, testing authorization rules. Covers both Pundit and Action Policy.

### Quality & Evaluation

- [ ] **LLM eval testing for skills** — Automated quality evaluation of skill content. Feed a skill + a task to the agent, grade the output against known-good implementations. Regression testing for skill quality — ensure skill edits don't degrade output.

## Raw / Unsorted

_New ideas go here before being categorized._

- [ ] **AGENTS.md as deviation-only config** — In target Rails projects, the AGENTS.md file should be minimal. The default stack is assumed; AGENTS.md only lists what's different. This keeps project-level config short and readable. Example: if the project uses PostgreSQL, AGENTS.md says `Database: PostgreSQL` — nothing more about the database.
