---
name: security
description: Prevent critical security vulnerabilities in Rails — XSS, SQL injection, CSRF, file uploads, and command injection
triggers:
  - XSS prevention
  - SQL injection
  - CSRF protection
  - file upload security
  - command injection
  - sanitize user input
  - security review
  - Content Security Policy
---

# Security

## When to use this skill

- Displaying any user-generated content (XSS risk)
- Writing database queries with user input (SQL injection risk)
- Building forms or AJAX requests (CSRF risk)
- Accepting file uploads from users
- Executing system commands with any external input
- Implementing authentication or authorization
- Reviewing code for security vulnerabilities
- Always — security applies to every feature

## Principles

1. **Defense in depth** — never rely on a single layer. Combine Rails defaults, input validation, CSP headers, and output encoding.
2. **Never trust user input** — all params, headers, cookies, and file uploads are attacker-controlled until validated.
3. **Allowlists over denylists** — validate against known-good values, not known-bad patterns.
4. **Fail closed** — return 404 (not 403) for unauthorized access to avoid revealing record existence.
5. **Parameterize everything** — never interpolate user input into SQL, shell commands, or file paths.
6. **Triple-validate uploads** — check content type, file extension, AND magic bytes. One check is never enough.
7. **Least privilege** — grant the minimum access needed. Prefer `attachment` over `inline` for file serving.

## XSS Prevention

Rails auto-escapes ERB output by default. Never bypass it with `html_safe` or `raw` on user input.

### Sanitizing rich content

```erb
<%# Allow only specific tags — everything else stripped %>
<%= sanitize(@feedback.content,
    tags: %w[p br strong em a ul ol li],
    attributes: %w[href title]) %>
```

### Content Security Policy

```ruby
# config/initializers/content_security_policy.rb
Rails.application.config.content_security_policy do |policy|
  policy.default_src :self, :https
  policy.font_src    :self, :https, :data
  policy.img_src     :self, :https, :data
  policy.object_src  :none
  policy.script_src  :self, :https
  policy.style_src   :self, :https
  policy.frame_ancestors :none
end

Rails.application.config.content_security_policy_nonce_generator =
  ->(request) { SecureRandom.base64(16) }
Rails.application.config.content_security_policy_nonce_directives = %w[script-src]
```

Use `<%= javascript_tag nonce: true do %>` for inline scripts allowed by CSP.

### Safe markdown rendering

When rendering user markdown, filter HTML in the renderer **and** sanitize the output:

```ruby
def content_html
  renderer = Redcarpet::Render::HTML.new(filter_html: true, no_styles: true, safe_links_only: true)
  html = Redcarpet::Markdown.new(renderer, autolink: true, tables: true).render(content)
  ActionController::Base.helpers.sanitize(html,
    tags: %w[p br strong em a ul ol li pre code h1 h2 h3 blockquote],
    attributes: %w[href title])
end
```

## SQL Injection Prevention

### Secure query patterns

```ruby
# ✅ Hash conditions — always preferred
Project.where(name: params[:name])
Project.where(name: params[:name], status: params[:status])

# ✅ Positional placeholders — for complex conditions
Project.where("name = ?", params[:name])
Feedback.where("status = ? AND (priority = ? OR created_at < ?)",
  params[:status], "high", 1.day.ago)

# ✅ LIKE queries — always escape wildcards
search = Project.sanitize_sql_like(params[:query])
Project.where("name LIKE ?", "%#{search}%")
```

### ORDER BY with allowlist

```ruby
ALLOWED_SORT = %w[name created_at status].freeze
ALLOWED_DIR  = %w[ASC DESC].freeze

column = ALLOWED_SORT.include?(params[:sort]) ? params[:sort] : "created_at"
direction = ALLOWED_DIR.include?(params[:direction]&.upcase) ? params[:direction] : "DESC"
@projects = Project.order("#{column} #{direction}")
```

### Never interpolate

