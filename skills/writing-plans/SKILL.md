---
name: writing-plans
description: Write convention-lean implementation plans that trust the executor's Rails knowledge by focusing on what and why, not how.
triggers:
  - plan a feature
  - writing a plan
  - implementation plan
  - feature spec
  - design document
---

# Convention-Lean Planning

## When to use this skill

- Any time you are asked to plan a new feature or significant change
- Before writing implementation plans for a multi-step task
- When organizing work for a subagent or parallel execution session
- When breaking down a large epic into manageable PR-sized chunks
- When asked to document a proposed architectural change
- When evaluating the feasibility and scope of a feature request

## Principles

1. **Convention over specification** — Plans specify deviations from Rails conventions, not the conventions themselves. Trust the executor's Rails knowledge.
2. **"What" and "Why", not "How"** — "Create a User model with name:string email:string" is enough. Do not describe validations or syntax the executor already knows.
3. **Zero boilerplate** — Standard CRUD + RESTful routes = zero plan detail needed. The executor knows how to write a controller, a form, and a migration.
4. **Specify the unwritten rules explicitly** — Always detail authorization rules, non-standard associations, business logic edge cases, and UI state requirements. These are the things the framework cannot guess.
5. **PR line-count budget** — 50-200 lines of code changed is ideal, 400 is the absolute maximum. If the plan will exceed this, split the task into multiple phases.
6. **Plans are living documents** — Update them as assumptions are proven wrong during implementation. Do not cling to a plan that no longer matches reality.
7. **Prefer short plans that grow** — A concise plan that evolves is vastly superior to a long, overspecified plan that gets ignored or becomes immediately obsolete.

## The Core Philosophy

This skill overrides the default, highly-verbose planning methodology. We believe that an AI agent equipped with Rails domain skills is a senior developer, not a junior developer who needs every terminal command and file path spelled out.

By writing convention-lean plans, you:
- Save massive amounts of context window (tokens), enabling the agent to retain more relevant project history.
- Prevent the AI from hallucinating incorrect boilerplate syntax or outdated coding patterns.
- Give the executing agent the freedom to use its built-in knowledge of the latest Rails 8 features (like Hotwire, Stimulus, ActionText, and Solid Queue).
- Focus the plan on the *actual* hard parts of software engineering: domain modeling, authorization, edge cases, and user experience.
- Reduce the brittleness of plans. A plan that dictates every file path will break if the project structure changes slightly; a plan that focuses on domain concepts remains valid.

## What to INCLUDE in Plans

A convention-lean plan is short, but it is dense with domain-specific requirements. You must include:

### 1. The Authorization Matrix
Always explicitly state who can perform which actions. The framework cannot guess your business rules.
- Which roles (Guest, User, Admin, Owner) have access?
- Are there row-level permissions (e.g., "users can only edit their own posts")?
- Does this feature interact with an existing authorization library (like Pundit or CanCanCan)?

### 2. Edge Case Slots (Minimum 3)
A good plan forces you to think about what goes wrong. You must explicitly define at least three edge cases:
- What happens if the user is not logged in or their session expires mid-action?
- What happens if the requested resource doesn't exist or was recently deleted?
- What happens if there is a concurrent modification (e.g., two admins editing the same record)?
- What happens if a required external API is down or times out?

### 3. UI State Matrix
For any interactive feature, define the four critical UI states. Do not assume the executing agent will invent a good user experience for failures.
- **Loading**: Skeleton loaders, spinners, or disabled buttons?
- **Success**: Inline flash messages, redirects, or Toast notifications?
- **Error**: Inline validation errors, form resets, or global error banners?
- **Empty**: What does the screen look like before any data exists? (e.g., "Empty state shows an illustration and a 'Create your first project' button").

### 4. Non-Standard Database Decisions
- Unusual indexes (e.g., partial indexes or composite unique constraints)
- Intentional denormalization for performance
- Complex foreign key constraints (e.g., `on_delete: :restrict_with_error`)

### 5. External Service Dependencies
- Webhook endpoints that need to be secured
- API rate limits to respect
- Actions that must be performed asynchronously in a background job

### 6. Data Migrations & Schema Changes
If the feature requires altering existing data, explicitly plan for zero-downtime migrations.
- How will existing records be backfilled?
- Will the migration lock the table? If so, how do we avoid downtime?
- Do we need a dual-writing phase before dropping a column?

### 7. Security & Compliance
- Rate limiting requirements for public endpoints
- Sensitive data handling (e.g., "Encrypt the API key at rest", "Filter the password from logs")
- PII (Personally Identifiable Information) considerations

### 8. Deviations from Team Conventions
If the plan requires doing something differently than the rest of the application, explicitly document the deviation and provide a rationale.
- Why are we using a custom SQL query instead of ActiveRecord?
- Why are we using a React component instead of a Hotwire frame?
- Why are we storing data in Redis instead of the primary PostgreSQL database?
- Without this explicit rationale, the executor will revert to the standard convention.

## What to OMIT from Plans

Do not waste tokens on things a senior Rails developer already knows.

