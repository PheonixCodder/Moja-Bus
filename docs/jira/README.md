# 🚌 Moja Ride — Jira Context & Operations Hub

Welcome to the **Moja Ride Jira Management & Tracking System**.

This directory (`docs/jira/`) serves as the permanent, single source of truth for how Jira is configured, how project roadmaps and goals are tracked, how tickets are created and updated, and how developers and AI agents interact with Jira without drifting or creating "fire-and-forget" noise.

---

## 🧭 Why We Use Jira in Moja Ride

Moja Ride is a multi-platform digital transportation ecosystem consisting of:
1. **Operator Portal & Admin Web App** (`apps/web`)
2. **Passenger Mobile App** (`apps/traveler-app`)
3. **Driver Mobile App** (`apps/driver-app`)
4. **Station Ticket Booth / Agent POS App** (`apps/booth-app`)
5. **Shared Monorepo Packages** (`packages/db`, `packages/auth`, `packages/schemas`, `packages/ui`, etc.)
6. **Production Infrastructure & Telemetry** (GHCR, Signoz, Uptime Kuma, PostHog)

Jira (`SCRUM` project: **Moja Ride**) provides the operational engine for:
* **Strategic Roadmap Tracking**: Mapping long-term product phases and OKRs to measurable Epics.
* **Sprint Accountability**: Organizing weekly/bi-weekly releases so features ship incrementally.
* **Traceability**: Linking pull requests, commits, and branch names (`feat/SCRUM-14-...`) directly to clear acceptance criteria.
* **Bug Triage**: Ensuring production defects and UX edge cases are triaged with clear severity rather than lost in chat logs.

---

## 📂 Documentation Directory Structure

| File | Purpose |
| :--- | :--- |
| **[README.md](./README.md)** | This document: System overview, directory index, and operational philosophy. |
| **[roadmaps-and-goals.md](./roadmaps-and-goals.md)** | Strategic goals, quarterly milestones, delivery phases (Phase 1 to 5), and OKRs. |
| **[taxonomy-and-rules.md](./taxonomy-and-rules.md)** | Issue hierarchy (Epics, Stories, Tasks, Bugs, Subtasks), title conventions, priorities, and branch naming. |
| **[components-map.md](./components-map.md)** | Jira Components mapped 1:1 to monorepo directories (`apps/*`, `packages/*`, infra). |
| **[workflows-and-sprints.md](./workflows-and-sprints.md)** | Board workflow states, sprint cycles, Definition of Done (DoD), and quality gates. |
| **[backlog-and-epics.md](./backlog-and-epics.md)** | Active Epics directory, ticket mapping, status of all backlog items, and orphan ticket cleanup plan. |
| **[sync-cheatsheet.md](./sync-cheatsheet.md)** | Automated workflows, JQL reference queries, Composio MCP commands, and AI agent instructions. |

---

## ⚡ The Golden Rules of Jira in Moja Ride

1. **No Orphan Issues**: Every Story, Task, and Bug MUST belong to a parent Epic.
2. **Always Tag Components**: When creating an issue, attach the matching monorepo component (e.g. `app:web-operator`, `app:traveler`, `core:db`).
3. **Explicit Definition of Done**: Every ticket must outline bulleted Acceptance Criteria before work begins.
4. **Update Jira in Real Time**: Move tickets from `To Do` → `In Progress` → `In Review` → `Done` as code changes occur.
5. **Branch & Commit Traceability**: Prefix branch names with the issue key (e.g. `git checkout -b feat/SCRUM-12-manifest-drawer`).
