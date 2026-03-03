# Rails AI OpenCode: Full Build Plan

## TL;DR

> **Quick Summary**: Build an opencode plugin + skill pack for Rails development that layers 20+ Rails domain skills on top of Superpowers (obra/superpowers) as the process layer. Adapt skills from zerobearing2/rails-ai (12 skills) and ThibautBaissac/rails_ai_agents (10+ skills), write infrastructure (plugin, install script, team rules), and ship a complete Rails AI development toolkit.
> 
> **Deliverables**:
> - `rails-ai.js` opencode plugin (session bootstrap)
> - `install.sh` (installs Superpowers + rails-ai via symlinks)
> - `using-rails-ai` bootstrap skill
> - 20+ Rails domain skills (adapted + original)
> - `writing-plans` Superpowers override skill (convention-lean)
> - `frame-problem` XY-detection skill
> - `TEAM_RULES.md` (Rails conventions)
> - Reconciled project documentation
> - README.md with installation and usage guide
> 
> **Estimated Effort**: XL (20+ tasks across 7 waves)
> **Parallel Execution**: YES — 7 waves, up to 8 tasks per wave
> **Critical Path**: Task 1 → Task 3 → Task 5 → Task 7 → Task 8 → Wave 3+ skills → Final verification

---

## Context

### Original Request
Build "literally everything" found during extensive research into the Rails AI ecosystem. The user wants a complete, shippable opencode plugin + skill pack for Rails development.

### Interview Summary
**Key Discussions**:
- Superpowers (68.8k ⭐) provides the process layer — brainstorming, TDD, debugging methodology, code review, subagent orchestration, verification. Native opencode support. We do NOT rebuild any of this.
- zerobearing2/rails-ai has **12 domain skills** (not 6 as initially thought) — all Claude Code format, need conversion to our canonical SKILL.md format
- ThibautBaissac/rails_ai_agents has **25 skills** in a separate Claude Code workspace (does NOT use Superpowers). We selectively adapt ~10.
- One-Man-App-Studio/rails-ai-playbook contributes concepts: living documentation, feature recipes (v2), post-commit audit hooks (document only), code quality rules to embed in skills
- Our key differentiator: "convention over specification" — sparse plans for standard Rails patterns

**Research Findings**:
- OpenCode plugin discovery is filesystem-based — no `opencode.json` needed
- Plugin hook: `experimental.chat.system.transform` — injects bootstrap content into system prompt
- Plugin does NOT auto-load skills — it injects ONE bootstrap skill; others are on-demand via OpenCode's native `skill` tool
- Skill priority: Project > Personal > Superpowers (our overrides win automatically)
- Both source repos (zerobearing2, ThibautBaissac) are MIT licensed

### Metis Review
**Critical Corrections Applied**:
- zerobearing2 has 12 skills, not 6 — mailers, debugging, views, styling, project-setup, using-rails-ai also exist
- zerobearing2 is a Claude Code plugin, NOT opencode — needs format conversion, not just namespace renames
- ThibautBaissac doesn't use Superpowers — completely independent Claude Code workspace
- No opencode.json needed — install script uses symlinks only
- Plugin only bootstraps `using-rails-ai/SKILL.md` — does NOT load all skills
- Existing `docs/architecture.md` and `docs/PRD.md` describe systems Superpowers replaces — must reconcile
- `specs/plugins.md` describes shell scripts; our plugin is a JS file — spec must be reconciled
- Must verify licenses before adapting content
- Must codify canonical skill format before bulk writing
- Must pilot ONE skill adaptation before committing to full batch

---

## Work Objectives

### Core Objective
Ship a complete, installable opencode plugin + skill pack that gives developers deep Rails 8 domain intelligence layered on top of Superpowers' process workflows.

### Concrete Deliverables
- `.opencode/plugins/rails-ai.js` — session bootstrap plugin
- `install.sh` — one-command installation of Superpowers + rails-ai
- `skills/using-rails-ai/SKILL.md` — bootstrap meta-skill
- `skills/writing-plans/SKILL.md` — convention-lean planning override
- `skills/frame-problem/SKILL.md` — XY-detection pre-planning skill
- 12 adapted skills from zerobearing2/rails-ai (models, controllers, security, hotwire, testing, solid-stack, mailers, debugging, views, styling, project-setup, authentication)
- 8 adapted skills from ThibautBaissac/rails_ai_agents (migrations, active-storage, action-cable, api-versioning, i18n, form-objects, caching-strategies, architecture)
- `rules/TEAM_RULES.md` — curated Rails conventions (max 25 rules)
- Updated `docs/PRD.md`, `docs/architecture.md`, `docs/IDEAS.md`
- `README.md` with installation guide and skill catalog

### Definition of Done
- [ ] `bash install.sh` succeeds on clean machine (creates all symlinks)
- [ ] `bash install.sh && bash install.sh` is idempotent (no errors on second run)
- [ ] All skills have YAML frontmatter with `name:` and `description:`
- [ ] No skill exceeds 400 lines
- [ ] All skills are independently loadable (no hard cross-skill dependencies)
- [ ] Plugin injects bootstrap content via `experimental.chat.system.transform`
- [ ] Project has git history with meaningful commits

### Must Have
- Single-command install that sets up both Superpowers and rails-ai
- Consistent skill format across all skills (adapted and original are indistinguishable)
- Convention-lean `writing-plans` override that trusts Rails knowledge
- Every zerobearing2 skill adapted with enrichments from research
- Architecture decision tree accessible to the agent
- XY-problem detection before feature work

### Must NOT Have (Guardrails)
- **NO Router/Classifier, Planner, Orchestrator, or Executor Pool** — Superpowers handles process orchestration
- **NO auto-loading all skills in plugin** — plugin injects ONE bootstrap skill; others are on-demand
- **NO opencode.json editing in install script** — filesystem discovery only
- **NO feature recipes infrastructure** — stub README only, deferred to v2
- **NO executable post-commit audit hooks** — document the concept in team rules only
- **NO project scaffolding/generation** — skills teach patterns, they don't create apps
- **NO skills > 400 lines** — risk partial LLM context window ignoring
- **NO hard cross-skill dependencies** — every skill must work independently
- **NO team rules > 25 rules** — curate, don't concatenate
- **NO custom RuboCop cops** — out of scope for v1

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (greenfield)
- **Automated tests**: None — skill markdown files are not unit-testable
- **Framework**: N/A
- **Verification method**: Shell commands checking file existence, structure, frontmatter, line counts

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Plugin/Install**: Use Bash — run install, verify symlinks, check plugin syntax
- **Skills**: Use Bash — verify frontmatter, line counts, structural consistency
- **Documentation**: Use Bash — verify file existence, check for broken references

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 0 (Foundation — MUST complete before all else):
├── Task 1: Git init + .gitignore [quick]
├── Task 2: Verify source repo licenses [quick]
├── Task 3: Codify canonical skill format reference [quick]
└── Task 4: Reconcile/update design docs (PRD, architecture, IDEAS, specs) [unspecified-high]

Wave 1 (Infrastructure — after Wave 0):
├── Task 5: Pilot skill adaptation: models (calibrate effort) [deep]
├── Task 6: Write rails-ai.js plugin [quick]
├── Task 7: Write using-rails-ai bootstrap skill [quick]
└── Task 8: Write install.sh [quick]

