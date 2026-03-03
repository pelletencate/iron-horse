---
name: project-setup
description: Initialize and configure new Rails 8+ projects with the default stack, living documentation, and development environment
triggers:
  - new rails project
  - rails new
  - project setup
  - initialize project
  - bootstrap rails app
  - AGENTS.md
  - living documentation
---

# Project Setup

## When to use this skill

- Creating a new Rails 8+ application from scratch
- Setting up the default stack (SQLite, Solid Queue, Solid Cache, Solid Cable, Hotwire, Propshaft)
- Bootstrapping living documentation (AGENTS.md, SCHEMA.md, BUSINESS_RULES.md)
- Configuring the development environment (`bin/setup`, `bin/dev`)
- Initializing git with proper `.gitignore` and first commit
- Adding recommended development gems to a fresh project
- Onboarding AI agents to an existing project with context files

## Principles

1. **Rails defaults are correct** — Rails 8 ships with SQLite, Solid Queue, Solid Cache, Solid Cable, Hotwire, and Propshaft. Don't swap them unless you have a proven scaling reason.
2. **Document from day one** — create AGENTS.md, SCHEMA.md, and BUSINESS_RULES.md at project birth. These are cheap to start and invaluable as the system grows.
3. **One command to run** — `bin/setup` bootstraps everything, `bin/dev` starts everything. A new developer (or AI agent) should never need tribal knowledge.
4. **Small first commit** — the initial commit is generated scaffolding only. Your first real commit adds documentation and dev gems.
5. **Living docs over stale docs** — SCHEMA.md and BUSINESS_RULES.md are updated as part of the development workflow, not as afterthoughts.

## Project Initialization

### Step 1: Create the application

```bash
rails new myapp

cd myapp
```

Rails 8 defaults give you everything you need:

| Component | Default | Notes |
|-----------|---------|-------|
| Database | SQLite | Production-ready for most apps via `solid_*` gems |
| Background jobs | SolidQueue | Database-backed, no Redis needed |
| Caching | SolidCache | Database-backed cache store |
| WebSockets | SolidCable | Database-backed Action Cable adapter |
| Frontend | Hotwire (Turbo + Stimulus) | Server-rendered, minimal JS |
| Assets | Propshaft | Simple asset pipeline |
| CSS | Tailwind CSS | Utility-first, via `tailwindcss-rails` |
| Deployment | Kamal | Docker-based, zero-downtime |

### Step 2: Verify the Solid Stack

Rails 8 includes Solid Queue, Solid Cache, and Solid Cable by default. Verify they're configured:

```bash
# Check Gemfile includes solid gems
grep -E "solid_queue|solid_cache|solid_cable" Gemfile

# Install and configure if missing
bin/rails solid_queue:install
bin/rails solid_cache:install
bin/rails solid_cable:install
```

Verify `config/queue.yml`, `config/cache.yml`, and `config/cable.yml` reference the solid adapters.

### Step 3: Add recommended development gems

```ruby
# Gemfile additions

group :development do
  gem "annotate"        # Schema annotations on models
  gem "letter_opener"   # Preview emails in browser
end

group :development, :test do
  gem "bullet"          # N+1 query detection
end
```

```bash
bundle install

# Generate annotate config
bin/rails generate annotate:install

# Configure bullet in config/environments/development.rb
# (add inside the configure block)
```

Bullet configuration:

```ruby
# config/environments/development.rb
config.after_initialize do
  Bullet.enable = true
  Bullet.rails_logger = true
  Bullet.add_footer = true
end
```

### Step 4: Initialize git

```bash
git init
git add -A
git commit -m "Initial Rails 8 application"
```

Rails generates a comprehensive `.gitignore`. Verify it excludes:

```gitignore
# These should already be present:
/config/master.key
/config/credentials/*.key
/tmp/*
/log/*
/storage/*
*.sqlite3
```

## Living Documentation

Living documentation files grow with your project. Create them early so both humans and AI agents always have up-to-date context.

### AGENTS.md — AI agent context

Create `AGENTS.md` in the project root. This is the first file an AI agent reads:

```markdown
# AGENTS.md

## Project Overview
[App name] is a [one-sentence description].

## Tech Stack
- Rails 8+ with SQLite, SolidQueue, SolidCache, SolidCable
- Hotwire (Turbo + Stimulus) for frontend interactivity
- Propshaft for asset pipeline
- Tailwind CSS for styling

## Conventions
- Minitest for testing (no RSpec)
- RESTful routes only
- Fat models, thin controllers
- Background jobs via SolidQueue
- Encrypted credentials for secrets

## Directory Structure
```
app/
├── controllers/   # RESTful controllers
├── models/        # ActiveRecord models
├── views/         # ERB templates
├── jobs/          # SolidQueue background jobs
└── mailers/       # Action Mailer classes
```

## Development
```bash
bin/setup          # First-time setup
bin/dev            # Start development server
bin/rails test     # Run tests
```

## Key Domain Concepts
[List 3-5 core domain objects and their relationships]
```

Update AGENTS.md when you add major features, change conventions, or introduce new architectural patterns.

### SCHEMA.md — Database documentation

Create `SCHEMA.md` to document the intent behind your database design:

```markdown
# SCHEMA.md

Database schema documentation. Updated alongside migrations.

## Tables

### users
Core user model. Authenticates via `has_secure_password`.

| Column | Type | Notes |
|--------|------|-------|
| email | string | Unique, indexed, used for login |
| password_digest | string | bcrypt hash |
| role | string | "member" or "admin", default "member" |

### [next table...]
```

