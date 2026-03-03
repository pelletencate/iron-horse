---
name: testing
description: Test Rails applications with Minitest — models, controllers, jobs, mailers, fixtures, mocking, and test helpers
triggers:
  - writing tests
  - Minitest assertions
  - model testing
  - controller testing
  - integration testing
  - fixtures
  - mocking and stubbing
  - test helpers
  - WebMock
---

# Testing

## When to use this skill

- Writing model, controller, job, or mailer tests
- Setting up fixtures, mocking external services, or stubbing methods
- Building reusable test helpers

## Principles

1. **Minitest only** — never RSpec. Minitest ships with Rails and is faster to write and run.
2. **One assertion concept per test** — each test proves one behavior. Easier to debug when it fails.
3. **Fixtures over factories** — use YAML fixtures for speed and simplicity. Reserve inline `create!` for unique-attribute scenarios.
4. **Stub external services** — never make live HTTP requests in tests. Use WebMock or `stub`.
5. **Test behavior, not implementation** — assert outcomes through public interfaces, not internal state.
6. **Pair tests with implementation** — test file mirrors app file: `app/models/feedback.rb` → `test/models/feedback_test.rb`.

## Test Structure

```ruby
require "test_helper"

class FeedbackTest < ActiveSupport::TestCase
  def setup
    @feedback = feedbacks(:one)
    @user = users(:alice)
  end

  test "feedback belongs to user" do
    assert_equal @user, @feedback.user
  end
end
```

Base classes by test type:

| Type | Base class | Directory |
|------|-----------|-----------|
| Model | `ActiveSupport::TestCase` | `test/models/` |
| Controller | `ActionDispatch::IntegrationTest` | `test/controllers/` |
| Job | `ActiveJob::TestCase` | `test/jobs/` |
| Mailer | `ActionMailer::TestCase` | `test/mailers/` |
| System | `ApplicationSystemTestCase` | `test/system/` |

## Assertions

```ruby
assert_equal 4, 2 + 2
assert_nil nil
assert_includes [1, 2, 3], 2
assert_raises(ArgumentError) { raise ArgumentError }
assert_difference "Feedback.count", 1 do
  Feedback.create!(content: "Valid content", recipient_email: "test@example.com")
end
assert_match /hello/, "hello world"
```

## Model Testing

### Validations

```ruby
class FeedbackTest < ActiveSupport::TestCase
  test "valid with all required attributes" do
    feedback = Feedback.new(content: "Valid content here", recipient_email: "user@example.com")
    assert feedback.valid?
  end

  test "invalid without content" do
    feedback = Feedback.new(recipient_email: "user@example.com")
    assert_not feedback.valid?
    assert_includes feedback.errors[:content], "can't be blank"
  end

  test "boundary: valid at exactly minimum length" do
    assert Feedback.new(content: "a" * 50, recipient_email: "user@example.com").valid?
  end
end
```

### Associations

```ruby
class FeedbackTest < ActiveSupport::TestCase
  test "belongs to recipient" do
    assert_equal :belongs_to, Feedback.reflect_on_association(:recipient).macro
  end

  test "has many abuse_reports with dependent destroy" do
    feedback = feedbacks(:one)
    3.times { feedback.abuse_reports.create!(reason: "spam", reporter_email: "r@example.com") }
    assert_difference "AbuseReport.count", -3 do
      feedback.destroy
    end
  end
end
```

### Scopes

```ruby
test "recent scope returns feedbacks from last 30 days" do
  old = Feedback.create!(content: "Old feedback", recipient_email: "o@example.com", created_at: 31.days.ago)
  recent = Feedback.create!(content: "Recent feedback", recipient_email: "r@example.com", created_at: 10.days.ago)
  assert_includes Feedback.recent, recent
  assert_not_includes Feedback.recent, old
end
```

### Callbacks

```ruby
test "enqueues delivery job after creation" do
  assert_enqueued_with(job: SendFeedbackJob) do
    Feedback.create!(content: "New feedback", recipient_email: "user@example.com")
  end
end

test "sanitizes HTML in content before save" do
  feedback = Feedback.create!(content: "<script>alert('xss')</script>Valid content", recipient_email: "user@example.com")
  assert_not_includes feedback.content, "<script>"
end
```

### Enums

```ruby
test "enum provides predicate and bang methods" do
  feedback = feedbacks(:pending)
  assert feedback.status_pending?
  feedback.status_delivered!
  assert feedback.status_delivered?
end

test "enum provides scopes" do
  assert Feedback.status_pending.all?(&:status_pending?)
end
```

## Controller / Integration Testing

```ruby
class FeedbacksControllerTest < ActionDispatch::IntegrationTest
  test "GET index returns success" do
    get feedbacks_url
    assert_response :success
  end

  test "POST create with valid params" do
    assert_difference("Feedback.count", 1) do
      post feedbacks_url, params: { feedback: { content: "New feedback", recipient_email: "test@example.com" } }
    end
    assert_redirected_to feedback_url(Feedback.last)
  end

  test "POST create with invalid params" do
    assert_no_difference("Feedback.count") do
      post feedbacks_url, params: { feedback: { content: nil } }
    end
    assert_response :unprocessable_entity
  end

  test "DELETE destroy removes feedback" do
    assert_difference("Feedback.count", -1) { delete feedback_url(feedbacks(:one)) }
    assert_redirected_to feedbacks_url
  end
end
```

## Job & Mailer Testing