Wave 2 (Core Skills Batch 1 — after Wave 1, MAX PARALLEL):
├── Task 9:  Adapt controllers skill [unspecified-high]
├── Task 10: Adapt security skill [unspecified-high]
├── Task 11: Adapt hotwire skill [unspecified-high]
├── Task 12: Adapt testing skill [unspecified-high]
├── Task 13: Adapt solid-stack skill [unspecified-high]
├── Task 14: Adapt mailers skill [unspecified-high]
└── Task 15: Adapt debugging skill [unspecified-high]

Wave 3 (Core Skills Batch 2 — after Wave 1):
├── Task 16: Adapt views skill [unspecified-high]
├── Task 17: Adapt styling skill [unspecified-high]
├── Task 18: Adapt project-setup skill [unspecified-high]
├── Task 19: Adapt authentication skill [unspecified-high]
├── Task 20: Write writing-plans override skill [deep]
└── Task 21: Write TEAM_RULES.md [unspecified-high]

Wave 4 (Expansion Skills — after Wave 1):
├── Task 22: Adapt migrations skill [unspecified-high]
├── Task 23: Adapt active-storage skill [unspecified-high]
├── Task 24: Adapt action-cable skill [unspecified-high]
├── Task 25: Adapt api-versioning skill [unspecified-high]
├── Task 26: Adapt i18n skill [unspecified-high]
├── Task 27: Adapt form-objects skill [unspecified-high]
├── Task 28: Adapt caching-strategies skill [unspecified-high]
└── Task 29: Write architecture decision tree skill [unspecified-high]

Wave 5 (Unique Skills + Enrichments — after Waves 2-4):
├── Task 30: Write frame-problem XY-detection skill [deep]
├── Task 31: Enrich models with state-as-records + .then chaining [quick]
├── Task 32: Enrich testing with phase-locked TDD [quick]
├── Task 33: Enrich security with "404 not 403" + OmniAuth patterns [quick]
├── Task 34: Enrich controllers with dependency direction + raise-on-failure [quick]
└── Task 35: Delete premature skills/brainstorm/SKILL.md [quick]

Wave 6 (Documentation + Polish — after Wave 5):
├── Task 36: Write README.md with install guide + skill catalog [writing]
├── Task 37: Update IDEAS.md with v2 backlog [quick]
└── Task 38: Create recipes/README.md stub [quick]

Wave FINAL (After ALL tasks — independent review, 4 parallel):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)

Critical Path: T1 → T3 → T5 → T6/T7/T8 → T9-T29 (parallel) → T30-T35 → T36 → F1-F4
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 8 (Waves 2-4)
```

### Dependency Matrix

- **1-4**: None — Wave 0 foundation
- **5**: 3 — needs canonical format
- **6**: 3, 5 — needs format + pilot validates approach
- **7**: 3, 5 — needs format + pilot validates approach
- **8**: 6, 7 — needs plugin + bootstrap skill to exist
- **9-15**: 3, 5 — needs format + pilot calibration
- **16-21**: 3, 5 — needs format + pilot calibration
- **22-29**: 3, 5 — needs format + pilot calibration
- **30**: 3 — needs format
- **31**: 5 — enriches models (already adapted)
- **32**: 12 — enriches testing (already adapted)
- **33**: 10 — enriches security (already adapted)
- **34**: 9 — enriches controllers (already adapted)
- **35**: None — just deletion
- **36**: All skills — needs complete inventory for catalog
- **37-38**: None
- **F1-F4**: All tasks complete

### Agent Dispatch Summary

- **Wave 0**: **4** — T1 → `quick`, T2 → `quick`, T3 → `quick`, T4 → `unspecified-high`
- **Wave 1**: **4** — T5 → `deep`, T6 → `quick`, T7 → `quick`, T8 → `quick`
- **Wave 2**: **7** — T9-T15 → `unspecified-high`
- **Wave 3**: **6** — T16-T19 → `unspecified-high`, T20 → `deep`, T21 → `unspecified-high`
- **Wave 4**: **8** — T22-T28 → `unspecified-high`, T29 → `unspecified-high`
- **Wave 5**: **6** — T30 → `deep`, T31-T34 → `quick`, T35 → `quick`
- **Wave 6**: **3** — T36 → `writing`, T37-T38 → `quick`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info + QA Scenarios.

### Wave 0: Foundation

- [ ] 1. Git init + .gitignore

  **What to do**:
  - Run `git init` in `/Users/pelle/dev/rails-ai`
  - Create `.gitignore` with entries for: `.sisyphus/evidence/`, `node_modules/`, `.DS_Store`, `*.swp`, `tmp/`
  - Stage all existing files and create initial commit

  **Must NOT do**:
  - Do not modify any existing file content
  - Do not push to any remote

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 0 (with Tasks 2, 3, 4)
  - **Blocks**: All subsequent tasks (everything needs git)
  - **Blocked By**: None

  **References**:
  - **Pattern References**: None — greenfield
  - **API/Type References**: None

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Git repo initialized
    Tool: Bash
    Preconditions: /Users/pelle/dev/rails-ai exists, no .git directory
    Steps:
      1. Run: git init
      2. Run: git status
      3. Assert: output contains "On branch main" or "On branch master"
    Expected Result: Git repository initialized with all existing files committed
    Evidence: .sisyphus/evidence/task-1-git-init.txt

  Scenario: .gitignore works
    Tool: Bash
    Preconditions: .gitignore created
    Steps:
      1. Run: mkdir -p .sisyphus/evidence && touch .sisyphus/evidence/test.txt
      2. Run: git status --porcelain .sisyphus/evidence/test.txt
      3. Assert: no output (file is ignored)
    Expected Result: Evidence directory is git-ignored
    Evidence: .sisyphus/evidence/task-1-gitignore.txt
  ```

  **Commit**: YES
  - Message: `chore: initialize git repository`
  - Files: `.gitignore`, all existing files
  - Pre-commit: None

