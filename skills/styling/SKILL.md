---
name: styling
description: Style Rails views with Tailwind CSS utilities, DaisyUI components, and theme-aware responsive design
triggers:
  - styling a view
  - Tailwind CSS
  - DaisyUI components
  - responsive design
  - dark mode
  - theme switching
  - CSS in Rails
  - component styling
---

# Styling

## When to use this skill

- Styling any user interface in a Rails application
- Building responsive layouts (mobile, tablet, desktop)
- Implementing dark mode or multiple themes
- Creating consistent UI components (buttons, cards, forms, modals)
- Rapid UI iteration and prototyping
- Maintaining design system consistency across views

## Principles

1. **Utility-first, component-second** — use Tailwind utilities directly. Reach for DaisyUI semantic components for complex, repeated UI (buttons, cards, modals).
2. **No hardcoded colors** — always use DaisyUI theme variables (`primary`, `secondary`, `accent`, `base-content`) so themes and dark mode work automatically.
3. **Mobile-first responsive** — start with the smallest breakpoint, layer up: base → `sm:` → `md:` → `lg:` → `xl:`.
4. **No custom CSS** — if you're writing a `.css` class, stop. Compose with Tailwind utilities or extract a ViewComponent instead.
5. **Propshaft serves assets** — Rails 8 uses Propshaft (not Sprockets). Tailwind CSS is compiled via `tailwindcss-rails` gem and served through Propshaft's asset pipeline.
6. **Import maps for JS** — Rails 8 uses import maps by default (no Webpack/esbuild bundler). Stimulus controllers are loaded via import maps.
7. **Accessibility is non-negotiable** — 4.5:1 color contrast ratio (WCAG 2.1 AA), visible focus states, keyboard-navigable interactive elements.

## Tailwind CSS Setup (Rails 8)

Rails 8 uses Propshaft + import maps. Tailwind is installed via the `tailwindcss-rails` gem:

```ruby
# Gemfile
gem "tailwindcss-rails"
```

```bash
bin/rails tailwindcss:install
```

This generates `app/assets/stylesheets/application.tailwind.css` with Tailwind directives. Propshaft serves the compiled output — no Sprockets manifest needed.

### Tailwind config

```javascript
// config/tailwind.config.js
module.exports = {
  content: [
    "./app/views/**/*.html.erb",
    "./app/helpers/**/*.rb",
    "./app/assets/stylesheets/**/*.css",
    "./app/javascript/**/*.js",
  ],
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light", "dark"],
  },
}
```

## Core Utilities

### Spacing & Layout

```erb
<%# Spacing: p-{size}, m-{size}, gap-{size} %>
<div class="p-4">Padding all sides</div>
<div class="px-6 py-4">Horizontal/Vertical padding</div>
<div class="mx-auto max-w-4xl">Centered container</div>

<%# Flexbox layout %>
<div class="flex items-center justify-between gap-4">
  <span>Left</span>
  <span>Right</span>
</div>

<%# Grid layout %>
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <% @items.each do |item| %>
    <div class="bg-base-100 p-4 rounded-lg shadow"><%= item.name %></div>
  <% end %>
</div>
```

### Responsive Design

Pattern: base (mobile) → `sm:` → `md:` → `lg:` → `xl:`

Breakpoints: `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`

```erb
<%# Responsive grid %>
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <% @feedbacks.each do |feedback| %>
    <%= render feedback %>
  <% end %>
</div>

<%# Responsive spacing/typography %>
<div class="p-4 md:p-8">
  <h1 class="text-2xl md:text-4xl font-bold">Heading</h1>
</div>

<%# Show/hide by breakpoint %>
<div class="block md:hidden">Mobile menu</div>
<nav class="hidden md:flex gap-4">Desktop nav</nav>
```

### Typography & Interactive States

```erb
<%# Typography %>
<p class="text-sm font-medium">Small medium text</p>
<h1 class="text-4xl font-bold">Large heading</h1>
<p class="leading-relaxed tracking-wide">Spaced text</p>
<p class="truncate"><%= feedback.content %></p>

<%# Interactive states %>
<button class="bg-primary hover:bg-primary-focus active:opacity-80 text-primary-content px-4 py-2 rounded">
  Hover me
</button>
<input type="text" class="border border-base-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded px-3 py-2" />
```

## DaisyUI Components

Semantic component library on top of Tailwind — 70+ accessible components with theming and dark mode built in.

### Buttons & Forms

```erb
<%# Button variants %>
<button class="btn btn-primary">Primary Action</button>
<button class="btn btn-ghost">Ghost</button>
<button class="btn btn-outline btn-primary">Outline</button>

<%# Rails form integration %>
<%= form_with model: @feedback do |f| %>
  <div class="form-control">
    <%= f.label :content, class: "label" do %>
      <span class="label-text">Feedback</span>
    <% end %>
    <%= f.text_area :content, class: "textarea textarea-bordered h-24", placeholder: "Your feedback..." %>
  </div>
  <div class="flex gap-2 justify-end">
    <%= link_to "Cancel", feedbacks_path, class: "btn btn-ghost" %>
    <%= f.submit "Submit", class: "btn btn-primary" %>
  </div>
<% end %>
```

### Cards

