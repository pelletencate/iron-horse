# Canonical Skill Format Reference

This document defines the authoritative and canonical format for all `SKILL.md` files within the `skills/` directory. Adhering to this format ensures consistency, readability, and efficient parsing by the orchestrator.

## Frontmatter Specification

Each `SKILL.md` file MUST begin with a YAML frontmatter block, enclosed by `---`. This block provides essential metadata about the skill.

```yaml
---
name: skill-name-here # A short, unique identifier for the skill (e.g., "brainstorm", "create-model")
description: One sentence describing when to invoke this skill # A concise summary of the skill's purpose
triggers: # A list of keyword phrases or commands that should activate this skill
  - keyword phrase 1
  - keyword phrase 2
---
```

### Constraints:
- `name`: Must be lowercase, hyphen-separated, and unique.
- `description`: Must be a single sentence.
- `triggers`: Must be an array of strings.

### Forbidden Frontmatter Fields:
- `allowed-tools`: This field is NOT permitted. Tool access is managed centrally, not per skill.
- Namespace prefixes (e.g., `rails-ai:models`): Skill `name` and other fields should NOT include namespace prefixes. Use `models` instead of `rails-ai:models`.

## Required Sections (in order)

After the frontmatter, the `SKILL.md` content MUST follow this precise structure:

### `## When to use this skill`
A bulleted list of conditions or scenarios that indicate this skill is relevant and should be invoked.

### `## Principles` (or `## Core Philosophy`)
A list of 3-7 opinionated guiding rules, best practices, or foundational beliefs that underpin the skill's approach. These should reflect the "why" behind the skill's recommendations.

### `## [Main Content Section]`
This section contains the core knowledge of the skill. Its title will vary depending on the skill's topic (e.g., `## Conversation Flow`, `## Step-by-step Guide`, `## Common Patterns`). This section should include decision trees, detailed patterns, code examples, or step-by-step guidance necessary to execute the skill's purpose.

### `## Gotchas`
A list of 3-7 common mistakes, pitfalls, or unexpected behaviors to avoid when applying this skill.

### `## Validation`
A clear, actionable checklist for verifying that the skill's objective has been successfully met and the outcome is correct.

## Optional Elements

### `<related-skills>`
An XML-like block can be included at the bottom of the document to hint at related skills, but it does not establish hard dependencies. This is purely for informational purposes.

Example:
```xml
<related-skills>
  <skill name="testing" reason="After creating a model, you often need to write tests for it." />
  <skill name="migrations" reason="Models often require database migrations." />
</related-skills>
```

## Line Budget

Skills should be concise and focused to ensure efficient processing and avoid truncation by LLMs.
- **General Skills**: 80-400 lines (including frontmatter and empty lines).
- **Bootstrap Skills** (those injected into every session): Must be ≤200 lines.

## Example Minimal Template Skeleton

```markdown
---
name: example-skill
description: This is a short description of when to use the example skill.
triggers:
  - "example trigger"
  - "show me how"
---

# Example Skill Title

## When to use this skill
- When you need to understand the basic skill structure.
- As a starting point for creating a new skill.

## Principles
1. Be concise and to the point.
2. Provide clear, actionable advice.
3. Keep the user's current context in mind.

## My Main Content Section
This section explains the core logic or steps of the `example-skill`.
You might include code snippets, decision flows, or detailed instructions here.

```ruby
# Example code snippet
def example_method
  puts "Hello from example skill!"
end
```

## Gotchas
- Forgetting the frontmatter.
- Exceeding the line budget.
- Not providing clear validation steps.

## Validation
- [ ] Confirmed frontmatter is correctly formatted.
- [ ] All required sections are present.
- [ ] Skill logic is clear and actionable.
```

## Conflict Resolution & Clarifications

- **NO `allowed-tools:` in frontmatter**: This is a key deviation from some external skill formats. Tool permissions are managed globally.
- **NO namespace prefixes**: Skill names and references should be simple (e.g., `models` instead of `rails-ai:models`).
- **NO `<superpowers-integration>` blocks**: This concept is not part of the canonical skill format.