- [ ] 2. Verify source repo licenses

  **What to do**:
  - Fetch LICENSE files from both source repos:
    - `https://raw.githubusercontent.com/zerobearing2/rails-ai/main/LICENSE`
    - `https://raw.githubusercontent.com/ThibautBaissac/rails_ai_agents/main/LICENSE`
  - Confirm both are MIT licensed
  - Create `ATTRIBUTION.md` listing both source repos, their licenses, and what was adapted
  - If either is NOT MIT, stop and report — do not proceed with adaptation

  **Must NOT do**:
  - Do not proceed with any skill adaptation if licenses are incompatible

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 0 (with Tasks 1, 3, 4)
  - **Blocks**: All adaptation tasks (9-29)
  - **Blocked By**: None

  **References**:
  - **External References**: `https://github.com/zerobearing2/rails-ai`, `https://github.com/ThibautBaissac/rails_ai_agents`

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Licenses verified as MIT
    Tool: Bash (curl)
    Preconditions: Internet access
    Steps:
      1. curl -s https://raw.githubusercontent.com/zerobearing2/rails-ai/main/LICENSE | head -5
      2. Assert: output contains "MIT License" or "Permission is hereby granted"
      3. curl -s https://raw.githubusercontent.com/ThibautBaissac/rails_ai_agents/main/LICENSE | head -5
      4. Assert: output contains "MIT License" or "Permission is hereby granted"
    Expected Result: Both repos are MIT licensed
    Evidence: .sisyphus/evidence/task-2-licenses.txt

  Scenario: ATTRIBUTION.md created
    Tool: Bash
    Steps:
      1. test -f ATTRIBUTION.md && echo "exists"
      2. grep -c "zerobearing2" ATTRIBUTION.md
      3. grep -c "ThibautBaissac" ATTRIBUTION.md
    Expected Result: File exists, references both source repos
    Evidence: .sisyphus/evidence/task-2-attribution.txt
  ```

  **Commit**: YES
  - Message: `docs: add attribution for adapted skill sources`
  - Files: `ATTRIBUTION.md`

- [ ] 3. Codify canonical skill format reference

  **What to do**:
  - Create `specs/skill-format-reference.md` — the ONE authoritative format document
  - Resolve the three-way conflict: `specs/skills.md` (6 sections), `skills/brainstorm/SKILL.md` (phased flow), zerobearing2 (related-skills blocks)
  - The canonical format MUST include:
    - YAML frontmatter: `name:`, `description:`, `triggers:` (list of keyword strings)
    - Section 1: "When to use this skill" — trigger conditions
    - Section 2: "Principles" or "Core Philosophy" — guiding rules (3-7 bullets)
    - Section 3: Main content — decision trees, patterns, code examples, step-by-step guidance
    - Section 4: "Gotchas" — common mistakes to avoid
    - Section 5: "Validation" — how to verify the result (checklist)
    - Optional: `<related-skills>` block at bottom (hints, not requirements)
  - Line budget: 80-400 lines per skill
  - Update `specs/skills.md` to point to this reference as canonical

  **Must NOT do**:
  - Do not create a skill format that requires `allowed-tools:` in frontmatter (ThibautBaissac's convention — not ours)
  - Do not require namespace prefixes in skill names (just `models`, not `rails-ai:models`)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 0 (with Tasks 1, 2, 4)
  - **Blocks**: All skill writing tasks (5-35)
  - **Blocked By**: None

  **References**:
  - **Pattern References**:
    - `specs/skills.md` — current skill spec (63 lines) — the 6-section structure is a starting point
    - `skills/brainstorm/SKILL.md` — existing skill implementation (108 lines) — good length/tone reference
  - **External References**:
    - Superpowers skill format: YAML frontmatter with `name:` and `description:`, phased sections, Graphviz decision trees
    - zerobearing2 format: `name:` with `rails-ai:` prefix, `<related-skills>` blocks, `<superpowers-integration>` blocks
    - ThibautBaissac format: `allowed-tools:` in frontmatter (we do NOT adopt this)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Format reference exists and is complete
    Tool: Bash
    Steps:
      1. test -f specs/skill-format-reference.md && echo "exists"
      2. grep -c "frontmatter" specs/skill-format-reference.md
      3. grep -c "Gotchas" specs/skill-format-reference.md
      4. grep -c "Validation" specs/skill-format-reference.md
      5. grep -c "80-400" specs/skill-format-reference.md
    Expected Result: File exists, mentions all required sections and line budget
    Evidence: .sisyphus/evidence/task-3-format-ref.txt

  Scenario: specs/skills.md updated to reference canonical doc
    Tool: Bash
    Steps:
      1. grep -c "skill-format-reference" specs/skills.md
    Expected Result: At least 1 reference to the canonical format doc
    Evidence: .sisyphus/evidence/task-3-skills-spec.txt
  ```

  **Commit**: YES
  - Message: `docs: codify canonical skill format reference`
  - Files: `specs/skill-format-reference.md`, `specs/skills.md`

