# Booth Ecosystem & Booth App — Comprehensive Deep-Dive Audit

> **Audit Status**: Active  
> **Target App**: `apps/booth-app`  
> **Related Surfaces**: `apps/web` (Operator Dashboard, TRPC Routers, IAM/Auth), `packages/db` (Prisma Schema), `packages/schemas` (Validation/Permissions), `apps/traveler-app` & `apps/driver-app` (Golden References)  
> **Auditor**: Lead Systems Architect & Product Engineering Review  
> **Timestamp**: 2026-09-11  

---

## Executive Summary

A comprehensive, file-by-file forensic audit of the ticket booth subsystem across the entire repository reveals that the booth ecosystem (`apps/booth-app`, related `apps/web` routers, database entities, operator dashboard staff management, and validation schemas) is in a **severely broken, misconfigured, and non-viable state**. 

While high-level architectural documentation in `apps/booth-app/context/overview.md` describes an elegant offline-capable POS application for counter ticket sales, passenger check-in, thermal receipt printing, and end-of-shift reconciliation, **the actual codebase cannot complete a single happy-path flow in production**. 

Staff cannot log in, operators cannot invite booth staff, online and offline cash sales fail silently due to validation and state-binding bugs, Paystack payments create unconfirmed ghost bookings that release seats back to the public pool, and thermal printing relies on an uninstalled native library that immediately throws runtime exceptions.

### System Scorecard

| Domain | Rating | Status | Summary of Core Failure |
| :--- | :---: | :---: | :--- |
| **Authentication & Security** | **F** | **BLOCKER** | Client uses disabled `emailAndPassword` auth; server rejects `mojabooth://` origin; missing OTP plugins. |
| **Staff & IAM Governance** | **F** | **BLOCKER** | `BOOTH` role excluded from `INVITABLE_STAFF_ROLES`; UI coerces booth staff to `ADMIN`; impossible to invite counter agents. |
| **Sales Flow Execution** | **F** | **BLOCKER** | Destination terminal ID set to `""` causes silent sales abort; passenger search crashes Zod validation; Paystack confirm mutation never called. |
| **Offline Engine & Sync** | **D-** | **CRITICAL** | Sync passes `holdId` instead of `boothSaleId` to conflict reporting; NetInfo reachability check falsely marks Abidjan networks offline. |
| **Hardware & Printing** | **F** | **CRITICAL** | `react-native-thermal-receipt-printer-enhanced` is not in `package.json`; printing is completely non-functional. |
| **Design System & UI/UX** | **D** | **MAJOR** | 5 rudimentary components vs 32 shadcn primitives in `traveler-app`; missing `components.json`; raw unstyled components. |
| **Internationalization & Copy** | **D-** | **CRITICAL** | `fr.json` has severe UTF-8 mojibake across the entire file; `en.json` contains legacy `"MoovMove"` branding. |
| **Code Structure & Parity** | **D+** | **MAJOR** | Monolithic screens; missing feature-driven folder hierarchy used by `traveler-app` and `driver-app`. |

---

## Top 10 Blocker & Critical Findings

