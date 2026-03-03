---
name: i18n
description: Implement Rails internationalization with locale files, lazy lookups, pluralization, date/currency formatting, and locale switching
triggers:
  - translations
  - internationalization
  - i18n
  - locales
  - multi-language
  - translate text
  - locale switching
  - pluralization
---

# I18n

## When to use this skill

- Adding translations or locale files to a Rails application
- Setting up multi-language support
- Localizing dates, times, numbers, or currencies
- Implementing locale switching (URL-based, user preference, Accept-Language)
- Translating model attributes, enum values, or error messages
- Configuring pluralization rules
- Setting up fallback locales
- Auditing for missing or unused translations

## Principles

1. **Every user-facing string goes through I18n** — never hardcode text in views, mailers, or flash messages.
2. **Lazy lookups in views** — use `t('.title')` instead of `t('events.index.title')` to keep templates clean and refactor-friendly.
3. **Organize locale files by domain** — split into `models/`, `views/`, `mailers/`, and `components/` subdirectories, not one giant file.
4. **Mirror structure across locales** — every key in `en.yml` must exist in every other locale file with the same nesting.
5. **Database constraints match translations** — enum values, status strings, and model names should all have corresponding `activerecord` translations.
6. **Test for missing keys** — use `i18n-tasks` gem to catch missing and unused translations in CI.

## Quick Start

```ruby
# config/application.rb
config.i18n.default_locale = :en
config.i18n.available_locales = [:en, :fr, :de]
config.i18n.fallbacks = true
```

## Project Structure

```
config/locales/
├── en.yml                    # Shared/common English
├── fr.yml                    # Shared/common French
├── models/
│   ├── en.yml               # Model translations (EN)
│   └── fr.yml               # Model translations (FR)
├── views/
│   ├── en.yml               # View translations (EN)
│   └── fr.yml               # View translations (FR)
├── mailers/
│   ├── en.yml               # Mailer translations
│   └── fr.yml
└── components/
    ├── en.yml               # Component translations
    └── fr.yml
```

## Locale File Patterns

### Model Translations

```yaml
# config/locales/models/en.yml
en:
  activerecord:
    models:
      event: Event
      event_vendor: Event Vendor
    attributes:
      event:
        name: Name
        event_date: Event Date
        status: Status
      event/statuses:
        draft: Draft
        confirmed: Confirmed
        cancelled: Cancelled
    errors:
      models:
        event:
          attributes:
            name:
              blank: "can't be blank"
              too_long: "is too long (maximum %{count} characters)"
            event_date:
              in_past: "can't be in the past"
```

### Enum Translations

Enum values live under `activerecord.attributes.model/attribute_name` (shown in model translations above). Access them in code:

```ruby
# In model or presenter
I18n.t("activerecord.attributes.event/statuses.#{status}")
Event.human_attribute_name("statuses.draft")  # => "Draft"
```

### View Translations

```yaml
# config/locales/views/en.yml
en:
  events:
    index:
      title: Events
      new_event: New Event
      no_events: No events found
    show:
      edit: Edit
      delete: Delete
      confirm_delete: Are you sure?
    form:
      submit_create: Create Event
      submit_update: Update Event
    create:
      success: Event was successfully created.
    destroy:
      success: Event was successfully deleted.
```

### Shared / Common Keys

```yaml
# config/locales/en.yml
en:
  common:
    actions:
      save: Save
      cancel: Cancel
      delete: Delete
    confirmations:
      delete: Are you sure you want to delete this?
    messages:
      loading: Loading...
      no_results: No results found
```

## Usage Patterns

### Lazy Lookups in Views

```erb
<%# app/views/events/index.html.erb %>
<%# t(".title") resolves to "events.index.title" %>

<h1><%= t(".title") %></h1>
<%= link_to t(".new_event"), new_event_path %>

<% if @events.empty? %>
  <p><%= t(".no_events") %></p>
<% end %>

<%# Interpolation %>
<p><%= t(".welcome", name: current_user.name) %></p>

<%# HTML-safe translations (use _html suffix in key) %>
<p><%= t(".intro_html", link: link_to("here", help_path)) %></p>
```

### Controllers

```ruby
class EventsController < ApplicationController
  def create
    @event = current_account.events.build(event_params)
    if @event.save
      redirect_to @event, notice: t(".success")
    else
      render :new, status: :unprocessable_entity
    end
  end

  def destroy
    @event.destroy
    redirect_to events_path, notice: t(".success")
  end
end
```

### Models and Presenters

```ruby
class EventPresenter < BasePresenter
  def formatted_date
    return not_specified if event_date.nil?
    I18n.l(event_date, format: :long)
  end

  def status_text
    I18n.t("activerecord.attributes.event/statuses.#{status}")
  end

  private

  def not_specified
    tag.span(I18n.t("common.messages.not_specified"), class: "text-muted")
  end
end
```

## Pluralization

```yaml
en:
  events:
    count:
      zero: No events
      one: 1 event
      other: "%{count} events"

  notifications:
    unread:
      zero: No unread notifications
      one: You have 1 unread notification
      other: "You have %{count} unread notifications"
```

```ruby
t("events.count", count: 0)   # => "No events"
t("events.count", count: 1)   # => "1 event"
t("events.count", count: 5)   # => "5 events"
```

