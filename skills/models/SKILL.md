---
name: models
description: Design Rails models with ActiveRecord patterns, associations, validations, scopes, concerns, and query objects
triggers:
  - creating a model
  - ActiveRecord associations
  - model validations
  - callbacks
  - scopes and queries
  - concerns
  - query objects
  - form objects
  - N+1 prevention
---

# Models

## When to use this skill

- Designing database models and associations
- Writing validations and callbacks
- Creating scopes and query methods
- Extracting complex queries to query objects
- Building form objects for multi-model operations
- Organizing shared behavior with concerns
- Creating custom validators
- Preventing N+1 queries

## Principles

1. **Fat models, thin controllers** — business logic lives in models, not controllers.
2. **Database constraints back validations** — always add NOT NULL, foreign keys, and unique indexes alongside model validations.
3. **Callbacks stay simple** — use callbacks only for data normalization and enqueuing jobs. Complex side effects belong in service objects.
4. **Explicit over implicit** — use named scopes, never `default_scope`.
5. **Eager load by default** — always use `includes()` to prevent N+1 queries.
6. **Extract early** — concerns when models exceed ~200 lines, query objects for complex filters, form objects for multi-model operations.

## Associations

```ruby
class Feedback < ApplicationRecord
  belongs_to :recipient, class_name: "User", optional: true
  belongs_to :category, counter_cache: true
  has_one :response, class_name: "FeedbackResponse", dependent: :destroy
  has_many :abuse_reports, dependent: :destroy
  has_many :taggings, dependent: :destroy
  has_many :tags, through: :taggings

  # Scoped associations
  has_many :recent_reports, -> { where(created_at: 7.days.ago..) },
    class_name: "AbuseReport"
end
```

Migration — always use `t.references` for indexed foreign keys:

```ruby
create_table :feedbacks do |t|
  t.references :recipient, foreign_key: { to_table: :users }, null: true
  t.references :category, foreign_key: true, null: false
  t.text :content, null: false
  t.string :status, default: "pending", null: false
  t.timestamps
end
add_index :feedbacks, :status
```

### Polymorphic associations

```ruby
class Comment < ApplicationRecord
  belongs_to :commentable, polymorphic: true
  belongs_to :author, class_name: "User"
end

class Feedback < ApplicationRecord
  has_many :comments, as: :commentable, dependent: :destroy
end
```

Migration — always add a composite index:

```ruby
t.references :commentable, polymorphic: true, null: false
add_index :comments, [:commentable_type, :commentable_id]
```

## Validations

```ruby
class Feedback < ApplicationRecord
  validates :content, presence: true, length: { minimum: 50, maximum: 5000 }
  validates :recipient_email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :status, inclusion: { in: %w[pending delivered read responded] }
  validates :tracking_code, uniqueness: { scope: :recipient_email, case_sensitive: false }
  validates :rating, numericality: { only_integer: true, in: 1..5 }, allow_nil: true

  validate :recipient_can_receive_feedback, on: :create

  private

  def recipient_can_receive_feedback
    return if recipient_email.blank?
    user = User.find_by(email: recipient_email)
    errors.add(:recipient_email, "has disabled feedback") if user&.feedback_disabled?
  end
end
```

### Custom validators

Place reusable validation logic in `app/validators/`:

```ruby
# app/validators/email_validator.rb
class EmailValidator < ActiveModel::EachValidator
  EMAIL_REGEX = /\A[\w+\-.]+@[a-z\d\-]+(\.[a-z\d\-]+)*\.[a-z]+\z/i

  def validate_each(record, attribute, value)
    return if value.blank? && options[:allow_blank]
    record.errors.add(attribute, options[:message] || "is not a valid email") unless value =~ EMAIL_REGEX
  end
end

# Usage: validates :email, email: true
```

## Callbacks

Keep callbacks minimal — normalization and job enqueuing only:

```ruby
class Feedback < ApplicationRecord
  before_validation :normalize_email, :strip_whitespace
  before_create :generate_tracking_code
  after_create_commit :enqueue_delivery_job

  private

  def normalize_email
    self.recipient_email = recipient_email&.downcase&.strip
  end

  def strip_whitespace
    self.content = content&.strip
  end

  def generate_tracking_code
    self.tracking_code = SecureRandom.alphanumeric(10).upcase
  end

  def enqueue_delivery_job
    SendFeedbackJob.perform_later(id)
  end
end
```

## Scopes & Enums

### Scopes

```ruby
class Feedback < ApplicationRecord
  scope :recent, -> { where(created_at: 30.days.ago..) }
  scope :unread, -> { where(status: "delivered") }
  scope :responded, -> { where.not(response: nil) }
  scope :by_recipient, ->(email) { where(recipient_email: email) }
  scope :with_associations, -> { includes(:recipient, :response, :category, :tags) }

  def self.search(query)
    return none if query.blank?
    where("content ILIKE ? OR response ILIKE ?",
      "%#{sanitize_sql_like(query)}%", "%#{sanitize_sql_like(query)}%")
  end
end

# Chainable: Feedback.recent.by_recipient("user@example.com").responded
```

### Enums

Use string-backed enums with `prefix:` to avoid method conflicts:

```ruby
enum :status, {
  pending: "pending", delivered: "delivered",
  read: "read", responded: "responded"
}, prefix: true, scopes: true

# feedback.status_pending?  feedback.status_pending!  Feedback.status_pending
```

