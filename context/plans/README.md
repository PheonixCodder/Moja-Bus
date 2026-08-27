# Moja Ride — Feature Implementation Plans

This directory holds **active feature plans** created by the `/architect` skill before development begins. Plans capture vocabulary alignment, architectural decisions, assumptions, and the ordered implementation steps agreed upon before code is written.

---

## How Plans Work

1. Before building any non-trivial feature, run `/architect`.
2. The `/architect` skill interviews you about the feature, surfaces key decisions, and produces a plan.
3. Save the finalized plan here as `context/plans/[feature-name].md`.
4. Implementation follows the plan. Deviations are noted in `memory.md`.
5. Once the feature is shipped and verified, the plan file can be deleted or kept as reference.

---

## Plan File Format

Each plan follows this structure (produced automatically by `/architect`):

```markdown
# Plan — [Feature Name]

## What we are building
[One clear paragraph describing exactly what will be built]

## Vocabulary agreed
- [Term]: [agreed definition]

## Decisions made
- [Decision]: [what was decided and the reasoning]

## Assumptions
- [Anything assumed but not explicitly confirmed]

## Implementation steps
1. ...
2. ...
```

---

## Current Plans

*No active plans. Create one with `/architect` before starting a new feature.*