### Language-Specific Pluralization

Some languages (Arabic, Russian, Polish) need more plural forms than `one`/`other`. Configure a custom pluralization backend or use the `rails-i18n` gem which ships rules for 100+ locales:

```ruby
# Gemfile
gem "rails-i18n", "~> 8.0"
```

## Date, Time, and Number Formatting

### Localizing Dates

```ruby
I18n.l(Date.current)                    # => "January 15, 2024"
I18n.l(Date.current, format: :short)    # => "Jan 15"
I18n.l(Date.current, format: :long)     # => "Wednesday, January 15, 2024"
I18n.l(event.event_date, format: "%d/%m/%Y")  # => "15/01/2024"
```

### Localizing Numbers and Currency

```ruby
number_to_currency(1234.50)                    # => "$1,234.50"
number_to_currency(1234.50, locale: :fr)       # => "1 234,50 €"
```

```yaml
# config/locales/fr.yml
fr:
  number:
    currency:
      format:
        unit: "€"
        format: "%n %u"
        separator: ","
        delimiter: " "
```

## Locale Switching

### URL-Based Locale

```ruby
# config/routes.rb
Rails.application.routes.draw do
  scope "(:locale)", locale: /en|fr|de/ do
    resources :events
  end
end

# app/controllers/application_controller.rb
class ApplicationController < ActionController::Base
  around_action :switch_locale

  private

  def switch_locale(&action)
    locale = params[:locale] || I18n.default_locale
    I18n.with_locale(locale, &action)
  end

  def default_url_options
    { locale: I18n.locale }
  end
end
```

### User Preference with Accept-Language Fallback

```ruby
def switch_locale(&action)
  locale = current_user&.locale ||
           extract_locale_from_header ||
           I18n.default_locale
  I18n.with_locale(locale, &action)
end

def extract_locale_from_header
  parsed = request.env["HTTP_ACCEPT_LANGUAGE"]&.scan(/^[a-z]{2}/)&.first
  parsed if I18n.available_locales.map(&:to_s).include?(parsed)
end
```

### Fallback Locales

```ruby
# config/application.rb
config.i18n.fallbacks = [:en]

# Or per-locale fallback chains
config.i18n.fallbacks = { de: [:de, :en], fr: [:fr, :en] }
```

## Testing I18n

### Missing Translation Detection

```ruby
# spec/rails_helper.rb — raise on missing translations in tests
RSpec.configure do |config|
  config.around(:each) do |example|
    I18n.exception_handler = ->(exception, *) { raise exception }
    example.run
    I18n.exception_handler = I18n::ExceptionHandler.new
  end
end
```

### i18n-tasks Gem

```ruby
# Gemfile
gem "i18n-tasks", group: :development
```

```bash
bundle exec i18n-tasks missing      # Find missing translations
bundle exec i18n-tasks unused       # Find unused translations
bundle exec i18n-tasks normalize    # Sort and normalize locale files
bundle exec i18n-tasks health       # Full health check
```

```ruby
# spec/i18n_spec.rb
require "i18n/tasks"

RSpec.describe "I18n" do
  let(:i18n) { I18n::Tasks::BaseTask.new }

  it "has no missing translations" do
    expect(i18n.missing_keys).to be_empty
  end

  it "has no unused translations" do
    expect(i18n.unused_keys).to be_empty
  end
end
```

## Gotchas

- **Don't concatenate translations** — `t("hello") + " " + t("world")` breaks in languages with different word order. Use interpolation: `t("greeting", name: name)`.
- **Don't use flat keys** — `events_index_title` is unmaintainable. Use nested YAML matching the view path: `events.index.title`.
- **Lazy lookups only work in views and controllers** — in models, mailers, jobs, or service objects you must use the full key: `I18n.t("events.count", count: n)`.
- **HTML in translations requires `_html` suffix** — `t("intro")` is escaped; `t("intro_html")` is marked `html_safe`. Forgetting the suffix causes visible HTML tags.
- **Pluralization keys vary by language** — English needs `one`/`other`, but Arabic needs `zero`/`one`/`two`/`few`/`many`/`other`. Use `rails-i18n` gem for correct plural rules.
- **`I18n.locale` is thread-local** — never set it globally. Always use `I18n.with_locale(locale) { ... }` in controllers/jobs to avoid locale bleed between requests.

## Validation

- [ ] All user-facing strings use `I18n.t()` or `t()` — no hardcoded text in views
- [ ] Locale files organized by domain (`models/`, `views/`, etc.)
- [ ] Lazy lookups used in views (`t(".key")`) instead of full paths
- [ ] Pluralization uses `count:` parameter with `zero`/`one`/`other` keys
- [ ] Dates and currencies formatted with `I18n.l()` and `number_to_currency()`
- [ ] Locale switching implemented (`around_action :switch_locale`)
- [ ] Fallback locales configured
- [ ] `i18n-tasks health` passes with no missing or unused keys
- [ ] Missing translation detection enabled in test suite

<related-skills>
  <skill name="models" reason="Model attribute and enum translations live under activerecord namespace" />
  <skill name="testing" reason="I18n specs catch missing translations before deployment" />
  <skill name="views" reason="Views are the primary consumer of lazy lookups and translated content" />
</related-skills>
