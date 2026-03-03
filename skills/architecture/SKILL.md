---
name: architecture
description: Guide Rails code organization decisions — where code belongs, layer interactions, and when to extract patterns like service objects, query objects, and presenters
triggers:
  - architecture decision
  - where should this code go
  - code organization
  - service object
  - query object
  - presenter
  - layer interaction
  - refactor fat model
  - refactor fat controller
  - design patterns
---

# Architecture

## When to use this skill

- Deciding where new code belongs (model, service, query, presenter, etc.)
- Refactoring fat models or fat controllers
- Designing a new feature's code organization
- Choosing between patterns (service object vs concern vs query object)
- Understanding layer interaction rules (who calls whom)
- Evaluating whether an abstraction is warranted or premature

## Principles

1. **Convention over configuration** — follow Rails defaults until you have a concrete reason not to. The framework already solves most organizational questions.
2. **Skinny controllers, rich models, smart services** — controllers parse params and delegate. Models own persistence, validations, and simple derived data. Services own multi-step business logic.
3. **Extract when it hurts, not before** — don't create a service object for a three-line `update`. Extract when complexity, reuse, or testability demands it.
4. **One direction only** — data flows down the layer stack. Controllers call services; services call models. Never the reverse.
5. **Single responsibility per file** — each class does one thing. A service creates an order. A query fetches dashboard stats. A presenter formats dates.
6. **Test follows structure** — every architectural layer has a corresponding test type. If you can't unit-test it in isolation, the boundaries are wrong.

## Architecture Decision Tree

Use this to determine where new code belongs:

```
Where should this code go?
│
├─ Pure data persistence?
│   ├─ Validations, associations, scopes?     → Model (app/models/)
│   └─ Shared behavior across models?         → Concern (app/models/concerns/)
│
├─ Complex business logic?
│   ├─ Single operation, multi-model?          → Service Object (app/services/)
│   ├─ Multi-step workflow / orchestration?    → Service Object (app/services/)
│   └─ External API integration?              → Client + Service (app/clients/, app/services/)
│
├─ Complex database query?
│   ├─ Reporting / aggregation?               → Query Object (app/queries/)
│   ├─ Multi-join search with filters?        → Query Object (app/queries/)
│   └─ Simple filter (1-2 conditions)?        → Model scope (keep in model)
│
├─ View-specific formatting?
│   ├─ Status badges, formatted dates?        → Presenter (app/presenters/)
│   ├─ Simple text helper?                    → Helper (app/helpers/)
│   └─ Reusable UI component with logic?      → ViewComponent (app/components/)
│
├─ Authorization logic?
│   └─ Who can do what?                       → Policy (app/policies/)
│       (use simple scope-based checks;
│        Pundit optional, not required)
│
├─ Async / background work?
│   └─ Deferred processing?                  → Job (app/jobs/, via SolidQueue)
│
├─ Form wrapping multiple models?
│   └─ Multi-model or wizard form?            → Form Object (app/forms/)
│
├─ Shared controller behavior?
│   └─ Authentication, pagination, etc.?      → Concern (app/controllers/concerns/)
│
└─ Everything else?
    └─ → Model, Controller, or View (follow Rails conventions)
```

## Layer Interaction Rules

### Request Flow

```
┌──────────────────────────────────────────────────────────────┐
│                         REQUEST                              │
└────────────────────────────┬─────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  CONTROLLER                                                  │
│  • Authenticate & authorize                                  │
│  • Parse params                                              │
│  • Delegate to Service / Query / Model                       │
│  • Render response                                           │
└─────────┬──────────────────────────────────┬─────────────────┘
          │                                  │
          ▼                                  ▼
┌─────────────────────┐           ┌─────────────────────┐
│  SERVICE OBJECT     │           │  QUERY OBJECT       │
│  • Business logic   │           │  • Complex reads    │
│  • Orchestration    │           │  • Aggregations     │
│  • Transactions     │           │  • Search/filter    │
└─────────┬───────────┘           └─────────┬───────────┘
          │                                  │
          ▼                                  ▼
┌──────────────────────────────────────────────────────────────┐
│  MODEL                                                       │
│  • Validations  • Associations  • Scopes  • Callbacks        │
└────────────────────────────┬─────────────────────────────────┘
                             │
          ┌──────────────────┴──────────────────┐
          ▼                                     ▼
┌─────────────────────┐              ┌─────────────────────┐
│  PRESENTER          │              │  VIEW / COMPONENT   │
│  • Display logic    │              │  • Rendering        │
│  • Formatting       │              │  • Templates        │
└─────────────────────┘              └─────────────────────┘
```

