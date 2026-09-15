# 🏷️ Moja Ride — Jira Taxonomy & Rules

To keep Jira clean, searchable, and aligned with our Git workflows, follow these conventions for all issues.

---

## 1. Issue Hierarchy

```
Level 1: 🟣 EPIC
  ├── Purpose: High-level themes, modules, or major product phases (e.g. Operator Portal, Payments).
  └── Duration: Spans across multiple sprints (several weeks to months).

Level 2: 📗 STORY (User-facing feature) / 🔵 TASK (Technical or operational work) / 🔴 BUG
  ├── Purpose: Deliverable unit of work that fits within a single sprint (1-5 days of effort).
  └── Rule: MUST belong to an Epic.

Level 3: ⬛ SUBTASK
  ├── Purpose: Atomic step, UI component breakdown, or PR chunk within a Story or Task.
  └── Rule: Belongs directly to its parent Story/Task.
```

---

## 2. Issue Title Conventions

Every issue title must be prefixed by its target domain or component enclosed in brackets `[component]`:

* **Features/Stories**: `[component] Brief active-voice summary`
  * *Example*: `[web-operator] Add manifest drawer to dispatch board`
  * *Example*: `[traveler-app] Implement offline QR ticket storage`
* **Tasks**: `[infra] Setup GitHub Container Registry automated builds`
* **Bugs**: `[bug][web] Fix Nuqs query state desynchronization on filter reset`

---

## 3. Standard Issue Description Template

Every Jira Story or Task must contain the following sections:

```markdown
### 🎯 Context & Goal
What problem does this issue solve, and why are we building it?

### 🧩 Affected Monorepo Packages / Apps
- `apps/web` (or `apps/traveler-app`, `packages/db`, etc.)

### 📋 Acceptance Criteria (Definition of Done)
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Edge cases handled (e.g. empty state, network failure)
- [ ] Automated tests or type checks pass (`pnpm check` / `pnpm build`)

### 🔗 Context References
- Relevant docs: `context/domain-specs/operations.md`
```

---

## 4. Priority Guidelines

| Priority | When to Use | SLA / Target Timeline |
| :--- | :--- | :--- |
| **Highest / Blocker** 🔴 | Production crash, broken auth, payment failures, double-booking bug. Blocks all other work. | Immediate resolution (same day) |
| **High** 🟠 | Core sprint deliverable, blocking another developer or downstream task. | Current sprint |
| **Medium** 🟡 | Standard feature work, UI enhancements, routine improvements. | Scheduled sprint |
| **Low** 🟢 | Minor visual polish, non-critical tech debt, future exploration. | Backlog / when time permits |

---

## 5. Git & Jira Traceability Rules

### Branch Naming
Always include the Jira ticket key in the branch name:
```bash
# For features:
git checkout -b feat/SCRUM-12-manifest-drawer

# For bug fixes:
git checkout -b fix/SCRUM-10-nuqs-bug

# For infrastructure/chores:
git checkout -b chore/SCRUM-11-ghcr-setup
```

### Commit Messages
Include the Jira key in commits to link work automatically:
```bash
git commit -m "feat(web): add passenger manifest drawer component [SCRUM-12]"
```
