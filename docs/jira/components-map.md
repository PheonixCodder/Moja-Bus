# 🧩 Moja Ride — Jira Components & Monorepo Mapping

To avoid ambiguity about where work belongs, every Jira issue must specify a **Component**. These components correspond directly to the packages, applications, and infrastructure of the Moja Ride monorepo.

---

## Component Matrix

| Jira Component Name | Monorepo Directory | Description & Scope |
| :--- | :--- | :--- |
| **`app:web-operator`** | `apps/web` (`/operator/*`) | Operator management portal, route & schedule management, dispatch board, fleet manager, company settings. |
| **`app:web-admin`** | `apps/web` (`/admin/*`) | Super-admin platform portal, operator verification, audit logs, global analytics. |
| **`app:web-passenger`** | `apps/web` (`/passenger/*`, `/search/*`) | Passenger search and desktop booking web portal. |
| **`app:traveler`** | `apps/traveler-app` | React Native / Expo mobile app for passengers (ticket search, seat selection, offline QR ticket storage). |
| **`app:driver`** | `apps/driver-app` | React Native / Expo mobile app for drivers (assigned trips, passenger manifest check-in, GPS tracking). |
| **`app:booth`** | `apps/booth-app` | Station counter POS and walk-in ticket sales app for bus terminal agents. |
| **`core:backend-db`** | `packages/db` | Prisma schema, PostgreSQL migrations, database seeders, and data access layers. |
| **`core:auth`** | `packages/auth` | Better Auth multi-tenant authentication, session management, RBAC, and permissions. |
| **`core:shared-ui`** | `packages/ui` & `packages/theme` | Reusable React / Tailwind v4 components, design tokens, color palette, typography. |
| **`infra:devops`** | Root `compose.yml`, `Dockerfile`, `.github/*` | Docker, Compose, GitHub Container Registry (GHCR), CI/CD pipelines, environment config. |
| **`infra:observability`** | Root & services config | Signoz (traces/logs), Uptime Kuma (health monitoring), PostHog (telemetry & events). |
| **`integration:payments`** | `context/services/paystack/` | Paystack payment gateway, mobile money (MTN, Orange, Moov), webhook verification. |
| **`integration:notifications`** | `context/services/novu/` | Novu transactional messaging (Email, SMS, Push, In-App, WhatsApp). |
| **`site:guides`** | `guides.mojaride.net` | Knowledge base, operator training documentation, video guides. |
| **`site:docs`** | `docs.mojaride.net` | Public developer API documentation, webhooks, architecture guides. |

---

## 🎯 How to Pick the Right Component

1. **If you are touching UI inside `apps/web` for operators**: Choose `app:web-operator`.
2. **If you are modifying database models in Prisma**: Choose `core:backend-db`.
3. **If you are updating mobile screens**: Choose `app:traveler` or `app:driver`.
4. **If you are touching container builds or deployments**: Choose `infra:devops`.
5. **Cross-cutting features**: Pick the primary component where the user-facing impact is felt, and link related subtasks to secondary components.
