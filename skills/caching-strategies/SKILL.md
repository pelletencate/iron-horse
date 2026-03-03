---
name: caching-strategies
description: Implements Rails caching patterns — fragment, Russian doll, HTTP, low-level, and SolidCache — for performance optimization
triggers:
  - caching
  - fragment caching
  - Russian doll caching
  - cache invalidation
  - HTTP caching
  - ETags
  - SolidCache
  - cache keys
  - performance optimization
  - low-level caching
  - cache expiration
---

# Caching Strategies for Rails 8

## When to use this skill

- Adding fragment caching to expensive view partials
- Implementing Russian doll (nested) caching with `touch: true`
- Setting up HTTP caching with `stale?`, `fresh_when`, ETags, or `Last-Modified`
- Configuring SolidCache (Rails 8 default) or other cache stores
- Designing cache key strategies with `cache_key_with_version`
- Building low-level caching with `Rails.cache.fetch`
- Planning cache invalidation and expiration strategies
- Replacing action caching with fragment caching patterns
- Adding counter caches to avoid repeated COUNT queries

## Principles

1. **SolidCache first** — Rails 8 defaults to SolidCache (SQLite/database-backed). Use it unless you have a proven need for Redis or Memcached.
2. **Fragment over action caching** — action caching is removed from Rails core. Fragment caching is more granular, composable, and cache-store agnostic.
3. **Key-based expiration over manual invalidation** — let `cache_key_with_version` (model ID + `updated_at`) auto-expire stale entries instead of manually deleting keys.
4. **Russian doll with `touch: true`** — nested caches cascade invalidation through associations. Always add `touch: true` on `belongs_to` for parent cache busting.
5. **Cache the expensive, not everything** — profile first. Cache partials that hit the database, run calculations, or render complex markup. Don't cache trivial HTML.
6. **HTTP caching is free performance** — use `stale?` and `fresh_when` for conditional GETs. Browsers and CDNs respect ETags and `Last-Modified` without extra infrastructure.

## Cache Store Configuration

### Rails 8 Default: SolidCache

```ruby
# config/environments/production.rb
config.cache_store = :solid_cache_store  # Database-backed, no Redis needed

# config/environments/development.rb
config.cache_store = :memory_store
```

Enable caching in development:

```bash
bin/rails dev:cache
```

### Store Comparison

| Store | Best For | Trade-off |
|-------|----------|-----------|
| `:solid_cache_store` | Production (Rails 8 default) | Database-backed, no extra infra |
| `:memory_store` | Development / testing | Not shared across processes |
| `:redis_cache_store` | High-throughput production | Requires Redis infrastructure |
| `:file_store` | Simple single-server deploys | Slow, not shared across hosts |
| `:null_store` | Testing without caching | No caching at all |

## Fragment Caching

### Basic Fragment Cache

```erb
<%# app/views/events/_event.html.erb %>
<% cache event do %>
  <article class="event-card">
    <h3><%= event.name %></h3>
    <p><%= event.description %></p>
    <time><%= l(event.event_date, format: :long) %></time>
  </article>
<% end %>
```

Rails generates cache keys automatically from model name, ID, `updated_at`, and template digest.

### Custom Cache Keys

```erb
<%# Version-specific cache %>
<% cache [event, "v2"] do %>
  ...
<% end %>

<%# User-dependent content %>
<% cache [event, current_user] do %>
  ...
<% end %>

<%# Date-scoped cache %>
<% cache "featured-events-#{Date.current}" do %>
  <%= render @featured_events %>
<% end %>
```

### Collection Caching

```erb
<%# Caches each item individually — multi-read optimization %>
<%= render partial: "events/event", collection: @events, cached: true %>

<%# With custom cache key %>
<%= render partial: "events/event",
           collection: @events,
           cached: ->(event) { [event, current_user.admin?] } %>
```

## Russian Doll Caching

Nested caches where inner fragments survive outer cache invalidation:

```erb
<%# app/views/events/show.html.erb %>
<% cache @event do %>
  <h1><%= @event.name %></h1>

  <section class="vendors">
    <% @event.vendors.each do |vendor| %>
      <% cache vendor do %>
        <%= render partial: "vendors/card", locals: { vendor: vendor } %>
      <% end %>
    <% end %>
  </section>
<% end %>
```

### Cascade Invalidation with `touch: true`

```ruby
class Comment < ApplicationRecord
  belongs_to :event, touch: true  # Updates event.updated_at on comment change
end

class EventVendor < ApplicationRecord
  belongs_to :event, touch: true
  belongs_to :vendor
end
```

When a comment is saved, `event.updated_at` updates → outer cache key changes → outer fragment re-renders, but unchanged inner vendor fragments are served from cache.

## Low-Level Caching

### `Rails.cache.fetch`

```ruby
# Fetch with block — reads cache or executes block and caches result
Rails.cache.fetch("stats/#{Date.current}", expires_in: 1.hour) do
  {
    total_events: Event.count,
    total_revenue: Order.sum(:total_cents)
  }
end

# Read / write / delete directly
stats = Rails.cache.read("stats/#{Date.current}")
Rails.cache.write("stats/#{Date.current}", stats, expires_in: 1.hour)
Rails.cache.delete("stats/#{Date.current}")
```

### In Service Objects

```ruby
class DashboardStatsService
  CACHE_TTL = 15.minutes

  def call(account:)
    Rails.cache.fetch(cache_key(account), expires_in: CACHE_TTL) do
      calculate_stats(account)
    end
  end

  def invalidate(account:)
    Rails.cache.delete(cache_key(account))
  end

  private

  def cache_key(account)
    "dashboard_stats/#{account.id}"
  end

  def calculate_stats(account)
    {
      events_count: account.events.count,
      upcoming_events: account.events.upcoming.count,
      total_revenue: account.orders.sum(:total_cents)
    }
  end
end
```

