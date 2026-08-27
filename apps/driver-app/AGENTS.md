<!-- BEGIN:expo-agent-rules -->
# Driver App Agent Rules (apps/driver-app)

This is the **Moja Ride Driver Mobile App** — Expo, React Native, NativeWind, Background GPS Telemetry, and Offline QR Check-in.

## Context Loading Order
1. Read [../../CONTEXT_SYSTEM.md](../../CONTEXT_SYSTEM.md) — platform-wide protocol and full directory map.
2. Read [context/overview.md](./context/overview.md) — routes, telemetry architecture, onboarding wizard, boot gate.
3. Check [context/ui-registry.md](./context/ui-registry.md) before building new screens or components.
4. For GPS telemetry: read [../../context/services/mapbox-telemetry/index.md](../../context/services/mapbox-telemetry/index.md).
5. For push notifications: read [../../context/services/novu/index.md](../../context/services/novu/index.md).
6. Check [../../context/plans/](../../context/plans/) for any existing plan before starting new features.

## Key Rules
- **NEVER use bare `<div>` elements** — this is React Native. Use `<View>`, `<Text>`, `<Pressable>`.
- All document uploads go through **presigned S3 PUT URLs** minted server-side via `drivers.presignDoc`. Never upload to a hardcoded URL.
- Boot gate must **fail-open on network error** (after one retry) — offline drivers must not be blocked.
- GPS telemetry tokens are JWT-based and entirely separate from Better Auth session cookies — do not conflate them.
- Driver accounts do NOT have operator ERP permissions. Never assign `companyId`-scoped operator privileges to `DRIVER` role users.
- Use `/architect` before building significant new features and save the plan to `context/plans/`.
<!-- END:expo-agent-rules -->