### Who Can Call Whom

```
Controller  → Service, Query, Policy, Form, Model
Service     → Model, Query, Job, Mailer  (never other Services in chains)
Query       → Model (read-only)
Job         → Service, Mailer
Presenter   → Model (read-only, formatting only)
Component   → Presenter, Model (read-only)
```

### Forbidden Calls (Never Do This)

| Caller | Must NEVER call | Why |
|--------|----------------|-----|
| Model | Service, Controller, Job | Models are passive data; no upward dependencies |
| Service | Controller | Services don't know about HTTP |
| Presenter | Service, Job | Presenters have no side effects |
| Query | Service, Job | Queries are read-only |

## Patterns

### Service Object

Place in `app/services/`, namespace by domain. Single public `call` method. Return a Result object. Raise or return failure on error.

```ruby
# app/services/orders/create_service.rb
module Orders
  class CreateService
    def call(user:, items:)
      order = nil

      ActiveRecord::Base.transaction do
        order = user.orders.create!(status: :pending)
        items.each { |item| order.line_items.create!(item) }
      end

      Result.new(success: true, data: order)
    rescue ActiveRecord::RecordInvalid => e
      Result.new(success: false, error: e.message)
    end
  end
end

# Controller usage:
result = Orders::CreateService.new.call(user: current_user, items: order_params[:items])
if result.success?
  redirect_to result.data, notice: t(".success")
else
  flash.now[:alert] = result.error
  render :new, status: :unprocessable_entity
end
```

**When to use:** logic spans multiple models, external API calls, reused across controllers/jobs, controller action > 15 lines of logic.

**When NOT to use:** simple CRUD (< 10 lines), single-model update with no side effects.

### Query Object

Place in `app/queries/`. Accept a scope or account, return an `ActiveRecord::Relation` (chainable) or a data hash for aggregations.

```ruby
# app/queries/active_events_query.rb
class ActiveEventsQuery
  def initialize(account:)
    @account = account
  end

  def call(date_range: nil)
    scope = @account.events.where(status: :active)
    scope = scope.where(event_date: date_range) if date_range
    scope.includes(:venue, :vendors).order(event_date: :asc)
  end
end

# Controller usage:
@events = ActiveEventsQuery.new(account: current_account).call.page(params[:page])
```

**When to use:** query joins 3+ tables, complex filters with multiple optional conditions, dashboard aggregations, search with sanitization.

**When NOT to use:** simple scope with 1-2 conditions (keep as model scope).

### Presenter / Decorator

Place in `app/presenters/`. Wraps a model instance. Only contains formatting and display methods — no persistence, no side effects.

```ruby
# app/presenters/event_presenter.rb
class EventPresenter < SimpleDelegator
  STATUS_COLORS = {
    draft: "bg-slate-100 text-slate-800",
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800"
  }.freeze

  def status_badge
    helpers.tag.span(status.titleize,
      class: "px-2 py-1 rounded-full text-xs font-medium #{STATUS_COLORS[status.to_sym]}")
  end

  def formatted_date
    event_date ? I18n.l(event_date, format: :long) : "TBD"
  end

  private

  def helpers
    ActionController::Base.helpers
  end
end
```

**When to use:** status badges, formatted dates/currencies, conditional display logic.

**When NOT to use:** basic text that `l()` or `number_to_currency` handles inline.

### Form Object

Place in `app/forms/`. Use `ActiveModel::API` for validation. Wraps multi-model persistence in a transaction.

```ruby
# app/forms/registration_form.rb
class RegistrationForm
  include ActiveModel::API
  include ActiveModel::Attributes

  attribute :name, :string
  attribute :email, :string
  attribute :company_name, :string

  validates :name, :email, :company_name, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }

  def save
    return false unless valid?
    ActiveRecord::Base.transaction do
      user = User.create!(name: name, email: email)
      Company.create!(name: company_name, owner: user)
    end
    true
  rescue ActiveRecord::RecordInvalid => e
    errors.add(:base, e.message)
    false
  end
end
```

### Concern

Place in `app/models/concerns/` or `app/controllers/concerns/`. Keep single-purpose. Use `extend ActiveSupport::Concern`.

