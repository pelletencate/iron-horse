---
name: frame-problem
description: Use this skill BEFORE writing code or creating a plan to detect XY problems early.
triggers:
  - frame the problem
  - what is the real problem
  - 5 whys
  - xy problem
  - pre-brainstorming
---

# 🎯 Problem Framing & Solution Discovery

You are a technical architect helping translate raw stakeholder requests into well-framed problems with optimal solution approaches. Use this skill BEFORE writing code or creating a plan. Detect XY problems early.

## When to use this skill
- Before starting feature work, creating a plan, or writing code.
- When a user requests a specific implementation but the underlying goal is unclear.
- When a requested feature seems like a workaround for a different issue.
- As a pre-brainstorming step (before using brainstorming skills) to ensure you are solving the right problem.
- When you suspect an XY problem.

## Principles
1. **Challenge the request politely** - You are a technical advisor, not just an order-taker.
2. **Discover the root need** - Use the "5 Whys" technique to move past surface-level asks.
3. **Investigate first** - Always search the existing codebase before proposing new solutions.
4. **Provide options, not mandates** - Offer multiple approaches with clear trade-offs.
5. **Think long-term** - Consider maintenance, scalability, and architectural alignment.

## The Problem Framing Process

### Phase 1: Understand the Raw Request

1. **Ask the user to describe the request** they received from the stakeholder
   - Accept any format: Slack message, email, verbal request, ticket description
   - Don't judge the request yet - just capture it

2. **Extract the surface-level ask:**
   - What feature/button/screen was requested?
   - Who made the request? (role/department)
   - Any mentioned urgency or deadline?

---

### Phase 2: The "5 Whys" Discovery

Ask progressively deeper questions to uncover the **root need**:

#### 🔍 Round 1: Understand the Immediate Problem

Ask questions like:
- **"What problem is the stakeholder trying to solve?"**
  - Suggested context: "Are they trying to make a decision, track something, fix an issue, or improve a process?"

- **"What do they currently do to accomplish this?"**
  - Suggested context: "Manual workarounds? Existing feature that's inadequate? Nothing (new need)?"

- **"What triggered this request now?"**
  - Suggested context: "Specific pain point? Upcoming event? Change in business process?"

**Format:**
```markdown
## Discovery Q1: What problem is the stakeholder trying to solve?

**Context options:**
- [ ] Making a business decision (which decision?)
- [ ] Tracking/monitoring something (what metric?)
- [ ] Fixing a broken workflow (what's broken?)
- [ ] Compliance/reporting requirement (what regulation?)
- [ ] Competitive pressure (what competitor has this?)
- [ ] Other: ________________

**Your answer:** [User fills this]

**Follow-up:** [Why is this important right now?]
```

#### 🎯 Round 2: Identify Success Criteria

Ask questions like:
- **"What does success look like for them?"**
  - How will they know this solved their problem?
  - What metrics would improve?

- **"Who else is affected by this problem?"**
  - Just them? Their team? External users?

- **"How often do they need this?"**
  - Daily? Monthly? Once per quarter? Ad-hoc?

#### 🏗️ Round 3: Explore Constraints & Context

Ask questions like:
- **"Are there existing features that partially solve this?"**
  - Use file search tools to search the codebase if needed
  - What's missing from existing solutions?

- **"What have they tried already?"**
  - Workarounds? Other tools? Manual processes?

- **"What's the actual data they need access to?"**
  - Be specific about models, fields, relationships

---

### Phase 3: Analyze Existing Codebase

**CRITICAL:** Before proposing solutions, understand what already exists.

#### 🔎 Step 3.1: Search for Related Features

Use your tools to explore:

1. **Search for similar functionality:** Find related models, controllers, components
2. **Find relevant files:** Find related views, components, services
3. **Read key files:**
   - Models that contain the data they need
   - Controllers that handle similar workflows
   - ViewComponents that could be extended
   - Service objects that encapsulate similar logic

#### 📊 Step 3.2: Document Current State

Create a section documenting the current state:
```markdown
## Current State Analysis

### Existing Features Found
- **Feature/File:** [path]
  - **Purpose:** [what it does]
  - **Gaps:** [what's missing for this request]

### Relevant Data Models
- **Model:** [name]
  - **Fields available:** [list]
  - **Current access pattern:** [how it's used now]

### Technical Debt Identified
- [Any issues that would block or complicate this]
```

---

### Phase 4: Detect the Problem Type

Classify the request into one of these patterns:

#### 🚩 Pattern A: "XY Problem" Detected
**Indicators:**
- Stakeholder asks for specific implementation (button, export, email)
- But underlying need is actually visibility/access/notification
- Solution requested is complex, but simpler alternatives exist

**Response:**
```markdown
## 🚩 Potential XY Problem Detected

**What they asked for (X):** [specific implementation]
**What they actually need (Y):** [root need]

**Why this matters:** [explain the mismatch]
```

#### ✅ Pattern B: Legitimate New Feature
**Indicators:**
- Clear new capability needed
- No existing feature covers this
- Fits product roadmap

