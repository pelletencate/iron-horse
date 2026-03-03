---
name: action-cable
description: Implement real-time features with Action Cable, WebSockets, channels, broadcasting, and SolidCable for Rails 8
triggers:
  - Action Cable
  - WebSockets
  - real-time updates
  - channels
  - broadcasting
  - live updates
  - chat features
  - notifications channel
  - SolidCable
  - real-time dashboard
---

# Action Cable

## When to use this skill

- Adding real-time updates without polling (live feeds, dashboards)
- Building chat or messaging features
- Implementing server-to-client push notifications
- Creating collaborative editing or presence indicators
- Setting up Action Cable channels and subscriptions
- Integrating WebSockets with Stimulus controllers
- Broadcasting model changes to connected clients

## Principles

1. **SolidCable first** — Rails 8 ships SolidCable as the default adapter. Use it instead of Redis unless you have a specific scaling reason.
2. **Authorize at every layer** — authenticate in `Connection`, authorize in each `Channel#subscribed`. Never trust the client.
3. **Broadcast from services, not controllers** — keep broadcasting logic in service objects or model callbacks, not controller actions.
4. **Stream scoping** — use `stream_for` with a record or user to scope streams. Avoid global `stream_from` strings that leak data.
5. **Thin channels** — channels route messages; business logic belongs in services and models.
6. **Test channels like any other Ruby class** — use `stub_connection`, `have_stream_for`, and `have_broadcasted_to` matchers.

## Configuration

```yaml
# config/cable.yml
development:
  adapter: async

test:
  adapter: test

production:
  adapter: solid_cable  # Rails 8 default — no Redis needed
```

SolidCable stores messages in the database. For high-throughput apps that outgrow it, swap `adapter: redis` with a `REDIS_URL`.

## Connection Authentication

```ruby
# app/channels/application_cable/connection.rb
module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    def find_verified_user
      if session_token = cookies.signed[:session_token]
        if session = Session.find_by(token: session_token)
          session.user
        else
          reject_unauthorized_connection
        end
      else
        reject_unauthorized_connection
      end
    end
  end
end
```

## Channel Patterns

### Notifications Channel (stream per user)

```ruby
# app/channels/notifications_channel.rb
class NotificationsChannel < ApplicationCable::Channel
  def subscribed
    stream_for current_user
  end

  def self.notify(user, notification)
    broadcast_to(user, {
      type: "notification",
      id: notification.id,
      title: notification.title,
      body: notification.body,
      created_at: notification.created_at.iso8601
    })
  end
end
```

### Resource Channel (stream per record, with authorization)

```ruby
# app/channels/events_channel.rb
class EventsChannel < ApplicationCable::Channel
  def subscribed
    @event = Event.find(params[:event_id])

    if EventPolicy.new(current_user, @event).show?
      stream_for @event
    else
      reject
    end
  end

  def self.broadcast_update(event)
    broadcast_to(event, {
      type: "update",
      html: ApplicationController.renderer.render(
        partial: "events/event", locals: { event: event }
      )
    })
  end
end
```

### Chat Channel (client actions, presence)

```ruby
# app/channels/chat_channel.rb
class ChatChannel < ApplicationCable::Channel
  def subscribed
    @room = ChatRoom.find(params[:room_id])

    if @room.users.include?(current_user)
      stream_for @room
      broadcast_presence(:join)
    else
      reject
    end
  end

  def unsubscribed
    broadcast_presence(:leave) if @room
  end

  def speak(data)
    message = @room.messages.create!(user: current_user, body: data["body"])
    self.class.broadcast_to(@room, {
      type: "message",
      html: ApplicationController.renderer.render(
        partial: "messages/message", locals: { message: message }
      ),
      message_id: message.id
    })
  end

  def typing
    self.class.broadcast_to(@room, { type: "typing", user: current_user.name })
  end

  private

  def broadcast_presence(action)
    self.class.broadcast_to(@room, {
      type: "presence", action: action,
      user: current_user.name, timestamp: Time.current.iso8601
    })
  end
end
```

## Client-Side Subscription (Stimulus)

```javascript
// app/javascript/controllers/chat_controller.js
import { Controller } from "@hotwired/stimulus"
import consumer from "../channels/consumer"

export default class extends Controller {
  static targets = ["messages", "input", "typingIndicator"]
  static values = { roomId: Number }

  connect() {
    this.channel = consumer.subscriptions.create(
      { channel: "ChatChannel", room_id: this.roomIdValue },
      {
        received: this.received.bind(this),
        connected: this.connected.bind(this),
        disconnected: this.disconnected.bind(this)
      }
    )
  }

  disconnect() {
    this.channel?.unsubscribe()
  }

  connected() {
    this.element.classList.remove("disconnected")
  }

  disconnected() {
    this.element.classList.add("disconnected")
  }

  received(data) {
    switch (data.type) {
      case "message":
        this.messagesTarget.insertAdjacentHTML("beforeend", data.html)
        this.messagesTarget.scrollTop = this.messagesTarget.scrollHeight
        break
      case "typing":
        this.typingIndicatorTarget.textContent = `${data.user} is typing...`
        setTimeout(() => (this.typingIndicatorTarget.textContent = ""), 2000)
        break
    }
  }

  send(event) {
    event.preventDefault()
    const body = this.inputTarget.value.trim()
    if (body) {
      this.channel.perform("speak", { body })
      this.inputTarget.value = ""
    }
  }

  typing() {
    this.channel.perform("typing")
  }
}
```

