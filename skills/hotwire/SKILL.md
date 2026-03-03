---
name: hotwire
description: Use when adding interactivity to Rails views — Turbo (Drive, Morphing, Frames, Streams) and Stimulus controllers
triggers:
  - turbo drive
  - turbo frames
  - turbo streams
  - turbo morphing
  - broadcasts_refreshes
  - stimulus controller
  - real-time updates
  - SPA-like navigation
  - inline editing
  - dynamic forms
  - hotwire
---

# Hotwire (Turbo + Stimulus)

Build fast, interactive, SPA-like experiences using server-rendered HTML. Turbo provides navigation and real-time updates without writing JavaScript. Stimulus enhances HTML with lightweight JavaScript controllers.

## When to use this skill

- Adding interactivity without heavy JavaScript frameworks
- Building real-time, SPA-like experiences with server-rendered HTML
- Implementing live updates, infinite scroll, or dynamic content
- Creating modals, inline editing, or interactive UI components

## Principles

1. **Turbo Morphing by default** — use morphing with standard Rails controllers for general CRUD. Frames only for modals, inline editing, pagination, tabs.
2. **Progressive enhancement** — features must work without JavaScript, then enhance with it.
3. **`broadcasts_refreshes` for real-time** — the primary Rails 8 real-time pattern. Dedicated Turbo Streams are for complex multi-element updates.
4. **Stimulus is the last resort** — before writing a Stimulus controller, ask "Can Turbo Morph handle this?"
5. **Always clean up** — Stimulus `disconnect()` must tear down timers, listeners, and subscriptions.

## Turbo Drive

Turbo Drive intercepts links and forms automatically. Control with `data` attributes:

```erb
<%# Disable Turbo for specific links %>
<%= link_to "Download PDF", pdf_path, data: { turbo: false } %>

<%# Replace without history %>
<%= link_to "Dismiss", dismiss_path, data: { turbo_action: "replace" } %>
```

## Turbo Morphing — Preferred Approach

Morphing intelligently updates only changed DOM elements while preserving scroll position, focus, form state, and media playback. This is the Rails 8 default.

### Layout setup (one-time)

```erb
<%# app/views/layouts/application.html.erb %>
<head>
  <%# Enable Turbo Morph for page refreshes %>
  <meta name="turbo-refresh-method" content="morph">
  <meta name="turbo-refresh-scroll" content="preserve">
</head>
```

That's it. Standard Rails controllers now work with morphing — no custom JavaScript needed.

### Standard CRUD with morphing

Stock Rails scaffold controllers work automatically:

```ruby
class FeedbacksController < ApplicationController
  def create
    @feedback = Feedback.new(feedback_params)
    if @feedback.save
      redirect_to feedbacks_path, notice: "Feedback created"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def destroy
    @feedback.destroy
    redirect_to feedbacks_path, notice: "Feedback deleted"
  end
end
```

```erb
<%# app/views/feedbacks/index.html.erb %>
<div id="feedbacks">
  <% @feedbacks.each do |feedback| %>
    <%= render feedback %>
  <% end %>
</div>

<%# app/views/feedbacks/_feedback.html.erb %>
<div id="<%= dom_id(feedback) %>" class="card">
  <h3><%= feedback.content %></h3>
  <%= link_to "Edit", edit_feedback_path(feedback) %>
  <%= button_to "Delete", feedback_path(feedback), method: :delete,
                form: { data: { turbo_confirm: "Are you sure?" } } %>
</div>
```

Create/update/delete triggers redirect → Turbo intercepts → morphs only changed elements → scroll and focus preserved.

### Permanent elements

Prevent specific elements from being morphed:

```erb
<%# Video won't restart on page morph %>
<video id="tutorial" data-turbo-permanent src="tutorial.mp4" controls></video>

<%# Form preserves input during live updates %>
<%= form_with model: @feedback, id: "feedback-form",
              data: { turbo_permanent: true } do |form| %>
  <%= form.text_area :content %>
  <%= form.submit %>
<% end %>
```