```erb
<div class="card bg-base-100 shadow-xl">
  <div class="card-body">
    <div class="flex items-start justify-between">
      <h2 class="card-title"><%= @feedback.title %></h2>
      <div class="badge badge-<%= @feedback.status %>">
        <%= @feedback.status.titleize %>
      </div>
    </div>
    <p class="text-base-content/70"><%= @feedback.content %></p>
    <div class="card-actions justify-end mt-4">
      <%= link_to "View", feedback_path(@feedback), class: "btn btn-primary btn-sm" %>
    </div>
  </div>
</div>
```

### Alerts & Flash Messages

```erb
<%# Flash messages with DaisyUI alerts %>
<% if flash[:notice] %>
  <div class="alert alert-success">
    <span><%= flash[:notice] %></span>
  </div>
<% end %>

<% if flash[:alert] %>
  <div class="alert alert-error">
    <span><%= flash[:alert] %></span>
  </div>
<% end %>

<%# Badges %>
<div class="badge badge-primary">Primary</div>
<div class="badge badge-success">Active</div>
<div class="badge badge-warning">Pending</div>
```

### Modals

```erb
<button class="btn btn-primary" onclick="feedback_modal.showModal()">
  View Details
</button>

<dialog id="feedback_modal" class="modal">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Feedback Details</h3>
    <p class="py-4"><%= @feedback.content %></p>
    <div class="modal-action">
      <form method="dialog">
        <button class="btn">Close</button>
      </form>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
```

## Theme Switching with Stimulus

DaisyUI themes are activated via the `data-theme` attribute on `<html>`. Use a Stimulus controller for persistence:

```javascript
// app/javascript/controllers/theme_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    const savedTheme = localStorage.getItem("theme") || "light"
    this.setTheme(savedTheme)
  }

  toggle() {
    const current = document.documentElement.getAttribute("data-theme")
    const next = current === "light" ? "dark" : "light"
    this.setTheme(next)
  }

  setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("theme", theme)
  }
}
```

```erb
<%# In layout %>
<html data-theme="light">
  <body>
    <div data-controller="theme">
      <button class="btn btn-ghost btn-circle" data-action="click->theme#toggle">
        Toggle Theme
      </button>
    </div>
  </body>
</html>
```

## Component-Style CSS Organization

Avoid writing custom CSS classes. Instead, extract repeated utility combinations into ViewComponents or partials:

```ruby
# app/components/badge_component.rb
class BadgeComponent < ViewComponent::Base
  VARIANTS = {
    success: "badge badge-success",
    warning: "badge badge-warning",
    error:   "badge badge-error",
    info:    "badge badge-info",
  }.freeze

  def initialize(variant: :info, label:)
    @css = VARIANTS.fetch(variant)
    @label = label
  end
end
```

```erb
<%# app/components/badge_component.html.erb %>
<span class="<%= @css %>"><%= @label %></span>

<%# Usage: render BadgeComponent.new(variant: :success, label: "Active") %>
```

## Testing Styles

```ruby
# test/system/styling_test.rb
class StylingTest < ApplicationSystemTestCase
  test "responsive layout changes at breakpoints" do
    visit feedbacks_path
    page.driver.browser.manage.window.resize_to(1280, 800)
    assert_selector ".hidden.md\\:flex"  # Desktop nav visible

    page.driver.browser.manage.window.resize_to(375, 667)
    assert_selector ".block.md\\:hidden"  # Mobile menu visible
  end

  test "dark mode toggle works" do
    visit root_path
    assert_equal "light", page.evaluate_script("document.documentElement.getAttribute('data-theme')")

    click_button "Toggle Theme"
    assert_equal "dark", page.evaluate_script("document.documentElement.getAttribute('data-theme')")
  end
end
```

Manual testing checklist:
- Test responsive breakpoints (375px, 640px, 768px, 1024px, 1280px)
- Verify color contrast ratios (browser DevTools or axe)
- Test light and dark themes
- Check focus states on all interactive elements
- Test browser zoom at 200% and 400%

## Gotchas

- **Never hardcode colors** — `bg-blue-500` breaks theme switching. Use DaisyUI semantic names (`bg-primary`, `text-base-content`) so colors adapt to the active theme.
- **Don't build custom buttons with raw Tailwind** — `class="px-4 py-2 bg-blue-500 text-white rounded"` duplicates what `btn btn-primary` already does, minus the accessibility and theming.
- **Don't use inline `style=` attributes** — they bypass the design system and can't be purged. Use Tailwind utilities.
- **Don't forget the responsive base** — writing `md:grid-cols-3` without a base `grid-cols-1` means undefined layout on mobile.
- **Propshaft is not Sprockets** — there's no `*= require` manifest. Propshaft serves files from `app/assets/` by path. Don't look for a Sprockets manifest file.
- **Import maps don't bundle** — each module is a separate HTTP request. Don't try to `import` npm packages that aren't pinned in `config/importmap.rb`.

## Validation

- [ ] No hardcoded colors — all colors use DaisyUI theme variables
- [ ] Responsive design tested at mobile, tablet, and desktop breakpoints
- [ ] Accessibility verified — 4.5:1 contrast ratio, visible focus states, keyboard navigation
- [ ] Theme-aware — UI works correctly in both light and dark modes
- [ ] Tailwind utilities used — no custom CSS files or inline styles
- [ ] DaisyUI components used for buttons, cards, modals, alerts (not hand-rolled equivalents)
- [ ] All tests passing

<related-skills>
  <skill name="views" reason="View structure and partials that styling is applied to" />
  <skill name="hotwire" reason="Interactive Turbo/Stimulus components that need styling" />
  <skill name="testing" reason="System tests for visual regression and accessibility" />
</related-skills>
