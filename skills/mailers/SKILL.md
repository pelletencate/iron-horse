---
name: mailers
description: Send emails with ActionMailer — async delivery via SolidQueue, templates, previews, attachments, and testing
triggers:
  - sending email
  - ActionMailer
  - mailer templates
  - email previews
  - deliver_later
  - mailer testing
  - email attachments
---

# Mailers

## When to use this skill

- Sending transactional emails (password resets, confirmations, receipts)
- Sending notification emails (updates, alerts, digests)
- Delivering emails asynchronously via SolidQueue background jobs
- Creating email templates with HTML and text versions
- Setting up mailer previews for development
- Attaching files (PDFs, images) to emails
- Testing email delivery and content

## Principles

1. **Always deliver async** — use `deliver_later` (not `deliver_now`) so email sending never blocks HTTP requests. SolidQueue handles background delivery.
2. **Both HTML and text** — always provide `.html.erb` and `.text.erb` templates for every mailer action. Text fallbacks ensure compatibility.
3. **URLs, not paths** — use `*_url` helpers in emails, never `*_path`. Emails are viewed outside your app so relative paths break.
4. **Inline CSS only** — email clients strip external stylesheets. All styles must be inline or in `<style>` tags within the email layout.
5. **Preview everything** — create mailer previews for every email variation. Catch layout issues before they reach users.
6. **Test delivery and content** — verify recipients, subjects, body content, and that emails are enqueued to the correct queue.

## ActionMailer Setup

### Application mailer

```ruby
# app/mailers/application_mailer.rb
class ApplicationMailer < ActionMailer::Base
  default from: "noreply@example.com"
  layout "mailer"
end
```

### Mailer class

```ruby
# app/mailers/notification_mailer.rb
class NotificationMailer < ApplicationMailer
  def welcome_email(user)
    @user = user
    @login_url = login_url
    mail(to: user.email, subject: "Welcome to Our App")
  end

  def password_reset(user)
    @user = user
    @reset_url = password_reset_url(user.reset_token)
    mail(to: user.email, subject: "Password Reset Instructions")
  end
end
```

### Templates

HTML template:

```erb
<%# app/views/notification_mailer/welcome_email.html.erb %>
<h1>Welcome, <%= @user.name %>!</h1>
<p>Thanks for signing up. Get started by logging in:</p>
<%= link_to "Login Now", @login_url, class: "button" %>
```

Text template:

```erb
<%# app/views/notification_mailer/welcome_email.text.erb %>
Welcome, <%= @user.name %>!

Thanks for signing up. Get started by logging in:
<%= @login_url %>
```

### Sending (async via SolidQueue)

```ruby
# In controller or service — always deliver_later
NotificationMailer.welcome_email(@user).deliver_later
NotificationMailer.password_reset(@user).deliver_later(queue: :mailers)
```

## Parameterized Mailers

Use `.with()` for cleaner parameter passing:

```ruby
class NotificationMailer < ApplicationMailer
  def custom_notification
    @user = params[:user]
    @message = params[:message]
    mail(to: @user.email, subject: params[:subject])
  end
end

# Usage
NotificationMailer.with(
  user: user,
  message: "Update available",
  subject: "System Alert"
).custom_notification.deliver_later
```

## Email Layouts

### HTML layout

```erb
<%# app/views/layouts/mailer.html.erb %>
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        color: #333;
      }
      .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
      .content { padding: 20px; }
      .button {
        display: inline-block; padding: 12px 24px;
        background-color: #4F46E5; color: white;
        text-decoration: none; border-radius: 4px;
      }
      .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
  </head>
  <body>
    <div class="header"><h1>Your App</h1></div>
    <div class="content"><%= yield %></div>
    <div class="footer"><p>&copy; <%= Date.current.year %> Your Company. All rights reserved.</p></div>
  </body>
</html>
```

### Text layout

```erb
<%# app/views/layouts/mailer.text.erb %>
================================================================================
YOUR APP
================================================================================

<%= yield %>

--------------------------------------------------------------------------------
© <%= Date.current.year %> Your Company. All rights reserved.
```

## Attachments

```ruby
class ReportMailer < ApplicationMailer
  def monthly_report(user, data)
    @user = user

    # Regular attachment
    attachments["report.pdf"] = {
      mime_type: "application/pdf",
      content: generate_pdf(data)
    }

    # Inline attachment (for embedding in email body)
    attachments.inline["logo.png"] = File.read(
      Rails.root.join("app/assets/images/logo.png")
    )

    mail(to: user.email, subject: "Monthly Report")
  end
end
```

Reference inline attachments in templates:

```erb
<%= image_tag attachments["logo.png"].url %>
```

## Environment Configuration

### Development — letter_opener