- [ ] 4. Reconcile/update design docs

  **What to do**:
  - **`docs/architecture.md`**: Rewrite to reflect actual architecture — Superpowers as process layer, our skills as domain layer. Remove the Router/Classifier → Planner+Orchestrator → Executor Pool system (Superpowers handles this). Keep the "Convention-Lean Planning" section. Add sections on: plugin bootstrap mechanism, skill priority/discovery, how Superpowers and rails-ai compose.
  - **`docs/PRD.md`**: Update to reflect: package is opencode plugin + skill pack (not a custom orchestration system). Keep Default Stack, Convention Over Specification, Quality Bar, Non-Goals. Update Core Concepts to describe: Plugin (bootstrap), Skills (domain knowledge), Superpowers integration (process layer). Remove custom orchestration references.
  - **`specs/plugins.md`**: Rewrite to describe the actual opencode plugin mechanism (JS file with `experimental.chat.system.transform` hook) instead of the executable-script-based system currently described.
  - **`docs/IDEAS.md`**: Add all v2 ideas from research: feature recipes, post-commit audit hooks, living documentation scaffolding, style-aware skill adaptation, deployment patterns skill, payments/Stripe skill, SEO/analytics skill, LLM eval testing for skills. Mark brainstorm command as superseded by Superpowers.
  - Resolve all "Open Questions" sections with concrete answers based on decisions made:
    - Planner = Superpowers' writing-plans skill (not a separate model call)
    - Plan state = Superpowers handles this
    - Sub-agents = Superpowers' subagent-driven-development
    - Router = Superpowers handles this
    - Skills versioning = not for v1
    - Convention detection = Skill Adaptation section in specs/skills.md
    - Dry-run mode = not for v1
    - Failure handling = Superpowers' systematic-debugging + verification-before-completion

  **Must NOT do**:
  - Do not delete the design docs — reconcile them with correct information
  - Do not remove the "Convention Over Specification" principle
  - Do not add implementation details that belong in actual code/skills

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 0 (with Tasks 1, 2, 3)
  - **Blocks**: None directly (but informs all subsequent work)
  - **Blocked By**: None

  **References**:
  - **Pattern References**:
    - `docs/architecture.md` — current architecture doc (227 lines) — rewrite needed
    - `docs/PRD.md` — current PRD (152 lines) — update needed
    - `specs/plugins.md` — current plugin spec (46 lines) — rewrite needed
    - `docs/IDEAS.md` — current ideas backlog (48 lines) — expand needed
  - **External References**:
    - Superpowers INSTALL.md: `https://github.com/obra/superpowers/blob/main/.opencode/INSTALL.md` — how the plugin system actually works
    - Superpowers plugin source: `https://github.com/obra/superpowers/blob/main/.opencode/plugins/superpowers.js` — reference implementation

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Architecture doc no longer describes custom orchestration
    Tool: Bash (grep)
    Steps:
      1. grep -c "Router / Classifier" docs/architecture.md
      2. grep -c "Executor Pool" docs/architecture.md
      3. grep -c "Superpowers" docs/architecture.md
    Expected Result: 0 hits for Router/Classifier and Executor Pool; ≥3 hits for Superpowers
    Evidence: .sisyphus/evidence/task-4-architecture.txt

  Scenario: PRD updated with correct Core Concepts
    Tool: Bash (grep)
    Steps:
      1. grep -c "Plugin" docs/PRD.md
      2. grep -c "Superpowers" docs/PRD.md
      3. grep -c "opencode" docs/PRD.md
    Expected Result: All ≥1
    Evidence: .sisyphus/evidence/task-4-prd.txt

  Scenario: Open Questions resolved
    Tool: Bash (grep)
    Steps:
      1. grep -c "\- \[ \]" docs/architecture.md
      2. grep -c "\- \[ \]" docs/PRD.md
    Expected Result: 0 open questions in both files
    Evidence: .sisyphus/evidence/task-4-open-questions.txt
  ```

  **Commit**: YES
  - Message: `docs: reconcile design docs with Superpowers-based architecture`
  - Files: `docs/architecture.md`, `docs/PRD.md`, `specs/plugins.md`, `docs/IDEAS.md`

---

### Wave 1: Infrastructure

- [ ] 5. Pilot skill adaptation: models

  **What to do**:
  - Clone/fetch zerobearing2/rails-ai `skills/models/SKILL.md` (1,157 lines)
  - Convert to our canonical format (from Task 3):
    - Replace `rails-ai:models` namespace with `models`
    - Replace `<related-skills>` blocks with our format
    - Remove any `<superpowers-integration>` blocks
    - Restructure to match our canonical sections: When to use / Principles / Main content / Gotchas / Validation
    - Trim to ≤400 lines — prioritize actionable patterns, cut redundant examples
  - This is the PILOT — it calibrates effort for all subsequent adaptations
  - Document adaptation time and any surprises in `.sisyphus/evidence/task-5-pilot-notes.txt`

  **Must NOT do**:
  - Do not exceed 400 lines
  - Do not add hard dependencies on other skills being loaded
  - Do not keep Claude Code-specific tool references

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
    - Reason: Pilot adaptation requires careful judgment about what to keep/cut/restructure

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (must complete before Wave 2+)
  - **Blocks**: Tasks 6, 7, 9-29 (validates approach for all skills)
  - **Blocked By**: Task 3 (canonical format)

  **References**:
  - **Pattern References**:
    - `specs/skill-format-reference.md` — canonical format (from Task 3)
    - `skills/brainstorm/SKILL.md` — existing skill for tone/length reference
  - **External References**:
    - Source: `https://raw.githubusercontent.com/zerobearing2/rails-ai/main/skills/models/SKILL.md` — the 1,157-line source to adapt
    - Enrichment: ThibautBaissac's "State as Records" pattern — add as a section (but do this in Task 31, not here)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Adapted models skill matches canonical format
    Tool: Bash
    Steps:
      1. head -1 skills/models/SKILL.md | grep -q "^---$" && echo "frontmatter ok"
      2. grep -q "^name: models" skills/models/SKILL.md && echo "name ok"
      3. grep -q "^description:" skills/models/SKILL.md && echo "description ok"
      4. wc -l < skills/models/SKILL.md | xargs test 400 -ge && echo "line count ok"
      5. grep -c "rails-ai:" skills/models/SKILL.md  # should be 0
      6. grep -c "superpowers-integration" skills/models/SKILL.md  # should be 0
    Expected Result: Frontmatter valid, name is "models" (no prefix), ≤400 lines, no Claude Code artifacts
    Evidence: .sisyphus/evidence/task-5-models-validation.txt

  Scenario: Pilot notes captured
    Tool: Bash
    Steps:
      1. test -f .sisyphus/evidence/task-5-pilot-notes.txt && echo "notes exist"
    Expected Result: Pilot notes file exists with adaptation time and observations
    Evidence: .sisyphus/evidence/task-5-pilot-notes.txt
  ```

  **Commit**: YES
  - Message: `feat: add models skill (pilot adaptation from zerobearing2/rails-ai)`
  - Files: `skills/models/SKILL.md`

- [ ] 6. Write rails-ai.js plugin

  **What to do**:
  - Create `.opencode/plugins/rails-ai.js` modeled DIRECTLY on Superpowers' `superpowers.js`
  - The plugin MUST:
    - Export a named function (e.g., `RailsAIPlugin`) that receives `{ client, directory }`
    - Return an object with `experimental.chat.system.transform` hook
    - Read `using-rails-ai/SKILL.md` from the skills directory (resolved via `__dirname`)
    - Strip YAML frontmatter before injecting
    - Push bootstrap content to `(output.system ||= []).push(content)`
    - Include a tool mapping section for OpenCode equivalents
  - The plugin MUST NOT:
    - Auto-load all skills (only `using-rails-ai`)
    - Define custom tools (`find_skills`, `use_skill` — OpenCode's native `skill` tool handles this)
    - Implement any orchestration logic

  **Must NOT do**:
  - Do not copy Superpowers wholesale — write a clean implementation modeled on the same pattern
  - Do not auto-load any skill except `using-rails-ai`
  - Do not add tool definitions

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Task 5 completes)
  - **Parallel Group**: Wave 1 (with Tasks 7, 8)
  - **Blocks**: Task 8 (install script needs plugin path)
  - **Blocked By**: Task 3 (format), Task 5 (pilot validates approach)

  **References**:
  - **Pattern References**:
    - Superpowers plugin: `https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/plugins/superpowers.js` — exact pattern to follow. Key: ES module with `import.meta.url` for `__dirname`, `extractAndStripFrontmatter()` helper, `getBootstrapContent()` function, single `experimental.chat.system.transform` hook

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Plugin syntax is valid
    Tool: Bash
    Steps:
      1. node -c .opencode/plugins/rails-ai.js
    Expected Result: No syntax errors
    Evidence: .sisyphus/evidence/task-6-syntax.txt

  Scenario: Plugin file structure is correct
    Tool: Bash
    Steps:
      1. grep -q "experimental.chat.system.transform" .opencode/plugins/rails-ai.js && echo "hook ok"
      2. grep -q "output.system" .opencode/plugins/rails-ai.js && echo "push ok"
      3. grep -q "using-rails-ai" .opencode/plugins/rails-ai.js && echo "bootstrap ref ok"
      4. grep -c "find_skills\|use_skill" .opencode/plugins/rails-ai.js  # should be 0
    Expected Result: Has correct hook, pushes to system, references using-rails-ai, no custom tools
    Evidence: .sisyphus/evidence/task-6-structure.txt
  ```

  **Commit**: YES
  - Message: `feat: add rails-ai.js opencode plugin`
  - Files: `.opencode/plugins/rails-ai.js`