```ruby
# ❌ CRITICAL — allows arbitrary SQL injection
Project.where("name = '#{params[:name]}'")
# Attack: params[:name] = "' OR '1'='1"

# ✅ SECURE
Project.where(name: params[:name])
```

## CSRF Protection

Rails enables CSRF protection by default. Keep it enabled for all session-based controllers.

### Layout setup

```erb
<%# app/views/layouts/application.html.erb %>
<head>
  <%= csrf_meta_tags %>
</head>
```

### JavaScript requests

```javascript
const csrfToken = document.head.querySelector("meta[name=csrf-token]")?.content;
fetch("/feedbacks", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
  body: JSON.stringify({ feedback: { content: "test" } })
});
```

Or use `@rails/request.js` which handles CSRF automatically.

### API endpoints — skip CSRF only with token auth

```ruby
class Api::V1::BaseController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :authenticate_api_token

  private

  def authenticate_api_token
    token = request.headers["Authorization"]&.split(" ")&.last
    @current_api_user = User.find_by(api_token: token)
    head :unauthorized unless @current_api_user
  end
end
```

### SameSite cookies (defense in depth)

```ruby
# config/initializers/session_store.rb
Rails.application.config.session_store :cookie_store,
  key: '_myapp_session',
  same_site: :lax,
  secure: Rails.env.production?,
  httponly: true,
  expire_after: 24.hours
```

## File Upload Security

### ActiveStorage with validation

```ruby
class Feedback < ApplicationRecord
  has_one_attached :screenshot
  has_many_attached :documents

  validates :screenshot,
    content_type: %w[image/png image/jpeg image/gif],
    size: { less_than: 5.megabytes }

  validates :documents,
    content_type: %w[application/pdf text/plain],
    size: { less_than: 10.megabytes }
end
```

### Triple validation (content type + extension + magic bytes)

```ruby
class Feedback < ApplicationRecord
  has_one_attached :image
  validate :acceptable_image

  private

  def acceptable_image
    return unless image.attached?

    unless image.content_type.in?(%w[image/jpeg image/png image/gif])
      errors.add(:image, "must be a JPEG, PNG, or GIF")
    end

    unless image.filename.to_s.match?(/\.(jpe?g|png|gif)\z/i)
      errors.add(:image, "must have a valid extension")
    end

    unless valid_image_signature?
      errors.add(:image, "file signature doesn't match declared type")
    end

    errors.add(:image, "must be less than 5MB") if image.byte_size > 5.megabytes
  end

  def valid_image_signature?
    image.open do |file|
      magic = file.read(8)
      return false unless magic
      magic[0..2] == "\xFF\xD8\xFF" ||
        magic[0..7] == "\x89PNG\r\n\x1A\n" ||
        magic[0..3] == "GIF8"
    end
  rescue => e
    Rails.logger.error("Image validation error: #{e.message}")
    false
  end
end
```

### Force download for dangerous file types

```ruby
# config/initializers/active_storage.rb
Rails.application.config.active_storage.content_types_to_serve_as_binary.tap do |types|
  types << "image/svg+xml"
  types << "text/html" << "application/xhtml+xml"
  types << "text/xml" << "application/xml"
  types << "application/javascript" << "text/javascript"
end

Rails.application.config.active_storage.content_types_allowed_inline = %w[
  image/png image/jpeg image/gif image/bmp image/webp application/pdf
]
```

### Secure file serving

```ruby
class DownloadsController < ApplicationController
  before_action :authenticate_user!

  def show
    @feedback = Feedback.find(params[:feedback_id])
    head :not_found and return unless can_download?(@feedback)

    @document = @feedback.documents.find(params[:id])
    send_data @document.download,
      filename: @document.filename.to_s.gsub(/[^\w.-]/, "_"),
      type: @document.content_type,
      disposition: "attachment"
  end

  private

  def can_download?(feedback)
    feedback.user == current_user || current_user.admin?
  end
end
```

Note: use `head :not_found` (not `:forbidden`) to avoid revealing record existence.

## Command Injection Prevention

### Always use array form

