---
name: using-iron-horse
description: Provides core Rails domain knowledge, architecture patterns, and an overview of available iron-horse skills.
triggers:
  - "iron-horse"
  - "rails"
  - "architecture decision"
---

# Using Iron Horse

This skill provides the foundational Rails domain knowledge for the OpenCode agent, focusing on best practices, common patterns, and architectural guidance within a Rails 8 context. It serves as a bootstrap for understanding how to approach tasks when working with Rails applications.

## Default Stack Assumption

Unless otherwise specified, assume the following default stack for Rails 8 projects:
- **Web Framework:** Rails 8
- **Frontend:** Hotwire (Turbo + Stimulus)
- **Background Jobs/Caching/WebSockets:** Solid Stack (SolidQueue, SolidCache, SolidCable)
- **Database:** SQLite (development/test), PostgreSQL (production)
- **Testing Framework:** Minitest
- **Asset Pipeline:** Propshaft

## How to Discover Skills

To explore specific Rails-related domains, use OpenCode's native `skill` tool (e.g., `skill("models")`, `skill("hotwire")`). Each skill provides detailed guidance on its respective topic.

## Architecture Decision Tree

Use this flowchart to determine the best place for new code:

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

## Convention-Lean Planning Principle

"Plans only specify deviations from Rails conventions. Trust the agent's Rails knowledge. Only include implementation detail when it's non-obvious." This principle helps keep plans concise and focused on the unique aspects of a task rather than repeating standard Rails practices.

## Available Skills

- `models`: ActiveRecord patterns, associations, validations, scopes, concerns, query objects
- `controllers`: RESTful CRUD, strong params, skinny controllers, concerns
- `views`: ERB patterns, partials, layouts, helpers, content_for
- `hotwire`: Turbo Drive, Turbo Frames, Turbo Streams, Stimulus
- `testing`: Minitest assertions, fixtures, integration tests, mocking
- `security`: XSS/SQL injection prevention, CSRF, authentication security
- `solid-stack`: SolidQueue jobs, SolidCache, SolidCable, Mission Control
- `mailers`: ActionMailer, async delivery, previews, attachments
- `debugging`: Rails-specific debugging techniques, log analysis
- `styling`: CSS/Tailwind in Rails, Propshaft asset pipeline
- `project-setup`: New project initialization, default stack, living docs
- `authentication`: Rails 8 `has_secure_password`, session auth, OAuth
- `migrations`: Safe reversible migrations, zero-downtime, indexes
- `active-storage`: File uploads, variants, direct uploads, security
- `action-cable`: WebSockets, channels, SolidCable integration
- `api-versioning`: Versioned REST APIs, namespacing, serialization
- `i18n`: Rails I18n, locale files, lazy lookups, pluralization
- `form-objects`: ActiveModel::API form objects, multi-model forms
- `caching-strategies`: Fragment caching, Russian doll, SolidCache
- `architecture`: Decision trees, code organization, layer interactions
- `writing-plans`: Convention-lean planning for Rails projects
- `frame-problem`: XY-problem detection before feature work

## Process vs Domain

Iron Horse provides **domain** skills — Rails-specific knowledge. Your agent harness (oh-my-opencode, Superpowers, or equivalent) handles **process** — planning, TDD, debugging, code review, verification. Load `iron-horse` skills for deep Rails domain knowledge specific to the task at hand.