## Broadcasting from Services and Models

### From a service object

```ruby
# app/services/events/update_service.rb
module Events
  class UpdateService
    def call(event, params)
      event.update!(params)
      EventsChannel.broadcast_update(event)
      DashboardChannel.broadcast_stats(event.account)
      event
    end
  end
end
```

### From model callbacks

```ruby
# app/models/comment.rb
class Comment < ApplicationRecord
  belongs_to :event
  belongs_to :user

  after_create_commit :broadcast_to_channel

  private

  def broadcast_to_channel
    EventsChannel.broadcast_comment(event, self)
  end
end
```

## Turbo Streams Integration

Action Cable powers Turbo Streams broadcasts — prefer this for simple CRUD updates:

```ruby
# app/models/comment.rb
class Comment < ApplicationRecord
  after_create_commit -> {
    broadcast_append_to(
      [event, "comments"],
      target: "comments",
      partial: "comments/comment"
    )
  }

  after_destroy_commit -> {
    broadcast_remove_to([event, "comments"])
  }
end
```

```erb
<%# app/views/events/show.html.erb %>
<%= turbo_stream_from @event, "comments" %>

<div id="comments">
  <%= render @event.comments %>
</div>
```

## Testing Action Cable Channels

### Channel subscription and streaming

```ruby
# spec/channels/notifications_channel_spec.rb
require "rails_helper"

RSpec.describe NotificationsChannel, type: :channel do
  let(:user) { create(:user) }

  before { stub_connection(current_user: user) }

  describe "#subscribed" do
    it "streams for the current user" do
      subscribe
      expect(subscription).to be_confirmed
      expect(subscription).to have_stream_for(user)
    end
  end

  describe ".notify" do
    let(:notification) { create(:notification, user: user) }

    it "broadcasts to the user" do
      expect {
        described_class.notify(user, notification)
      }.to have_broadcasted_to(user).with(hash_including(type: "notification"))
    end
  end
end
```

### Channel with authorization

```ruby
# spec/channels/events_channel_spec.rb
require "rails_helper"

RSpec.describe EventsChannel, type: :channel do
  let(:user) { create(:user) }
  let(:event) { create(:event, account: user.account) }
  let(:other_event) { create(:event) }

  before { stub_connection(current_user: user) }

  it "subscribes to authorized events" do
    subscribe(event_id: event.id)
    expect(subscription).to be_confirmed
    expect(subscription).to have_stream_for(event)
  end

  it "rejects unauthorized events" do
    subscribe(event_id: other_event.id)
    expect(subscription).to be_rejected
  end
end
```

## Gotchas

- **Don't skip channel authorization** — `stream_for` without an authorization check in `subscribed` exposes data to any authenticated user.
- **Don't broadcast large payloads** — render partials server-side and send HTML, or send minimal JSON. Never broadcast entire ActiveRecord objects.
- **Don't forget `after_create_commit`** — use `_commit` callback variants so broadcasts happen after the transaction commits, not inside it.
- **Don't rely on connection count for presence** — users may have multiple tabs. Use a dedicated presence tracking mechanism.
- **Don't default to Redis** — SolidCable is the Rails 8 default and works for most apps without external dependencies.
- **Don't use `stream_from` with user-controlled strings** — always use `stream_for` with a record to prevent stream name injection.

## Validation

- [ ] `ApplicationCable::Connection` authenticates and sets `identified_by`
- [ ] Each channel authorizes in `subscribed` and calls `reject` on failure
- [ ] Broadcasts use `broadcast_to` with a scoped record, not raw strings
- [ ] Client-side subscriptions handle `connected`, `disconnected`, and `received`
- [ ] Channel specs cover subscription, rejection, and broadcast assertions
- [ ] `config/cable.yml` uses `solid_cable` adapter for production
- [ ] Turbo Stream broadcasts use `after_create_commit` (not `after_create`)
- [ ] No sensitive data leaked in broadcast payloads

<related-skills>
  <skill name="turbo" reason="Turbo Streams use Action Cable for real-time broadcasts" />
  <skill name="stimulus" reason="Stimulus controllers manage client-side channel subscriptions" />
  <skill name="testing" reason="Channel specs verify subscriptions, authorization, and broadcasts" />
  <skill name="authentication" reason="Connection authentication gates WebSocket access" />
</related-skills>