```ruby
# ✅ Array args bypass shell — user input treated as literal
system("/bin/echo", params[:filename])
system("convert", params[:image], "output.jpg")
system("wkhtmltopdf", "--quiet", "--page-size", "A4", input_file, output_file)
```

### Prefer Ruby methods over shell commands

```ruby
# ❌ Shell command
system("rm #{params[:filename]}")

# ✅ Ruby method — no injection risk
File.delete(params[:filename]) if File.exist?(params[:filename])

# ❌ Shell command
system("mkdir -p #{params[:directory]}")

# ✅ Ruby method
FileUtils.mkdir_p(params[:directory])
```

### Path traversal prevention

```ruby
def safe_file_path(user_input)
  base_dir = Rails.root.join("uploads")
  full_path = base_dir.join(user_input).expand_path
  raise ArgumentError, "Invalid path" unless full_path.to_s.start_with?(base_dir.to_s)
  full_path
end
```

### When array form isn't possible

```ruby
require "shellwords"
filename = Shellwords.escape(params[:filename])
system("convert input.jpg #{filename}")
```

## OmniAuth Security Patterns

```ruby
# Verify state parameter to prevent CSRF on OAuth callbacks
OmniAuth.config.allowed_request_methods = [:post]  # never allow GET for auth

# Validate callback data before creating sessions
class SessionsController < ApplicationController
  def create
    auth = request.env["omniauth.auth"]
    return redirect_to root_path, alert: "Auth failed" unless auth&.dig("info", "email")

    user = User.find_or_create_from_omniauth(auth)
    session[:user_id] = user.id
    redirect_to root_path
  end
end
```

## Security Headers

```ruby
# config/application.rb
config.action_dispatch.default_headers = {
  'X-Frame-Options' => 'SAMEORIGIN',
  'X-Content-Type-Options' => 'nosniff',
  'X-XSS-Protection' => '1; mode=block',
  'Referrer-Policy' => 'strict-origin-when-cross-origin'
}
```

## Gotchas

- **`html_safe` / `raw` on user input** — instantly creates XSS. Only use on content you've sanitized with an explicit allowlist.
- **String interpolation in SQL** — `where("col = '#{val}'"` is always wrong. Use `where(col: val)` or `where("col = ?", val)`.
- **Skipping CSRF for convenience** — `skip_before_action :verify_authenticity_token` on session-based controllers is a critical hole.
- **Trusting filenames** — `params[:file].original_filename` can contain `../../etc/passwd`. Always sanitize or use ActiveStorage.
- **Content-Type alone for uploads** — easily spoofed. Always validate extension AND magic bytes too.
- **Backticks or `%x()` with user input** — these invoke a shell. Use `system("cmd", arg1, arg2)` array form instead.
- **Returning 403 for unauthorized records** — reveals that the record exists. Return 404 instead.

## Validation

- [ ] No `html_safe` or `raw` called on unsanitized user input
- [ ] All SQL queries use hash conditions or placeholders (no string interpolation)
- [ ] `sanitize_sql_like` used for all LIKE queries
- [ ] ORDER BY clauses use allowlist validation
- [ ] `csrf_meta_tags` present in application layout
- [ ] All forms use `form_with` (auto-includes CSRF token)
- [ ] JavaScript requests include `X-CSRF-Token` header
- [ ] File uploads validate content type + extension + magic bytes
- [ ] Dangerous file types forced to download (SVG, HTML, JS)
- [ ] Files stored outside public directory (ActiveStorage or equivalent)
- [ ] System commands use array form — never string interpolation
- [ ] File paths validated against directory traversal
- [ ] Strong parameters used for all mass assignment
- [ ] Unauthorized access returns 404, not 403

<related-skills>
  <skill name="controllers" reason="Strong parameters for mass assignment protection" />
  <skill name="models" reason="Input validation patterns at the model layer" />
  <skill name="views" reason="XSS prevention in templates" />
  <skill name="testing" reason="Security-specific test strategies" />
</related-skills>
