---
name: form-objects
description: Build form objects for complex form handling — multi-model forms, search forms, wizards, and non-persisted forms using ActiveModel::API
triggers:
  - form object
  - multi-model form
  - complex form
  - wizard form
  - multi-step form
  - search form
  - filter form
  - non-persisted form
  - virtual model
  - contact form
  - nested attributes alternative
---

# Form Objects

## When to use this skill

- Building forms that span multiple ActiveRecord models (e.g. user + company registration)
- Creating search/filter forms that don't persist to the database
- Implementing wizard or multi-step form flows
- Replacing complex `accepts_nested_attributes_for` with explicit form objects
- Handling contact forms or other non-persisted submissions
- Transforming API parameters before creating records
- Extracting complex validation logic that doesn't belong on a single model

## Principles

1. **`ActiveModel::API` over `ActiveModel::Model`** — on Rails 6.1+ use `ActiveModel::API` which provides the minimal interface (`ActiveModel::Model` includes extras you rarely need).
2. **Form objects are not models** — they validate user input and coordinate persistence, but don't own database state.
3. **Wrap transactions** — multi-model saves must be wrapped in `ActiveRecord::Base.transaction` so partial writes never occur.
4. **One form, one action** — each form object handles exactly one user action (register, search, submit step). Don't build god-forms.
5. **Test the form, not the controller** — form objects are plain Ruby; test validations, persistence, and error propagation directly.
6. **Use `form_with model:`** — form objects that include `ActiveModel::API` work seamlessly with Rails form helpers.

## Project Structure

```
app/
├── forms/
│   ├── application_form.rb         # Optional base class
│   ├── registration_form.rb        # Multi-model
│   ├── event_search_form.rb        # Search/filter
│   ├── contact_form.rb             # Non-persisted
│   └── wizard/
│       ├── base_form.rb
│       ├── step_one_form.rb
│       └── step_two_form.rb
spec/forms/
├── registration_form_spec.rb
├── event_search_form_spec.rb
└── contact_form_spec.rb
```

## Base Form Class

An optional base provides `model_name`, `persisted?`, and a save template:

```ruby
# app/forms/application_form.rb
class ApplicationForm
  include ActiveModel::API
  include ActiveModel::Attributes

  def self.model_name
    ActiveModel::Name.new(self, nil, name.chomp("Form"))
  end

  def persisted?
    false
  end

  def save
    return false unless valid?
    persist!
    true
  rescue ActiveRecord::RecordInvalid => e
    errors.add(:base, e.message)
    false
  end

  private

  def persist!
    raise NotImplementedError
  end
end
```

## Pattern 1: Multi-Model Registration

### Implementation

```ruby
# app/forms/registration_form.rb
class RegistrationForm < ApplicationForm
  attribute :email, :string
  attribute :password, :string
  attribute :password_confirmation, :string
  attribute :company_name, :string
  attribute :phone, :string

  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, presence: true, length: { minimum: 8 }
  validates :password_confirmation, presence: true
  validates :company_name, presence: true
  validate :passwords_match
  validate :email_unique

  attr_reader :user, :account

  private

  def persist!
    ActiveRecord::Base.transaction do
      @account = Account.create!(name: company_name)
      @user = User.create!(
        email_address: email,
        password: password,
        account: @account,
        phone: phone
      )
    end
  end

  def passwords_match
    return if password == password_confirmation
    errors.add(:password_confirmation, "doesn't match password")
  end

  def email_unique
    return unless User.exists?(email_address: email&.downcase)
    errors.add(:email, "has already been taken")
  end
end
```

### Test

```ruby
# spec/forms/registration_form_spec.rb
RSpec.describe RegistrationForm do
  describe "validations" do
    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_presence_of(:password) }
    it { is_expected.to validate_presence_of(:company_name) }
    it { is_expected.to validate_length_of(:password).is_at_least(8) }
  end

  describe "#save" do
    context "with valid params" do
      let(:form) { described_class.new(valid_params) }

      it "creates user and account in a transaction" do
        expect { form.save }
          .to change(User, :count).by(1)
          .and change(Account, :count).by(1)
      end

      it "associates user with account" do
        form.save
        expect(form.user.account).to eq(form.account)
      end
    end

    context "with invalid params" do
      let(:form) { described_class.new(email: "", password: "short") }

      it "returns false and does not create records" do
        expect(form.save).to be false
        expect(form.errors).not_to be_empty
      end
    end
  end
end
```

## Pattern 2: Search / Filter Form

```ruby
# app/forms/event_search_form.rb
class EventSearchForm
  include ActiveModel::API
  include ActiveModel::Attributes

  attribute :query, :string
  attribute :event_type, :string
  attribute :status, :string
  attribute :start_date, :date
  attribute :end_date, :date

  attr_reader :account

  def initialize(account:, params: {})
    @account = account
    super(params)
  end

  def results
    scope = account.events
    scope = scope.where("name ILIKE :q", q: "%#{sanitize_like(query)}%") if query.present?
    scope = scope.where(event_type: event_type)          if event_type.present?
    scope = scope.where(status: status)                  if status.present?
    scope = scope.where("event_date >= ?", start_date)   if start_date.present?
    scope = scope.where("event_date <= ?", end_date)     if end_date.present?
    scope.order(event_date: :desc)
  end

  def any_filters?
    [query, event_type, status, start_date, end_date].any?(&:present?)
  end

  private

  def sanitize_like(term)
    term.gsub(/[%_]/) { |x| "\\#{x}" }
  end
end
```

