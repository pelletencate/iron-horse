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

## [2026-03-03] Task 4 — Reconcile Design Docs

### What Changed
- `docs/architecture.md`: Full rewrite — two-layer architecture (Superpowers process + rails-ai domain). Removed all Router/Classifier/Executor Pool/Planner references. Added sections: Plugin Bootstrap Mechanism, Skill Discovery & Priority, How They Compose, Architecture Decision Tree.
- `docs/PRD.md`: Updated Core Concepts to describe Plugin + Skills + Superpowers integration. Resolved all 9 open questions in a "Resolved Questions" table. Removed custom orchestration references.
- `specs/plugins.md`: Full rewrite — describes actual JS plugin with `experimental.chat.system.transform` hook. Removed shell script system. Added implementation pattern, discovery, installation, and Superpowers comparison.
- `docs/IDEAS.md`: Added 10 v2 ideas (feature recipes, post-commit audit, living docs, style-aware adaptation, deployment skill, Payments/Stripe skill, SEO skill, ViewComponent skill, Pundit skill, LLM eval testing). Marked brainstorm command as superseded by Superpowers.

### Key Patterns
- Evidence files confirm zero "Router / Classifier" or "Executor Pool" references remain
- Evidence files confirm zero `- [ ]` open questions in architecture.md and PRD.md
- Superpowers referenced 15 times in architecture.md, 21 times in PRD.md
- The two-layer metaphor (process vs domain) is clean and easily understood
- Resolved Questions table format works well — shows the question AND the concrete answer

## [2026-03-03] Task 5: Pilot Adaptation Learnings

### Adaptation Process
- Source (zerobearing2/rails-ai): 1,157 lines → adapted to 348 lines (70% reduction)
- Biggest effort: restructuring custom XML tags (`<pattern>`, `<antipattern>`, `<when-to-use>`) into flat markdown canonical sections
- Content cutting was secondary to structural transformation

### What Works for Cutting (apply to Tasks 9-29)
1. **`<why>` blocks** — cut first, easiest 15-20% savings with minimal value loss
2. **`<testing>` sections** — fold key guidance into Validation checklist
3. **`<resources>` blocks** — external links don't add actionable value
4. **`<benefits>` / `<team-rules-enforcement>`** — project-specific or obvious, cut entirely
5. **Antipattern bad/good pairs** — condense to Gotchas bullets ("don't X, do Y instead")
6. **Keep one representative example per pattern category** — e.g., one custom validator, one query object

### Structural Mapping (reusable recipe)
- `<when-to-use>` → `## When to use this skill` (markdown bullets)
- `<standards>` → fold into `## Principles` (6-7 opinionated rules)
- `<pattern>` wrappers → flat `##`/`###` sections with code blocks
- `<antipatterns>` → `## Gotchas` (concise bullets)
- `<verification-checklist>` → `## Validation` (checklist format)
- `<related-skills>` → clean XML, strip `rails-ai:` prefix from skill names
- Remove: `<superpowers-integration>`, `[Category+Skill Reminder]`, `allowed-tools:`

### Target Line Range
- Aim for 340-380 lines to leave headroom for later additions without hitting 400 cap
