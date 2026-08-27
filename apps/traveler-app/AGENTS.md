<!-- BEGIN:expo-agent-rules -->
# Traveler App Agent Rules (apps/traveler-app)

This is the **Moja Ride Passenger Mobile App** — Expo, React Native, NativeWind.

## Context Loading Order
1. Read [../../CONTEXT_SYSTEM.md](../../CONTEXT_SYSTEM.md) — platform-wide protocol and full directory map.
2. Read [context/overview.md](./context/overview.md) — routes, feature structure, state patterns, offline handling.
3. Check [context/ui-registry.md](./context/ui-registry.md) before building new screens or components.
4. For push notifications: read [../../context/services/novu/index.md](../../context/services/novu/index.md).
5. For payments (checkout): read [../../context/services/paystack/index.md](../../context/services/paystack/index.md).
6. Check [../../context/plans/](../../context/plans/) for any existing plan before starting new features.

## Key Rules
- Style with **NativeWind** utility classes only — no `StyleSheet` objects unless required by a native API.
- Navigation is file-based via **Expo Router** — do not use `react-navigation` `navigate()` calls directly.
- All data fetching goes through tRPC client — no ad-hoc `fetch()` to the backend.
- QR tickets must be accessible offline — persist booking reference and QR payload to local storage after confirmation.
- Never hard-code `localhost` or IP addresses — use `EXPO_PUBLIC_API_URL` env var.
- Use `/architect` before building significant new features and save the plan to `context/plans/`.
<!-- END:expo-agent-rules -->
