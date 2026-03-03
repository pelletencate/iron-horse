---
name: api-versioning
description: Implement RESTful API versioning with namespace-based routing, versioned controllers, authentication, and deprecation strategies
triggers:
  - building an API
  - adding API endpoints
  - versioning an API
  - REST API design
  - JSON API
  - API authentication
  - API deprecation
  - Accept header versioning
---

# API Versioning

## When to use this skill

- Creating a new versioned REST API from scratch
- Adding a new version (v2, v3) to an existing API
- Setting up API authentication (token or JWT)
- Designing JSON response formats for API endpoints
- Writing request specs for API endpoints
- Planning a deprecation strategy for older API versions
- Choosing between URL path vs Accept header versioning

## Principles

1. **URL path versioning by default** — `/api/v1/` is the most common, most debuggable, and easiest to route. Use Accept header versioning only when URL aesthetics or hypermedia constraints demand it.
2. **Inherit from a shared base** — all API controllers inherit `Api::BaseController` for consistent error handling, authentication, and response format.
3. **Version the namespace, not the model** — models are shared across versions. Only controllers and serialization change between versions.
4. **Explicit JSON contracts** — every endpoint returns a predictable `{ data: ..., meta: ... }` or `{ error: ..., errors: ... }` structure.
5. **Deprecate loudly, remove quietly** — use `Deprecation` response headers and documentation warnings for at least two release cycles before sunsetting a version.
6. **Test at the HTTP layer** — request specs exercise routing, authentication, serialization, and status codes in one pass.

## Versioning Strategies

| Strategy | URL Example | Header Example | Tradeoff |
|----------|-------------|----------------|----------|
| URL Path | `/api/v1/users` | — | Simple, visible, easy caching |
| Accept Header | `/api/users` | `Accept: application/vnd.myapp.v1+json` | Clean URLs, harder to test |
| Query Param | `/api/users?version=1` | — | Fragile, not recommended |

**Recommendation**: Start with URL path versioning. Only move to Accept header versioning if you have a strong reason.

### Accept Header Versioning (alternative)

```ruby
# app/controllers/api/base_controller.rb
module Api
  class BaseController < ApplicationController
    before_action :set_api_version

    private

    def set_api_version
      accept = request.headers["Accept"] || ""
      match = accept.match(/application\/vnd\.myapp\.v(\d+)\+json/)
      @api_version = match ? match[1].to_i : 1
    end
  end
end
```

## Namespace-Based Setup

### Routes

```ruby
# config/routes.rb
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :users, only: [:index, :show, :create, :update, :destroy]
      resources :posts, only: [:index, :show, :create]
    end

    namespace :v2 do
      resources :users, only: [:index, :show, :create, :update, :destroy]
    end
  end
end
```

### Directory Structure

```
app/controllers/
  api/
    base_controller.rb        # Shared API logic (auth, error handling)
    v1/
      base_controller.rb      # V1-specific config
      users_controller.rb
      posts_controller.rb
    v2/
      base_controller.rb      # V2-specific config
      users_controller.rb
```

### Shared Base Controller

```ruby
# app/controllers/api/base_controller.rb
module Api
  class BaseController < ApplicationController
    skip_before_action :verify_authenticity_token
    respond_to :json

    rescue_from ActiveRecord::RecordNotFound, with: :not_found
    rescue_from ActiveRecord::RecordInvalid, with: :unprocessable_entity
    rescue_from ActionController::ParameterMissing, with: :bad_request

    private

    def not_found(exception)
      render json: { error: exception.message }, status: :not_found
    end

    def unprocessable_entity(exception)
      render json: { errors: exception.record.errors }, status: :unprocessable_entity
    end

    def bad_request(exception)
      render json: { error: exception.message }, status: :bad_request
    end
  end
end
```

### Version Base Controller

```ruby
# app/controllers/api/v1/base_controller.rb
module Api
  module V1
    class BaseController < Api::BaseController
      # V1-specific configuration
    end
  end
end
```

### Resource Controller

```ruby
# app/controllers/api/v1/users_controller.rb
module Api
  module V1
    class UsersController < BaseController
      before_action :set_user, only: [:show, :update, :destroy]

      def index
        @users = User.page(params[:page]).per(25)
        render json: {
          data: @users.as_json(only: [:id, :name, :email, :created_at]),
          meta: pagination_meta(@users)
        }
      end

      def show
        render json: { data: @user }
      end

      def create
        @user = User.create!(user_params)
        render json: { data: @user }, status: :created
      end

      def update
        @user.update!(user_params)
        render json: { data: @user }
      end

      def destroy
        @user.destroy
        head :no_content
      end

      private

      def set_user
        @user = User.find(params[:id])
      end

      def user_params
        params.require(:user).permit(:name, :email)
      end

      def pagination_meta(collection)
        {
          current_page: collection.current_page,
          total_pages: collection.total_pages,
          total_count: collection.total_count
        }
      end
    end
  end
end
```

## JSON Response Format

Stick to two shapes — **success** and **error** — across all versions:

```json
// Single resource
{ "data": { "id": 1, "type": "user", "attributes": { "name": "John", "email": "john@example.com" } } }

// Collection with pagination
{ "data": [{ "id": 1, "type": "user", "attributes": { "name": "John" } }],
  "meta": { "current_page": 1, "total_pages": 10, "total_count": 100 } }

// Error responses
{ "error": "Record not found", "code": "not_found" }
{ "errors": { "email": ["has already been taken"], "name": ["can't be blank"] } }
```

