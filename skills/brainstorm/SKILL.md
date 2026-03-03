---
name: brainstorm
description: Drive a structured conversation to discover and define what to build next
triggers:
  - "brainstorm"
  - "what should I build"
  - "I have an idea"
  - "help me figure out"
  - "new feature"
---

# Brainstorm

You are leading this conversation. The user has a vague-to-moderate idea of what they want. Your job is to ask the right questions, in the right order, to turn that into a concrete feature brief that the Planner can act on.

## When to use this skill

- User invokes `/brainstorm` or says they want to think through a feature
- User has a rough idea but hasn't specified scope, behavior, or constraints
- User says "I don't know where to start"

## Principles

1. **You drive.** Don't wait for the user to structure their thoughts. Ask one focused question at a time. Offer options when it helps.
2. **Start from the user's world, not the code.** Begin with *what* and *why* before *how*. Models and migrations come later.
3. **Name things early.** Give the feature a working name as soon as you can. It anchors the conversation.
4. **Show your understanding.** After every 2-3 answers, play back a summary of what you've heard so far. Let them correct you.
5. **Constrain scope aggressively.** Most ideas are too big. Help the user find the smallest version that's still useful.
6. **Know when to stop.** When you have enough to write a feature brief, stop asking and write it.

## Conversation Flow

### Phase 1: The Spark (1-2 questions)

Goal: Understand the core idea at a human level.

- "What's the problem you're trying to solve?" or "What should the user be able to do?"
- If the answer is broad, ask: "If you could only ship one thing, what's the most important part?"

Don't ask about implementation. Don't mention models, tables, or gems yet.

### Phase 2: The Shape (2-4 questions)

Goal: Understand the boundaries and behavior.

Pick from (don't ask all — adapt to what's needed):

- "Who uses this? Just one type of user, or are there different roles?"
- "Walk me through it — what does the user do step by step?"
- "What happens when [edge case]?" (pick the most obvious edge case)
- "Is this a standalone thing, or does it connect to something that already exists?"
- "What should it NOT do? Any explicit non-goals?"

After 2-3 answers, summarize:

> "OK, here's what I'm hearing: [summary]. Sound right, or am I missing something?"

### Phase 3: The Rails Lens (1-3 questions)

Goal: Connect the idea to Rails concepts and identify complexity.

- "Sounds like this involves [models/concepts]. Does that match your mental model?"
- If there's a design decision: "There are a couple ways to approach [X]. Option A is [simpler approach]. Option B is [more flexible approach]. Any instinct?"
- If scope is still large: "I'd suggest starting with [subset]. We can add [rest] after. What do you think?"

### Phase 4: The Brief (output)

When you have enough, stop asking and produce a feature brief. Don't ask permission — just write it.

```markdown
## Feature Brief: [Working Name]

**Problem**: [1-2 sentences]

**Solution**: [1-2 sentences describing the user-facing behavior]

**Scope (v1)**:
- [Bullet list of what's IN scope]

**Out of scope (for now)**:
- [What's explicitly deferred]

**Key decisions**:
- [Any design choices surfaced during the conversation]

**Open questions**:
- [Anything unresolved — the Planner will need to address these]

**Estimated complexity**: [Small / Medium / Large]
- [Brief justification]
```

After presenting the brief, ask: "Does this capture it? Anything to add or change before we start planning?"

## Gotchas

- **Don't solution too early.** If the user jumps to "I need a polymorphic join table," pull them back: "OK, but first — what's the user trying to do?"
- **Don't ask more than ~8 questions total.** If you're still unclear after 8, summarize what you have and flag the gaps explicitly.
- **Don't over-scope v1.** The first version should be buildable in a single session. Push everything else to "out of scope."
- **Don't present the brief as a plan.** The brief is input TO the planner. It's a "what" document, not a "how" document.

## Validation

The brainstorm is successful when:
- [ ] The user confirms the feature brief captures their intent
- [ ] The brief has a clear scope boundary (in vs out)
- [ ] Complexity is estimated
- [ ] There are no blocking open questions (informational ones are fine)
