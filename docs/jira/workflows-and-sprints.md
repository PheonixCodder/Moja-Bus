# 🔄 Moja Ride — Workflows, Sprints & Quality Gates

This guide outlines how tickets flow across the Jira board, how sprints are planned and executed, and the strict quality gates required before closing an issue.

---

## 1. Board Workflow Columns

Our Jira Scrum Board uses a 5-stage progressive workflow:

```
[Backlog] ──> [To Do] ──> [In Progress] ──> [In Review] ──> [Done]
```

### Stage Definitions

| Column | Meaning & Prerequisites |
| :--- | :--- |
| **Backlog** | Idea or future requirement. Unscheduled. May lack full acceptance criteria. |
| **To Do** | Groomed and assigned to the active sprint. Acceptance criteria and component are defined. Ready for pickup. |
| **In Progress** | Developer / AI agent has checked out a branch and is actively writing code. |
| **In Review** | Pull request is submitted, automated CI is running, and PR is awaiting architectural/peer review. |
| **Done** | PR is merged into main branch, acceptance criteria verified, and ticket is closed. |

---

## 2. Board & Sprint Configuration (Live Jira)

* **Board**: `SCRUM board` (Board ID `1`, type: Simple / Scrum)
* **Active Sprint**: `SCRUM Sprint 0` (Sprint ID `2`)
* **Future Sprint**: `SCRUM Sprint 1` (Sprint ID `1`)
* **Cadence**: 2 Weeks (10 working days).
* **Active Sprint Scope (Updated 2026-09-17)**: ~~Operator Core Overhaul~~ ✅ (`SCRUM-12`, `SCRUM-13`, `SCRUM-25`, `SCRUM-26`, `SCRUM-27` — **Done**), ~~Nuqs Fixes~~ ✅ (`SCRUM-10` — **Done**), ~~Component Centralization~~ ✅ (`SCRUM-30` — **Done**), Page Redesign Audit (`SCRUM-28` — **In Progress**), Type Inference (`SCRUM-31` — **To Do**).
* **Mid-Sprint Check**: Verify that `In Progress` items are advancing and blockers are flagged immediately.
* **Sprint Review & Retrospective**:
  * Demo completed features.
  * Move any incomplete tasks back to backlog or rollover to next sprint.
  * Update `docs/jira/backlog-and-epics.md` to reflect the latest state.

---

## 3. Definition of Done (DoD)

An issue can **only** be moved to `Done` when **all** of the following conditions are met:

1. **Acceptance Criteria Met**: Every checkbox in the issue description has been verified.
2. **Code Standards Followed**: Code complies with `context/code-standards.md` (Clean Architecture, strict TypeScript, no `any`, proper error handling).
3. **Type-Check & Lint Pass**: Running `pnpm check` and `pnpm lint` yields zero errors.
4. **No Broken Tests / Builds**: `pnpm build` executes successfully.
5. **Context Maintained**: If new UI components were added, update `context/ui-registry.md` or the corresponding app context (`apps/web/context/overview.md`).
