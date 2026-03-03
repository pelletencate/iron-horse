# TEAM_RULES.md — Engineering Standards & Governance

**Philosophy:** 37signals-inspired Rails development — Simple, pragmatic, conventional

---

## Core Principles

1. **Convention over Configuration** — Follow Rails conventions religiously
2. **Simplicity over Cleverness** — Obvious code beats clever code
3. **Delete code, don't add it** — The best code is no code
4. **Ship working software** — Done is better than perfect

---

## Code Organization

## Rule 1: Dependency Direction — Controller → Service → Model

**NEVER**: Call a service from a model. Models are the persistence layer only.

**Why**: Bidirectional dependencies create circular coupling, making code untestable and impossible to reason about.

**Bad:**
```ruby
# app/models/order.rb
class Order < ApplicationRecord
  after_create { OrderNotificationService.new(self).notify }
end
```

**Good:**
```ruby
# app/controllers/orders_controller.rb
class OrdersController < ApplicationController
  def create
    @order = Order.create!(order_params)
    OrderNotificationService.new(@order).notify
    redirect_to @order
  end
end
```

---

## Rule 2: Fat Models, Thin Controllers

**ALWAYS**: Put business logic in models. Controllers coordinate only.

**Why**: Logic in models is easier to test, reuse, and reason about. Controllers should be thin orchestration layers.

**Bad:**
```ruby
class OrdersController < ApplicationController
  def create
    @order = Order.new(order_params)
    @order.total = @order.line_items.sum(&:price) * (1 - @order.discount_rate)
    @order.status = @order.total > 1000 ? "review" : "confirmed"
    @order.save!
  end
end
```

**Good:**
```ruby
class Order < ApplicationRecord
  before_save :calculate_total, :assign_status

  private

  def calculate_total
    self.total = line_items.sum(&:price) * (1 - discount_rate)
  end

  def assign_status
    self.status = total > 1000 ? "review" : "confirmed"
  end
end
```

---

## Rule 3: RESTful Routes Only

**NEVER**: Add custom `member` or `collection` routes. Create a child controller instead.

**Why**: REST forces good design. Custom actions are a code smell indicating a missing resource.

**Bad:**
```ruby
resources :feedbacks do
  member { post :publish }
  collection { get :archived }
end
```

**Good:**
```ruby
resources :feedbacks, only: [:index, :show, :new, :create] do
  resource :publication, only: [:create], module: :feedbacks
end
```

---

## Rule 4: Proper Namespacing

**ALWAYS**: Use module namespacing for nested entities. Use `User::Setting`, not `UserSetting`.

**Why**: Clear organization, prevents naming conflicts, shows ownership relationships.

**Bad:**
```ruby
# app/models/user_setting.rb
class UserSetting < ApplicationRecord; end

# app/controllers/user_settings_controller.rb
class UserSettingsController < ApplicationController; end
```

**Good:**
```ruby
# app/models/user/setting.rb
class User::Setting < ApplicationRecord; end

# app/controllers/users/settings_controller.rb
module Users
  class SettingsController < ApplicationController; end
end
```

---

## Rule 5: Raise on Failure

**NEVER**: Return `false` or `nil` from service objects to indicate failure. Use bang methods and raise exceptions.

**Why**: Silent failures hide bugs. Explicit exceptions surface problems immediately and provide stack traces. Rescue at the controller or job boundary.

**Bad:**
```ruby
class CreateOrder
  def call
    order = Order.new(params)
    return false unless order.save
    return false unless charge_payment(order)
    order
  end
end
```

**Good:**
```ruby
class CreateOrder
  def call
    order = Order.create!(params)
    charge_payment!(order)
    order
  end
end

# Rescue at the boundary
class OrdersController < ApplicationController
  def create
    @order = CreateOrder.new(order_params).call
    redirect_to @order
  rescue ActiveRecord::RecordInvalid => e
    @order = e.record
    render :new, status: :unprocessable_entity
  end
end
```

