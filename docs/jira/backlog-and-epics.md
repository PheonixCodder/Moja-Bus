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

> Last synced from Jira: **2026-09-17**

### ✅ Completed Issues (17)

| Key | Title & Scope | Type | Parent Epic | Component Tag |
| :--- | :--- | :--- | :--- | :--- |
| **[SCRUM-1](https://ubaidullahismail0.atlassian.net/browse/SCRUM-1)** | Complete Booth App | Task | `[SCRUM-18]` Booking & Sales | `app:booth`, `counter-sales` |
| **[SCRUM-2](https://ubaidullahismail0.atlassian.net/browse/SCRUM-2)** | Fix the Driver and Passenger App Stylings and Bugs | Story | `[SCRUM-21]` Mobile Apps | `app:traveler`, `app:driver` |
| **[SCRUM-7](https://ubaidullahismail0.atlassian.net/browse/SCRUM-7)** | Adding Manual Booking and Passenger Creation | Story | `[SCRUM-19]` Operator Portal | `app:web-operator`, `booking` |
| **[SCRUM-8](https://ubaidullahismail0.atlassian.net/browse/SCRUM-8)** | Identify metrics to track on all pages for Web, Traveler and Driver Apps to integrate PostHog | Story | `[SCRUM-24]` Observability | `infra:observability`, `analytics` |
| **[SCRUM-9](https://ubaidullahismail0.atlassian.net/browse/SCRUM-9)** | Fully integrate and setup Uptime Kuma, DB and Signoz for Production | Story | `[SCRUM-24]` Observability | `infra:observability`, `monitoring` |
| **[SCRUM-10](https://ubaidullahismail0.atlassian.net/browse/SCRUM-10)** | Fix Nuqs bugs in the complete web app across all pages | Story | `[SCRUM-23]` Quality & UX | `app:web-operator`, `bug` |
| **[SCRUM-11](https://ubaidullahismail0.atlassian.net/browse/SCRUM-11)** | Add Github Container Registry to the Repo | Story | `[SCRUM-20]` DevOps & Infra | `infra:devops`, `docker` |
| **[SCRUM-12](https://ubaidullahismail0.atlassian.net/browse/SCRUM-12)** | Dispatch Board's Trip's Manifest Drawer | Story | `[SCRUM-19]` Operator Portal | `app:web-operator`, `dispatch` |
| **[SCRUM-13](https://ubaidullahismail0.atlassian.net/browse/SCRUM-13)** | Dispatch Board's Trip's Driver, Relief and Conductor Selection Option | Story | `[SCRUM-19]` Operator Portal | `app:web-operator`, `dispatch` |
| **[SCRUM-14](https://ubaidullahismail0.atlassian.net/browse/SCRUM-14)** | Centralize Header for Operator Dashboard Pages | Story | `[SCRUM-19]` Operator Portal | `app:web-operator`, `ui` |
| **[SCRUM-15](https://ubaidullahismail0.atlassian.net/browse/SCRUM-15)** | Create common action cards for Operator Dashboard | Story | `[SCRUM-19]` Operator Portal | `app:web-operator`, `ui` |
| **[SCRUM-16](https://ubaidullahismail0.atlassian.net/browse/SCRUM-16)** | Fix the checkout problems | Story | `[SCRUM-18]` Booking & Sales | `app:web-passenger`, `checkout` |
| **[SCRUM-17](https://ubaidullahismail0.atlassian.net/browse/SCRUM-17)** | Add the third step when signing up | Story | `[SCRUM-21]` Mobile Apps | `app:traveler`, `auth` |
| **[SCRUM-25](https://ubaidullahismail0.atlassian.net/browse/SCRUM-25)** | [web-operator] Create common action cards across Operator Overview and Subpages | Story | `[SCRUM-19]` Operator Portal | `app:web-operator`, `ui` |
| **[SCRUM-26](https://ubaidullahismail0.atlassian.net/browse/SCRUM-26)** | [web-operator] Deploy common header across all remaining Operator Dashboard pages | Story | `[SCRUM-19]` Operator Portal | `app:web-operator`, `ui` |
| **[SCRUM-27](https://ubaidullahismail0.atlassian.net/browse/SCRUM-27)** | [web-operator] Redesign Operator Dashboard Overview Page | Story | `[SCRUM-19]` Operator Portal | `app:web-operator`, `overview` |
| **[SCRUM-30](https://ubaidullahismail0.atlassian.net/browse/SCRUM-30)** | [core-ui] Centralize shared UI components across monorepo | Task | `[SCRUM-23]` Quality & UX | `core:shared-ui`, `refactor` |

---

### 🔵 In Progress (2)

| Key | Title | Type | Parent Epic | Component Tag | Priority | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **[SCRUM-3](https://ubaidullahismail0.atlassian.net/browse/SCRUM-3)** | [core-ui] Standardize shared UI design tokens and typography | Task | *(Core Package)* | `core:shared-ui`, `tech-debt` | **Low** | In Progress |
| **[SCRUM-28](https://ubaidullahismail0.atlassian.net/browse/SCRUM-28)** | [web] Curate comprehensive list of all pages to redesign | Story | `[SCRUM-23]` Quality & UX | `app:web-operator`, `design` | **High** | In Progress |

---

### 📋 Open / To Do (14)

| Key | Title | Type | Parent Epic | Component Tag | Priority | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **[SCRUM-4](https://ubaidullahismail0.atlassian.net/browse/SCRUM-4)** | Verify button and form input theme contrast | Subtask | *(Subtask of SCRUM-3)* | `core:shared-ui` | **Low** | To Do |
| **[SCRUM-5](https://ubaidullahismail0.atlassian.net/browse/SCRUM-5)** | Add Whatsapp Agent | Story | `[SCRUM-22]` AI Integrations | `integration:notifications`, `ai` | **Medium** | To Do |
| **[SCRUM-6](https://ubaidullahismail0.atlassian.net/browse/SCRUM-6)** | Operator Analytics link for the mobile | Story | `[SCRUM-21]` Mobile Apps | `app:driver`, `app:traveler` | **Medium** | To Do |
| **[SCRUM-29](https://ubaidullahismail0.atlassian.net/browse/SCRUM-29)** | [docs] Create docs.mojaride.net developer documentation portal | Story | `[SCRUM-22]` AI & Ecosystem | `site:docs`, `developer` | **Medium** | To Do |
| **[SCRUM-31](https://ubaidullahismail0.atlassian.net/browse/SCRUM-31)** | [core-db] Remove any types and strictly infer Prisma types across queries and mutations | Task | `[SCRUM-23]` Quality & UX | `core:backend-db`, `typescript` | **High** | To Do |
| **[SCRUM-32](https://ubaidullahismail0.atlassian.net/browse/SCRUM-32)** | [guides] Create guides.mojaride.net for operator guides and training videos | Story | `[SCRUM-22]` AI & Ecosystem | `site:guides`, `documentation` | **Medium** | To Do |
| **[SCRUM-33](https://ubaidullahismail0.atlassian.net/browse/SCRUM-33)** | [web] Complete SEO implementation for Moja Ride Web App (page-by-page) | Story | `[SCRUM-23]` Quality & UX | `app:web-operator`, `seo` | **Medium** | To Do |
| **[SCRUM-34](https://ubaidullahismail0.atlassian.net/browse/SCRUM-34)** | [infra] Integrate self-hosted Novu service into Docker Compose stack | Story | `[SCRUM-20]` DevOps & Infra | `infra:devops`, `notifications` | **High** | To Do |
| **[SCRUM-35](https://ubaidullahismail0.atlassian.net/browse/SCRUM-35)** | [all-apps] Audit all tRPC & TanStack Query calls for prefetch, mutations and UX | Task | `[SCRUM-23]` Quality & UX | `app:web-operator`, `app:traveler`, `app:driver`, `app:booth` | **High** | To Do |
| **[SCRUM-36](https://ubaidullahismail0.atlassian.net/browse/SCRUM-36)** | [booth-app] Add PIN login for Booth App | Story | `[SCRUM-18]` Booking & Sales | `app:booth`, `auth` | **High** | To Do |
| **[SCRUM-37](https://ubaidullahismail0.atlassian.net/browse/SCRUM-37)** | [core-schemas] Centralize API call schemas for tRPC routers across all apps | Task | `[SCRUM-23]` Quality & UX | `core:schemas`, `typescript` | **High** | To Do |
| **[SCRUM-38](https://ubaidullahismail0.atlassian.net/browse/SCRUM-38)** | [core-ui] Create centralized skeleton loaders for Admin, Operator and Traveler dashboards | Story | `[SCRUM-23]` Quality & UX | `core:shared-ui`, `ux` | **High** | To Do |
| **[SCRUM-39](https://ubaidullahismail0.atlassian.net/browse/SCRUM-39)** | [web] Integrate OpenSEO into Moja Ride Web App | Task | `[SCRUM-23]` Quality & UX | `app:web-operator`, `seo` | **Medium** | To Do |
| **[SCRUM-40](https://ubaidullahismail0.atlassian.net/browse/SCRUM-40)** | [ai-platforms] Register and optimize Moja Ride presence on AI platforms (Claude, ChatGPT, Google AI, Grok) | Story | `[SCRUM-22]` AI & Ecosystem | `integration:ai-platforms` | **Medium** | To Do |

---

## 🎯 Remaining Roadmap (Next Sprints)

### 🏃 Current Sprint: Wrap Up
1. **`SCRUM-28`**: Curate list of all pages to redesign *(In Progress)*
2. **`SCRUM-31`**: Remove any types & strictly infer Prisma types

### 🔧 Sprint 2: Quality, Performance & Auth
1. **`SCRUM-35`**: tRPC & TanStack Query full audit (prefetch, mutations, UX)
2. **`SCRUM-37`**: Centralize API call schemas across all apps
3. **`SCRUM-38`**: Centralized skeleton loaders for all dashboards
4. **`SCRUM-36`**: PIN login for Booth App
5. **`SCRUM-3`** / **`SCRUM-4`**: UI design tokens & contrast check

### 🌐 Sprint 3: SEO & AI Visibility
1. **`SCRUM-33`**: Complete SEO for Web App (page-by-page)
2. **`SCRUM-39`**: Integrate OpenSEO
3. **`SCRUM-40`**: Register Moja Ride on AI Platforms
4. **`SCRUM-34`**: Self-hosted Novu Docker integration

### 📡 Sprint 4: Multimodal Growth & Knowledge Portals
1. **`SCRUM-5`**: WhatsApp Agent for passengers
2. **`SCRUM-32`**: Create `guides.mojaride.net` for operators
3. **`SCRUM-29`**: Create `docs.mojaride.net` for developers
4. **`SCRUM-6`**: Operator Analytics mobile link

