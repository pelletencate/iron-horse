# Architectural Decisions

## [2026-03-03] Initial Setup

### D1: Worktree = Main Directory
- Decision: Use `/Users/pelle/dev/rails-ai` directly as worktree (not a separate branch)
- Reason: Not a git repo yet; worktree concept needs git first
- Impact: Task 1 must run before any file modification tasks

### D2: Wave 0 All Parallel
- Tasks 1, 2, 3, 4 are all independent
- Task 1 (git init) does not conflict with Tasks 2, 3, 4 (file creation/editing)
- All can run simultaneously

### D3: Plugin Pattern
- Model directly on Superpowers' superpowers.js
- Use `import.meta.url` for __dirname equivalent
- `extractAndStripFrontmatter()` helper
- Single `experimental.chat.system.transform` hook
- Push to `(output.system ||= []).push(content)`