---

## Rule 6: Don't Over-Engineer (YAGNI)

**NEVER**: Create service objects, decorators, or presenters unless pain is real and measured.

**Why**: Premature abstraction wastes time and adds complexity. Extract patterns when you feel the pain, not before.

---

## Rule 7: Be Concise — Code Is Self-Documenting

**NEVER**: Write comments that explain "what" code does. Only comment "why."

**Why**: Good code is self-documenting. Redundant comments rot faster than the code they describe.

**Bad:**
```ruby
# Calculate the total price by summing line items
total = line_items.sum(&:price)
```

**Good:**
```ruby
# Discount applied post-tax per accounting policy (see ACCT-2024-03)
total = line_items.sum(&:price) * (1 - tax_adjusted_discount)
```

---

## Testing

## Rule 8: Minitest Only

**NEVER**: Use RSpec. Use Minitest for all tests (`Minitest::Test`, `ActiveSupport::TestCase`).

**Why**: Minitest is simple, fast, and part of Ruby's standard library. RSpec adds unnecessary DSL complexity.

---

## Rule 9: No Live HTTP in Tests

**ALWAYS**: Stub all external HTTP requests with WebMock.

**Why**: Live HTTP in tests = slow, flaky, and dependent on external services.

```ruby
stub_request(:post, "https://api.example.com/webhooks")
  .with(body: hash_including(event: "feedback.created"))
  .to_return(status: 200, body: { success: true }.to_json)
```

---

## Rule 10: Integration Tests over System Tests

**NEVER**: Use `ApplicationSystemTestCase`. Use integration tests with Capybara instead.

**Why**: Integration tests provide the same coverage with better performance and simpler setup.

**Bad:**
```ruby
class FeedbackSystemTest < ApplicationSystemTestCase; end
```

**Good:**
```ruby
class FeedbackFlowTest < ActionDispatch::IntegrationTest
  include Capybara::DSL
end
```

---

## Security

## Rule 11: Return 404 Not 403

**NEVER**: Return `403 Forbidden` for unauthorized access — return `404 Not Found`.

**Why**: Returning 403 reveals that a resource exists, enabling enumeration attacks. A 404 reveals nothing.

**Bad:**
```ruby
def show
  @document = Document.find(params[:id])
  head :forbidden unless @document.accessible_by?(current_user)
end
```

**Good:**
```ruby
def show
  @document = current_user.accessible_documents.find_by!(id: params[:id])
  # Raises ActiveRecord::RecordNotFound → 404 automatically
end
```

---

## Rule 12: Think in Scopes, Not Permissions

**ALWAYS**: Implement authorization as scoped queries. `Post.visible_to(current_user)`, not `if current_user.admin?`.

**Why**: Scoped queries are composable, testable, and impossible to accidentally bypass. Conditional permission checks scatter authorization logic everywhere.

**Bad:**
```ruby
def index
  @posts = Post.all
  @posts = @posts.where(published: true) unless current_user.admin?
end
```

**Good:**
```ruby
# app/models/post.rb
scope :visible_to, ->(user) {
  user.admin? ? all : where(published: true)
}

# app/controllers/posts_controller.rb
def index
  @posts = Post.visible_to(current_user)
end
```

---

## Rule 13: Strong Parameters — No Mass Assignment

**ALWAYS**: Use strong parameters. Never pass raw params to model methods.

**Why**: Mass assignment vulnerabilities let attackers set fields you didn't intend (role, admin flag, etc.).

---

## Database

## Rule 14: Use the Solid Stack (Rails 8 Defaults)

**NEVER**: Add Sidekiq, Redis, or Memcached. Use SolidQueue, SolidCache, and SolidCable.

**Why**: Rails 8 provides excellent defaults. External dependencies add operational complexity without proportional benefit for most applications.

---

## Rule 15: Hash#dig for Nested Access

**ALWAYS**: Use `Hash#dig` for nested hash access where intermediate keys might be nil.