## Pattern 3: Wizard / Multi-Step Form

```ruby
# app/forms/wizard/base_form.rb
module Wizard
  class BaseForm < ApplicationForm
    def self.steps
      raise NotImplementedError
    end

    def current_step
      raise NotImplementedError
    end

    def next_step
      idx = self.class.steps.index(current_step)
      self.class.steps[idx + 1]
    end

    def last_step?
      current_step == self.class.steps.last
    end

    def progress_percentage
      steps = self.class.steps
      ((steps.index(current_step) + 1).to_f / steps.size * 100).round
    end
  end
end

# app/forms/wizard/event_step_one_form.rb
module Wizard
  class EventStepOneForm < BaseForm
    attribute :name, :string
    attribute :event_type, :string
    attribute :event_date, :date

    validates :name, presence: true
    validates :event_type, presence: true
    validates :event_date, presence: true

    def self.steps = [:basics, :details, :vendors, :confirmation]
    def current_step = :basics
  end
end
```

## Pattern 4: Contact Form (No Persistence)

```ruby
# app/forms/contact_form.rb
class ContactForm
  include ActiveModel::API
  include ActiveModel::Attributes

  attribute :name, :string
  attribute :email, :string
  attribute :subject, :string
  attribute :message, :string

  validates :name, presence: true
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :subject, presence: true
  validates :message, presence: true, length: { minimum: 10 }

  def save
    return false unless valid?
    ContactMailer.inquiry(name: name, email: email, subject: subject, message: message).deliver_later
    true
  end
end
```

## Controller Integration

```ruby
# app/controllers/registrations_controller.rb
class RegistrationsController < ApplicationController
  def new
    @form = RegistrationForm.new
  end

  def create
    @form = RegistrationForm.new(registration_params)
    if @form.save
      start_new_session_for(@form.user)
      redirect_to dashboard_path, notice: t(".success")
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def registration_params
    params.require(:registration).permit(
      :email, :password, :password_confirmation, :company_name, :phone
    )
  end
end
```

## View Integration

`form_with model:` works because form objects include `ActiveModel::API` and define `model_name`:

```erb
<%= form_with model: @form, url: registrations_path do |f| %>
  <% if @form.errors.any? %>
    <div class="alert alert-error">
      <% @form.errors.full_messages.each do |msg| %>
        <p><%= msg %></p>
      <% end %>
    </div>
  <% end %>

  <%= f.email_field :email %>
  <%= f.password_field :password %>
  <%= f.text_field :company_name %>
  <%= f.submit "Register" %>
<% end %>
```

Search forms use `method: :get` so filters appear in the URL:

```erb
<%= form_with model: @search_form, url: events_path, method: :get do |f| %>
  <%= f.search_field :query, placeholder: "Search..." %>
  <%= f.select :event_type, options, include_blank: "All types" %>
  <%= f.submit "Search" %>
<% end %>
```

## ActiveModel::Model vs ActiveModel::API

- **`ActiveModel::API`** (Rails 6.1+) — minimal: naming, conversion, validations. Recommended for form objects.
- **`ActiveModel::Model`** (Rails 4.0+) — includes everything in API plus `Dirty` and `Serialization`. Use only if you need `changed?` / `previous_changes`.

## Gotchas

- **Don't inherit from `ApplicationRecord`** — form objects are not database-backed. Use `ActiveModel::API` or a base form class.
- **Always wrap multi-model saves in a transaction** — without it, partial writes leave data in an inconsistent state.
- **Override `model_name` for routing** — without it, `form_with model: @form` generates params keyed as `registration_form` instead of `registration`.
- **Don't skip `persisted?`** — Rails form helpers check `persisted?` to decide between POST and PATCH. Form objects should return `false`.
- **Validate before delegating** — run form-level validations (password match, uniqueness checks) before calling `create!` inside the transaction.
- **Don't use `accepts_nested_attributes_for` as a substitute** — form objects give you explicit control; nested attributes hide complexity and are harder to test.

## Validation

- [ ] Form object uses `ActiveModel::API` (Rails 6.1+) or `ActiveModel::Model`, not `ApplicationRecord`
- [ ] Attributes declared with types via `ActiveModel::Attributes`
- [ ] All validations defined and tested
- [ ] Multi-model `#save` wraps persistence in `ActiveRecord::Base.transaction`
- [ ] `model_name` overridden so `form_with model:` routes correctly
- [ ] Controller uses form object with strong parameters
- [ ] View uses `form_with model: @form_object`
- [ ] Error messages propagate to the view
- [ ] All specs pass

<related-skills>
  <skill name="models" reason="Form objects coordinate ActiveRecord models for multi-model operations" />
  <skill name="testing" reason="Form objects should be thoroughly unit-tested independent of controllers" />
  <skill name="controllers" reason="Controllers instantiate and delegate to form objects" />
</related-skills>