## API Authentication

### Bearer Token

```ruby
# app/controllers/api/base_controller.rb
module Api
  class BaseController < ApplicationController
    before_action :authenticate_api_user!

    private

    def authenticate_api_user!
      token = request.headers["Authorization"]&.split(" ")&.last
      @current_api_user = User.find_by(api_token: token)
      render json: { error: "Unauthorized" }, status: :unauthorized unless @current_api_user
    end

    def current_api_user
      @current_api_user
    end
  end
end
```

### JWT Authentication

```ruby
# Using the jwt gem
def authenticate_api_user!
  token = request.headers["Authorization"]&.split(" ")&.last
  return unauthorized unless token

  payload = JWT.decode(token, Rails.application.secret_key_base).first
  @current_api_user = User.find(payload["user_id"])
rescue JWT::DecodeError
  unauthorized
end

def unauthorized
  render json: { error: "Unauthorized" }, status: :unauthorized
end
```

### API Key Header

```ruby
def authenticate_api_user!
  api_key = request.headers["X-API-Key"]
  @current_api_user = User.find_by(api_key: api_key)
  render json: { error: "Unauthorized" }, status: :unauthorized unless @current_api_user
end
```

## Deprecation Strategy

### When to Deprecate

- A new version introduces breaking changes to response shape or behavior
- At least two release cycles (or a fixed calendar window) have passed since v(N+1) shipped
- Active consumers have been notified via changelog, email, or dashboard alert

### How to Signal Deprecation

```ruby
# app/controllers/api/v1/base_controller.rb
module Api
  module V1
    class BaseController < Api::BaseController
      before_action :add_deprecation_header

      private

      def add_deprecation_header
        response.set_header("Deprecation", "true")
        response.set_header("Sunset", "2025-06-01")
        response.set_header("Link", "</api/v2>; rel=\"successor-version\"")
      end
    end
  end
end
```

### Sunset Timeline

1. **Announce** — add `Deprecation` headers, update docs, notify consumers
2. **Monitor** — track v1 traffic for 2-3 months; reach out to remaining consumers
3. **Remove** — delete v1 controllers and routes; return `410 Gone` for old endpoints

## Testing APIs

```ruby
# spec/requests/api/v1/users_spec.rb
require "rails_helper"

RSpec.describe "Api::V1::Users", type: :request do
  let(:headers) { { "Accept" => "application/json", "Content-Type" => "application/json" } }

  describe "GET /api/v1/users" do
    let!(:users) { create_list(:user, 3) }

    it "returns all users" do
      get "/api/v1/users", headers: headers
      expect(response).to have_http_status(:ok)
      expect(json_response["data"].size).to eq(3)
    end

    it "returns paginated results" do
      get "/api/v1/users", params: { page: 1 }, headers: headers
      expect(json_response["meta"]).to include("current_page", "total_pages")
    end
  end

  describe "POST /api/v1/users" do
    it "creates a user" do
      expect {
        post "/api/v1/users",
          params: { user: { name: "Test", email: "test@example.com" } }.to_json,
          headers: headers
      }.to change(User, :count).by(1)
      expect(response).to have_http_status(:created)
    end

    it "returns validation errors for invalid params" do
      post "/api/v1/users",
        params: { user: { name: "", email: "" } }.to_json, headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response["errors"]).to be_present
    end
  end

  def json_response = JSON.parse(response.body)
end
```

## Gotchas

- **Don't version models** — only controllers and serialization differ between versions. Shared models keep data consistent.
- **Don't forget CSRF skip** — API controllers must `skip_before_action :verify_authenticity_token` or requests from non-browser clients will fail with 422.
- **Don't expose internal errors** — always rescue exceptions in the base controller. Leaking stack traces is a security risk.
- **Don't skip pagination** — unbounded collections will eventually cause timeouts. Always paginate list endpoints.
- **Don't deprecate silently** — if you remove a version without `Deprecation`/`Sunset` headers and consumer notification, you will break integrations with no warning.
- **Don't mix auth strategies** — pick one (token, JWT, API key) per API surface and stick with it. Mixing creates confusing security boundaries.

## Validation

- [ ] Routes use `namespace :api do; namespace :v1 do` pattern
- [ ] `Api::BaseController` inherits from `ApplicationController` with JSON error handling
- [ ] Version-specific controllers inherit from `Api::V1::BaseController`
- [ ] All endpoints return consistent `{ data: ... }` or `{ error: ... }` JSON
- [ ] Authentication is applied in the base controller via `before_action`
- [ ] Request specs cover happy path, error cases, and authentication
- [ ] No N+1 queries in index actions (check with `bullet` or log)
- [ ] Deprecated versions emit `Deprecation` and `Sunset` headers
- [ ] `rake routes | grep api` shows expected versioned paths

<related-skills>
  <skill name="controllers" reason="API controllers follow RESTful controller patterns" />
  <skill name="testing" reason="Request specs are the primary way to test API endpoints" />
  <skill name="security" reason="API authentication and authorization patterns" />
  <skill name="models" reason="API endpoints expose model resources with serialization" />
</related-skills>