- **Standard Rails validation syntax**: The executor knows `validates :email, presence: true`. Just say "Email is required and must be valid."
- **RESTful routing patterns**: The executor knows `resources :posts`. Just say "Standard RESTful routes for Posts."
- **Migration syntax**: The executor knows `rails g migration` and `t.references`. Just say "Add user_id to posts."
- **Association macros**: The executor knows `belongs_to` and `has_many`. Just say "A Post belongs to a User."
- **Standard testing structure**: The executor knows how to structure RSpec or Minitest files. Do not write out the test boilerplate in the plan.
- **Step-by-step terminal commands**: Do not list `git add`, `pytest`, `rspec`, or `rails test` commands. The executor knows how to run tests and commit code.
- **File paths**: Do not spell out `app/controllers/posts_controller.rb` unless it's a completely non-standard location.

## Plan Templates (Contrast)

Observe the difference between a verbose, overspecified plan and a good convention-lean plan.

### BAD (Overspecified & Verbose)

```markdown
### Task 1: Create Comments
- Run `rails generate model Comment body:text article:references user:references`
- Open `app/models/comment.rb` and add `validates :body, presence: true`
- Open `app/models/article.rb` and add `has_many :comments, dependent: :destroy`
- Open `app/models/user.rb` and add `has_many :comments, dependent: :destroy`
- Run `rails db:migrate`
- Create `app/controllers/comments_controller.rb` with `index`, `create`, `destroy` actions
- Open `config/routes.rb` and add `resources :comments, only: [:create, :destroy]` nested under articles
- Create a test file `test/controllers/comments_controller_test.rb`
- Write a failing test for Comment creation
- Implement the create action to make the test pass
- Run tests to verify with `rails test`
- Commit the changes with `git commit -m "feat: add comments"`
```

### GOOD (Convention-Lean)

```markdown
### Feature: Article Comments
- **Scope**: Comments on articles. Standard CRUD via Hotwire/Turbo.
- **Authorization**:
  - Guests: Can read comments.
  - Logged-in Users: Can create comments.
  - Authors: Can delete their own comments.
  - Admins: Can delete any comment.
- **Edge Cases**:
  1. Deleted user's comments should remain but show "Deleted User" as the author (nullify user_id on user deletion).
  2. Attempting to comment on a locked article should return a friendly error message, not a 500.
  3. Concurrent deletion: If an admin deletes a comment while the author is editing it, the author's save should fail gracefully.
- **UI States**:
  - Loading: Disable the submit button and show a small inline spinner.
  - Success: Append the new comment to the list via Turbo Stream, reset the form.
  - Error: Render inline validation errors below the comment form.
  - Empty: "No comments yet. Be the first to share your thoughts!"
- **Deviations/Notes**: No email notifications in v1. Keep it simple.
```

## Feature Spec Template

When writing a new plan, use this exact structure:

```markdown
# [Feature Name] Implementation Plan

**Goal:** [One sentence describing what this builds]
**Architecture:** [2-3 sentences about the approach, highlighting any deviations from standard Rails]

## Phase 1: [Phase Name] (e.g., Domain Model)
- **Scope**: [What is being built]
- **Authorization**: [Who can do what]
- **Edge Cases**:
  1. [What if X?]
  2. [What if Y?]
  3. [What if Z?]
- **UI States** (if applicable):
  - Loading: [Description]
  - Success: [Description]
  - Error: [Description]
  - Empty: [Description]
- **Deviations/Notes**: [Any non-standard decisions]

## Phase 2: [Phase Name] (e.g., User Interface)
...
```

## Gotchas

- **Missing domain skills**: Sparse plans only work if the executing agent loads domain skills. Ensure the `using-iron-horse` baseline is active or explicitly instruct the executor to use Rails conventions.
- **Confusing "convention-lean" with "no plan"**: Authorization rules and edge cases are ALWAYS required. Do not skip them just because the plan is "lean".
- **Under-specifying integrations**: Plans for external integrations (Stripe, OAuth, 3rd party APIs) need MORE detail, not less. Do not assume convention here, as external APIs have no standard convention. For example, explicitly plan out the webhook verification strategy.
- **Implicit state machines**: State machine logic and complex transitions always need explicit documentation and planning. Do not assume the executor will guess the correct state flow or side-effects of a state transition.
- **Ignoring the line count budget**: If a single phase of your plan will clearly require more than 400 lines of code changes, your plan is too coarse. Break it down into smaller phases.

## Validation

Before finalizing any plan, run through this checklist:

- [ ] Does the plan specify an explicit authorization matrix?
- [ ] Are there at least 3 explicitly defined edge cases?
- [ ] Are all 4 UI states (Loading/Success/Error/Empty) defined for interactive features?
- [ ] Are standard Rails conventions (validations, migrations, routing) omitted?
- [ ] Are all deviations from conventions explicitly justified?
- [ ] Will each phase result in a PR under the 400-line budget?

<related-skills>
  <skill name="models" reason="Model conventions dictate how to structure the database layer." />
  <skill name="controllers" reason="Controller conventions dictate how to handle routing and requests." />
  <skill name="testing" reason="Testing conventions dictate how to verify the implementation." />
</related-skills>