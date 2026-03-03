# Rails AI — OpenCode Plugin + Skill Pack for Rails 8

> Deep Rails 8 domain intelligence layered on top of [Superpowers](https://github.com/obra/superpowers) process workflows.

## What This Is

Rails AI is an OpenCode plugin and skill pack that gives AI agents deep Rails 8 domain knowledge. It ships 23 domain skills covering everything from migrations to WebSockets, plus a bootstrap plugin that loads core context at session start.

Superpowers handles the process layer (TDD methodology, debugging loops, code review, planning). Rails AI handles the domain layer — the Rails-specific patterns, conventions, and gotchas that generic models don't know well.

## Quick Install

```sh
git clone https://github.com/your-org/rails-ai.git
cd rails-ai
bash install.sh
```

`install.sh` clones Superpowers, symlinks the plugin into your OpenCode plugins directory, and symlinks all skills into your OpenCode skills directory. After install, OpenCode loads `using-rails-ai` automatically at every session start.

## Default Stack

Rails AI assumes this stack unless you say otherwise:

| Layer | Choice |
|---|---|
| Framework | Rails 8 |
| Frontend | Hotwire (Turbo + Stimulus) |
| Background jobs | SolidQueue |
| Caching | SolidCache |
| WebSockets | SolidCable |
| Database | SQLite (dev/test), PostgreSQL (prod) |
| Testing | Minitest |
| Assets | Propshaft |
| Styling | Tailwind CSS + DaisyUI |

## How It Works

1. **Session start** — the `using-rails-ai` plugin bootstraps core Rails domain context automatically.
2. **On-demand skills** — individual skills load via OpenCode's native `skill` tool (e.g., `skill("hotwire")`). Each skill provides deep, focused guidance for its domain.
3. **Process layer** — Superpowers handles TDD, debugging loops, code review, and planning workflows. Rails AI skills slot in alongside Superpowers, not replacing it.

## Skill Catalog

23 domain skills. Load any of them with `skill("<name>")`.

| Skill | Description |
|---|---|
| `action-cable` | Implement real-time features with Action Cable, WebSockets, channels, broadcasting, and SolidCable for Rails 8 |
| `active-storage` | Configure Active Storage for file uploads with variants, direct uploads, and secure attachment handling |
| `api-versioning` | Implement RESTful API versioning with namespace-based routing, versioned controllers, authentication, and deprecation strategies |
| `architecture` | Guide Rails code organization decisions — where code belongs, layer interactions, and when to extract patterns like service objects, query objects, and presenters |
| `authentication` | Implement authentication using Rails 8 built-in generator — session-based auth, password resets, token generation, remember-me, and OAuth integration |
| `caching-strategies` | Implements Rails caching patterns — fragment, Russian doll, HTTP, low-level, and SolidCache — for performance optimization |
| `controllers` | Build Rails controllers with RESTful actions, strong parameters, skinny architecture, concerns, and nested resources |
| `debugging` | Rails-specific debugging tools and techniques for logs, console, breakpoints, SQL inspection, and performance profiling |
| `form-objects` | Build form objects for complex form handling — multi-model forms, search forms, wizards, and non-persisted forms using ActiveModel::API |
| `frame-problem` | Use this skill BEFORE writing code or creating a plan to detect XY problems early |
| `hotwire` | Use when adding interactivity to Rails views — Turbo (Drive, Morphing, Frames, Streams) and Stimulus controllers |
| `i18n` | Implement Rails internationalization with locale files, lazy lookups, pluralization, date/currency formatting, and locale switching |
| `mailers` | Send emails with ActionMailer — async delivery via SolidQueue, templates, previews, attachments, and testing |
| `migrations` | Create safe, reversible database migrations with zero-downtime strategies, proper indexing, and strong_migrations patterns |
| `models` | Design Rails models with ActiveRecord patterns, associations, validations, scopes, concerns, and query objects |
| `project-setup` | Initialize and configure new Rails 8+ projects with the default stack, living documentation, and development environment |
| `security` | Prevent critical security vulnerabilities in Rails — XSS, SQL injection, CSRF, file uploads, and command injection |
| `solid-stack` | Use when setting up background jobs, caching, or WebSockets — SolidQueue, SolidCache, SolidCable (never Sidekiq/Redis) |
| `styling` | Style Rails views with Tailwind CSS utilities, DaisyUI components, and theme-aware responsive design |
| `testing` | Test Rails applications with Minitest — models, controllers, jobs, mailers, fixtures, mocking, and test helpers |
| `using-rails-ai` | Provides core Rails domain knowledge, architecture patterns, and an overview of available rails-ai skills |
| `views` | Build Rails views with partials, layouts, helpers, forms, nested forms, and WCAG 2.1 AA accessibility |
| `writing-plans` | Write convention-lean implementation plans that trust the executor's Rails knowledge by focusing on what and why, not how |

## Convention-Lean Planning

Plans only specify deviations from Rails conventions. Trust the agent's Rails knowledge. Only include implementation detail when it's non-obvious.

This means a plan says "add soft-delete to User" rather than "add a `deleted_at:datetime` column, add a `default_scope`, add a `discard` method...". The executor knows Rails. The plan focuses on intent and constraints, not steps the agent can infer from convention.

Load `writing-plans` when you need a plan written this way.

## Attribution

This project adapts domain skills from two MIT-licensed repositories. See [ATTRIBUTION.md](ATTRIBUTION.md) for full details.

- [zerobearing2/rails-ai](https://github.com/zerobearing2/rails-ai) — 12 adapted domain skills
- [ThibautBaissac/rails_ai_agents](https://github.com/ThibautBaissac/rails_ai_agents) — 8 adapted domain skills

## License

MIT
