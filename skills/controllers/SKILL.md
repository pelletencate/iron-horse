---
name: controllers
description: Build Rails controllers with RESTful actions, strong parameters, skinny architecture, concerns, and nested resources
triggers:
  - building a controller
  - RESTful actions
  - strong parameters
  - nested resources
  - controller concerns
  - skinny controllers
  - API controllers
---

# Controllers

## When to use this skill

- Building Rails controller actions (CRUD or API)
- Implementing nested or shallow-nested resources
- Handling request parameters with strong params
- Refactoring fat controllers into skinny ones
- Sharing behavior across controllers with concerns
- Setting up RESTful routing

## Principles

1. **Only 7 RESTful actions** — `index`, `show`, `new`, `create`, `edit`, `update`, `destroy`. No custom actions; use child controllers instead.
2. **Skinny controllers** — controllers handle HTTP concerns only. Delegate business logic to models or service objects.
3. **Controller → Service → Model** — dependency flows one direction. Models never call services; services never call controllers.
4. **Strong parameters on every input** — use `params.expect()` (Rails 8.1+) or `params.require().permit()`. Never pass raw `params` to models.
5. **Raise on failure, don't return booleans** — prefer `create!` / `update!` with `rescue` over conditional `if save` when the controller doesn't render a form.
6. **Think in scopes, not permissions** — scope queries to `current_user` associations instead of checking ownership after loading. Authorization is a query concern.
7. **One resource per controller** — if a controller manages two unrelated resources, split it.

## RESTful CRUD

```ruby
# app/controllers/feedbacks_controller.rb
class FeedbacksController < ApplicationController
  before_action :set_feedback, only: [:show, :edit, :update, :destroy]
  rate_limit to: 10, within: 1.minute, only: [:create, :update]

  def index
    @feedbacks = Feedback.includes(:recipient).recent
  end

  def show; end

  def new
    @feedback = Feedback.new
  end

  def create
    @feedback = Feedback.new(feedback_params)

    if @feedback.save
      redirect_to @feedback, notice: "Feedback was successfully created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit; end

  def update
    if @feedback.update(feedback_params)
      redirect_to @feedback, notice: "Feedback was successfully updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @feedback.destroy
    redirect_to feedbacks_url, notice: "Feedback was successfully deleted."
  end

  private

  def set_feedback
    @feedback = Feedback.find(params[:id])
  end

  def feedback_params
    params.require(:feedback).permit(:content, :recipient_email, :sender_name)
  end
end
```

Routes — `resources :feedbacks` generates all 7 RESTful routes.

### API controllers

```ruby
# app/controllers/api/v1/feedbacks_controller.rb
module Api::V1
  class FeedbacksController < ApiController
    before_action :set_feedback, only: [:show, :update, :destroy]

    def index
      render json: Feedback.includes(:recipient).recent
    end

    def show
      render json: @feedback
    end

    def create
      feedback = Feedback.create!(feedback_params)
      render json: feedback, status: :created
    end

    def update
      @feedback.update!(feedback_params)
      render json: @feedback
    end

    def destroy
      @feedback.destroy
      head :no_content
    end

    private

    def set_feedback
      @feedback = Feedback.find(params[:id])
    end

    def feedback_params
      params.expect(feedback: [:content, :recipient_email, :sender_name])
    end
  end
end
```

API controllers use `create!` / `update!` and let a `rescue_from` concern handle error rendering (see Concerns below).

## Nested Resources

### Child controllers with module namespacing

```ruby
# config/routes.rb
resources :feedbacks do
  resource :archival, only: [:create], module: :feedbacks
  resources :responses, only: [:index, :create, :destroy], module: :feedbacks
end
```

```ruby
# app/controllers/feedbacks/responses_controller.rb
module Feedbacks
  class ResponsesController < ApplicationController
    before_action :set_feedback

    def index
      @responses = @feedback.responses.order(created_at: :desc)
    end

    def create
      @response = @feedback.responses.build(response_params)
      if @response.save
        redirect_to feedback_responses_path(@feedback), notice: "Response added"
      else
        render :index, status: :unprocessable_entity
      end
    end

    def destroy
      @response = @feedback.responses.find(params[:id])
      @response.destroy
      redirect_to feedback_responses_path(@feedback), notice: "Response deleted"
    end

    private

    def set_feedback
      @feedback = Feedback.find(params[:feedback_id])
    end

    def response_params
      params.require(:response).permit(:content, :author_name)
    end
  end
end
```

Directory structure mirrors the namespace:

```
app/controllers/
  feedbacks_controller.rb
  feedbacks/
    archivals_controller.rb
    responses_controller.rb
```

### Shallow nesting

Use `shallow: true` when child resources don't need the parent ID for member actions:

```ruby
resources :projects do
  resources :tasks, shallow: true, module: :projects
end
# GET  /projects/:project_id/tasks     → index, create
# GET  /tasks/:id                      → show, update, destroy
```

