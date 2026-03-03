---
name: views
description: Build Rails views with partials, layouts, helpers, forms, nested forms, and WCAG 2.1 AA accessibility
triggers:
  - building a view
  - ERB templates
  - partials and layouts
  - view helpers
  - nested forms
  - form_with
  - content_for
  - accessibility
  - WCAG compliance
  - ARIA labels
---

# Views

## When to use this skill

- Building any user interface or view in Rails
- Creating reusable partials and view components
- Implementing forms (simple or nested with `accepts_nested_attributes_for`)
- Organizing view logic with helpers or presenters
- Managing layouts with `yield` and `content_for`
- Ensuring WCAG 2.1 AA accessibility compliance

## Principles

1. **Locals over instance variables in partials** — pass data explicitly via `locals:` to keep partials reusable and testable.
2. **Semantic HTML first** — use `header`, `nav`, `main`, `section`, `footer` before reaching for ARIA attributes.
3. **No logic in templates** — conditionals beyond simple `if`/`unless` belong in helpers or presenters.
4. **Accessible by default** — every form has labels, every image has alt text, every interactive element is keyboard-reachable.
5. **Sanitize, never `html_safe`** — use `sanitize()` with an explicit allowlist. Calling `.html_safe` on user input is an XSS vector.
6. **Collection rendering over loops** — `render @items` is faster (single template lookup) and cleaner than `each` + `render`.

## Partials

### Basic partials with locals

```erb
<%# Shared directory %>
<%= render "shared/header" %>

<%# Explicit locals (preferred) %>
<%= render partial: "feedback", locals: { feedback: @feedback, show_actions: true } %>

<%# app/views/feedbacks/_feedback.html.erb %>
<div id="<%= dom_id(feedback) %>" class="card">
  <h3><%= feedback.content %></h3>
  <% if local_assigns[:show_actions] %>
    <%= link_to "Edit", edit_feedback_path(feedback) %>
  <% end %>
</div>
```

Use `local_assigns[:var]` to check for optional locals without raising `NameError`.

### Collection rendering

```erb
<%# Shorthand — automatic partial lookup %>
<%= render @feedbacks %>

<%# Explicit with counter/iteration %>
<%= render partial: "feedback", collection: @feedbacks %>

<%# Inside the partial: %>
<div id="<%= dom_id(feedback) %>" class="card">
  <span class="badge"><%= feedback_counter + 1 %></span>
  <h3><%= feedback.content %></h3>
  <% if feedback_iteration.last? %>
    <span class="label">Latest</span>
  <% end %>
</div>
```

Counter variables: `feedback_counter` (0-indexed), `feedback_iteration` (`first?`, `last?`, `index`, `size`).

## Layouts & Content Blocks

```erb
<%# app/views/layouts/application.html.erb %>
<!DOCTYPE html>
<html lang="en">
<head>
  <title><%= content_for?(:title) ? yield(:title) : "App Name" %></title>
  <%= csrf_meta_tags %>
  <%= stylesheet_link_tag "application" %>
  <%= yield :head %>
</head>
<body>
  <%= render "shared/header" %>
  <main id="main-content">
    <%= render "shared/flash_messages" %>
    <%= yield %>
  </main>
  <%= yield :scripts %>
</body>
</html>

<%# app/views/feedbacks/show.html.erb %>
<% content_for :title, "#{@feedback.content.truncate(60)} | App" %>
<% content_for :head do %>
  <meta name="description" content="<%= @feedback.content.truncate(160) %>">
<% end %>
<div class="feedback-detail"><%= @feedback.content %></div>
```

## View Helpers

### Custom helpers

```ruby
# app/helpers/application_helper.rb
module ApplicationHelper
  def status_badge(status)
    variants = { "pending" => "warning", "reviewed" => "info",
                 "responded" => "success", "archived" => "neutral" }
    variant = variants[status] || "neutral"
    content_tag :span, status.titleize, class: "badge badge-#{variant}"
  end

  def page_title(title = nil)
    base = "My App"
    title.present? ? "#{title} | #{base}" : base
  end
end
```

