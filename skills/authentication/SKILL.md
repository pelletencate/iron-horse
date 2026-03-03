---
name: authentication
description: Implement authentication using Rails 8 built-in generator — session-based auth, password resets, token generation, remember-me, and OAuth integration
triggers:
  - authentication
  - login and logout
  - session management
  - password reset
  - has_secure_password
  - generates_token_for
  - current user
  - OAuth
  - OmniAuth
  - remember me
---

# Authentication

## When to use this skill

- Setting up user authentication on a new Rails 8 app
- Implementing login/logout and session management
- Building password reset or email verification flows
- Adding remember-me functionality
- Integrating OAuth providers (Google, GitHub, etc.)
- Securing controllers with authentication requirements
- Managing multiple device sessions

## Principles

1. **Use the Rails 8 generator first** — `bin/rails generate authentication` gives you a complete, secure foundation. Don't hand-roll what Rails provides.
2. **Sessions over tokens for web apps** — cookie-based sessions with `httponly` and `secure` flags. Save JWTs for APIs.
3. **No Devise for new projects** — Rails 8 `has_secure_password` + the generator covers most needs without gem dependencies.
4. **Database-backed sessions** — store sessions in a `sessions` table for revocation, multi-device tracking, and audit trails.
5. **Consume-once tokens** — password reset and email verification tokens must expire and be single-use via `generates_token_for`.
6. **Rate limit authentication endpoints** — always apply `rate_limit` to login and password reset actions.

## Quick Start

```bash
bin/rails generate authentication
bin/rails db:migrate
```

This creates:
- `User` model with `has_secure_password`
- `Session` model for secure sessions
- `Current` model for request-local storage
- `Authentication` concern for controllers
- Session and Password controllers with views

## Core Components

### User Model

```ruby
class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy

  normalizes :email_address, with: -> { _1.strip.downcase }

  validates :email_address, presence: true, uniqueness: true,
            format: { with: URI::MailTo::EMAIL_REGEXP }
end
```

### Session Model

```ruby
class Session < ApplicationRecord
  belongs_to :user

  before_create { self.token = SecureRandom.urlsafe_base64(32) }

  scope :active, -> { where("created_at > ?", 30.days.ago) }

  def expired?
    created_at <= 30.days.ago
  end
end
```

### Current Model

```ruby
class Current < ActiveSupport::CurrentAttributes
  attribute :session
  delegate :user, to: :session, allow_nil: true
end
```

### Authentication Concern

```ruby
# app/controllers/concerns/authentication.rb
module Authentication
  extend ActiveSupport::Concern

  included do
    before_action :require_authentication
    helper_method :authenticated?
  end

  class_methods do
    def allow_unauthenticated_access(**options)
      skip_before_action :require_authentication, **options
    end
  end

  private

  def authenticated?
    Current.session.present?
  end

  def require_authentication
    resume_session || request_authentication
  end

  def resume_session
    if session_token = cookies.signed[:session_token]
      if session = Session.find_by(token: session_token)
        Current.session = session
      end
    end
  end

  def request_authentication
    redirect_to new_session_path
  end

  def start_new_session_for(user)
    session = user.sessions.create!
    cookies.signed.permanent[:session_token] = {
      value: session.token, httponly: true,
      secure: Rails.env.production?, same_site: :lax
    }
    Current.session = session
  end

  def terminate_session
    Current.session&.destroy
    cookies.delete(:session_token)
  end
end
```

## Login / Logout

```ruby
class SessionsController < ApplicationController
  allow_unauthenticated_access only: [:new, :create]
  rate_limit to: 10, within: 3.minutes, only: :create,
             with: -> { redirect_to new_session_path, alert: "Too many attempts" }

  def new; end

  def create
    if user = User.authenticate_by(email_address: params[:email_address],
                                    password: params[:password])
      start_new_session_for(user)
      redirect_to root_path, notice: "Signed in successfully"
    else
      flash.now[:alert] = "Invalid email or password"
      render :new, status: :unprocessable_entity
    end
  end

  def destroy
    terminate_session
    redirect_to root_path, notice: "Signed out"
  end
end
```

## Password Reset with `generates_token_for`

Rails 8 provides single-use, expiring tokens without extra gems:

```ruby
class User < ApplicationRecord
  has_secure_password

  generates_token_for :password_reset, expires_in: 15.minutes do
    password_salt&.last(10)  # Token invalidated when password changes
  end

  generates_token_for :email_verification, expires_in: 24.hours do
    email_address
  end
end
```

### Password Reset Controller

```ruby
class PasswordsController < ApplicationController
  allow_unauthenticated_access

  def new; end

  def create
    if user = User.find_by(email_address: params[:email_address])
      token = user.generate_token_for(:password_reset)
      PasswordMailer.reset(user, token).deliver_later
    end
    # Always show success to prevent email enumeration
    redirect_to new_session_path, notice: "Check your email for reset instructions"
  end

  def edit
    @user = User.find_by_token_for(:password_reset, params[:token])
    redirect_to new_password_path, alert: "Invalid or expired link" unless @user
  end

  def update
    @user = User.find_by_token_for(:password_reset, params[:token])
    if @user&.update(password_params)
      redirect_to new_session_path, notice: "Password updated"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  private

  def password_params
    params.require(:user).permit(:password, :password_confirmation)
  end
end
```