1. **Authentication Impossible (P0)**: `apps/booth-app/app/(auth)/login.tsx` calls `authClient.signIn.email({ email, password })`, but `apps/web/lib/auth-server.ts` explicitly sets `emailAndPassword: { enabled: false }`. Furthermore, `apps/booth-app/lib/auth-client.ts` lacks the `emailOTPClient()` and `phoneNumberClient()` plugins used across the platform.
2. **Production Origin Rejection (P0)**: `apps/web/lib/trusted-origins.ts` restricts mobile schemes to `APP_SCHEMES = ["traveler-app://", "driver-app://"]`. The booth app scheme `mojabooth://` is omitted, causing Better Auth to reject all booth mobile requests in production.
3. **Staff Invitation Blocked in Schema & UI (P0)**: `BOOTH` is omitted from `INVITABLE_STAFF_ROLES` in `packages/schemas/src/permissions.ts`. Consequently, `staff.inviteStaff` rejects `BOOTH` with HTTP 400, and `apps/web/features/operator/components/staff/role-sheet.tsx` literally coerces `BOOTH` staff members to `ADMIN` (`member.role === "BOOTH" ? "ADMIN" : member.role`).
4. **Sales Flow Silently Aborts (P0)**: In `apps/booth-app/app/sell/[tripId].tsx`, destination terminal is hardcoded as `setTerminals(terminal.id, "")`. In `payment.tsx`, `handleCashConfirm()` and `handlePaystackInitiate()` guard with `if (!sellSession.destinationTerminalId) return;`. The function exits silently—tapping "Confirm Cash Sale" produces zero response and leaves the agent stranded.
5. **Paystack Payments Form Ghost Bookings (P0)**: In `apps/booth-app/app/sell/payment.tsx`, when Paystack polling succeeds (`pollData?.status === "PAID"`), the app redirects to confirmation without ever calling `trpc.booth.confirmPaystackSale`. The booking stays `PENDING_PAYMENT` with `paymentStatus: UNPAID` until its 10-minute hold expires and the seat is released back to the open market, despite passenger money being captured.
6. **Passenger Search Zod Crash (P1)**: In `apps/booth-app/app/sell/passenger.tsx`, passenger search passes `{ email: searchQuery, fullName: "" }` to `booth.lookupOrCreatePassenger`. `lookupOrCreatePassengerSchema` enforces `fullName: z.string().min(2)` and `email: z.string().email()`. If an agent searches by phone number or name, or leaves `fullName` empty, the tRPC call instantly crashes with a Zod validation error.
7. **Offline Conflict Sync Data Corruption (P1)**: In `apps/booth-app/lib/offline-sync.ts`, `reportUrbanConflict` passes `entries.map((e) => e.holdId)` as `boothSaleIds`. `tx.boothSale.updateMany({ where: { id: { in: input.boothSaleIds } } })` matches zero records because hold IDs are not sale IDs, resulting in corrupted, blank manager conflict notifications.
8. **Thermal Printer Ghost Library (P1)**: `apps/booth-app/lib/bluetooth-print.ts` requires `"react-native-thermal-receipt-printer-enhanced"`, which is **not declared in `package.json`**. The printer module is always `null`, and `confirmation.tsx` never even invokes `printTicket`.
9. **French Locale File Corruption (P1)**: `apps/booth-app/locales/fr.json` suffers from severe UTF-8 encoding corruption throughout (e.g., `"SǸlectionnez"`, `"rǸserve expirǸe"`, `"accs"`, `"tǸlǸphone"`, `"Paiement ǸchouǸ"`), rendering customer-facing and agent UI illegible in Francophone markets.
10. **Design System & Component Gulf (P2)**: Unlike `traveler-app` (which features 32 accessible, shadcn-compliant primitives from `@rn-primitives/*`), `booth-app` features only 5 rudimentary hand-rolled components, lacks `components.json`, and bypasses its own primitives with inline, unstyled React Native views.

---

## Audit Directory Index

This audit is organized into 9 modules under `context/audits/booth-ecosystem-audit/`:

```
context/audits/booth-ecosystem-audit/
├── README.md                            # Executive summary, scorecard, top 10 blockers
├── 01-system-map-and-architecture.md     # System map, monorepo topology, entity models, data flows
├── 02-auth-and-security-deep-dive.md     # Better Auth client/server analysis, origins, boot gate
├── 03-trpc-and-api-contracts.md         # tRPC client, query engine, booth router audit
├── 04-operator-staff-and-governance.md   # Operator staff management, IAM, templates, invite flow
├── 05-sales-flow-and-offline-engine.md   # Sales journey, seat map, Paystack, offline queue & holds
├── 06-ui-ux-design-system-and-parity.md  # Screen & component mapping vs traveler-app, design tokens
├── 07-i18n-assets-hardware-printing.md  # Locale files, mojibake audit, ESC/POS printing, branding
├── 08-findings-catalog.md               # Severity-ranked findings register (P0–P3)
└── 09-remediation-roadmap.md            # Phased implementation plan with code diffs & release gates
```