**Keeping it alive:** After running `bin/rails db:migrate`, update SCHEMA.md with the new table or column and a one-line explanation of *why* it exists. The schema itself shows *what*; this file explains *why*.

### BUSINESS_RULES.md — Domain rules

Create `BUSINESS_RULES.md` to capture rules that aren't obvious from code alone:

```markdown
# BUSINESS_RULES.md

Domain rules and invariants. Updated when business logic changes.

## Pricing
- Free tier: 3 projects, 1 user per project
- Pro tier: unlimited projects, 10 users per project
- Billing is monthly, prorated on upgrade

## Permissions
- Admins can invite/remove members
- Members can create/edit their own resources
- Resources are soft-deleted (archived), never hard-deleted

## Notifications
- Email on invitation accepted
- Email on project shared with user
- No email notifications between 10pm-8am user-local-time
```

**Keeping it alive:** When you implement a business rule, add it here. When a rule changes, update it here first, then update the code. This file is the source of truth for "how the business works."

## Development Environment

### bin/setup

Rails 8 generates a `bin/setup` script. Verify it handles:

```bash
#!/usr/bin/env ruby
# bin/setup

system("bundle install")
system("bin/rails db:prepare")
system("bin/rails tmp:clear")
system("bin/rails restart")
```

A new developer should clone the repo and run `bin/setup` — nothing else.

### bin/dev

Rails 8 uses `Procfile.dev` with `foreman` (via `bin/dev`):

```procfile
# Procfile.dev
web: bin/rails server
css: bin/rails tailwindcss:watch
jobs: bin/jobs
```

This starts the Rails server, Tailwind CSS watcher, and SolidQueue worker in a single terminal.

### Environment configuration

Rails 8 defaults are excellent. Only customize what you need:

```ruby
# config/environments/development.rb
# Add inside the configure block:

# Preview emails in browser (requires letter_opener)
config.action_mailer.delivery_method = :letter_opener

# Catch i18n issues early
config.i18n.raise_on_missing_translations = true
```

## Credentials Setup

Use Rails encrypted credentials from the start:

```bash
# Edit master credentials
bin/rails credentials:edit

# Edit per-environment credentials
bin/rails credentials:edit --environment production
bin/rails credentials:edit --environment development
```

Structure your credentials file:

```yaml
secret_key_base: <auto-generated>

# Group by service
stripe:
  publishable_key: pk_test_...
  secret_key: sk_test_...

smtp:
  username: apikey
  password: SG...
```

Access with `dig` for safe nested lookups:

```ruby
Rails.application.credentials.dig(:stripe, :secret_key)
```

**Rules:**
- Never commit `config/master.key` or `config/credentials/*.key`
- Share keys via password manager or CI/CD secrets
- Use test/sandbox API keys in development credentials

## Project Structure Checklist

After setup, your project should look like this:

```
myapp/
├── AGENTS.md               # AI agent context
├── SCHEMA.md               # Database documentation
├── BUSINESS_RULES.md       # Domain rules
├── Gemfile                 # With annotate, bullet, letter_opener
├── Procfile.dev            # web + css + jobs
├── bin/
│   ├── setup               # First-time bootstrap
│   └── dev                 # Start everything
├── config/
│   ├── environments/       # Per-environment config
│   ├── credentials/        # Encrypted secrets
│   └── queue.yml           # SolidQueue config
├── db/
│   └── migrate/            # Database migrations
└── test/                   # Minitest (not spec/)
```

## Gotchas

- **Don't swap SQLite prematurely** — SQLite + Solid Stack handles more traffic than you think. Switch to PostgreSQL only when you have measured data showing SQLite is the bottleneck.
- **Don't skip AGENTS.md** — without it, AI agents guess at conventions and make inconsistent choices. Five minutes of documentation saves hours of correction.
- **Don't forget `bin/jobs`** — SolidQueue needs a separate process. If background jobs aren't running, check that `Procfile.dev` includes the jobs entry and `bin/dev` is used instead of `bin/rails server`.
- **Don't commit credentials keys** — Rails `.gitignore` excludes them by default, but verify after any `.gitignore` edits.
- **Don't let living docs go stale** — update SCHEMA.md with every migration and BUSINESS_RULES.md with every domain logic change. Stale docs are worse than no docs.
- **Don't add gems you don't need yet** — start with the minimal recommended set. Add gems when you have a specific problem to solve, not "just in case."

## Validation

- [ ] `bin/setup` completes without errors
- [ ] `bin/dev` starts web server, CSS watcher, and SolidQueue worker
- [ ] `bin/rails test` passes (even if no tests yet, should exit 0)
- [ ] AGENTS.md exists with project overview and conventions
- [ ] SCHEMA.md exists with at least a template structure
- [ ] BUSINESS_RULES.md exists with at least a template structure
- [ ] Solid Stack configured (queue.yml, cache.yml, cable.yml)
- [ ] Credentials accessible: `bin/rails credentials:show` works
- [ ] Git initialized with clean first commit
- [ ] No secrets in version control (`config/master.key` excluded)

<related-skills>
  <skill name="models" reason="After project setup, you'll create your first models and migrations" />
  <skill name="testing" reason="Set up Minitest patterns from the start" />
  <skill name="security" reason="Credentials and security configuration established during setup" />
</related-skills>
