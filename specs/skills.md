# Skills Specification

> Living document. Last updated: 2026-03-01

## What is a Skill?

A skill is a packaged unit of knowledge that teaches the agent how to perform a specific Rails task correctly. Skills encode best practices, conventions, and step-by-step workflows.

## Structure

Each skill is a directory under `skills/`:

```
skills/
└── <skill-name>/
    ├── SKILL.md          # Instructions, patterns, decision trees
    ├── examples/         # Reference implementations (optional)
    └── scripts/          # Helper scripts (optional)
```

## SKILL.md Format

```yaml
---
name: <skill-name>
description: <one-line description>
triggers:
  - "<keyword or phrase>"
---
```

Followed by markdown instructions with:

1. **When to use this skill** - Trigger conditions
2. **Pre-flight checks** - What to inspect before acting (schema, existing models, conventions)
3. **Decision tree** - Branching logic for different scenarios
4. **Step-by-step instructions** - The actual workflow
5. **Gotchas** - Common mistakes to avoid
6. **Validation** - How to verify the result

## Skill Loading

Skills are loaded:
- **Automatically** when the router/executor detects a matching trigger
- **Explicitly** when the orchestrator's plan references a skill
- **On demand** when the user asks for a specific skill

## Skill Adaptation

Skills should adapt to the project they're working in:

1. **Detect test framework** - RSpec vs Minitest (check for `spec/` dir, Gemfile)
2. **Detect patterns** - Service objects? Form objects? Interactors? (scan `app/` subdirs)
3. **Detect style** - Rubocop config, existing code conventions
4. **Detect Rails version** - From `Gemfile.lock`
5. **Detect key gems** - Devise, Pundit, Cancancan, Sidekiq, etc.

## Open Questions

- [ ] Should skills be composable? (e.g., model skill + testing skill for "create model with tests")
- [ ] How to handle conflicting advice between skills?
- [ ] Should skills have a "confidence" score for their recommendations?
- [ ] How to version skills alongside Rails versions?