### Built-in text helpers

```erb
<%= truncate(@feedback.content, length: 150) %>
<%= time_ago_in_words(@feedback.created_at) %> ago
<%= pluralize(@feedbacks.count, "feedback") %>
<%= sanitize(user_content, tags: %w[p br strong em]) %>
```

## Nested Forms

Build forms handling parent-child relationships with `accepts_nested_attributes_for` and `fields_for`.

### Model setup

```ruby
class Feedback < ApplicationRecord
  has_many :attachments, dependent: :destroy
  accepts_nested_attributes_for :attachments,
    allow_destroy: true,
    reject_if: :all_blank
end
```

### Controller params

```ruby
class FeedbacksController < ApplicationController
  def new
    @feedback = Feedback.new
    3.times { @feedback.attachments.build }
  end

  private

  def feedback_params
    params.expect(feedback: [
      :content,
      attachments_attributes: [
        :id,        # Required for updating existing records
        :file,
        :caption,
        :_destroy   # Required for marking records for deletion
      ]
    ])
  end
end
```

### Nested form view

```erb
<%= form_with model: @feedback do |form| %>
  <%= form.text_area :content, class: "textarea" %>

  <fieldset>
    <legend>Attachments</legend>
    <%= form.fields_for :attachments do |f| %>
      <div class="nested-fields card">
        <%= f.file_field :file, class: "file-input" %>
        <%= f.text_field :caption, class: "input" %>
        <%= f.hidden_field :id if f.object.persisted? %>
        <%= f.check_box :_destroy %> <%= f.label :_destroy, "Remove" %>
      </div>
    <% end %>
  </fieldset>

  <%= form.submit class: "btn btn-primary" %>
<% end %>
```

## Accessibility (WCAG 2.1 AA)

### Semantic structure & skip links

```erb
<a href="#main-content" class="sr-only focus:not-sr-only">
  Skip to main content
</a>

<header>
  <h1>App Name</h1>
  <nav aria-label="Main navigation">
    <ul>
      <li><%= link_to "Home", root_path %></li>
      <li><%= link_to "Feedbacks", feedbacks_path %></li>
    </ul>
  </nav>
</header>

<main id="main-content">
  <section aria-labelledby="pending-heading">
    <h2 id="pending-heading">Pending Items</h2>
  </section>
</main>
```

Maintain logical heading hierarchy (h1 → h2 → h3); never skip levels.

### ARIA labels for icon-only and custom elements

```erb
<%# Icon-only button %>
<button aria-label="Close modal" class="btn btn-ghost btn-sm">
  <svg class="w-4 h-4">...</svg>
</button>

<%# Delete with context %>
<%= button_to "Delete", feedback_path(@feedback),
    method: :delete,
    aria: { label: "Delete feedback from #{@feedback.sender_name}" } %>

<%# Modal %>
<dialog aria-labelledby="modal-title" aria-modal="true">
  <h3 id="modal-title">Feedback Details</h3>
</dialog>

<%# Hint text linked to input %>
<%= form.text_field :email, aria: { describedby: "email-hint" } %>
<span id="email-hint">We'll never share your email</span>
```

### Live regions for dynamic content

```erb
<div aria-live="polite" aria-atomic="true">
  <% if flash[:notice] %>
    <div role="status" class="alert alert-success"><%= flash[:notice] %></div>
  <% end %>
  <% if flash[:alert] %>
    <div role="alert" class="alert alert-error"><%= flash[:alert] %></div>
  <% end %>
</div>
```

`aria-live="polite"` announces when idle; `"assertive"` interrupts immediately.

### Accessible forms with error handling