## Remember Me

Override `start_new_session_for` in the Authentication concern:

```ruby
def start_new_session_for(user, remember: false)
  session = user.sessions.create!
  cookie_options = {
    value: session.token, httponly: true,
    secure: Rails.env.production?, same_site: :lax
  }
  cookie_options[:expires] = 2.weeks.from_now if remember

  cookies.signed.permanent[:session_token] = cookie_options
  Current.session = session
end
```

In the login action, pass the checkbox value:

```ruby
start_new_session_for(user, remember: params[:remember_me] == "1")
```

## OAuth / OmniAuth Integration

### Setup

```ruby
# Gemfile
gem "omniauth"
gem "omniauth-google-oauth2"
gem "omniauth-rails_csrf_protection"

# config/initializers/omniauth.rb
Rails.application.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2, ENV["GOOGLE_CLIENT_ID"], ENV["GOOGLE_CLIENT_SECRET"]
end
```

### User Model — find_or_create_from_oauth

```ruby
class User < ApplicationRecord
  has_secure_password validations: false  # Allow OAuth-only users (no password)

  def self.find_or_create_from_oauth(auth)
    find_or_create_by(provider: auth.provider, uid: auth.uid) do |user|
      user.email_address = auth.info.email
      user.name = auth.info.name
      user.avatar_url = auth.info.image
      user.password = SecureRandom.hex(16)  # Random password for OAuth users
    end
  end
end
```

### OAuth Callback Controller

```ruby
class OauthCallbacksController < ApplicationController
  allow_unauthenticated_access

  def create
    auth = request.env["omniauth.auth"]
    user = User.find_or_create_from_oauth(auth)
    start_new_session_for(user)
    redirect_to root_path, notice: "Signed in with #{auth.provider.titleize}"
  end

  def failure
    redirect_to new_session_path, alert: "Authentication failed"
  end
end
```

### Routes

```ruby
# config/routes.rb
get "auth/:provider/callback", to: "oauth_callbacks#create"
get "auth/failure", to: "oauth_callbacks#failure"
```

## Protecting Controllers

```ruby
class ApplicationController < ActionController::Base
  include Authentication  # All actions require auth by default
end

class HomeController < ApplicationController
  allow_unauthenticated_access only: [:index, :about]
end
```

Revoke other sessions: `Current.user.sessions.where.not(id: Current.session.id).destroy_all`

Cleanup expired sessions daily via Solid Queue:

```ruby
class CleanupExpiredSessionsJob < ApplicationJob
  def perform = Session.where("created_at <= ?", 30.days.ago).delete_all
end
```

## Testing

### Test Helper

```ruby
# spec/support/authentication_helpers.rb
module AuthenticationHelpers
  def sign_in(user)
    session = user.sessions.create!
    cookies[:session_token] = session.token
  end
end

RSpec.configure do |config|
  config.include AuthenticationHelpers, type: :request
  config.include AuthenticationHelpers, type: :system
end
```

### Request Specs

```ruby
RSpec.describe "Sessions", type: :request do
  let(:user) { create(:user, password: "password123") }

  it "signs in with valid credentials" do
    post session_path, params: { email_address: user.email_address, password: "password123" }
    expect(response).to redirect_to(root_path)
  end

  it "rejects invalid credentials" do
    post session_path, params: { email_address: user.email_address, password: "wrong" }
    expect(response).to have_http_status(:unprocessable_entity)
  end
end
```

## Gotchas

- **Don't enumerate emails** — password reset must return the same response whether the email exists or not.
- **`Current` is request-scoped** — never access `Current.user` in background jobs; pass user ID explicitly.
- **`generates_token_for` tokens are consume-once** — the token invalidates when the underlying attribute changes (e.g., `password_salt` for password reset).
- **Always set `httponly: true`** — without it, session cookies are accessible to JavaScript and vulnerable to XSS.
- **Rate limit login and reset endpoints** — brute force attacks are trivial without `rate_limit`.
- **OAuth users may lack passwords** — use `has_secure_password validations: false` if supporting password-less OAuth accounts.

## Validation

- [ ] `bin/rails generate authentication` was run (or equivalent files exist)
- [ ] User model has `has_secure_password` and email normalization
- [ ] Session cookies use `httponly: true` and `secure: true` in production
- [ ] Password reset tokens use `generates_token_for` with expiry
- [ ] Login endpoint has `rate_limit` applied
- [ ] Password reset response does not reveal whether email exists
- [ ] Authentication concern included in `ApplicationController`
<related-skills>
  <skill name="models" reason="User model validations, associations, and concerns" />
  <skill name="controllers" reason="Session and password controllers follow RESTful conventions" />
  <skill name="testing" reason="Authentication flows need thorough request and system specs" />
  <skill name="security" reason="CSRF protection, rate limiting, and secure cookie configuration" />
</related-skills>