## Skinny Controller Refactoring

A fat controller doing validation, API calls, and mailers in `create` is a code smell. Fix by pushing logic down:

- **Validations and defaults** → model (`before_validation`, `validates`)
- **Side effects** → model callbacks (`after_create_commit`) or background jobs
- **External APIs** → service objects (`app/services/`)
- **Authorization** → scope queries to `current_user` associations

Result — the controller shrinks to HTTP plumbing:

```ruby
class FeedbacksController < ApplicationController
  def create
    @feedback = current_user.feedbacks.build(feedback_params)

    if @feedback.save
      FeedbackAiProcessingJob.perform_later(@feedback.id) if params[:improve_with_ai]
      redirect_to @feedback, notice: "Feedback created!"
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def feedback_params
    params.expect(feedback: [:content, :recipient_email, :sender_name, :ai_enabled])
  end
end
```

## Controller Concerns

### Authentication

```ruby
# app/controllers/concerns/authentication.rb
module Authentication
  extend ActiveSupport::Concern

  included do
    before_action :require_authentication
    helper_method :current_user, :logged_in?
  end

  private

  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]
  end

  def logged_in?
    current_user.present?
  end

  def require_authentication
    redirect_to login_path, alert: "Please log in to continue" unless logged_in?
  end

  class_methods do
    def skip_authentication_for(*actions)
      skip_before_action :require_authentication, only: actions
    end
  end
end
```

### API error handling

```ruby
# app/controllers/concerns/api/response_handler.rb
module Api::ResponseHandler
  extend ActiveSupport::Concern

  included do
    rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
    rescue_from ActiveRecord::RecordInvalid, with: :record_invalid
    rescue_from ActionController::ParameterMissing, with: :parameter_missing
  end

  private

  def record_not_found(exception)
    render json: { error: "Not found", detail: exception.message }, status: :not_found
  end

  def record_invalid(exception)
    render json: { error: "Validation failed", errors: exception.record.errors.as_json },
           status: :unprocessable_entity
  end

  def parameter_missing(exception)
    render json: { error: "Missing parameter", parameter: exception.param },
           status: :bad_request
  end
end
```

Always use `extend ActiveSupport::Concern` — never manual `self.included`.

## Strong Parameters

### `params.expect()` — strict (Rails 8.1+)

```ruby
def feedback_params
  params.expect(feedback: [:content, :recipient_email, :sender_name, :ai_enabled])
end
```

Raises `ActionController::ParameterMissing` if the `:feedback` key is missing or has wrong structure.

### `params.require().permit()` — lenient (all Rails versions)

```ruby
def feedback_params
  params.require(:feedback).permit(:content, :recipient_email, :sender_name)
end
```

### Nested attributes and arrays

```ruby
def person_params
  params.expect(
    person: [
      :name, :age,
      addresses_attributes: [:id, :street, :city, :state, :_destroy]
    ]
  )
end

def post_params
  params.expect(post: [:title, :body, tags: []])
end
```

Use separate param methods per role to prevent privilege escalation (e.g. `user_params` vs `admin_user_params` with additional permitted fields).

## Gotchas

- **Never add custom route actions** — `member { post :archive }` breaks REST. Create a child controller (`Feedbacks::ArchivalsController`) with a `create` action instead.
- **Never pass raw `params` to models** — `Feedback.create(params[:feedback])` raises `ForbiddenAttributesError` and is a mass-assignment vulnerability. Always filter through strong params.
- **Never use `permit!`** — it bypasses all security checks. Always list attributes explicitly.
- **Avoid deep nesting** — more than one level of nesting creates unwieldy URLs. Use `shallow: true` or flatten with separate resource declarations.
- **Don't put query logic in controllers** — if an action builds multi-conditional queries, extract to a query object or scope chain.
- **Don't use `before_action` for business logic** — `before_action` is for setup (loading records, authentication). Side effects and domain rules belong in models or services.

## Validation

- [ ] Only RESTful actions used (no custom member/collection routes)
- [ ] Child controllers created for non-CRUD operations
- [ ] Controllers are thin (< 100 lines, actions < 10 lines)
- [ ] Strong parameters used for all user input (`expect` or `require.permit`)
- [ ] Business logic delegated to models/services, not in controller actions
- [ ] Queries scoped to `current_user` associations where applicable
- [ ] Proper HTTP status codes returned (200, 201, 422, 404)
- [ ] All controller actions covered by request tests
- [ ] All tests passing

<related-skills>
  <skill name="models" reason="Controllers delegate business logic to models and use model validations" />
  <skill name="views" reason="Controllers render views with Turbo Frames/Streams" />
  <skill name="security" reason="Strong parameters, CSRF, and authorization patterns" />
  <skill name="testing" reason="Controller actions need request/integration tests" />
</related-skills>
