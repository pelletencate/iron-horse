---
name: solid-stack
description: Use when setting up background jobs, caching, or WebSockets — SolidQueue, SolidCache, SolidCable (NEVER Sidekiq/Redis)
triggers:
  - background jobs
  - SolidQueue
  - SolidCache
  - SolidCable
  - job processing
  - caching
  - ActionCable WebSockets
  - mission control jobs
  - queue configuration
  - migrating from Sidekiq or Redis
---

# Solid Stack

Configure background job processing, caching, and WebSockets using Rails 8 defaults — SolidQueue, SolidCache, and SolidCable. Zero external dependencies, database-backed, production-ready.

## When to use this skill

- Setting up any new Rails 8+ application's background infrastructure
- Background job processing (NEVER Sidekiq/Redis)
- Application caching (NEVER Redis/Memcached)
- WebSocket / ActionCable setup (NEVER Redis)
- Migrating from Redis/Sidekiq to Solid Stack
- Async job execution (emails, uploads, reports)
- Real-time features via ActionCable
- Monitoring jobs with Mission Control dashboard

## Principles

1. **NEVER Sidekiq/Redis** — always use SolidQueue, SolidCache, SolidCable. Reject any request to add `sidekiq` or `redis` gems.
2. **Separate databases** — dedicated SQLite databases for queue, cache, and cable. Never share with primary.
3. **Prioritize queues** — critical and mailers before default in production.
4. **Pass IDs, not objects** — always pass record IDs to jobs to avoid serialization issues.
5. **Retry with backoff** — use `retry_on` with exponential backoff for transient failures; `discard_on` for permanent ones.
6. **Monitor proactively** — use Mission Control dashboard and health-check endpoints to catch stuck/failed jobs early.

## SolidQueue

### Setup

```ruby
# config/environments/{development,production}.rb
Rails.application.configure do
  config.active_job.queue_adapter = :solid_queue
  config.solid_queue.connects_to = { database: { writing: :queue } }
end
```

```yaml
# config/database.yml
default: &default
  adapter: sqlite3
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  timeout: 5000

production:
  primary:
    <<: *default
    database: storage/production.sqlite3
  queue:
    <<: *default
    database: storage/production_queue.sqlite3
    migrations_paths: db/queue_migrate
```

### Queue prioritization (production)

```yaml
# config/queue.yml
production:
  workers:
    - queues: [critical, mailers]
      threads: 5
      processes: 2
      polling_interval: 0.1
    - queues: [default]
      threads: 3
      processes: 2
      polling_interval: 1
```

### Job definition

```ruby
# app/jobs/report_generation_job.rb
class ReportGenerationJob < ApplicationJob
  queue_as :default

  def perform(user_id, report_type)
    user = User.find(user_id)
    report = ReportGenerator.generate(user, report_type)
    ReportMailer.with(user: user, report: report).delivery.deliver_later
  end
end
```

### Enqueuing

```ruby
ReportGenerationJob.perform_later(user.id, "monthly")
ReportGenerationJob.set(wait: 1.hour).perform_later(user.id, "monthly")
ReportGenerationJob.set(queue: :critical).perform_later(user.id, "urgent")
ReportGenerationJob.set(priority: 10).perform_later(user.id, "important")
```

### Retry strategies

```ruby
class EmailDeliveryJob < ApplicationJob
  queue_as :mailers

  # Retry up to 5 times with exponential backoff
  retry_on StandardError, wait: :exponentially_longer, attempts: 5

  # Don't retry certain errors
  discard_on ActiveJob::DeserializationError

  # Custom retry logic
  retry_on ApiError, wait: 5.minutes, attempts: 3 do |job, error|
    Rails.logger.error("Job #{job.class} failed: #{error.message}")
  end

  def perform(user_id)
    user = User.find(user_id)
    SomeMailer.notification(user).deliver_now
  end
end
```

### Mission Control dashboard

```ruby
# Gemfile
gem "mission_control-jobs"

# config/routes.rb
Rails.application.routes.draw do
  authenticate :user, ->(user) { user.admin? } do
    mount MissionControl::Jobs::Engine, at: "/jobs"
  end
end

# config/initializers/mission_control.rb
MissionControl::Jobs.configure do |config|
  config.finished_jobs_retention_period = 14.days
  config.failed_jobs_retention_period = 90.days
  config.filter_parameters = [:password, :token, :secret]
end
```

Dashboard provides: queue overview (pending/running/finished/failed), job detail with error backtraces, bulk retry/discard, queue pause/resume, and throughput metrics.

### Job monitoring (console & endpoints)

```ruby
# Rails console
SolidQueue::Job.pending.count
SolidQueue::Job.failed.count
SolidQueue::Job.failed.each { |job| puts "#{job.class_name}: #{job.error}" }
SolidQueue::Job.failed.first.retry_job
SolidQueue::Job.finished.where("finished_at < ?", 7.days.ago).delete_all
```

```ruby
# app/controllers/health_controller.rb
class HealthController < ApplicationController
  def show
    oldest = SolidQueue::Job.pending.order(:created_at).first
    age = oldest ? ((Time.current - oldest.created_at) / 60).round : 0

    render json: {
      queue_pending: SolidQueue::Job.pending.count,
      queue_failed: SolidQueue::Job.failed.count,
      oldest_pending_minutes: age
    }
  end
end
```