### Real-time with `broadcasts_refreshes`

The primary Rails 8 real-time pattern. The server broadcasts a refresh signal; all connected pages morph smoothly.

```ruby
# app/models/feedback.rb
class Feedback < ApplicationRecord
  broadcasts_refreshes
end
```

```erb
<%# Subscribe to stream — morphs when model changes %>
<%= turbo_stream_from @feedback %>

<div id="feedbacks">
  <% @feedbacks.each do |feedback| %>
    <%= render feedback %>
  <% end %>
</div>
```

User A creates feedback → server broadcasts `<turbo-stream action="refresh">` → all connected pages morph to show new content → scroll and focus preserved.

### Morph method in Turbo Streams

For targeted updates that preserve form state:

```erb
<%# .turbo_stream.erb %>
<turbo-stream action="replace" target="feedback_<%= @feedback.id %>" method="morph">
  <template>
    <%= render @feedback %>
  </template>
</turbo-stream>
```

## Turbo Frames — Use Sparingly

**Only use for:** modals, inline editing, tabs, pagination, lazy loading. For general CRUD, use Turbo Morph.

### Inline editing (valid use case)

```erb
<%# Show view %>
<%= turbo_frame_tag dom_id(@feedback) do %>
  <h3><%= @feedback.content %></h3>
  <%= link_to "Edit", edit_feedback_path(@feedback) %>
<% end %>

<%# Edit view — matching frame ID %>
<%= turbo_frame_tag dom_id(@feedback) do %>
  <%= form_with model: @feedback do |form| %>
    <%= form.text_area :content %>
    <%= form.submit "Save" %>
  <% end %>
<% end %>
```

### Lazy loading

```erb
<%= turbo_frame_tag "statistics", src: statistics_path, loading: :lazy do %>
  <p>Loading statistics...</p>
<% end %>

<%# Frame that reloads with morphing on page refresh %>
<%= turbo_frame_tag "live-stats", src: live_stats_path, refresh: "morph" do %>
  <p>Loading...</p>
<% end %>
```

## Turbo Streams — Complex Multi-Element Updates

Use dedicated Turbo Streams when you need to update multiple unrelated DOM elements in a single response. For simple CRUD, prefer `broadcasts_refreshes`.

### Stream actions

```ruby
def create
  if @feedback.save
    respond_to do |format|
      format.turbo_stream do
        render turbo_stream: [
          turbo_stream.prepend("feedbacks", @feedback),
          turbo_stream.update("count", html: Feedback.count.to_s),
          turbo_stream.remove("empty-state")
        ]
      end
      format.html { redirect_to feedbacks_path }
    end
  end
end
```

Actions: `append`, `prepend`, `replace`, `update`, `remove`, `before`, `after`, `refresh`

### Broadcasting (granular real-time)

For complex multi-element real-time updates where `broadcasts_refreshes` isn't sufficient:

```ruby
class Feedback < ApplicationRecord
  after_create_commit -> { broadcast_prepend_to "feedbacks" }
  after_update_commit -> { broadcast_replace_to "feedbacks" }
  after_destroy_commit -> { broadcast_remove_to "feedbacks" }
end
```

```erb
<%= turbo_stream_from "feedbacks" %>
<div id="feedbacks">
  <%= render @feedbacks %>
</div>
```

## Stimulus

Stimulus connects JavaScript objects to HTML via data attributes. Use it for client-side interactions that Turbo can't handle: dropdowns, character counters, dynamic forms.

**Don't use Stimulus for:** basic CRUD (use Turbo Morph), list updates (use Turbo Morph), navigation (use Turbo Drive).

### Controller basics

