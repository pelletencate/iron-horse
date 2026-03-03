# Rails AI Recipes

> **Coming in v2** — Pre-built convention-lean plans for common Rails features.

## What Are Recipes?

Recipes are pre-authored feature plans that pair with the `writing-plans` skill. Instead of writing a plan from scratch for common patterns, you load a recipe and customize the deviations for your project.

Recipes embody the convention-lean philosophy: they specify authorization rules, edge cases, and project-specific decisions — while omitting everything the AI executor already knows about Rails conventions.

## Planned Recipes (v2)

- **authentication** — Email/password registration, login, password reset, remember-me
- **oauth-google** — Google OAuth integration with OmniAuth, find_or_create_from_oauth
- **payments-stripe** — Stripe Checkout, subscription management, webhook handling
- **settings-page** — User preferences, notification settings, account deletion
- **email-verification** — Token-based email confirmation flow
- **contact-form** — Non-persisted form object, ActionMailer delivery, rate limiting
- **deployment-kamal** — Kamal v2 Docker deployment configuration
- **multi-tenancy** — Row-level security with tenant scoping
- **file-uploads** — ActiveStorage with direct upload, variants, and security validation
- **admin-panel** — Basic admin scaffold with authorization scoping

## Contributing

Recipes follow the convention-lean format from the `writing-plans` skill. See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines (coming soon).