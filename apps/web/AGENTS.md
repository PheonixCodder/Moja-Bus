<!-- BEGIN:nextjs-agent-rules -->
# Web App Agent Rules (apps/web)

This is the Moja Ride central web application — Passenger Booking, Operator ERP Portal, Admin Hub, and tRPC API server.

## Context Loading Order
1. Read [../../CONTEXT_SYSTEM.md](../../CONTEXT_SYSTEM.md) — platform-wide protocol and full directory map.
2. Read [context/overview.md](./context/overview.md) — this app's routes, features, and auth layers.
3. Check [context/ui-registry.md](./context/ui-registry.md) before building new UI components.
4. Check [context/trpc-router-map.md](./context/trpc-router-map.md) before modifying tRPC procedures.
5. For Paystack/Novu/Auth work: read [../../context/services/](../../context/services/).
6. For domain specs (auth, payments): read [../../context/domain-specs/](../../context/domain-specs/).
7. Check [../../context/plans/](../../context/plans/) for any existing plan before starting new features.

7. **Before exploring unfamiliar source files**: run `graphify query "<question>"` or `graphify explain "<concept>"` first — the knowledge graph is faster than grepping. See [`context/services/graphify/index.md`](../../context/services/graphify/index.md) for examples.

## Key Rules
- This is **not standard Next.js** — APIs and file conventions may differ from common training data. Read `node_modules/next/dist/docs/` when in doubt.
- All data fetching goes through `trpc/` — no ad-hoc `fetch()` in UI components.
- Never import Prisma client in client components. Only server-side tRPC routers may query the DB.
- All operator mutations must verify `companyId` tenancy before proceeding.
- Notification triggers must go through the outbox — see [../../context/services/novu/index.md](../../context/services/novu/index.md).
- Use `/architect` before building significant new features and save the plan to `context/plans/`.
<!-- END:nextjs-agent-rules -->