**Response:**
```markdown
## ✅ Legitimate Feature Request

**Core need:** [validated need]
**Why it's needed:** [business justification]
**Fits architecture:** [how it aligns with existing system]
```

#### 🔧 Pattern C: Configuration/Extension Need
**Indicators:**
- Feature exists but lacks flexibility
- Simple enhancement to existing capability
- More of a "tweak" than new feature

**Response:**
```markdown
## 🔧 Enhancement to Existing Feature

**Current feature:** [what exists]
**Limitation:** [what's missing]
**Enhancement needed:** [small change required]
```

#### 🔀 Pattern D: Process/Workflow Problem
**Indicators:**
- Technical solution requested for organizational issue
- Could be solved with training, documentation, or process change
- Tech solution is overkill

**Response:**
```markdown
## 🔀 May Not Require Code

**Technical request:** [what they asked for]
**Alternative approaches:**
- [ ] Training/documentation
- [ ] Process change
- [ ] Use existing feature differently
- [ ] Lightweight tech solution
```

---

### Phase 5: Propose Solution Approaches

Present **3 options** with increasing complexity:

```markdown
## Solution Options Analysis

### 🥉 Option A: Minimal Viable Solution
**Approach:** [Simplest thing that could work]

**Implementation:**
- [What needs to be built]
- [Estimated effort: hours/days]

**Pros:**
- ✅ [advantage 1]
- ✅ [advantage 2]

**Cons:**
- ❌ [limitation 1]
- ❌ [limitation 2]

**Best for:** [when to choose this]

---

### 🥈 Option B: Balanced Solution
**Approach:** [Middle ground - good UX without over-engineering]

**Implementation:**
- [What needs to be built]
- [Estimated effort: days/week]

**Pros:**
- ✅ [advantage 1]
- ✅ [advantage 2]

**Cons:**
- ❌ [limitation 1]

**Best for:** [when to choose this]

---

### 🥇 Option C: Comprehensive Solution
**Approach:** [Full-featured, scalable, handles edge cases]

**Implementation:**
- [What needs to be built]
- [Estimated effort: weeks]

**Pros:**
- ✅ [advantage 1]
- ✅ [advantage 2]
- ✅ [advantage 3]

**Cons:**
- ❌ [complexity/time investment]

**Best for:** [when to choose this]

---

### 💡 Option D: Alternative Approach (if applicable)
**Approach:** [Non-obvious solution - e.g., external tool, process change]

**Why consider this:**
- [Explanation of how it solves the root need differently]

**Trade-offs:**
- [Compare to building custom solution]
```

---

### Phase 6: Make a Recommendation

Based on your analysis, recommend one option with clear reasoning:

```markdown
## 🎯 Recommended Approach

**I recommend: Option [A/B/C/D]**

**Reasoning:**
1. [Why this fits the actual need]
2. [Why this is appropriate for the urgency/importance]
3. [How this aligns with system architecture]
4. [What this enables for the future]

**Critical assumptions:**
- ✓ [Assumption 1 - verify with stakeholder]
- ✓ [Assumption 2 - verify with stakeholder]

**Next steps if approved:**
1. [First action]
2. [Second action]
3. Create a specification or plan based on this decision
```

---

### Phase 7: Generate Draft Specification

If the solution requires code (not process/config change), generate a **draft specification** ready for implementation or planning:

```markdown
## 📋 Draft Specification (for Option [X])

### Feature Name
[Clear, descriptive name]

### Problem Statement
**Current state:** [What happens now]
**Desired state:** [What should happen]
**Root need:** [The actual need identified]

### Target Users
- **Primary:** [role]
- **Secondary:** [role if applicable]

### Proposed Solution
[High-level description of chosen approach]

### Key Requirements
**Must-Have:**
- [ ] [Requirement 1]
- [ ] [Requirement 2]

**Nice-to-Have:**
- [ ] [Enhancement 1]

### Data Requirements
**Models involved:**
- [Model 1]: [what data/fields]
- [Model 2]: [what data/fields]

**New models needed:**
- [If any]

### User Workflow (Happy Path)
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Technical Approach
- [High-level architecture]
- [Components needed: controllers, services, views, etc.]

### Open Questions
- [ ] [Question 1]
- [ ] [Question 2]
```

## Gotchas

- **Requests for reports/exports:** Often mask need for better dashboards/visibility. Don't just build an export feature without digging deeper.
- **"Just add a button":** Usually more complex than it sounds and touches more layers than anticipated.
- **Copy competitor features:** May not fit your users' actual needs. Validate before copying.
- **Urgent without clear deadline:** Push back to understand real urgency before rushing a poor solution.
- **"Everyone wants this":** Verify with data/research before committing significant resources.

## Validation

At the end of this process, ensure you have:
- [ ] Clear problem statement (not just feature request).
- [ ] Root need identified (5 Whys analysis).
- [ ] Current state analysis (what exists in codebase).
- [ ] 3+ solution options (with pros/cons/trade-offs).
- [ ] Recommended approach (with reasoning).
- [ ] Draft specification (ready for the next step).
- [ ] Assumptions to validate (with stakeholder).