```ruby
# Gemfile
group :development do
  gem "letter_opener"
end

# config/environments/development.rb
config.action_mailer.delivery_method = :letter_opener
config.action_mailer.perform_deliveries = true
config.action_mailer.raise_delivery_errors = true
config.action_mailer.default_url_options = { host: "localhost", port: 3000 }
```

### Test

```ruby
# config/environments/test.rb
config.action_mailer.delivery_method = :test
config.action_mailer.default_url_options = { host: "example.com" }
```

### Production

```ruby
# config/environments/production.rb
config.action_mailer.delivery_method = :smtp
config.action_mailer.perform_deliveries = true
config.action_mailer.raise_delivery_errors = false
config.action_mailer.default_url_options = { host: ENV["APP_HOST"], protocol: "https" }

config.action_mailer.smtp_settings = {
  address: ENV["SMTP_ADDRESS"],
  port: ENV["SMTP_PORT"],
  user_name: Rails.application.credentials.dig(:smtp, :username),
  password: Rails.application.credentials.dig(:smtp, :password),
  authentication: :plain,
  enable_starttls_auto: true
}
```

## Mailer Previews

Preview all email variations at `/rails/mailers`:

```ruby
# test/mailers/previews/notification_mailer_preview.rb
class NotificationMailerPreview < ActionMailer::Preview
  # Preview at http://localhost:3000/rails/mailers/notification_mailer/welcome_email
  def welcome_email
    user = User.first || User.new(name: "Test User", email: "test@example.com")
    NotificationMailer.welcome_email(user)
  end

  def password_reset
    user = User.first || User.new(name: "Test User", email: "test@example.com")
    user.reset_token = "sample_token_123"
    NotificationMailer.password_reset(user)
  end

  # Preview edge cases
  def welcome_email_long_name
    user = User.new(name: "Christopher Alexander Montgomery III", email: "long@example.com")
    NotificationMailer.welcome_email(user)
  end
end
```

## Testing Mailers

```ruby
# test/mailers/notification_mailer_test.rb
class NotificationMailerTest < ActionMailer::TestCase
  setup do
    @user = users(:alice)
  end

  test "welcome_email sends with correct attributes" do
    email = NotificationMailer.welcome_email(@user)

    assert_emails 1 do
      email.deliver_now
    end

    assert_equal [@user.email], email.to
    assert_equal ["noreply@example.com"], email.from
    assert_equal "Welcome to Our App", email.subject
    assert_includes email.html_part.body.to_s, @user.name
    assert_includes email.text_part.body.to_s, @user.name
  end

  test "delivers via background job" do
    assert_enqueued_with(job: ActionMailer::MailDeliveryJob, queue: "mailers") do
      NotificationMailer.welcome_email(@user).deliver_later(queue: :mailers)
    end
  end

  test "password_reset includes reset link" do
    @user.update!(reset_token: "test_token_123")
    email = NotificationMailer.password_reset(@user)

    assert_includes email.html_part.body.to_s, "test_token_123"
  end
end
```

### System test with email delivery

```ruby
# test/system/email_delivery_test.rb
class EmailDeliveryTest < ApplicationSystemTestCase
  test "sends welcome email after signup" do
    visit signup_path
    fill_in "Email", with: "new@example.com"
    fill_in "Password", with: "password"
    click_button "Sign Up"

    assert_enqueued_emails 1
    perform_enqueued_jobs

    email = ActionMailer::Base.deliveries.last
    assert_equal ["new@example.com"], email.to
    assert_match "Welcome", email.subject
  end
end
```

## Gotchas

- **`deliver_now` blocks requests** — always use `deliver_later` in controllers and services. The only valid use of `deliver_now` is inside test assertions.
- **`*_path` helpers produce broken links** — emails are opened outside your app. Use `*_url` helpers and configure `default_url_options` per environment.
- **Missing text template** — some email clients only render plain text. Always provide a `.text.erb` alongside `.html.erb`.
- **External CSS gets stripped** — email clients remove `<link>` stylesheets. Use inline styles or `<style>` blocks in the layout.
- **Forgetting `default_url_options`** — URL helpers raise errors without this config. Set `host` (and `protocol` in production) in each environment file.

## Validation

- [ ] All emails sent with `deliver_later` (not `deliver_now`)
- [ ] Both HTML and text templates exist for every mailer action
- [ ] `*_url` helpers used (not `*_path`) in all email templates
- [ ] `default_url_options` configured for development, test, and production
- [ ] Mailer previews created and accessible at `/rails/mailers`
- [ ] Mailer tests verify delivery, recipients, subject, and body content
- [ ] SolidQueue configured as the queue adapter for background delivery
- [ ] Default `from` address set in ApplicationMailer

<related-skills>
  <skill name="jobs" reason="SolidQueue processes deliver_later calls as background jobs" />
  <skill name="views" reason="Email templates use ERB layouts and partials" />
  <skill name="testing" reason="Mailer tests verify delivery and content" />
</related-skills>
