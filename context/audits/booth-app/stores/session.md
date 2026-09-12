# Audit: session.ts

## 1. File
Exact source path: [`apps/booth-app/stores/session.ts`](file:///C:/dev/moja-buss/apps/booth-app/stores/session.ts)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Persistent Zustand store managing cashier shift context, assigned terminal, operator company profile, and active interface locale across app restarts.

## 4. Responsibilities
- Persist operator shift session to AsyncStorage under key `"booth-session"`.
- Store `SelectedTerminal` (`id`, `name`) and `OperatorProfile` (`operatorId`, `staffName`, `role`, `companyId`, `assignedTerminal`).
- Track whether profile has completed remote loading via `profileLoaded: boolean`.
- Export granular selector functions (`selectTerminalId`, `selectTerminalName`, `selectIsTerminalLocked`, `selectCashierName`, `selectCompanyName`) to prevent unnecessary component re-renders.

## 5. Dependencies
- `@react-native-async-storage/async-storage`
- `zustand` & `zustand/middleware` (`persist`, `createJSONStorage`)
- [`@/lib/i18n`](file:///C:/dev/moja-buss/apps/booth-app/lib/i18n.ts) (`type SupportedLocale`)

## 6. Consumers / Usage
- [`app/index.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/index.tsx) (Boot gate router)
- [`app/terminal-select.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/terminal-select.tsx) (Workstation terminal assignment)
- [`app/(tabs)/index.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(tabs)/index.tsx) (Header terminal & cashier name)
- [`app/(tabs)/profile.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(tabs)/profile.tsx) (Operator details & logout)
- [`app/sell/[tripId].tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/sell/[tripId].tsx) (Terminal ID injection into sale)
- [`app/reconcile.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/reconcile.tsx) (Shift reconciliation terminal context)

## 7. Current Implementation
- **File Length**: 86 lines.
- **Architectural Role**: Cashier session context authority.
- **Transaction-Critical Area**: YES (Heightened scrutiny required per Section 7)
- **Key Exports**: `useSessionStore`, selectors (`selectTerminalId`, etc.).

## 8. UI / UX Audit
- Controls initial screen routing: determines whether user is routed to `/(auth)/login`, `/terminal-select`, or `/(tabs)`.

## 9. Design-System Audit
- Not applicable.

## 10. Theme Audit
- Not applicable.

## 11. Logic Audit
- **Stale Profile Risk**: Operator profile is stored in AsyncStorage and partialize-persisted. If staff permissions or assigned terminals are updated in the web back-office, the booth app will use the cached profile until manually refreshed.
- **Terminal Lock Logic**: Line 77: `selectIsTerminalLocked = (state) => Boolean(state.profile?.assignedTerminal?.id)`. Correctly detects when management has assigned a fixed terminal.

## 12. State Management Audit
- Partializes state to persist only `terminal`, `profile`, and `locale`. `profileLoaded` correctly resets to `false` on startup.

## 13. Async / Side-Effect Audit
- AsyncStorage hydration is asynchronous and handled by Zustand persist middleware.

## 14. Error Handling Audit
- `createJSONStorage` handles serialization exceptions safely.

## 15. Offline / Synchronization Audit
- Crucial for offline resilience: persists terminal identity and cashier credentials so sales can proceed offline without network profile checks.

## 16. Performance Audit
- Provides granular selector functions, preventing full-tree re-renders on session updates.

## 17. Accessibility Audit
- Not applicable.

## 18. Architecture Audit
- Clean store architecture adhering to Zustand best practices.

## 19. Code Quality Audit
- Fully typed TypeScript with explicit interfaces.

## 20. Reference Comparison
- Matches session store patterns across POS applications.

## 21. Problems
1. [CACHE STALENESS] No cache TTL or revalidation timestamp on `profile`. If an operator is revoked or reassigned on the server, the app operates under stale credentials until network sync fails.
2. [DUAL LOCALE STORAGE] `session.locale` is stored in `"booth-session"` while `lib/i18n.ts` stores it in `"booth-app-user-locale"`.

## 22. Severity
- **Classification**: `P1`
- **Rationale**: Core session context affecting authentication routing and terminal assignment.

## 23. Recommended Changes
1. Add a `profileLastFetchedAt` timestamp and revalidate profile in background when online.
2. Synchronize `setLocale` with `i18n.changeLanguage`.

## 24. Refactoring Plan
1. Keep existing selector and action interfaces intact.
2. Add profile staleness check in boot gate (`app/index.tsx`).

## 25. Risks
- Critical security risk: any malfunction in session persistence causes cashier logout loops.

## 26. Dependencies / Blockers
- **Upstream Dependencies**: `AsyncStorage`, `zustand`
- **Downstream Consumers**: 6 route and component files
- **Current Blockers**: None.

## 27. Verification Checklist
- [x] TypeScript compilation passes with zero errors (`turbo typecheck`)
- [x] Biome linting and formatting check passes
- [x] Selectors verified for minimal re-render profile

## 28. Final Audit Decision
- **Decision**: `KEEP + IMPROVE`
- **Reason**: Well-structured store; needs profile staleness TTL and locale synchronization.