## Cache Invalidation Strategies

### Key-Based Expiration (Preferred)

Cache key includes timestamp — auto-expires when model changes:

```ruby
# Rails does this automatically in fragment caching via cache_key_with_version
# For low-level caching, include version in key:
Rails.cache.fetch("event/#{event.cache_key_with_version}") { ... }
```

### Time-Based Expiration

```ruby
Rails.cache.fetch("key", expires_in: 1.hour) { ... }
```

### Manual Invalidation

```ruby
class Event < ApplicationRecord
  after_commit :invalidate_caches

  private

  def invalidate_caches
    Rails.cache.delete("featured_events")
    Rails.cache.delete("dashboard_stats/#{account_id}")
  end
end
```

### Pattern-Based Deletion

```ruby
# Works with Redis cache store:
Rails.cache.delete_matched("dashboard/*")

# For SolidCache, delete keys explicitly:
Rails.cache.delete("dashboard/#{account_id}/stats")
Rails.cache.delete("dashboard/#{account_id}/events")
```

## HTTP Caching

### Conditional GET with `stale?`

```ruby
class EventsController < ApplicationController
  def show
    @event = Event.find(params[:id])

    # Returns 304 Not Modified if ETag/Last-Modified unchanged
    if stale?(@event)
      respond_to do |format|
        format.html
        format.json { render json: @event }
      end
    end
  end

  def index
    @events = current_account.events.recent

    if stale?(etag: @events, last_modified: @events.maximum(:updated_at))
      render :index
    end
  end
end
```

### `fresh_when` (Shorthand)

```ruby
def show
  @event = Event.find(params[:id])
  fresh_when(@event)  # Sets ETag + Last-Modified, renders normally if stale
end
```

### Cache-Control Headers

```ruby
class Api::EventsController < Api::BaseController
  def show
    @event = Event.find(params[:id])

    expires_in 1.hour, public: true   # CDN can cache
    # OR
    expires_in 15.minutes, private: true  # Browser only

    render json: @event
  end
end
```

## Counter Caching

Avoid N+1 COUNT queries with built-in counter caches:

```ruby
# Migration
add_column :events, :vendors_count, :integer, default: 0, null: false

# Model
class Vendor < ApplicationRecord
  belongs_to :event, counter_cache: true
end

# Usage — no query needed
event.vendors_count  # reads column, not COUNT(*)
```

## Testing Caching

### RSpec Configuration

```ruby
# spec/rails_helper.rb
RSpec.configure do |config|
  config.around(:each, :caching) do |example|
    caching = ActionController::Base.perform_caching
    ActionController::Base.perform_caching = true
    Rails.cache.clear
    example.run
    ActionController::Base.perform_caching = caching
  end
end
```

### Testing Cache Invalidation

```ruby
RSpec.describe DashboardStatsService do
  describe "#invalidate", :caching do
    it "clears the cache" do
      account = create(:account)
      service = described_class.new

      service.call(account: account)
      service.invalidate(account: account)

      expect(Rails.cache.exist?("dashboard_stats/#{account.id}")).to be false
    end
  end
end
```

## Performance Monitoring

```ruby
# Enable fragment cache logging
# config/environments/production.rb
config.action_controller.enable_fragment_cache_logging = true

# Subscribe to cache events for custom monitoring
ActiveSupport::Notifications.subscribe("cache_read.active_support") do |*args|
  event = ActiveSupport::Notifications::Event.new(*args)
  Rails.logger.info "Cache #{event.payload[:hit] ? 'HIT' : 'MISS'}: #{event.payload[:key]}"
end
```

## Gotchas

- **`delete_matched` is not supported by all stores** — SolidCache and MemoryStore don't support glob patterns. Delete keys explicitly or use key-based expiration instead.
- **`touch: true` can cascade widely** — a deeply nested `touch: true` chain can update timestamps on many records. Profile the write amplification.
- **Don't cache user-specific content in shared fragments** — include `current_user` in the cache key, or split into shared and per-user fragments.
- **Fragment caching hides N+1 queries** — the first (uncached) request still runs all queries. Eager load even inside cached partials.
- **Don't use Redis/Memcached by default** — SolidCache is the Rails 8 default and eliminates external dependencies. Only switch if benchmarks justify it.
- **Cache in development can confuse you** — run `bin/rails dev:cache` to toggle. Check `tmp/caching-dev.txt` exists to confirm caching is active.

## Validation

- [ ] Cache store configured per environment (`solid_cache_store` for production)
- [ ] Fragment caching applied to expensive partials with measurable impact
- [ ] `touch: true` set on `belongs_to` associations for Russian doll caching
- [ ] Collection rendering uses `cached: true` where appropriate
- [ ] Low-level caching has explicit `expires_in` or key-based expiration
- [ ] HTTP caching (`stale?` / `fresh_when`) used in read-heavy controllers
- [ ] Counter caches added for frequently counted associations
- [ ] Cache invalidation strategy documented and tested
- [ ] Frontmatter contains only name, description, triggers (no forbidden fields)
- [ ] Tests pass with caching enabled (`:caching` tag)

<related-skills>
  <skill name="models" reason="Cache invalidation via touch: true and counter_cache are model-level concerns" />
  <skill name="controllers" reason="HTTP caching (stale?, fresh_when) is implemented in controllers" />
  <skill name="testing" reason="Caching behavior needs dedicated tests with caching enabled" />
  <skill name="background-jobs" reason="Cache warming and async invalidation often use background jobs" />
</related-skills>
