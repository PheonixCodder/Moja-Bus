<!-- BEGIN:expo-agent-rules -->
# Booth App Agent Rules (apps/booth-app)

This is the **Moja Ride Booth Terminal App** — Expo, React Native, Expo Router, NativeWind (v4 preview), Tailwind CSS v4, and offline-first ticket sales for booth/terminal staff.

## Context Loading Order
1. Read [../../CONTEXT_SYSTEM.md](../../CONTEXT_SYSTEM.md) — platform-wide protocol and full directory map.
2. Read [context/overview.md](./context/overview.md) — routes, feature structure, offline strategy, boot gate.
3. Check [context/ui-registry.md](./context/ui-registry.md) before building new screens or components.
4. Check [../../context/plans/](../../context/plans/) for any existing plan before starting new features.
5. For the backend tRPC API surface: read [../../apps/web/trpc/routers/booth.ts](../../apps/web/trpc/routers/booth.ts).
6. For the BoothSale / BoothPaymentMethod schema: read the `BoothSale` model in [../../packages/db/prisma/schema.prisma](../../packages/db/prisma/schema.prisma) around line 3169.

## Key Rules
- **NEVER use bare `<div>` elements** — this is React Native. Use `<View>`, `<Text>`, `<TouchableOpacity>`, `<Pressable>`.
- **Light mode only** — booth-app is configured with `"userInterfaceStyle": "light"` in `app.json`. Do not introduce dark mode theming.
- All data fetching goes through the **tRPC client** (`@/lib/trpc`) targeting the `booth.*` procedures. Never use ad-hoc `fetch()` to the backend.
- **Boot gate must fail-open on network error** (after one retry) — terminal staff must not be blocked if the network is down. Offline holds and queue handles disconnected scenarios.
- All document/ticket uploads go through **server-minted URLs only** — never upload to a hardcoded endpoint.
- **Terminal context is critical**: every sale requires `terminalId` from the session store. Never proceed without a selected terminal.
- Booth staff DO NOT have operator ERP permissions — they are restricted to the `BOOTH` staff role with `booth.*` tRPC procedures only.
- Use `/architect` before building significant new features and save the plan to `context/plans/`.
<!-- END:expo-agent-rules -->