**Why**: Chained bracket access (`hash[:a][:b][:c]`) raises `NoMethodError` on nil intermediates. `dig` returns `nil` safely.

**Bad:**
```ruby
theme = user[:profile][:settings][:theme]
```

**Good:**
```ruby
theme = user.dig(:profile, :settings, :theme)
```

---

## Rule 16: No Premature Optimization

**NEVER**: Add caching, eager loading, or indexes "just in case." Optimize what you measure.

**Why**: Premature optimization adds complexity without evidence of benefit. Profile first, optimize second.

---

## Frontend

## Rule 17: Turbo Morph by Default

**ALWAYS**: Prefer Turbo Morph (page refresh with morphing) over Turbo Frames for general updates.

**Why**: Turbo Morph preserves scroll position, focus, and DOM state. Frames replace content and lose state. Use Frames only for modals, inline editing, tabs, or pagination.

---

## Rule 18: ViewComponent for Reusable UI

**ALWAYS**: Use ViewComponent for reusable UI elements. Partials are for simple, one-off fragments only.

**Why**: ViewComponents are testable, encapsulated, and 10x faster than partials. They enforce a clear interface via constructor arguments.

---

## Rule 19: Progressive Enhancement

**ALWAYS**: Ensure all features work without JavaScript. Layer JS on top for better UX.

**Why**: Server-rendered HTML is accessible, reliable, and works on all devices. JavaScript enhances; it should never be required.

---

## Process

## Rule 20: CI Must Pass Before Merge

**NEVER**: Merge code with failing CI. All checks (tests, linting, security scans) must be green.

**Why**: A broken build affects the entire team. One failing test today is ten failing tests tomorrow.

---

## Rule 21: Double Quotes for Strings

**ALWAYS**: Use double quotes for Ruby strings. Enforced by RuboCop.

**Why**: Consistency. One less decision to make. Exception: strings containing double quotes.

---

## Rule 22: Reduce Complexity Always

**ALWAYS**: Prefer deleting code over adding it. Flatten nested structures. Use Rails conventions instead of reinventing.

**Why**: Every line of code is a liability. Simpler code has fewer bugs, is easier to read, and costs less to maintain.

---

## Quick Reference

| # | Rule | NEVER/ALWAYS |
|---|------|--------------|
| 1 | Dependency Direction | NEVER call services from models |
| 2 | Fat Models, Thin Controllers | ALWAYS put logic in models |
| 3 | RESTful Routes Only | NEVER add custom member/collection routes |
| 4 | Proper Namespacing | ALWAYS use module namespacing |
| 5 | Raise on Failure | NEVER return false/nil for errors |
| 6 | Don't Over-Engineer | NEVER create abstractions preemptively |
| 7 | Be Concise | NEVER comment "what", only "why" |
| 8 | Minitest Only | NEVER use RSpec |
| 9 | No Live HTTP in Tests | ALWAYS stub external requests |
| 10 | Integration over System Tests | NEVER use ApplicationSystemTestCase |
| 11 | Return 404 Not 403 | NEVER reveal resource existence |
| 12 | Think in Scopes | ALWAYS use scoped queries for authz |
| 13 | Strong Parameters | ALWAYS use strong parameters |
| 14 | Solid Stack | NEVER add Redis/Sidekiq/Memcached |
| 15 | Hash#dig | ALWAYS use dig for nested access |
| 16 | No Premature Optimization | NEVER optimize without measurement |
| 17 | Turbo Morph Default | ALWAYS prefer Morph over Frames |
| 18 | ViewComponent for UI | ALWAYS use ViewComponent for reusable UI |
| 19 | Progressive Enhancement | ALWAYS ensure no-JS functionality |
| 20 | CI Must Pass | NEVER merge with failing CI |
| 21 | Double Quotes | ALWAYS use double quotes for strings |
| 22 | Reduce Complexity | ALWAYS prefer less code |
