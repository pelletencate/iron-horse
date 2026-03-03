---
name: active-storage
description: Configure Active Storage for file uploads with variants, direct uploads, and secure attachment handling
triggers:
  - file upload
  - image attachment
  - Active Storage
  - has_one_attached
  - has_many_attached
  - image variants
  - direct upload
  - cloud storage S3 GCS
  - file validation
  - document storage
---

# Active Storage

## When to use this skill

- Adding file or image uploads to a Rails model
- Configuring cloud storage (S3, GCS, Azure) or local disk
- Generating image variants (thumbnails, resizing, format conversion)
- Setting up direct uploads from the browser to cloud storage
- Validating uploaded file types, sizes, and content
- Serving or downloading attached files
- Preventing N+1 queries on attachments

## Principles

1. **Triple-validate uploads** — check content-type, file extension, AND magic bytes. Never trust the client.
2. **Variants are lazy** — define named variants on the model, they're generated on first access. Pre-process in background if needed.
3. **Eager load attachments** — always use `with_attached_*` scopes to prevent N+1 queries.
4. **Direct upload for large files** — skip the server roundtrip; upload directly from browser to cloud storage.
5. **Proxy mode for private files** — use `rails_storage_proxy_path` instead of redirect mode when files must stay behind authentication.
6. **Background purge** — use `purge_later` instead of `purge` to avoid blocking requests with cloud storage API calls.

## Setup

```bash
# Install Active Storage (creates migrations for active_storage_blobs/attachments/variant_records)
bin/rails active_storage:install
bin/rails db:migrate

# Add image processing for variants
bundle add image_processing
```

## Configuration

### Storage Services

```yaml
# config/storage.yml
local:
  service: Disk
  root: <%= Rails.root.join("storage") %>

test:
  service: Disk
  root: <%= Rails.root.join("tmp/storage") %>

amazon:
  service: S3
  access_key_id: <%= Rails.application.credentials.dig(:aws, :access_key_id) %>
  secret_access_key: <%= Rails.application.credentials.dig(:aws, :secret_access_key) %>
  region: eu-west-1
  bucket: <%= Rails.application.credentials.dig(:aws, :bucket) %>

google:
  service: GCS
  credentials: <%= Rails.root.join("config/gcs-credentials.json") %>
  project: my-project
  bucket: my-bucket
```

### Environment Config

```ruby
# config/environments/development.rb
config.active_storage.service = :local

# config/environments/production.rb
config.active_storage.service = :amazon
```

## Attachments

### Single Attachment

```ruby
class User < ApplicationRecord
  has_one_attached :avatar do |attachable|
    attachable.variant :thumb, resize_to_fill: [100, 100]
    attachable.variant :medium, resize_to_limit: [300, 300]
  end
end
```

### Multiple Attachments

```ruby
class Event < ApplicationRecord
  has_many_attached :photos do |attachable|
    attachable.variant :thumb, resize_to_fill: [150, 150]
  end

  has_many_attached :documents
end
```

## Image Variants

### Variant Operations

```ruby
resize_to_limit: [300, 300]   # Fit within box, maintain aspect ratio
resize_to_fill:  [300, 300]   # Crop to exact dimensions
resize_to_cover: [300, 300]   # Cover dimensions (may exceed)

# Format conversion with quality
resize_to_limit: [300, 300], format: :webp, saver: { quality: 80 }
```

### Using Variants in Views

```erb
<%# Named variant %>
<%= image_tag user.avatar.variant(:thumb) %>

<%# Inline variant %>
<%= image_tag user.avatar.variant(resize_to_limit: [200, 200]) %>

<%# With fallback %>
<% if user.avatar.attached? %>
  <%= image_tag user.avatar.variant(:thumb), alt: user.name %>
<% else %>
  <%= image_tag "default-avatar.png", alt: "Default" %>
<% end %>
```

## Validations

### Using active_storage_validations Gem (Recommended)

```ruby
# Gemfile
gem "active_storage_validations"
```

```ruby
class User < ApplicationRecord
  has_one_attached :avatar

  validates :avatar,
    content_type: ["image/png", "image/jpeg", "image/webp"],
    size: { less_than: 5.megabytes }
end

class Event < ApplicationRecord
  has_many_attached :documents

  validates :documents,
    content_type: ["application/pdf", "image/png", "image/jpeg"],
    size: { less_than: 10.megabytes },
    limit: { max: 10 }
end
```

### Manual Validation (Triple Check)

```ruby
class User < ApplicationRecord
  has_one_attached :avatar

  validate :acceptable_avatar

  private

  def acceptable_avatar
    return unless avatar.attached?

    # 1. Size check
    unless avatar.blob.byte_size <= 5.megabytes
      errors.add(:avatar, "is too large (max 5MB)")
    end

    # 2. Content-type check
    acceptable_types = ["image/jpeg", "image/png", "image/webp"]
    unless acceptable_types.include?(avatar.content_type)
      errors.add(:avatar, "must be a JPEG, PNG, or WebP")
    end

    # 3. Extension check (don't trust content_type alone)
    acceptable_extensions = %w[jpg jpeg png webp]
    unless acceptable_extensions.include?(avatar.filename.extension.downcase)
      errors.add(:avatar, "has an invalid file extension")
    end
  end
end
```

## Security

### Dangerous File Types — Block These

```ruby
DANGEROUS_TYPES = %w[
  application/x-executable application/x-msdownload
  application/x-sharedlib application/x-dosexec
  text/html application/xhtml+xml image/svg+xml
  application/javascript text/javascript
].freeze

validate :reject_dangerous_files

def reject_dangerous_files
  return unless file.attached?
  if DANGEROUS_TYPES.include?(file.content_type)
    errors.add(:file, "type is not allowed for security reasons")
  end
end
```

