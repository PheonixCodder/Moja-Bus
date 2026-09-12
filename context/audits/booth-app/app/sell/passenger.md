# Audit: app/sell/passenger.tsx

## 1. File
Exact source path: [`apps/booth-app/app/sell/passenger.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/sell/passenger.tsx)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Step 2 of ticket sales funnel: Passenger identification, customer account lookup by phone/email, quick walk-up filler, and customer account creation.

## 4. Responsibilities
- Lookup existing passenger records by phone or email via `trpc.booth.lookupOrCreatePassenger`.
- Create a new customer profile if account does not exist.
- Provide a "+ Remplissage rapide guichet" walk-up shortcut for unrepresented cash passengers.
- Display verified passenger badge and details.
- Persist passenger identity to [`stores/sell-session.ts`](file:///C:/dev/moja-buss/apps/booth-app/stores/sell-session.ts).
- Navigate to Step 3 (`/sell/payment`).

## 5. Dependencies
- `@hugeicons/core-free-icons` (`ArrowLeft01Icon`, `Call02Icon`, `Mail01Icon`, `Search01Icon`, `UserAdd01Icon`, `UserIcon`)
- `@hugeicons/react-native` (`HugeiconsIcon`)
- `@tanstack/react-query` (`useMutation`)
- `expo-router` (`router`, `useLocalSearchParams`)
- `react` (`useState`)
- `react-i18next` (`useTranslation`)
- `react-native` (`KeyboardAvoidingView`, `Platform`, `ScrollView`, `Text`, `TouchableOpacity`, `View`)
- `react-native-safe-area-context` (`useSafeAreaInsets`)
- `react-native-toast-message` (`Toast`)
- [`@/components/ui/badge`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/badge.tsx)
- [`@/components/ui/button`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/button.tsx)
- [`@/components/ui/card`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/card.tsx)
- [`@/components/ui/input`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/input.tsx)
- [`@/constants/ui-colors`](file:///C:/dev/moja-buss/apps/booth-app/constants/ui-colors.ts) (`IconColors`)
- [`@/lib/haptics`](file:///C:/dev/moja-buss/apps/booth-app/lib/haptics.ts) (`BoothFeedback`)
- [`@/lib/trpc`](file:///C:/dev/moja-buss/apps/booth-app/lib/trpc.tsx) (`useTRPC`)
- [`@/stores/sell-session`](file:///C:/dev/moja-buss/apps/booth-app/stores/sell-session.ts) (`useSellSession`)

## 6. Consumers / Usage
- Step 2 of ticket sales funnel.

## 7. Current Implementation
- **File Length**: 391 lines.
- **Architectural Role**: Sales Funnel Step 2.
- **Transaction-Critical Area**: HIGH (Customer identity capture)
- **Key Exports**: Default export `PassengerScreen`.

## 8. UI / UX Audit
- Clean step-by-step state machine: `"search"` -> `"create"` -> `"confirmed"`.
- Quick walk-up shortcut enables 1-tap anonymous passenger creation for rush-hour counter sales.

## 9. Design-System Audit
- Reuses `Card`, `Input`, `Button`, and `Badge` primitives.

## 10. Theme Audit
- Consistent design tokens.

## 11. Logic Audit
- **Quick Walkup Mock Data (Lines 135-142)**:
  ```ts
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  setFullName(`Passager Guichet ${randomSuffix}`);
  setEmail(`guichet-${randomSuffix}@mojaride.local`);
  setPhone("+22500000000");
  setMode("create");
  ```
  Creates synthetic mock emails like `guichet-4812@mojaride.local`. When submitted online, this registers fake accounts in the database.
- **Offline Passenger Defect**: `lookupOrCreatePassenger` requires internet. If offline, the cashier cannot search or create passengers. Needs local offline passenger synthesis so cash sales can proceed.

## 12. State Management Audit
- Stores customer details in `useSellSession`.

## 13. Async / Side-Effect Audit
- Asynchronous passenger lookup mutation.

## 14. Error Handling Audit
- Shows toast alerts on search failure and auto-populates the create form.

## 15. Offline / Synchronization Audit
- Defect: Lacks offline fallback for walk-up passenger creation.

## 16. Performance Audit
- Lightweight form interactions.

## 17. Accessibility Audit
- All inputs have explicit labels and keyboard types.

## 18. Architecture Audit
- Clear separation of lookup and creation modes.

## 19. Code Quality Audit
- Fully typed `Passenger` interface.

## 20. Reference Comparison
- Matches POS walk-up ticketing flows.

## 21. Problems
1. [ZERO OFFLINE PASSENGER CREATION] Cashier cannot create passengers when offline because mutation requires server RPC.
2. [SYNTHETIC ACCOUNT POLLUTION] Quick walk-up generates fake `@mojaride.local` user accounts in the main auth database instead of assigning an anonymous walk-up guest ticket.

## 22. Severity
- **Classification**: `P1`
- **Rationale**: Blocks offline ticketing and pollutes production user tables.

## 23. Recommended Changes
1. Support offline walkup guest generation directly in `useSellSession` without calling RPC when offline.
2. Mark walk-up sales as guest bookings without creating full Better Auth user records.

## 24. Refactoring Plan
1. Add offline detection: if offline, bypass server lookup and populate local walkup guest profile.

## 25. Test Strategy
1. Test searching passenger by phone.
2. Test walkup button populates fields.
3. Test offline passenger assignment.

## 26. Verification Criteria
- [ ] Offline sales proceed without server lookup.
- [ ] Passenger data transferred to payment screen.

## 27. Next Steps
- Implement in Phase 8.

## 28. Notes
None.
