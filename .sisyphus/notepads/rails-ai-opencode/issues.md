# Issues & Gotchas

## [2026-03-03] Pre-execution Notes

### I1: Git Init Order
- Task 1 must complete before any git commit operations in other tasks
- Tasks 2, 3, 4 can CREATE files in parallel with git init, but commits must wait for Task 1

### I2: zerobearing2 Skills Are Claude Code Format
- NOT opencode format — need full conversion, not just namespace rename
- Remove: `rails-ai:` namespace prefix, `<superpowers-integration>` blocks, Claude Code tool references
- Add: our canonical sections (Gotchas, Validation), proper YAML frontmatter

### I3: ThibautBaissac Does NOT Use Superpowers
- Their skills are standalone Claude Code commands
- No `<superpowers-integration>` blocks to worry about
- Their `allowed-tools:` frontmatter must be REMOVED

### I4: Skill Line Budget is Hard
- zerobearing2/models is 1,157 lines → must trim to ≤400 (65% cut)
- zerobearing2/testing is 1,930 lines → must trim to ≤400 (79% cut!)
- Aggressive prioritization required — actionable patterns > exhaustive examples

### I5: install.sh Idempotency
- Use `ln -sf` (force) for symlinks
- `mkdir -p` for all dirs
- Handle existing Superpowers clone gracefully (check before git clone)