| Approach | Best for | Access |
|----------|----------|--------|
| Mission Control | Production monitoring, visual investigation | Web UI at `/jobs` |
| Rails Console | Quick debugging, one-off queries | Terminal / SSH |
| Custom Endpoints | Alerting systems, health checks | HTTP API |

## SolidCache

### Setup

```ruby
# config/environments/{development,production}.rb
config.cache_store = :solid_cache_store
```

```yaml
# config/database.yml
production:
  cache:
    <<: *default
    database: storage/production_cache.sqlite3
    migrations_paths: db/cache_migrate
```

```bash
rails db:migrate:cache
```

### Usage

```ruby
# Fetch with expiration
Rails.cache.fetch("user_#{user.id}", expires_in: 1.hour) do
  expensive_computation(user)
end

# Model-based keys (auto-expire on update)
Rails.cache.fetch(user.cache_key) { expensive_user_data(user) }

# Namespace by version
Rails.cache.fetch(["v2", "user", user.id]) { new_computation(user) }

# Collection dependency
Rails.cache.fetch(["posts", "index", @posts.maximum(:updated_at)]) do
  render_posts_expensive(@posts)
end

# Low-level operations
Rails.cache.write("key", "value", expires_in: 1.hour)
Rails.cache.read("key")
Rails.cache.delete("key")
Rails.cache.exist?("key")
```

```erb
<%# Fragment caching in views %>
<% cache @post do %>
  <%= render @post %>
<% end %>

<%# Collection caching %>
<% cache @posts do %>
  <% @posts.each do |post| %>
    <% cache post do %>
      <%= render post %>
    <% end %>
  <% end %>
<% end %>
```

## SolidCable

### Setup

```yaml
# config/cable.yml
production:
  adapter: solid_cable

# config/database.yml
production:
  cable:
    <<: *default
    database: storage/production_cable.sqlite3
    migrations_paths: db/cable_migrate
```

### Channel and broadcasting

```ruby
# app/channels/notifications_channel.rb
class NotificationsChannel < ApplicationCable::Channel
  def subscribed
    stream_from "notifications_#{current_user.id}"
  end

  def unsubscribed
    # Cleanup
  end
end
```

```ruby
# Broadcasting from anywhere
ActionCable.server.broadcast(
  "notifications_#{user.id}",
  { message: "New notification", type: "info" }
)

# From a model callback
class Notification < ApplicationRecord
  after_create_commit do
    ActionCable.server.broadcast(
      "notifications_#{user_id}",
      { message: message, type: notification_type }
    )
  end
end
```

### Client-side (Stimulus)

```javascript
// app/javascript/controllers/notifications_controller.js
import { Controller } from "@hotwired/stimulus"
import consumer from "../channels/consumer"

export default class extends Controller {
  connect() {
    this.subscription = consumer.subscriptions.create(
      "NotificationsChannel",
      { received: (data) => this.displayNotification(data) }
    )
  }

  disconnect() {
    this.subscription?.unsubscribe()
  }

  displayNotification(data) {
    console.log("Received:", data)
  }
}
```

## Multi-Database Management

```bash
# All databases at once
rails db:create      # Creates primary, queue, cache, cable
rails db:migrate     # Migrates all
rails db:prepare     # Creates + migrates (production)

# Individual databases
rails db:migrate:queue
rails db:migrate:cache
rails db:migrate:cable
rails db:migrate:status:queue
rails db:rollback:queue
```

## Gotchas

- **Never share databases** — putting queue/cache/cable on the primary database creates contention and couples concerns that should be isolated.
- **Never use Sidekiq/Redis** — reject any request to add `sidekiq`, `redis`, or `memcached` gems. Always redirect to Solid Stack equivalents.
- **Don't pass full objects to jobs** — always pass IDs and re-fetch inside `perform` to avoid serialization/deserialization errors.
- **Don't forget queue migrations** — each Solid Stack component has its own migration path (`db/queue_migrate`, `db/cache_migrate`, `db/cable_migrate`). Run `rails db:prepare` to cover all.
- **Don't skip retry configuration** — jobs without `retry_on` / `discard_on` use defaults which may not suit your use case. Be explicit about retry behavior.

## Validation

- [ ] `config.active_job.queue_adapter = :solid_queue` in environment config
- [ ] `config.cache_store = :solid_cache_store` in environment config
- [ ] `cable.yml` uses `adapter: solid_cable` for production
- [ ] No `sidekiq`, `redis`, or `memcached` gems in Gemfile
- [ ] Separate databases configured for queue, cache, and cable
- [ ] All database migrations run (`rails db:prepare`)
- [ ] Jobs have explicit `retry_on` / `discard_on` strategies
- [ ] Mission Control mounted with authentication in routes
- [ ] All tests passing

<related-skills>
  <skill name="mailers" reason="Email delivery uses SolidQueue background jobs" />
  <skill name="testing" reason="Jobs and caching need integration tests" />
  <skill name="models" reason="Background jobs often triggered from model callbacks" />
</related-skills>
