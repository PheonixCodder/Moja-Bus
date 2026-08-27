# Moja Ride — Third-Party Services Hub

This directory contains complete Markdown documentation for every third-party service integrated into the Moja Ride platform. AI agents must read the relevant service folder **before** writing any integration code — never guess API signatures or webhook shapes.

---

## Services

| Service | Directory | Coverage |
| :--- | :--- | :--- |
| **Paystack** | [`paystack/`](./paystack/) | Payment initialization, mobile money (MTN/Orange/Wave), card tokenization, transfers, bank verification, webhooks, refunds. |
| **Novu** | [`novu/`](./novu/) | Notification channel routing (email, SMS, push, in-app), workflow identifiers, outbox payload contracts, subscriber identity. |
| **Better Auth** | [`better-auth/`](./better-auth/) | Passwordless OTP flows, session management, multi-tenancy, RBAC plugins, mobile client setup. |
| **Mapbox & Telemetry** | [`mapbox-telemetry/`](./mapbox-telemetry/) | Mobile tile sets, background GPS pinging, telemetry JWT tokens, Leaflet web fleet map. |

---

## Adding a New Service

When integrating a new external service:
1. Create `context/services/[service-name]/`.
2. Create `index.md` — quick-reference table, key integration patterns, and invariants specific to Moja Ride.
3. Copy or convert the service's official documentation into organized Markdown files.
4. Add the service to the table above.
5. Reference it in `context/architecture.md` and the relevant `apps/*/context/overview.md`.

> [!IMPORTANT]
> These files are ground truth for AI agents. Always consult this folder before implementing integrations.
