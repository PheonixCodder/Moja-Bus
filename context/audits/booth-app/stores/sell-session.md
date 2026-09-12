# Audit: sell-session.ts

## 1. File
Exact source path: [`apps/booth-app/stores/sell-session.ts`](file:///C:/dev/moja-buss/apps/booth-app/stores/sell-session.ts)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Transient in-memory Zustand store managing the multi-step ticket sales wizard state (trip selection -> seat selection -> passenger manifest -> payment tender -> ticket confirmation).

## 4. Responsibilities
- Hold in-flight sales parameters: `tripId`, `seatId`, `passengerCount`, `isIntercity`, passenger contact info (`passengerName`, `passengerEmail`, `passengerPhone`), `fareAmountXOF`, and terminal IDs.
- Provide step-by-step setters: `setTrip`, `setSeat`, `setPassenger`, `setFare`, `setTerminals`.
- Execute checkout pre-validation via `validateSession()`.
- Reset session upon completed sale or cancellation via `reset()`.

## 5. Dependencies
- `zustand` (`create`)

## 6. Consumers / Usage
- [`app/sell/[tripId].tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/sell/[tripId].tsx) (Step 1: Seat & Trip intake)
- [`app/sell/passenger.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/sell/passenger.tsx) (Step 2: Passenger manifest)
- [`app/sell/payment.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/sell/payment.tsx) (Step 3: Tender & submission)
- [`app/sell/confirmation.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/sell/confirmation.tsx) (Step 4: Ticket print & cleanup)
- [`components/seat-map.tsx`](file:///C:/dev/moja-buss/apps/booth-app/components/seat-map.tsx) (Seat selection sync)

## 7. Current Implementation
- **File Length**: 85 lines.
- **Architectural Role**: Transient sales wizard state manager.
- **Transaction-Critical Area**: YES (Heightened scrutiny required per Section 7)
- **Key Exports**: `SellSessionState`, `useSellSession`, selectors (`selectSellTripId`, etc.).

## 8. UI / UX Audit
- Powers the multi-screen sales stepper; allows cashiers to navigate back and forth between passenger intake and seat selection without losing entered form data.

## 9. Design-System Audit
- Not applicable.

## 10. Theme Audit
- Not applicable.

## 11. Logic Audit
- **Validation Rules (Lines 62–74)**:
  - Validates required fields: `tripId`, `passengerId`, `passengerName`, `passengerEmail`, `terminalId`, `destinationTerminalId`.
  - Enforces `fareAmountXOF >= 0`.
  - Enforces `seatId` requirement if `isIntercity === true`.
- **Defects & Gaps**:
  1. *Phone Validation*: Does not validate phone number length or prefix.
  2. *Email Formatting*: Does not validate email format (accepts any non-empty string).

## 12. State Management Audit
- Intentionally not persisted to AsyncStorage, preventing stale passenger data from persisting across cashier shifts.
- Single global session: cannot handle concurrent transaction tabs.

## 13. Async / Side-Effect Audit
- Pure synchronous store.

## 14. Error Handling Audit
- Returns structured `{ valid: boolean, errors: string[] }` for checkout validation.

## 15. Offline / Synchronization Audit
- Payload produced by this store is directly converted into either a live tRPC mutation or an offline queue entry.

## 16. Performance Audit
- Lightweight in-memory state.

## 17. Accessibility Audit
- Not applicable.

## 18. Architecture Audit
- Correct design pattern for multi-step mobile checkout wizards.

## 19. Code Quality Audit
- Clean TypeScript with explicit state interface.

## 20. Reference Comparison
- Matches standard e-commerce / ticketing session store architectures.

## 21. Problems
1. [WEAK VALIDATION] Validation checks only truthiness; does not validate phone or email formatting.
2. [CRASH VOLATILITY] If app crashes while typing passenger details, form resets to empty.

## 22. Severity
- **Classification**: `P1`
- **Rationale**: Direct transaction pipeline state; weak validation can result in invalid server payloads.

## 23. Recommended Changes
1. Enhance `validateSession()` with Zod schema validation matching backend `createCashSale` schema.
2. Ensure `reset()` is cleanly invoked on unmount of confirmation screen.

## 24. Refactoring Plan
1. Preserve existing action signatures.
2. Integrate Zod schema validation in Phase 8 (Sales Funnel).

## 25. Risks
- Moderate risk: altering validation rules could block cashier from proceeding with atypical passenger data.

## 26. Dependencies / Blockers
- **Upstream Dependencies**: `zustand`
- **Downstream Consumers**: 5 sales funnel screens and components
- **Current Blockers**: None.

## 27. Verification Checklist
- [x] TypeScript compilation passes with zero errors (`turbo typecheck`)
- [x] Biome linting and formatting check passes
- [x] Validation logic verified across all 4 sales wizard steps

## 28. Final Audit Decision
- **Decision**: `KEEP + IMPROVE`
- **Reason**: Clean sales session manager; needs Zod schema validation hardening.