```ruby
class SendFeedbackJobTest < ActiveJob::TestCase
  test "enqueues with correct arguments" do
    assert_enqueued_with(job: SendFeedbackJob, args: [feedbacks(:one)]) do
      SendFeedbackJob.perform_later(feedbacks(:one))
    end
  end

  test "delivers email and updates status" do
    assert_difference "ActionMailer::Base.deliveries.size", 1 do
      SendFeedbackJob.perform_now(feedbacks(:one))
    end
    assert_equal "delivered", feedbacks(:one).reload.status
  end
end

class FeedbackMailerTest < ActionMailer::TestCase
  test "notification email has correct content" do
    email = FeedbackMailer.notification(feedbacks(:one))
    assert_emails 1 do email.deliver_now end
    assert_equal [feedbacks(:one).recipient_email], email.to
    assert_match feedbacks(:one).content, email.body.encoded
  end
end
```

## Fixtures

```yaml
# test/fixtures/users.yml
alice:
  name: Alice Johnson
  email: alice@example.com
  created_at: <%= 1.week.ago %>

# test/fixtures/feedbacks.yml — use name-based references, never hardcoded IDs
one:
  content: This is great feedback with minimum fifty characters!
  recipient_email: alice@example.com
  sender: alice          # References users fixture by name
  status: pending

# Polymorphic: commentable: one (Feedback)
# ERB: sku: <%= "TSH-#{SecureRandom.hex(4)}" %>
```

Fixture helpers for shared logic:

```ruby
# test/test_helper.rb
module FixtureFileHelpers
  def default_password_digest
    BCrypt::Password.create("password123", cost: 4)
  end
end
ActiveRecord::FixtureSet.context_class.include FixtureFileHelpers
```

## Mocking & Stubbing

### Stubbing methods

```ruby
test "stubs instance method within block" do
  user = users(:alice)
  user.stub :name, "Stubbed Name" do
    assert_equal "Stubbed Name", user.name
  end
  assert_equal "Alice Johnson", user.name  # restored after block
end
```

### Minitest::Mock

```ruby
test "mock with verification" do
  mock = Minitest::Mock.new
  mock.expect :call, "mocked result", ["arg1"]
  assert_equal "mocked result", mock.call("arg1")
  mock.verify  # REQUIRED — ensures expectations were met
end
```

### WebMock for HTTP requests

```ruby
# Gemfile: gem "webmock", group: :test
# test/test_helper.rb: require "webmock/minitest"

test "stubs HTTP GET" do
  stub_request(:get, "https://api.example.com/data")
    .to_return(status: 200, body: '{"status":"ok"}')
  response = Net::HTTP.get(URI("https://api.example.com/data"))
  assert_equal '{"status":"ok"}', response
end

test "simulates timeout" do
  stub_request(:get, "https://api.example.com/slow").to_timeout
  assert_raises(Net::OpenTimeout) { Net::HTTP.get(URI("https://api.example.com/slow")) }
end

test "verifies request was made" do
  stub_request(:get, "https://api.example.com/check").to_return(status: 200)
  Net::HTTP.get(URI("https://api.example.com/check"))
  assert_requested :get, "https://api.example.com/check", times: 1
end
```

### Stubbing external services

```ruby
test "stubs external API client" do
  AIService.stub :improve_content, "Improved content" do
    assert_equal "Improved content", AIService.improve_content("raw")
  end
end

test "simulates external service error" do
  AIService.stub :improve_content, -> (*) { raise StandardError, "API down" } do
    assert_raises(StandardError) { AIService.improve_content("test") }
  end
end
```

## Test Helpers

```ruby
# test/test_helper.rb
ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    parallelize(workers: :number_of_processors)
    fixtures :all
  end
end

# test/test_helpers/authentication.rb
module TestHelpers::Authentication
  def sign_in_as(user)
    post sign_in_url, params: { email: user.email, password: "password" }
  end
end

# test/test_helpers/api_helpers.rb
module TestHelpers::ApiHelpers
  def json_response = JSON.parse(response.body)

  def api_post(url, params: {}, user: nil)
    headers = { "Content-Type" => "application/json" }
    headers["Authorization"] = "Bearer #{user.api_token}" if user
    post url, params: params.to_json, headers: headers
  end
end
```

## Running Tests

```bash
rails test                              # all tests
rails test test/models/feedback_test.rb # specific file
rails test test/models/feedback_test.rb:12  # by line number
rails test -n /validation/             # pattern match
```

## Phase-Locked TDD Discipline

Strict phase separation prevents thrashing:

**Red phase** (writing failing tests):
- NEVER modify `app/` code — only write/edit spec files
- Run specs frequently; stop when you have a clean failing test
- One failing test at a time

**Green phase** (making tests pass):
- Write MINIMUM code to pass the failing test
- NEVER modify `spec/` during green phase
- Stop immediately on first red — don't accumulate failures

**Refactor phase**:
- NEVER modify `spec/` — stop on first red and revert
- Use `flog` / `flay` metrics to identify refactor targets:
  `flog app/models/post.rb` — score >20 per method needs attention
  `flay app/` — finds structural duplication

Phase violations cause context switching and obscure bugs.

## Gotchas

- **Forgetting `mock.verify`**
- **Hardcoding fixture IDs**
- **Testing multiple concerns in one test**
- **Not using `assert_no_difference`**
- **Stubbing implementation details**
- **Live HTTP in tests**

## Validation

- [ ] Every model has corresponding test file with validation, association, and scope tests
- [ ] Integration tests cover happy path and error cases for each controller action
- [ ] External HTTP calls stubbed with WebMock; fixtures use name-based references (no hardcoded IDs)
- [ ] All tests pass: `rails test`
- [ ] One assertion concept per test method

<related-skills>
  <skill name="models" reason="Model tests verify validations, associations, scopes, and callbacks" />
  <skill name="controllers" reason="Integration tests exercise controller actions and routing" />
  <skill name="jobs" reason="Job tests verify enqueuing, execution, and failure handling" />
  <skill name="security" reason="Tests should verify auth, XSS prevention, and input sanitization" />
</related-skills>
