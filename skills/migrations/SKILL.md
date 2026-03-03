---
name: migrations
description: Create safe, reversible database migrations with zero-downtime strategies, proper indexing, and strong_migrations patterns
triggers:
  - database migration
  - schema change
  - add column
  - add index
  - rename column
  - remove column
  - zero-downtime migration
  - strong_migrations
  - data migration
  - backfill
---

# Migrations

## When to use this skill

- Creating or altering database tables and columns
- Adding indexes, foreign keys, or constraints
- Running zero-downtime schema changes on production
- Performing data migrations or backfills
- Configuring strong_migrations safety checks
- Changing column types or removing columns safely
- Creating reversible migrations with proper rollback

## Principles

1. **Every migration must be reversible** — use `change` for simple ops, explicit `up/down` for complex ones, and `raise ActiveRecord::IrreversibleMigration` only as a last resort.
2. **Never mix schema and data** — schema migrations change structure, data migrations backfill values. Keep them in separate migration files.
3. **Zero-downtime by default** — assume migrations run while the app serves traffic. Avoid table locks, use concurrent indexes, and split dangerous ops into multiple steps.
4. **Database constraints back model validations** — always add NOT NULL, foreign keys, and unique indexes at the database level alongside ActiveRecord validations.
5. **Use strong_migrations** — let the gem catch unsafe operations automatically rather than relying on manual review.
6. **Test rollback locally** — run `db:migrate` then `db:rollback` then `db:migrate` before pushing.

## Quick Reference

```bash
bin/rails generate migration AddStatusToEvents status:integer
bin/rails db:migrate
bin/rails db:rollback
bin/rails db:migrate:status
```

### Safety checklist before every migration

```
- [ ] Migration is reversible (has down or uses change)
- [ ] Large tables use batching for data updates
- [ ] Indexes added concurrently on large tables
- [ ] Foreign keys have indexes
- [ ] NOT NULL added in two steps (for existing columns with data)
- [ ] Default values don't lock table (Rails 8 handles this safely)
- [ ] Tested rollback locally
- [ ] strong_migrations checks pass
```

## Safe Migration Patterns

### Add column

```ruby
class AddStatusToEvents < ActiveRecord::Migration[8.0]
  def change
    add_column :events, :status, :integer, default: 0, null: false
  end
end
```

### Add NOT NULL to existing column (two-step)

For tables with existing data, split into two migrations to avoid locking:

```ruby
# Step 1: Add column with default, allow NULL temporarily
class AddPriorityToTasks < ActiveRecord::Migration[8.0]
  def change
    add_column :tasks, :priority, :integer, default: 0
  end
end

# Step 2: After backfill, add NOT NULL constraint
class AddNotNullToTasksPriority < ActiveRecord::Migration[8.0]
  def change
    change_column_null :tasks, :priority, false
  end
end
```

### Add index (production-safe, concurrent)

```ruby
class AddIndexToEventsStatus < ActiveRecord::Migration[8.0]
  disable_ddl_transaction!

  def change
    add_index :events, :status, algorithm: :concurrently, if_not_exists: true
  end
end
```

### Add foreign key with index

```ruby
class AddAccountToEvents < ActiveRecord::Migration[8.0]
  def change
    add_reference :events, :account, null: false, foreign_key: true, index: true
  end
end
```

### Remove column (safe, multi-step)

First remove all code references, then migrate:

```ruby
class RemoveLegacyFieldFromEvents < ActiveRecord::Migration[8.0]
  def change
    safety_assured { remove_column :events, :legacy_field, :string }
  end
end
```

### Add enum column

```ruby
class AddStatusEnumToOrders < ActiveRecord::Migration[8.0]
  def change
    add_column :orders, :status, :integer, default: 0, null: false
    add_index :orders, :status
  end
end
```

Model side:

```ruby
class Order < ApplicationRecord
  enum :status, { pending: 0, confirmed: 1, shipped: 2, delivered: 3, cancelled: 4 }
end
```

### Rename column

```ruby
class RenameNameToTitleOnEvents < ActiveRecord::Migration[8.0]
  def change
    rename_column :events, :name, :title
  end
end
```

## Dangerous Operations — Safe Alternatives

### Changing column type

```ruby
# ❌ DANGEROUS — can lose data or lock table
change_column :events, :budget, :decimal

# ✅ SAFE — three-step approach:
# Step 1: Add new column
add_column :events, :budget_decimal, :decimal, precision: 10, scale: 2

# Step 2: Backfill (separate migration or rake task)
Event.in_batches.update_all("budget_decimal = budget")

# Step 3: Remove old column and rename (after code updated)
safety_assured { remove_column :events, :budget, :integer }
rename_column :events, :budget_decimal, :budget
```

### Avoid table locks

```ruby
# ❌ Locks entire table
add_index :large_table, :column

# ✅ Non-blocking
disable_ddl_transaction!
add_index :large_table, :column, algorithm: :concurrently
```

## Data Migrations

**Rule: Never put data changes in schema migrations.** Create a separate migration file.

### Safe backfill pattern