## Concerns

Extract shared behavior into `app/models/concerns/`:

```ruby
# app/models/concerns/taggable.rb
module Taggable
  extend ActiveSupport::Concern

  included do
    has_many :taggings, as: :taggable, dependent: :destroy
    has_many :tags, through: :taggings
    scope :tagged_with, ->(name) { joins(:tags).where(tags: { name: name }).distinct }
  end

  def tag_list
    tags.pluck(:name).join(", ")
  end

  def tag_list=(names)
    self.tags = names.to_s.split(",").map { |n| Tag.find_or_create_by(name: n.strip.downcase) }
  end

  class_methods do
    def popular_tags(limit = 10)
      Tag.joins(:taggings).where(taggings: { taggable_type: name })
        .group("tags.id").order("COUNT(taggings.id) DESC").limit(limit)
    end
  end
end

# Usage: include Taggable in any model
```

## Query Objects

Place in `app/queries/` for complex, reusable filtering:

```ruby
# app/queries/feedback_query.rb
class FeedbackQuery
  def initialize(relation = Feedback.all)
    @relation = relation
  end

  def by_recipient(email)
    @relation = @relation.where(recipient_email: email)
    self
  end

  def by_status(status)
    @relation = @relation.where(status: status)
    self
  end

  def recent(limit = 10)
    @relation = @relation.order(created_at: :desc).limit(limit)
    self
  end

  def results
    @relation
  end
end

# Usage: FeedbackQuery.new.by_recipient(email).by_status("pending").recent(20).results
```

## Form Objects

Use `ActiveModel::API` for non-database forms and multi-model operations. Place in `app/forms/`:

```ruby
# app/forms/contact_form.rb
class ContactForm
  include ActiveModel::API
  include ActiveModel::Attributes

  attribute :name, :string
  attribute :email, :string
  attribute :message, :string

  validates :name, presence: true
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :message, presence: true, length: { minimum: 10 }

  def deliver
    return false unless valid?
    ContactMailer.contact_message(name: name, email: email, message: message).deliver_later
    true
  end
end
```

For multi-model operations, wrap in a transaction:

```ruby
# app/forms/user_registration_form.rb
class UserRegistrationForm
  include ActiveModel::API

  def save
    return false unless valid?
    ActiveRecord::Base.transaction do
      @user = User.create!(email: email, password: password, name: name)
      @company = Company.create!(name: company_name, owner: @user)
      Membership.create!(user: @user, company: @company, role: "admin")
      true
    end
  rescue ActiveRecord::RecordInvalid => e
    errors.add(:base, e.message)
    false
  end
end
```

## N+1 Prevention

```ruby
# ❌ N+1: 1 + N queries per association
@feedbacks = Feedback.limit(20)
@feedbacks.each { |f| f.recipient.name }  # 21 queries

# ✅ Eager load: 2-3 queries total
@feedbacks = Feedback.includes(:recipient, :category, :tags).limit(20)

# Choose the right method:
Feedback.includes(:recipient, :tags)       # Separate queries (default, usually best)
Feedback.eager_load(:recipient, :tags)     # LEFT OUTER JOIN (when filtering on association)
Feedback.includes(recipient: :profile)     # Nested associations
```

## State as Records

# State as Records — model closures, published states, etc.
# Treat state changes as records, not boolean flags
class Post < ApplicationRecord
  has_many :closures
  
  def closed?
    closures.exists?
  end
  
  def close!(user:)
    closures.create!(user:)
  end
end

class Closure < ApplicationRecord
  belongs_to :post
  belongs_to :user
end
# Routes: resource :closure, only: [:create, :destroy]
# This pattern from 37signals: state transitions become auditable records with CRUD routing

## .then Query Chaining

# .then for chainable query objects
class PostQuery
  def self.call(scope = Post.all)
    scope
  end
  
  def self.published(scope = Post.all)
    scope.where(published: true)
  end
end

# Chain with .then:
Post.all.then { |s| params[:published] ? s.where(published: true) : s }

## Gotchas

- **Never use `default_scope`** — it silently affects all queries, associations, and `count`. Use explicit named scopes instead.
- **Don't put complex logic in callbacks** — multiple `after_create` side effects (email, analytics, Slack) make models untestable. Use a service object or background job.
- **Always index foreign keys and query columns** — use `t.references` (auto-indexes) and add composite indexes for multi-column queries.
- **Don't duplicate validation logic** — extract to custom validators in `app/validators/` when the same rule appears in multiple models.
- **Don't put query logic in controllers** — if a controller action builds queries with multiple conditionals, extract to a query object.

## Validation

- [ ] All validations have corresponding database constraints (NOT NULL, foreign keys, unique indexes)
- [ ] No N+1 queries (check with `bullet` gem or log inspection)
- [ ] Business logic is in models/services, not controllers
- [ ] Callbacks are limited to normalization and job enqueuing
- [ ] Models under ~200 lines (extract concerns if larger)
- [ ] Strong parameters defined in controller for mass assignment
- [ ] All tests passing

<related-skills>
  <skill name="testing" reason="Models need thorough unit tests for validations, associations, and scopes" />
  <skill name="migrations" reason="Model changes typically require database migrations" />
  <skill name="controllers" reason="RESTful controllers expose model resources" />
  <skill name="security" reason="SQL injection prevention and strong parameters" />
</related-skills>