```erb
<%= form_with model: @feedback do |form| %>
  <% if @feedback.errors.any? %>
    <div role="alert" id="error-summary" tabindex="-1">
      <h2><%= pluralize(@feedback.errors.count, "error") %> prohibited saving:</h2>
      <ul>
        <% @feedback.errors.full_messages.each do |msg| %>
          <li><%= msg %></li>
        <% end %>
      </ul>
    </div>
  <% end %>

  <div class="form-control">
    <%= form.label :content, "Your Feedback" %>
    <%= form.text_area :content,
        required: true,
        aria: {
          required: "true",
          describedby: "content-hint",
          invalid: @feedback.errors[:content].any? ? "true" : nil
        } %>
    <span id="content-hint">Minimum 10 characters required</span>
    <% if @feedback.errors[:content].any? %>
      <span id="content-error" role="alert"><%= @feedback.errors[:content].first %></span>
    <% end %>
  </div>

  <fieldset>
    <legend>Sender Information</legend>
    <%= form.label :sender_name, "Name" %>
    <%= form.text_field :sender_name %>
    <%= form.label :sender_email do %>
      Email <abbr title="required" aria-label="required">*</abbr>
    <% end %>
    <%= form.email_field :sender_email, required: true, autocomplete: "email" %>
  </fieldset>

  <%= form.submit "Submit", data: { disable_with: "Submitting..." } %>
<% end %>
```

### Keyboard navigation

```erb
<%# Native elements are keyboard-accessible by default %>
<button type="button" data-action="click->modal#open">Open</button>

<%# Custom interactive elements need full keyboard support %>
<div tabindex="0" role="button"
     data-action="click->ctrl#act keydown.enter->ctrl#act keydown.space->ctrl#act">
  Custom Button
</div>
```

```css
/* Always provide visible focus indicators */
button:focus, a:focus, input:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

### Color contrast & images

WCAG AA minimums: 4.5:1 for normal text, 3:1 for large text (≥18px or bold ≥14px).

```erb
<%# Convey meaning with icon + text, not color alone %>
<span class="text-error">
  <svg aria-hidden="true">...</svg>
  <strong>Error:</strong> This field is required
</span>

<%# Descriptive alt text %>
<%= image_tag "chart.png", alt: "Bar chart: 85% positive feedback in March 2025" %>

<%# Decorative images — empty alt %>
<%= image_tag "decoration.svg", alt: "", role: "presentation" %>

<%# Functional images — describe the action %>
<%= link_to feedback_path(@feedback) do %>
  <%= image_tag "view-icon.svg", alt: "View feedback details" %>
<% end %>
```

## Gotchas

- **Instance variables in partials** create hidden coupling to controllers. Always pass data via `locals:`.
- **`html_safe` on user input** is an XSS vulnerability. Use `sanitize()` with an explicit tag allowlist instead.
- **Placeholder as label** — placeholders disappear on input and have poor contrast. Always pair with a visible `<label>`.
- **Missing `:id` in nested attributes params** — Rails can't match existing records, creating duplicates on update. Always permit `:id` and `:_destroy`.
- **Skipping heading levels** (h1 → h3) breaks screen reader navigation. Maintain strict hierarchy.
- **Forgetting `aria-live` on flash messages** — screen readers won't announce dynamically inserted content without live regions.

## Validation

- [ ] Semantic HTML used (`header`, `nav`, `main`, `section`, `footer`)
- [ ] All forms have proper `<label>` elements and error messages with `role="alert"`
- [ ] Partials use local variables, not instance variables
- [ ] Keyboard navigation works for all interactive elements
- [ ] Color contrast meets 4.5:1 (text) / 3:1 (large text) minimums
- [ ] Images have descriptive `alt` text (or `alt=""` for decorative)
- [ ] Nested form params include `:id` and `:_destroy`
- [ ] No `html_safe` on user-provided content
- [ ] All tests passing

<related-skills>
  <skill name="hotwire" reason="Add interactivity with Turbo and Stimulus" />
  <skill name="styling" reason="Style views with Tailwind and DaisyUI" />
  <skill name="controllers" reason="RESTful actions and strong parameters for form handling" />
  <skill name="testing" reason="View and system testing patterns" />
</related-skills>
