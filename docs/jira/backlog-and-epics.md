# 🗂️ Moja Ride — Backlog, Epics & Issue Directory

This document serves as the local single source of truth for all Jira Epics, Stories, and Tasks for Moja Ride (`SCRUM`), keeping the repository and Jira 100% synchronized.

---

## 🟣 Active Epics Directory (Live in Jira)

| Epic Key | Epic Name | Monorepo Domain / Component | Status | Description |
| :--- | :--- | :--- | :--- | :--- |
| **[SCRUM-19](https://ubaidullahismail0.atlassian.net/browse/SCRUM-19)** | `[EPIC-OPS] Operator Portal & Dispatch Operations` | `app:web-operator` | 🔄 Active | Web dashboard, trip dispatch board, conductor/driver selection, passenger manifest drawer. |
| **[SCRUM-18](https://ubaidullahismail0.atlassian.net/browse/SCRUM-18)** | `[EPIC-BOOKING] Booking, Payments & Counter Sales` | `app:web-passenger`, `app:booth`, `integration:payments` | 🔄 Active | Seat reservation, checkout flows, booth counter sales, Paystack/Mobile Money integration. |
| **[SCRUM-21](https://ubaidullahismail0.atlassian.net/browse/SCRUM-21)** | `[EPIC-MOBILE] Traveler & Driver Mobile Apps` | `app:traveler`, `app:driver` | 🔄 Active | React Native/Expo passenger app (onboarding, search, ticket QR) and driver app (routes, manifests). |
| **[SCRUM-20](https://ubaidullahismail0.atlassian.net/browse/SCRUM-20)** | `[EPIC-INFRA] DevOps, Container Registry & Cloud Deployment` | `infra:devops` | 🔄 Active | GitHub Container Registry (GHCR), Docker Compose, production database setup, environment management. |
| **[SCRUM-24](https://ubaidullahismail0.atlassian.net/browse/SCRUM-24)** | `[EPIC-OBSERVABILITY] Observability, APM & Analytics Telemetry` | `infra:observability` | 🔄 Active | Uptime Kuma uptime monitoring, Signoz APM traces/logs, PostHog telemetry across all apps. |
| **[SCRUM-22](https://ubaidullahismail0.atlassian.net/browse/SCRUM-22)** | `[EPIC-INTEGRATIONS] AI Agents & External Communications` | `integration:notifications`, `site:guides`, `site:docs` | 🔄 Active | WhatsApp conversational agent, Novu messaging, operator guides & developer documentation portals. |
| **[SCRUM-23](https://ubaidullahismail0.atlassian.net/browse/SCRUM-23)** | `[EPIC-QUALITY] Architecture, Quality & Core Web UX` | `core:shared-ui`, `core:backend-db`, `apps/web` | 🔄 Active | Nuqs URL state fixes, Prisma type inference, component centralization, page redesign curation. |

---

## 📋 Comprehensive Issues Inventory (SCRUM Project)

### 🟢 Completed Issues (6)

| Key | Title & Scope | Type | Parent Epic | Component Tag |
| :--- | :--- | :--- | :--- | :--- |
| **[SCRUM-10](https://ubaidullahismail0.atlassian.net/browse/SCRUM-10)** | Fix Nuqs bugs in the complete web app across all pages | Story | `[SCRUM-23]` Quality & UX | `app:web-operator`, `bug` |
| **[SCRUM-17](https://ubaidullahismail0.atlassian.net/browse/SCRUM-17)** | Add the third step when signing up | Story | `[SCRUM-21]` Mobile Apps | `app:traveler`, `auth` |
| **[SCRUM-16](https://ubaidullahismail0.atlassian.net/browse/SCRUM-16)** | Fix the checkout problems | Story | `[SCRUM-18]` Booking & Sales | `app:web-passenger`, `checkout` |
| **[SCRUM-7](https://ubaidullahismail0.atlassian.net/browse/SCRUM-7)** | Adding Manual Booking and Passenger Creation | Story | `[SCRUM-19]` Operator Portal | `app:web-operator`, `booking` |
| **[SCRUM-2](https://ubaidullahismail0.atlassian.net/browse/SCRUM-2)** | Fix the Driver and Passenger App Stylings and Bugs | Story | `[SCRUM-21]` Mobile Apps | `app:traveler`, `app:driver` |
| **[SCRUM-1](https://ubaidullahismail0.atlassian.net/browse/SCRUM-1)** | Complete Booth App | Task | `[SCRUM-18]` Booking & Sales | `app:booth`, `counter-sales` |

---

### 🔵 Active & Scheduled Roadmap Issues (19)

| Key | Title | Type | Parent Epic | Component Tag | Priority | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **[SCRUM-28](https://ubaidullahismail0.atlassian.net/browse/SCRUM-28)** | [web] Curate comprehensive list of all pages to redesign | Story | **[SCRUM-23]** Quality & UX | `app:web-operator`, `design` | **High** | To Do |
| **[SCRUM-27](https://ubaidullahismail0.atlassian.net/browse/SCRUM-27)** | [web-operator] Redesign Operator Dashboard Overview Page | Story | **[SCRUM-19]** Operator Portal | `app:web-operator`, `overview` | **High** | To Do |
| **[SCRUM-12](https://ubaidullahismail0.atlassian.net/browse/SCRUM-12)** | Dispatch Board's Trip's Manifest Drawer | Story | **[SCRUM-19]** Operator Portal | `app:web-operator`, `dispatch` | **High** | To Do |
| **[SCRUM-13](https://ubaidullahismail0.atlassian.net/browse/SCRUM-13)** | Dispatch Board's Trip's Driver, Relief and Conductor Selection Option | Story | **[SCRUM-19]** Operator Portal | `app:web-operator`, `dispatch` | **High** | To Do |
| **[SCRUM-26](https://ubaidullahismail0.atlassian.net/browse/SCRUM-26)** | [web-operator] Deploy common header across all remaining Operator Dashboard pages | Story | **[SCRUM-19]** Operator Portal | `app:web-operator`, `ui` | **High** | To Do |
| **[SCRUM-25](https://ubaidullahismail0.atlassian.net/browse/SCRUM-25)** | [web-operator] Create common action cards across Operator Overview and Subpages | Story | **[SCRUM-19]** Operator Portal | `app:web-operator`, `ui` | **High** | To Do |
| **[SCRUM-30](https://ubaidullahismail0.atlassian.net/browse/SCRUM-30)** | [core-ui] Centralize shared UI components across monorepo | Task | **[SCRUM-23]** Quality & UX | `core:shared-ui`, `refactor` | **Medium** | To Do |
| **[SCRUM-31](https://ubaidullahismail0.atlassian.net/browse/SCRUM-31)** | [core-db] Remove any types and strictly infer Prisma types across queries and mutations | Task | **[SCRUM-23]** Quality & UX | `core:backend-db`, `typescript` | **High** | To Do |
| **[SCRUM-11](https://ubaidullahismail0.atlassian.net/browse/SCRUM-11)** | Add Github Container Registry to the Repo | Story | **[SCRUM-20]** DevOps & Infra | `infra:devops`, `docker` | **High** | To Do |
| **[SCRUM-9](https://ubaidullahismail0.atlassian.net/browse/SCRUM-9)** | Fully integrate and setup Uptime Kuma, DB and Signoz for Production | Story | **[SCRUM-24]** Observability | `infra:observability`, `monitoring` | **High** | To Do |
| **[SCRUM-8](https://ubaidullahismail0.atlassian.net/browse/SCRUM-8)** | Identify metrics to track on all pages for Web, Traveler and Driver Apps to integrate PostHog | Story | **[SCRUM-24]** Observability | `infra:observability`, `analytics` | **Medium** | To Do |
| **[SCRUM-6](https://ubaidullahismail0.atlassian.net/browse/SCRUM-6)** | Operator Analytics link for the mobile | Story | **[SCRUM-21]** Mobile Apps | `app:driver`, `app:traveler` | **Medium** | To Do |
| **[SCRUM-5](https://ubaidullahismail0.atlassian.net/browse/SCRUM-5)** | Add Whatsapp Agent | Story | **[SCRUM-22]** AI Integrations | `integration:notifications`, `ai` | **Medium** | To Do |
| **[SCRUM-32](https://ubaidullahismail0.atlassian.net/browse/SCRUM-32)** | [guides] Create guides.mojaride.net for operator guides and training videos | Story | **[SCRUM-22]** AI & Ecosystem | `site:guides`, `documentation` | **Medium** | To Do |
| **[SCRUM-29](https://ubaidullahismail0.atlassian.net/browse/SCRUM-29)** | [docs] Create docs.mojaride.net developer documentation portal | Story | **[SCRUM-22]** AI & Ecosystem | `site:docs`, `developer` | **Medium** | To Do |
| **[SCRUM-14](https://ubaidullahismail0.atlassian.net/browse/SCRUM-14)** | Centralize Header for Operator Dashboard Pages *(Baseline Task)* | Story | **[SCRUM-19]** Operator Portal | `app:web-operator`, `ui` | **Medium** | To Do |
| **[SCRUM-15](https://ubaidullahismail0.atlassian.net/browse/SCRUM-15)** | Create common action cards for Operator Dashboard *(Baseline Task)* | Story | **[SCRUM-19]** Operator Portal | `app:web-operator`, `ui` | **Medium** | To Do |
| **[SCRUM-3](https://ubaidullahismail0.atlassian.net/browse/SCRUM-3)** | [core-ui] Standardize shared UI design tokens and typography | Task | *(Core Package)* | `core:shared-ui`, `tech-debt` | **Low** | In Progress |
| **[SCRUM-4](https://ubaidullahismail0.atlassian.net/browse/SCRUM-4)** | Verify button and form input theme contrast | Subtask | *(Subtask of SCRUM-3)* | `core:shared-ui` | **Low** | To Do |

---

## 🎯 Recommended Sprint Plan (Phased Progression)

### 🚀 Sprint 1: Operator Core Overhaul & Architecture Polish
1. **`SCRUM-28`**: Curate list of all pages to redesign
2. **`SCRUM-12`**: Dispatch Board's Trip Manifest Drawer
3. **`SCRUM-13`**: Trip Crew Selection (Driver, Relief, Conductor)
4. **`SCRUM-26`**: Common Header across all operator subpages
5. **`SCRUM-25`**: Common Action Cards across operator subpages
6. **`SCRUM-27`**: Operator Dashboard Overview page redesign
7. **`SCRUM-10`**: Fix Nuqs bugs across web app
8. **`SCRUM-31`**: Remove any types & strictly infer Prisma types
9. **`SCRUM-30`**: Centralize shared UI components

### 🛡️ Sprint 2: DevOps, Observability & Analytics
1. **`SCRUM-11`**: Add GitHub Container Registry to repo
2. **`SCRUM-9`**: Fully integrate Uptime Kuma, DB & Signoz for production
3. **`SCRUM-8`**: PostHog telemetry & event metrics across Web, Traveler & Driver apps
4. **`SCRUM-6`**: Operator Analytics mobile link

### 🌐 Sprint 3: Multimodal Growth & Knowledge Portals
1. **`SCRUM-5`**: WhatsApp Agent for passengers
2. **`SCRUM-32`**: Create `guides.mojaride.net` for operators
3. **`SCRUM-29`**: Create `docs.mojaride.net` for developers