**Why block SVGs?** SVG files can contain embedded JavaScript and are an XSS vector when served inline.

### Virus Scanning

For production systems handling user uploads, integrate virus scanning (e.g., ClamAV via `clamby` gem) as an `after_create_commit` callback or ActiveJob that quarantines suspicious files.

### Serving Modes

```ruby
# Redirect mode (default) — 302 to cloud storage URL
# Fast, but URL is temporarily public
rails_blob_path(user.avatar, disposition: "attachment")

# Proxy mode — stream through Rails server
# Slower, but keeps files behind authentication
rails_storage_proxy_path(user.avatar)
```

## Direct Uploads

### Setup

```javascript
// app/javascript/application.js
import * as ActiveStorage from "@rails/activestorage"
ActiveStorage.start()
```

### Form with Direct Upload

```erb
<%= form_with model: @event do |f| %>
  <%= f.file_field :photos, multiple: true, direct_upload: true %>
<% end %>
```

### Upload Progress Styling

```css
.direct-upload { display: inline-block; position: relative; padding: 2px 4px;
  margin: 0 3px 3px 0; border: 1px solid rgba(0,0,0,0.3); border-radius: 3px; }
.direct-upload--pending { opacity: 0.6; }
.direct-upload__progress { position: absolute; top: 0; left: 0; bottom: 0;
  opacity: 0.2; background: #0076ff; transition: width 120ms ease-out; }
.direct-upload--complete .direct-upload__progress { opacity: 0.4; }
.direct-upload--error { border-color: red; }
```

## Controller Handling

```ruby
# Permitting params — single attachment is a scalar, multiple is an array
def user_params
  params.require(:user).permit(:name, :email, :avatar)
end

def event_params
  params.require(:event).permit(:name, :description, photos: [], documents: [])
end

# Removing attachments
def remove_avatar
  @user.avatar.purge_later
  redirect_to edit_user_path(@user), notice: "Avatar removed"
end

# Downloading files
def download
  redirect_to rails_blob_path(@document.file, disposition: "attachment")
end
```

## Forms

```erb
<%# Single upload with preview %>
<%= form_with model: @user do |f| %>
  <%= f.file_field :avatar, accept: "image/png,image/jpeg,image/webp" %>
  <%= image_tag @user.avatar.variant(:thumb) if @user.avatar.attached? %>
<% end %>

<%# Multiple uploads %>
<%= form_with model: @event do |f| %>
  <%= f.file_field :photos, multiple: true, accept: "image/*" %>
<% end %>
```

## Performance

### Eager Loading (Prevent N+1)

```ruby
# Always use with_attached_* scopes
User.with_attached_avatar.limit(10)
Event.with_attached_photos.with_attached_documents
```

### Preloading Variants

```ruby
# Pre-process variants in background after attach
after_create_commit :preprocess_variants

def preprocess_variants
  avatar.variant(:thumb).processed if avatar.attached?
end
```

## Testing

```ruby
# spec/models/user_spec.rb
RSpec.describe User, type: :model do
  let(:user) { create(:user) }

  it "attaches an avatar" do
    user.avatar.attach(
      io: File.open(Rails.root.join("spec/fixtures/files/avatar.jpg")),
      filename: "avatar.jpg", content_type: "image/jpeg"
    )
    expect(user.avatar).to be_attached
  end
end

# spec/factories/users.rb — trait for attaching files
trait :with_avatar do
  after(:build) do |user|
    user.avatar.attach(
      io: File.open(Rails.root.join("spec/fixtures/files/avatar.jpg")),
      filename: "avatar.jpg", content_type: "image/jpeg"
    )
  end
end
```

### Service Methods Quick Reference

```ruby
user.avatar.attached?          # Check if attached
user.avatar.filename.to_s      # Original filename
user.avatar.content_type       # MIME type
user.avatar.byte_size          # Size in bytes
url_for(user.avatar)           # URL (requires controller context)
user.avatar.purge_later        # Delete async
```

## Gotchas

- **Don't trust `content_type` alone** — browsers send whatever the OS reports. Validate extension AND use magic-byte detection (the `marcel` gem, bundled with Rails, does this) for defense in depth.
- **SVGs are dangerous** — they can contain `<script>` tags. Block or sanitize SVG uploads unless you explicitly need them.
- **`purge` blocks the request** — always prefer `purge_later` to avoid slow cloud API calls in the request cycle.
- **`has_many_attached` replaces by default** — re-submitting a form with `photos: []` removes existing photos. Use `@model.photos.attach(new_files)` to append instead.
- **Variants require `image_processing` gem** — without it, variant calls silently fail or raise. Add `gem "image_processing"` to your Gemfile.
- **Missing `with_attached_*` causes N+1** — every `avatar.attached?` call in a loop fires a query. Always eager load.

## Validation

- [ ] `active_storage:install` migration has been run
- [ ] Storage service configured in `config/storage.yml` and environment files
- [ ] `image_processing` gem added if using variants
- [ ] Attachments declared on models (`has_one_attached` / `has_many_attached`)
- [ ] File validations present (content type, size, extension)
- [ ] Dangerous file types blocked (executables, SVGs, HTML)
- [ ] `with_attached_*` used in queries to prevent N+1
- [ ] Direct uploads configured if needed (JS import + `direct_upload: true`)
- [ ] Tests cover attachment, validation rejection, and variant generation

<related-skills>
  <skill name="models" reason="Attachments are declared on ActiveRecord models" />
  <skill name="testing" reason="Upload flows need request and model specs" />
  <skill name="security" reason="File uploads are a major attack vector" />
  <skill name="controllers" reason="Controllers handle upload params and serving files" />
</related-skills>