- [ ] 7. Write using-rails-ai bootstrap skill

  **What to do**:
  - Create `skills/using-rails-ai/SKILL.md` — the meta-skill injected at session start
  - Content should include:
    - What rails-ai is (Rails domain skills for opencode)
    - Default stack assumption (Rails 8, Hotwire, Solid Stack, SQLite, Minitest)
    - How to discover available skills: use OpenCode's native `skill` tool
    - Architecture decision tree (ASCII flowchart — where should code go?):
      ```
      Where should this code go?
      ├─ Complex business logic?        → Service Object (see: architecture skill)
      ├─ Complex database query?        → Query Object (see: models skill)
      ├─ View/display formatting?       → Helper or Presenter
      ├─ Shared behavior across models? → Concern (see: models skill)
      ├─ Authorization logic?           → Policy
      ├─ Async/background work?         → Job (see: solid-stack skill)
      └─ Everything else?               → Model, Controller, or View (Rails conventions)
      ```
    - Convention-lean planning principle: skills teach patterns; plans should only specify deviations
    - List of all available skills with one-line descriptions
    - Reminder: Superpowers handles process (brainstorming, TDD, debugging methodology, code review)
  - Line budget: 80-200 lines (bootstrap should be concise — it's loaded on EVERY session)

  **Must NOT do**:
  - Do not exceed 200 lines (injected every session — must be lean)
  - Do not duplicate Superpowers' `using-superpowers` content
  - Do not include detailed Rails knowledge (that's what individual skills are for)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Task 5)
  - **Parallel Group**: Wave 1 (with Tasks 6, 8)
  - **Blocks**: Task 8 (install script needs bootstrap skill)
  - **Blocked By**: Task 3 (format), Task 5 (pilot)

  **References**:
  - **Pattern References**:
    - Superpowers' `using-superpowers/SKILL.md`: `https://github.com/obra/superpowers/blob/main/skills/using-superpowers/SKILL.md` — reference for bootstrap skill structure
    - zerobearing2's `using-rails-ai/SKILL.md` — they have a version, reference for content ideas
  - **External References**:
    - ThibautBaissac's architecture decision tree in `rails-architecture/SKILL.md`

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Bootstrap skill exists and is concise
    Tool: Bash
    Steps:
      1. test -f skills/using-rails-ai/SKILL.md && echo "exists"
      2. head -1 skills/using-rails-ai/SKILL.md | grep -q "^---$" && echo "frontmatter ok"
      3. wc -l < skills/using-rails-ai/SKILL.md | xargs test 200 -ge && echo "line count ok"
      4. grep -q "architecture" skills/using-rails-ai/SKILL.md && echo "decision tree ok"
      5. grep -q "Superpowers" skills/using-rails-ai/SKILL.md && echo "superpowers ref ok"
    Expected Result: Exists, has frontmatter, ≤200 lines, includes decision tree and Superpowers reference
    Evidence: .sisyphus/evidence/task-7-bootstrap.txt
  ```

  **Commit**: YES
  - Message: `feat: add using-rails-ai bootstrap skill`
  - Files: `skills/using-rails-ai/SKILL.md`

- [ ] 8. Write install.sh

  **What to do**:
  - Create `install.sh` at project root — single-command installation
  - Script must:
    - Check if Superpowers is already installed at `~/.config/opencode/superpowers`; if not, `git clone https://github.com/obra/superpowers.git` there
    - Symlink Superpowers plugin: `~/.config/opencode/plugins/superpowers.js` → `~/.config/opencode/superpowers/.opencode/plugins/superpowers.js`
    - Symlink Superpowers skills: `~/.config/opencode/skills/superpowers` → `~/.config/opencode/superpowers/skills`
    - Determine rails-ai source directory (where install.sh lives)
    - Symlink rails-ai plugin: `~/.config/opencode/plugins/rails-ai.js` → `<source>/.opencode/plugins/rails-ai.js`
    - Symlink rails-ai skills: `~/.config/opencode/skills/rails-ai` → `<source>/skills`
    - Create directories with `mkdir -p` if they don't exist
    - Use `ln -sf` (force) to handle existing symlinks gracefully → idempotent
    - Print success message with list of what was installed
  - Script must NOT:
    - Edit any config files (no opencode.json, no package.json)
    - Require sudo or elevated permissions
    - Download anything besides the Superpowers git clone

  **Must NOT do**:
  - Do not edit opencode.json — plugin discovery is filesystem-based
  - Do not require npm or bun
  - Do not make assumptions about the user's shell beyond POSIX sh

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Tasks 6, 7)
  - **Parallel Group**: Wave 1 (after 6+7 complete)
  - **Blocks**: None
  - **Blocked By**: Tasks 6, 7 (needs plugin + bootstrap to exist)

  **References**:
  - **Pattern References**:
    - Superpowers INSTALL.md: `https://github.com/obra/superpowers/blob/main/.opencode/INSTALL.md` — exact symlink strategy to follow
  - **WHY Each Reference Matters**:
    - The INSTALL.md shows the exact symlink paths and gotchas (e.g., use `ln -s` not `ln -sf` for skills — but we use `-sf` for idempotency and handle the edge case differently)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Install script runs successfully
    Tool: Bash
    Steps:
      1. bash install.sh
      2. echo $?
    Expected Result: Exit code 0
    Evidence: .sisyphus/evidence/task-8-install.txt

  Scenario: Install is idempotent
    Tool: Bash
    Steps:
      1. bash install.sh
      2. bash install.sh
      3. echo $?
    Expected Result: Exit code 0 on both runs, no errors
    Evidence: .sisyphus/evidence/task-8-idempotent.txt

  Scenario: Symlinks point correctly
    Tool: Bash
    Steps:
      1. test -L ~/.config/opencode/plugins/rails-ai.js && echo "plugin linked"
      2. test -d ~/.config/opencode/skills/rails-ai && echo "skills linked"
    Expected Result: Both symlinks exist
    Evidence: .sisyphus/evidence/task-8-symlinks.txt
  ```

  **Commit**: YES
  - Message: `feat: add install.sh for one-command setup`
  - Files: `install.sh`

---

### Wave 2: Core Skills Batch 1

- [ ] 9. Adapt controllers skill

  **What to do**:
  - Fetch zerobearing2/rails-ai `skills/controllers/SKILL.md` (1,006 lines)
  - Convert to canonical format. Trim to ≤400 lines.
  - Key content to preserve: RESTful CRUD, strong params (`params.expect()` for Rails 8.1+), skinny controllers, controller concerns, nested resources
  - Enrichment (from rails-ai-playbook): Add "Controller → Service → Model dependency direction" rule and "raise on failure, don't return booleans" pattern
  - Remove Claude Code artifacts and `rails-ai:` namespace prefix

  **Recommended Agent Profile**: `unspecified-high`, Skills: []
  **Parallelization**: Wave 2, parallel with Tasks 10-15. Blocked by: Task 5 (pilot). Blocks: Task 34 (enrichment)
  **QA**: Same pattern as Task 5 — verify frontmatter, name, line count, no Claude Code artifacts
  **Commit**: YES (groups with Wave 2) — `feat: add controllers skill`

- [ ] 10. Adapt security skill

  **What to do**:
  - Fetch zerobearing2/rails-ai `skills/security/SKILL.md` (1,575 lines)
  - Convert to canonical format. Trim to ≤400 lines.
  - Key content: XSS prevention, SQL injection, CSRF, file uploads, command injection
  - Enrichment (from rails-ai-playbook): Add "Return 404 not 403 for unauthorized access" and OmniAuth security patterns
  - Remove Claude Code artifacts and namespace prefix

  **Recommended Agent Profile**: `unspecified-high`, Skills: []
  **Parallelization**: Wave 2, parallel with Tasks 9, 11-15. Blocked by: Task 5. Blocks: Task 33 (enrichment)
  **QA**: Same pattern as Task 5
  **Commit**: YES — `feat: add security skill`

- [ ] 11. Adapt hotwire skill

  **What to do**:
  - Fetch zerobearing2/rails-ai `skills/hotwire/SKILL.md` (699 lines)
  - Convert to canonical format. Trim to ≤400 lines.
  - Key content: Turbo Drive, Turbo Morphing (Rails 8 default — `broadcasts_refreshes`), Turbo Frames (use sparingly), Turbo Streams, Stimulus patterns
  - Remove Claude Code artifacts and namespace prefix

  **Recommended Agent Profile**: `unspecified-high`, Skills: []
  **Parallelization**: Wave 2, parallel. Blocked by: Task 5
  **QA**: Same pattern as Task 5
  **Commit**: YES — `feat: add hotwire skill`

- [ ] 12. Adapt testing skill

  **What to do**:
  - Fetch zerobearing2/rails-ai `skills/testing/SKILL.md` (1,930 lines)
  - Convert to canonical format. Trim to ≤400 lines. This is the largest skill — aggressive prioritization needed
  - Key content: Minitest assertions, model testing, integration testing, fixtures, mocking/stubbing, test helpers
  - Remove `<superpowers-integration>` block (3 lines referencing external TDD skill)
  - Enrichment placeholder: phase-locked TDD will be added in Task 32
  - Remove Claude Code artifacts and namespace prefix

  **Recommended Agent Profile**: `unspecified-high`, Skills: []
  **Parallelization**: Wave 2, parallel. Blocked by: Task 5. Blocks: Task 32 (enrichment)
  **QA**: Same pattern as Task 5
  **Commit**: YES — `feat: add testing skill`

- [ ] 13. Adapt solid-stack skill

  **What to do**:
  - Fetch zerobearing2/rails-ai `skills/jobs/SKILL.md` (704 lines) — rename to `solid-stack`
  - Convert to canonical format. Trim to ≤400 lines.
  - Key content: SolidQueue config, retry strategies, SolidCache, SolidCable, Mission Control, multi-database management
  - Decision: keep opinionated "NEVER Sidekiq/Redis" stance (matches our Rails 8 default stack)

  **Recommended Agent Profile**: `unspecified-high`, Skills: []
  **Parallelization**: Wave 2, parallel. Blocked by: Task 5
  **QA**: Same pattern as Task 5
  **Commit**: YES — `feat: add solid-stack skill`

- [ ] 14. Adapt mailers skill

  **What to do**:
  - Fetch zerobearing2/rails-ai `skills/mailers/SKILL.md`
  - Convert to canonical format. Trim to ≤400 lines.
  - Key content: ActionMailer patterns, async delivery via SolidQueue, mailer previews, attachments, multipart emails
  - Remove Claude Code artifacts and namespace prefix

  **Recommended Agent Profile**: `unspecified-high`, Skills: []
  **Parallelization**: Wave 2, parallel. Blocked by: Task 5
  **QA**: Same pattern as Task 5
  **Commit**: YES — `feat: add mailers skill`

- [ ] 15. Adapt debugging skill

  **What to do**:
  - Fetch zerobearing2/rails-ai `skills/debugging/SKILL.md`
  - Convert to canonical format. Trim to ≤400 lines.
  - Key content: Rails-specific debugging techniques — ActiveRecord query debugging, middleware stack tracing, asset pipeline issues, log analysis
  - Note: Superpowers handles debugging METHODOLOGY (4-phase process, 3-strikes rule). This skill adds Rails-specific TECHNIQUES within that methodology.

  **Recommended Agent Profile**: `unspecified-high`, Skills: []
  **Parallelization**: Wave 2, parallel. Blocked by: Task 5
  **QA**: Same pattern as Task 5
  **Commit**: YES — `feat: add debugging skill`

---

### Wave 3: Core Skills Batch 2

- [ ] 16. Adapt views skill

  **What to do**: Fetch zerobearing2/rails-ai `skills/views/SKILL.md`. Convert to canonical format. ≤400 lines. Content: ERB patterns, partials, layouts, helpers, content_for, view rendering best practices.
  **Recommended Agent Profile**: `unspecified-high`, Skills: []
  **Parallelization**: Wave 3, parallel with Tasks 17-21. Blocked by: Task 5
  **QA**: Same frontmatter/linecount pattern. **Commit**: YES — `feat: add views skill`

- [ ] 17. Adapt styling skill

  **What to do**: Fetch zerobearing2/rails-ai `skills/styling/SKILL.md`. Convert to canonical format. ≤400 lines. Content: CSS/Tailwind patterns in Rails context, Propshaft, asset pipeline.
  **Recommended Agent Profile**: `unspecified-high`, Skills: []
  **Parallelization**: Wave 3, parallel. Blocked by: Task 5
  **QA**: Same pattern. **Commit**: YES — `feat: add styling skill`

- [ ] 18. Adapt project-setup skill

  **What to do**: Fetch zerobearing2/rails-ai `skills/project-setup/SKILL.md`. Convert to canonical format. ≤400 lines. Content: New Rails project initialization, default stack setup, AGENTS.md creation. Enrichment: Add living documentation concept from rails-ai-playbook (SCHEMA.md, BUSINESS_RULES.md that grow with project).
  **Recommended Agent Profile**: `unspecified-high`, Skills: []
  **Parallelization**: Wave 3, parallel. Blocked by: Task 5
  **QA**: Same pattern. **Commit**: YES — `feat: add project-setup skill`

- [ ] 19. Adapt authentication skill

  **What to do**: Fetch ThibautBaissac/rails_ai_agents `skills/authentication-flow/SKILL.md` + `reference/` subdocs. Convert to canonical format. ≤400 lines. Content: Rails 8 `has_secure_password`, session auth, `generates_token_for`, password reset flow. Enrichment from rails-ai-playbook: OmniAuth/Google OAuth integration patterns, `find_or_create_from_oauth`.
  **Recommended Agent Profile**: `unspecified-high`, Skills: []
  **Parallelization**: Wave 3, parallel. Blocked by: Task 5
  **QA**: Same pattern. **Commit**: YES — `feat: add authentication skill`

- [ ] 20. Write writing-plans override skill

  **What to do**:
  - Create `skills/writing-plans/SKILL.md` — this OVERRIDES Superpowers' `writing-plans` skill
  - Core philosophy: Convention-lean planning. Plans only specify deviations, project-specific decisions, and non-obvious requirements. Trust Rails knowledge.
  - Include: when to use sparse plans vs detailed plans, plan structure (YAML-like from architecture.md), examples of good vs bad plans, PR line-count budgets (50-200 ideal, 400 max from ThibautBaissac)
  - Feature spec template elements: authorization matrix, edge case slots (min 3), UI state matrix (Loading/Success/Error/Empty)
  - Explicitly state: "For standard Rails patterns (CRUD, RESTful routes, model validations, migration syntax), omit implementation detail. The executor knows Rails."
  - Line budget: 200-400 lines

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
    - Reason: This is our key differentiator — needs careful design to balance sparse plans with sufficient detail

  **Parallelization**: Wave 3, parallel. Blocked by: Task 5
  **QA**: Verify frontmatter, line count, contains "convention" and "deviation" keywords
  **Commit**: YES — `feat: add writing-plans override skill (convention-lean)`

- [ ] 21. Write TEAM_RULES.md

  **What to do**:
  - Create `rules/TEAM_RULES.md` — curated Rails conventions
  - Source: zerobearing2's 20 rules (extract content, strip agent-routing language like `@architect`, `@backend`)
  - Enrichments from research: "Return 404 not 403", "Controller → Service → Model dependency direction", "Raise on failure, don't return booleans", "Think in scopes not permissions"
  - Format: Each rule has: title, NEVER/ALWAYS framing, good/bad code example, brief rationale
  - Max 25 rules total
  - Structure sections: Code Organization, Testing, Security, Database, Frontend, Process

  **Recommended Agent Profile**: `unspecified-high`, Skills: []
  **Parallelization**: Wave 3, parallel. Blocked by: Task 5
  **QA**: Verify file exists, rule count ≥15 and ≤25
  **Commit**: YES — `feat: add TEAM_RULES.md with curated Rails conventions`

---

### Wave 4: Expansion Skills

- [ ] 22. Adapt migrations skill

  **What to do**: Fetch ThibautBaissac `skills/database-migrations/SKILL.md`. Convert to canonical format. ≤400 lines. Content: Safe reversible migrations, strong_migrations patterns, zero-downtime migrations, index strategies.
  **Recommended Agent Profile**: `unspecified-high`. **Parallelization**: Wave 4, parallel with 23-29. Blocked by: Task 5
  **QA**: Same pattern. **Commit**: YES — `feat: add migrations skill`

- [ ] 23. Adapt active-storage skill

  **What to do**: Fetch ThibautBaissac `skills/active-storage-setup/SKILL.md`. Convert to canonical format. ≤400 lines. Content: File uploads, attachments, variants, direct uploads, security (triple validation: content-type + extension + magic bytes).
  **Recommended Agent Profile**: `unspecified-high`. **Parallelization**: Wave 4, parallel. Blocked by: Task 5
  **QA**: Same pattern. **Commit**: YES — `feat: add active-storage skill`

- [ ] 24. Adapt action-cable skill

  **What to do**: Fetch ThibautBaissac `skills/action-cable-patterns/SKILL.md`. Convert to canonical format. ≤400 lines. Content: Channel definition, broadcasting, Stimulus client-side subscription, SolidCable integration.
  **Recommended Agent Profile**: `unspecified-high`. **Parallelization**: Wave 4, parallel. Blocked by: Task 5
  **QA**: Same pattern. **Commit**: YES — `feat: add action-cable skill`

- [ ] 25. Adapt api-versioning skill

  **What to do**: Fetch ThibautBaissac `skills/api-versioning/SKILL.md`. Convert to canonical format. ≤400 lines. Content: Versioned REST APIs, namespace routing, JSON serialization, API authentication patterns.
  **Recommended Agent Profile**: `unspecified-high`. **Parallelization**: Wave 4, parallel. Blocked by: Task 5
  **QA**: Same pattern. **Commit**: YES — `feat: add api-versioning skill`

- [ ] 26. Adapt i18n skill

  **What to do**: Fetch ThibautBaissac `skills/i18n-patterns/SKILL.md`. Convert to canonical format. ≤400 lines. Content: Rails I18n setup, locale files, lazy lookups, pluralization, date/time formatting, locale switching.
  **Recommended Agent Profile**: `unspecified-high`. **Parallelization**: Wave 4, parallel. Blocked by: Task 5
  **QA**: Same pattern. **Commit**: YES — `feat: add i18n skill`

- [ ] 27. Adapt form-objects skill

  **What to do**: Fetch ThibautBaissac `skills/form-object-patterns/SKILL.md`. Convert to canonical format. ≤400 lines. Content: ActiveModel::API-based form objects, multi-model forms, wizards, validation patterns.
  **Recommended Agent Profile**: `unspecified-high`. **Parallelization**: Wave 4, parallel. Blocked by: Task 5
  **QA**: Same pattern. **Commit**: YES — `feat: add form-objects skill`

- [ ] 28. Adapt caching-strategies skill

  **What to do**: Fetch ThibautBaissac `skills/caching-strategies/SKILL.md`. Convert to canonical format. ≤400 lines. Content: Fragment caching, Russian doll caching, HTTP caching, SolidCache integration, cache key patterns.
  **Recommended Agent Profile**: `unspecified-high`. **Parallelization**: Wave 4, parallel. Blocked by: Task 5
  **QA**: Same pattern. **Commit**: YES — `feat: add caching-strategies skill`

- [ ] 29. Write architecture decision tree skill

  **What to do**: Create `skills/architecture/SKILL.md` — standalone architecture guidance skill. Content: Expanded architecture decision tree (from Task 7 bootstrap, but with full detail), code organization patterns, when to use concerns vs services vs query objects, layer interaction rules, error handling patterns. Source: ThibautBaissac's `rails-architecture/SKILL.md` + reference docs (error-handling.md, layer-interactions.md, query-patterns.md, service-patterns.md, testing-strategy.md).
  **Recommended Agent Profile**: `unspecified-high`. **Parallelization**: Wave 4, parallel. Blocked by: Task 5
  **QA**: Same pattern. **Commit**: YES — `feat: add architecture skill`

---

### Wave 5: Unique Skills + Enrichments

- [ ] 30. Write frame-problem XY-detection skill

  **What to do**:
  - Create `skills/frame-problem/SKILL.md` — XY-problem detection before feature work
  - Source: ThibautBaissac's `commands/frame-problem.md` (446 lines) — convert from Claude Code command format to SKILL.md format
  - Content: classify requests (XY Problem / Legitimate Feature / Enhancement / Process Problem), run "5 Whys", search codebase for existing solutions, output 3 options (minimal/balanced/comprehensive), recommend approach
  - Trim to ≤400 lines
  - This is a PRE-BRAINSTORMING step — used before Superpowers' brainstorming skill

  **Recommended Agent Profile**: `deep`, Skills: []
  **Parallelization**: Wave 5, parallel with 31-35. Blocked by: Task 3
  **QA**: Verify frontmatter, line count, contains "XY" and "5 Whys" keywords
  **Commit**: YES — `feat: add frame-problem XY-detection skill`

- [ ] 31. Enrich models with state-as-records + .then chaining

  **What to do**: Edit `skills/models/SKILL.md` to add:
  - "State as Records" pattern section (from ThibautBaissac 37signals agents): Closure model example, CRUD routing (`resource :closure`), concern pattern (`Closeable`)
  - `.then` query chaining pattern for query objects
  - Keep within 400-line budget (may need to trim other sections to make room)

  **Recommended Agent Profile**: `quick`, Skills: []
  **Parallelization**: Wave 5. Blocked by: Task 5 (models already adapted)
  **QA**: Verify still ≤400 lines, contains "State as Records" and ".then"
  **Commit**: YES — `feat: enrich models skill with state-as-records pattern`

- [ ] 32. Enrich testing with phase-locked TDD

  **What to do**: Edit `skills/testing/SKILL.md` to add:
  - Phase-locked discipline section: "Red phase: NEVER modify app/ — only write specs", "Refactor phase: NEVER modify spec/ — stop on first red"
  - `flog`/`flay` metrics integration for refactoring decisions
  - Keep within 400-line budget

  **Recommended Agent Profile**: `quick`, Skills: []
  **Parallelization**: Wave 5. Blocked by: Task 12 (testing already adapted)
  **QA**: Verify still ≤400 lines, contains "phase-locked" or "NEVER modify app/"
  **Commit**: YES — `feat: enrich testing skill with phase-locked TDD discipline`

- [ ] 33. Enrich security with additional patterns

  **What to do**: Edit `skills/security/SKILL.md` to add:
  - "Return 404 not 403 for unauthorized access (don't reveal record existence)"
  - OmniAuth security patterns (OAuth token validation, `find_or_create_from_oauth`)
  - Keep within 400-line budget

  **Recommended Agent Profile**: `quick`, Skills: []
  **Parallelization**: Wave 5. Blocked by: Task 10 (security already adapted)
  **QA**: Verify still ≤400 lines, contains "404 not 403"
  **Commit**: YES — `feat: enrich security skill with access disclosure and OAuth patterns`

- [ ] 34. Enrich controllers with dependency direction

  **What to do**: Edit `skills/controllers/SKILL.md` to add:
  - "Controller → Service → Model dependency direction" rule (Model should never call services)
  - "Raise on failure, don't return booleans" pattern
  - "Think in scopes not permissions" for authorization
  - Keep within 400-line budget

  **Recommended Agent Profile**: `quick`, Skills: []
  **Parallelization**: Wave 5. Blocked by: Task 9 (controllers already adapted)
  **QA**: Verify still ≤400 lines, contains "dependency direction"
  **Commit**: YES — `feat: enrich controllers skill with dependency direction rules`

- [ ] 35. Delete premature skills/brainstorm/SKILL.md

  **What to do**: Delete `skills/brainstorm/SKILL.md` and the `skills/brainstorm/` directory. Superpowers handles brainstorming — our premature draft is superseded.

  **Recommended Agent Profile**: `quick`, Skills: [`git-master`]
  **Parallelization**: Wave 5, parallel. Blocked by: None
  **QA**: Verify `skills/brainstorm/` does not exist
  **Commit**: YES — `chore: remove premature brainstorm skill (superseded by Superpowers)`

---

### Wave 6: Documentation + Polish

- [ ] 36. Write README.md

  **What to do**:
  - Rewrite `README.md` at project root with:
    - Project description (what this is, relationship to Superpowers)
    - Quick install: `curl -sSL ... | bash` or manual steps
    - Skill catalog: table with every skill name + one-line description
    - Default stack table
    - How it works: plugin bootstrap → on-demand skills → Superpowers process layer
    - Convention-lean planning philosophy (brief)
    - Attribution (link to ATTRIBUTION.md)
    - Contributing section
    - License (MIT)

  **Recommended Agent Profile**: `writing`, Skills: []
  **Parallelization**: Wave 6. Blocked by: All skills complete (needs full catalog)
  **QA**: Verify README mentions all skill names, contains install instructions
  **Commit**: YES — `docs: write comprehensive README`

- [ ] 37. Update IDEAS.md with v2 backlog

  **What to do**: Update `docs/IDEAS.md` with all deferred items from research:
  - Feature recipes directory (`recipes/`)
  - Post-commit audit hook runtime
  - Living documentation auto-update system
  - Style-aware skill adaptation (detect 37signals vs Standard from codebase)
  - Deployment patterns skill
  - Payments/Stripe skill
  - SEO/analytics skill
  - LLM eval testing for skills
  - ViewComponent skill
  - Pundit/authorization skill
  - Mark "Brainstorm command" as completed/superseded

  **Recommended Agent Profile**: `quick`, Skills: []
  **Parallelization**: Wave 6, parallel. Blocked by: None
  **QA**: Verify IDEAS.md has ≥10 new items
  **Commit**: YES — `docs: update IDEAS.md with v2 backlog from research`

- [ ] 38. Create recipes/README.md stub

  **What to do**: Create `recipes/README.md` with:
  - Brief explanation of what recipes will be (pre-built plans for common features)
  - "Coming in v2" notice
  - List of planned recipes: authentication, payments/Stripe, settings page, email verification, contact form, deployment

  **Recommended Agent Profile**: `quick`, Skills: []
  **Parallelization**: Wave 6, parallel. Blocked by: None
  **QA**: Verify file exists, contains "v2"
  **Commit**: YES — `docs: add recipes stub for v2`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, check structure). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `node -c .opencode/plugins/rails-ai.js` (syntax check). Verify all SKILL.md files have consistent YAML frontmatter. Check line counts (80-400). Verify no skill has hard dependencies on another skill being loaded. Check for broken file references. Verify install.sh is idempotent.
  Output: `Plugin [PASS/FAIL] | Skills [N/N valid] | Line Budgets [N/N] | Install [PASS/FAIL] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` 
  Start from clean state. Run `bash install.sh`. Verify all symlinks. Count skills. Verify frontmatter on every SKILL.md. Spot-check 5 random skills for quality (coherent content, no placeholder text, actionable guidance). Test install script idempotency. Save evidence to `.sisyphus/evidence/final-qa/`.
  Output: `Install [PASS/FAIL] | Symlinks [N/N] | Skills [N/N] | Spot Checks [N/5 pass] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual file created. Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect unaccounted files. Verify adapted skills are indistinguishable from original skills in format.
  Output: `Tasks [N/N compliant] | Unaccounted [CLEAN/N files] | Format Consistency [PASS/FAIL] | VERDICT`

---

## Commit Strategy

- **Wave 0**: `chore: initialize project with git, reconcile design docs, codify skill format`
- **Wave 1**: `feat: add plugin, bootstrap skill, install script, pilot models skill`
- **Wave 2**: `feat: add core domain skills (controllers, security, hotwire, testing, solid-stack, mailers, debugging)`
- **Wave 3**: `feat: add core domain skills (views, styling, project-setup, authentication, writing-plans, team rules)`
- **Wave 4**: `feat: add expansion skills (migrations, active-storage, action-cable, api-versioning, i18n, form-objects, caching, architecture)`
- **Wave 5**: `feat: add frame-problem skill, enrich existing skills with research findings`
- **Wave 6**: `docs: add README, update IDEAS, add recipes stub`

---

## Success Criteria

### Verification Commands
```bash
# Plugin syntax valid
node -c .opencode/plugins/rails-ai.js  # Expected: no errors

# All skills have frontmatter
for f in skills/*/SKILL.md; do head -1 "$f" | grep -q "^---$" || echo "FAIL: $f"; done  # Expected: no output

# All skills have name and description
for f in skills/*/SKILL.md; do grep -q "^name:" "$f" && grep -q "^description:" "$f" || echo "FAIL: $f"; done  # Expected: no output

# No skill exceeds 400 lines
wc -l skills/*/SKILL.md | grep -v total | awk '{if ($1 > 400) print "OVER BUDGET:", $2, $1, "lines"}'  # Expected: no output

# Skill count
ls -d skills/*/SKILL.md | wc -l  # Expected: ≥ 23

# Install script is executable and idempotent
test -x install.sh && bash install.sh && bash install.sh  # Expected: exits 0

# Team rules exist with sufficient rules
test -f rules/TEAM_RULES.md && grep -c "^## Rule" rules/TEAM_RULES.md  # Expected: ≥ 15

# Git repo initialized
test -d .git && echo "ok"  # Expected: ok
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All skills pass frontmatter check
- [ ] All skills within line budget
- [ ] Install script works and is idempotent
- [ ] Plugin exports correct hook
- [ ] Design docs reconciled (no contradictory systems described)
- [ ] README includes complete skill catalog