```ruby
class BackfillEventStatus < ActiveRecord::Migration[8.0]
  disable_ddl_transaction!

  def up
    Event.unscoped.in_batches(of: 1000) do |batch|
      batch.where(status: nil).update_all(status: 0)
      sleep(0.1) # Reduce database load
    end
  end

  def down
    # No rollback for data migration
  end
end
```

### Background job for large tables

```ruby
# Migration adds the column only
class AddProcessedAtToEvents < ActiveRecord::Migration[8.0]
  def change
    add_column :events, :processed_at, :datetime
  end
end

# Separate job handles backfill
class BackfillProcessedAtJob < ApplicationJob
  def perform(start_id, end_id)
    Event.where(id: start_id..end_id, processed_at: nil)
         .update_all(processed_at: Time.current)
  end
end
```

## Index Strategies

### Composite indexes

```ruby
# For queries: WHERE account_id = ? AND status = ?
add_index :events, [:account_id, :status]

# Column order matters! This index helps:
#   WHERE account_id = ?
#   WHERE account_id = ? AND status = ?
# But NOT:
#   WHERE status = ?  (needs its own index)
```

### Partial indexes

```ruby
# Index only active records — smaller, faster
add_index :events, :event_date,
  where: "status = 0", name: "index_events_on_date_active"

# Index only non-null values
add_index :users, :reset_token,
  where: "reset_token IS NOT NULL"
```

### Unique indexes

```ruby
add_index :users, :email, unique: true
add_index :event_vendors, [:event_id, :vendor_id], unique: true
```

## Foreign Keys

```ruby
# With automatic index
add_reference :events, :venue, foreign_key: true

# To existing column
add_foreign_key :events, :accounts

# With custom column name
add_foreign_key :events, :users, column: :organizer_id

# ON DELETE options
add_foreign_key :comments, :posts, on_delete: :cascade   # Delete children
add_foreign_key :posts, :users, column: :author_id, on_delete: :nullify  # Set NULL
add_foreign_key :orders, :users, on_delete: :restrict     # Prevent deletion
```

## strong_migrations Setup

### Installation and configuration

```ruby
# Gemfile
gem "strong_migrations"
```

```ruby
# config/initializers/strong_migrations.rb
StrongMigrations.start_after = 20240101000000
StrongMigrations.target_version = 16  # PostgreSQL version

# Custom checks
StrongMigrations.add_check do |method, args|
  if method == :add_column && args[1] == :events
    stop! "Check with team before modifying events table"
  end
end
```

### Bypassing when you know it's safe

```ruby
class AddColumnWithDefault < ActiveRecord::Migration[8.0]
  def change
    safety_assured do
      add_column :events, :priority, :integer, default: 0, null: false
    end
  end
end
```

## Reversible Migrations

### Using `change` (automatic reversal)

```ruby
class CreateEvents < ActiveRecord::Migration[8.0]
  def change
    create_table :events do |t|
      t.string :name, null: false
      t.date :event_date
      t.references :account, null: false, foreign_key: true
      t.timestamps
    end
    add_index :events, [:account_id, :event_date]
  end
end
```

### Using `up/down` (manual reversal)

```ruby
class AddBudgetConstraint < ActiveRecord::Migration[8.0]
  def up
    execute <<-SQL
      ALTER TABLE events ADD CONSTRAINT check_positive_budget
      CHECK (budget_cents >= 0)
    SQL
  end

  def down
    execute <<-SQL
      ALTER TABLE events DROP CONSTRAINT check_positive_budget
    SQL
  end
end
```

### Irreversible migrations

```ruby
class DropLegacyTable < ActiveRecord::Migration[8.0]
  def up
    drop_table :legacy_events
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Cannot restore dropped table"
  end
end
```

## Gotchas

- **Never use `change_column` to add NOT NULL on a populated table** — it locks the entire table. Use the two-step pattern: add column with default, then add constraint.
- **Always use `disable_ddl_transaction!` with concurrent indexes** — `algorithm: :concurrently` cannot run inside a transaction; the migration will fail without this.
- **Don't backfill data in schema migrations** — mixing data and schema changes makes rollback unpredictable and slows deploys.
- **Column order matters in composite indexes** — `[:account_id, :status]` helps queries on `account_id` alone but NOT `status` alone. Put the most selective/filtered column first.
- **`add_reference` auto-creates an index** — don't add a duplicate index manually when using `add_reference` or `t.references`.
- **Rename/remove columns break running app instances** — old app servers still reference the old column name. Deploy code changes first, then migrate.

## Validation

- [ ] Migration is reversible (`db:rollback` succeeds)
- [ ] All foreign keys have corresponding indexes
- [ ] Large table indexes use `algorithm: :concurrently` with `disable_ddl_transaction!`
- [ ] NOT NULL on existing columns uses two-step pattern
- [ ] Data migrations are in separate files from schema migrations
- [ ] `strong_migrations` checks pass
- [ ] No table-locking operations on production-size tables
- [ ] `db:migrate && db:rollback && db:migrate` cycle passes locally

<related-skills>
  <skill name="models" reason="Model changes typically require corresponding migrations" />
  <skill name="testing" reason="Migration rollback testing ensures data safety" />
  <skill name="security" reason="Migrations must preserve data integrity constraints" />
</related-skills>