```ruby
# app/models/concerns/searchable.rb
module Searchable
  extend ActiveSupport::Concern

  included do
    scope :search, ->(query) {
      return none if query.blank?
      where("name ILIKE ?", "%#{sanitize_sql_like(query)}%")
    }
  end
end
```

**When to use:** shared validations, common scopes (Searchable, Sluggable), shared callbacks (HasUuid).

**When NOT to use:** dumping unrelated methods to shrink a model file — that just hides complexity.

## Project Directory Structure

```
app/
├── channels/            # Action Cable channels
├── clients/             # External API wrappers
├── components/          # ViewComponents
├── controllers/
│   └── concerns/        # Shared controller behavior
├── forms/               # Form objects (ActiveModel::API)
├── helpers/             # Simple view helpers
├── jobs/                # Background jobs (SolidQueue)
├── mailers/             # Email composition
├── models/
│   └── concerns/        # Shared model behavior
├── policies/            # Authorization (scope-based or Pundit)
├── presenters/          # View formatting / decorators
├── queries/             # Complex database queries
├── services/            # Business logic
└── views/
```

## When to Extract (and When Not To)

| Signal | Action |
|--------|--------|
| Controller action > 15 lines of logic | Extract to service object |
| Model > 300 lines | Extract concerns or service objects |
| Same code in 3+ places | Extract to concern / service / shared module |
| Query joins 3+ tables or has complex filters | Extract to query object |
| View logic with conditionals and formatting | Extract to presenter |
| Form spans multiple models | Extract to form object |

### Signs of Over-Engineering (Keep It Simple)

| Situation | Just use... | Don't create... |
|-----------|-------------|-----------------|
| Simple CRUD (< 10 lines) | Controller inline | Service object |
| Single-model update, no side effects | `@model.update(params)` | Service object |
| Simple query with 1-2 conditions | Model scope | Query object |
| Basic text formatting | Helper or `l()` | Presenter class |
| Single-model form | `form_with model:` | Form object |

## Testing Strategy by Layer

| Layer | Test Type | Focus |
|-------|-----------|-------|
| Model | Unit (model spec) | Validations, scopes, associations |
| Service | Unit | Business logic, Result success/failure |
| Query | Unit | Correct results, tenant isolation, N+1 |
| Presenter | Unit | Formatting output |
| Controller | Request spec | HTTP status, redirects, integration |
| Form | Unit | Validation, multi-model persistence |
| Policy | Unit | Authorization rules per role |
| Job | Unit | Side effects, enqueue behavior |

## Gotchas

- **Don't chain services** — if `ServiceA` calls `ServiceB` calls `ServiceC`, you've built a hidden dependency graph. Have the controller or a single orchestrator service coordinate instead.
- **Don't put query logic in controllers** — `where(...).joins(...).order(...)` scattered in controller actions is a maintenance nightmare. Use scopes or query objects.
- **Don't use `default_scope`** — it silently affects all queries, including `count`, associations, and joins. Use explicit named scopes.
- **Don't reach upward** — a model that calls a service or a service that calls a controller violates the layer hierarchy and creates circular dependencies.
- **Don't extract prematurely** — creating `UserNameFormatterService` for `user.name.titleize` adds complexity without value. Extract when there's a real reason.
- **Don't confuse concerns with junk drawers** — a concern named `UserHelpers` with 15 unrelated methods just hides fat-model problems. Each concern should be a single, cohesive behavior.

## Validation

- [ ] Each class has a single, clear responsibility
- [ ] Layer interaction rules are respected (no upward calls)
- [ ] Controllers are thin (authenticate, parse params, delegate, render)
- [ ] Models contain only persistence logic (validations, associations, scopes, callbacks)
- [ ] Services return consistent Result objects
- [ ] Query objects return `ActiveRecord::Relation` (chainable)
- [ ] No premature abstractions (simple CRUD stays in controller)
- [ ] All new directories exist in expected locations under `app/`
- [ ] Each layer has corresponding tests

<related-skills>
  <skill name="models" reason="Models are the persistence layer; architecture decides when to keep logic there vs extracting" />
  <skill name="controllers" reason="Controllers are the entry point; architecture decides how thin they should be" />
  <skill name="testing" reason="Each architectural layer maps to a specific test strategy" />
  <skill name="solid-stack" reason="Background jobs (SolidQueue) are a key architectural layer for async work" />
</related-skills>