```javascript
// app/javascript/controllers/feedback_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["content", "charCount"]
  static values = { maxLength: { type: Number, default: 1000 } }

  connect() {
    this.updateCharCount()
  }

  updateCharCount() {
    const count = this.contentTarget.value.length
    this.charCountTarget.textContent = `${count} / ${this.maxLengthValue}`
  }

  disconnect() {
    // Always clean up timers, listeners, subscriptions
  }
}
```

```erb
<div data-controller="feedback" data-feedback-max-length-value="1000">
  <textarea data-feedback-target="content"
            data-action="input->feedback#updateCharCount"></textarea>
  <div data-feedback-target="charCount">0 / 1000</div>
</div>
```

Action syntax: `event->controller#method` (default event based on element type).

### Values API

Value types: `Array`, `Boolean`, `Number`, `Object`, `String`. Declare with `static values = { name: { type: Type, default: val } }`. Use `nameValueChanged()` callback to react to changes. See controller basics example above.

### Outlets — cross-controller communication

```javascript
// search_controller.js — references results controller via outlet
export default class extends Controller {
  static outlets = ["results"]

  search(event) {
    fetch(`/search?q=${event.target.value}`)
      .then(r => r.text())
      .then(html => this.resultsOutlet.update(html))
  }
}
```

```erb
<div data-controller="search" data-search-results-outlet="#results">
  <input data-action="input->search#search">
</div>
<div id="results" data-controller="results"></div>
```

### Dynamic nested forms

```erb
<div data-controller="nested-form">
  <%= form_with model: @feedback do |form| %>
    <button type="button" data-action="nested-form#add">Add Attachment</button>
    <div data-nested-form-target="container">
      <%= form.fields_for :attachments do |f| %>
        <%= render "attachment_fields", form: f %>
      <% end %>
    </div>
    <template data-nested-form-target="template">
      <%= form.fields_for :attachments, Attachment.new, child_index: "NEW_RECORD" do |f| %>
        <%= render "attachment_fields", form: f %>
      <% end %>
    </template>
  <% end %>
</div>
```

```javascript
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container", "template"]

  add(event) {
    event.preventDefault()
    const content = this.templateTarget.innerHTML
      .replace(/NEW_RECORD/g, new Date().getTime())
    this.containerTarget.insertAdjacentHTML("beforeend", content)
  }

  remove(event) {
    event.preventDefault()
    const field = event.target.closest(".nested-fields")
    const destroyInput = field.querySelector("input[name*='_destroy']")
    const idInput = field.querySelector("input[name*='[id]']")

    if (idInput && idInput.value) {
      destroyInput.value = "1"
      field.style.display = "none"
    } else {
      field.remove()
    }
  }
}
```

## Gotchas

- **Don't wrap every list in Turbo Frames** — Turbo Morph is simpler and preserves more state. Frames add unnecessary complexity for basic CRUD.
- **Don't forget `disconnect()` cleanup** — timers, event listeners, and subscriptions cause memory leaks if not torn down.
- **Don't skip the HTML fallback** — always provide `format.html` alongside `format.turbo_stream` so forms work without JavaScript.
- **Don't use `broadcasts_refreshes` and granular broadcasts together** — pick one pattern per model. Mixing causes double updates.
- **Don't forget `dom_id`** — Turbo Streams and morphing rely on stable element IDs. Always use `dom_id(record)` on partials.

## Validation

- [ ] Works without JavaScript (progressive enhancement verified)
- [ ] Turbo Morph used for CRUD operations (not Frames)
- [ ] Turbo Frames only for: modals, inline editing, pagination, tabs, lazy loading
- [ ] Stimulus controllers clean up in `disconnect()`
- [ ] `format.html` fallback present alongside `format.turbo_stream`
- [ ] All interactive features tested with system tests
- [ ] All tests passing

<related-skills>
  <skill name="views" reason="Partials, helpers, and view structure that Turbo operates on" />
  <skill name="controllers" reason="RESTful actions that work with Turbo responses" />
  <skill name="testing" reason="System tests for verifying Turbo and Stimulus behavior" />
</related-skills>
