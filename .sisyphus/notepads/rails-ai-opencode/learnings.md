# Learnings

## [2026-03-03] Session ses_34c03c74dffejTdAiFSMoAX1RE — Atlas Orchestration Start

### Project State
- Greenfield project at `/Users/pelle/dev/rails-ai`
- NOT a git repo yet — Task 1 must initialize it first
- Existing files: `docs/architecture.md`, `docs/PRD.md`, `docs/IDEAS.md`, `specs/plugins.md`, `specs/skills.md`, `skills/brainstorm/SKILL.md`, `README.md`
- `.sisyphus/evidence/` directory created

### Architecture Decisions (from plan)
- Superpowers (obra/superpowers) = process layer — we do NOT rebuild it
- Our skills = domain layer (Rails 8 knowledge)
- Plugin: single JS file with `experimental.chat.system.transform` hook
- Plugin auto-loads ONLY `using-rails-ai/SKILL.md` (NOT all skills)
- Skill discovery: OpenCode native `skill` tool (filesystem-based)
- No `opencode.json` editing — symlinks only
- Skill priority: Project > Personal > Superpowers (our overrides win)

### Canonical Skill Format (Task 3 will codify this)
- YAML frontmatter: `name:`, `description:`, `triggers:`
- Section 1: When to use
- Section 2: Principles/Core Philosophy (3-7 bullets)
- Section 3: Main content (decision trees, patterns, code examples)
- Section 4: Gotchas
- Section 5: Validation checklist
- Optional: `<related-skills>` block
- Line budget: 80-400 lines (bootstrap skill: ≤200 lines)
- NO `allowed-tools:` (ThibautBaissac convention — not ours)
- NO namespace prefixes (just `models`, not `rails-ai:models`)

### Source Repos
- zerobearing2/rails-ai: 12 skills, Claude Code format → needs conversion
- ThibautBaissac/rails_ai_agents: 25 skills, independent workspace → selective adapt ~10
- Both MIT licensed (to be verified in Task 2)

### Must NOT Build
- Router/Classifier, Planner, Orchestrator, Executor Pool (Superpowers handles this)
- Auto-loading all skills in plugin
- Skills > 400 lines
- Hard cross-skill dependencies
- Team rules > 25 rules
