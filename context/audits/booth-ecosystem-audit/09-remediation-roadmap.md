# Module 09: Remediation Blueprint & Phased Execution Plan

> **Audit Context**: Step-by-Step Engineering Roadmap for Complete Booth Reconstruction  
> **Estimated Execution**: 6 Structured Phases  
> **Quality Gate**: 100% Parity with `apps/traveler-app` and Zero Open P0/P1 Findings  

---

## Phase 1: Security, Auth & Origins Hardening (P0 Blockers)

### 1.1 Register Booth Custom Scheme in Trusted Origins
In `apps/web/lib/trusted-origins.ts`:
```diff
- export const APP_SCHEMES = ["traveler-app://", "driver-app://"] as const;
+ export const APP_SCHEMES = [
+   "traveler-app://",
+   "driver-app://",
+   "mojabooth://",
+ ] as const;
```

### 1.2 Align Booth Auth Client with Server Protocols
In `apps/booth-app/lib/auth-client.ts`:
```diff
+ import {
+   emailOTPClient,
+   phoneNumberClient,
+   inferAdditionalFields,
+ } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL,
  plugins: [
+   emailOTPClient(),
+   phoneNumberClient(),
+   inferAdditionalFields,
    expoClient({
      scheme: "mojabooth",
      storage: SecureStore,
      storagePrefix: AUTH_STORAGE_PREFIX,
    }) as unknown as { id: "expo"; $Infer: object },
  ],
});
```

### 1.3 Implement Modern OTP Authentication UI
- Replace `apps/booth-app/app/(auth)/login.tsx` with a multi-step phone/email OTP screen ported from `apps/traveler-app/features/auth/screens/login.tsx`.
- Support Côte d'Ivoire mobile number detection (`+225`, `07`, `05`, `01`).
- Fall back to email OTP for management staff.

### 1.4 Implement Fail-Open Boot Gate
In `apps/booth-app/app/index.tsx`:
- If `session` is valid but network fails during `getMyProfile`, **fail-open** to cached profile in `sessionStore`.
- Do not redirect to `/(auth)/login` on transient network errors.

---

## Phase 2: IAM & Operator Staff Governance

### 2.1 Add `BOOTH` to Invitable Staff Roles
In `packages/schemas/src/permissions.ts`:
```diff
export const INVITABLE_STAFF_ROLES = [
  "ADMIN",
  "MANAGER",
  "OPERATIONS",
  "FINANCE",
  "SUPPORT",
  "TREASURY",
  "DISPATCHER",
  "CONDUCTOR",
+ "BOOTH",
] as const;
```

### 2.2 Permit Admins & Managers to Assign Booth Role
In `packages/schemas/src/permissions.ts`:
```diff
ADMIN: [
  "MANAGER", "OPERATIONS", "FINANCE", "SUPPORT",
  "TREASURY", "DISPATCHER", "CONDUCTOR",
+ "BOOTH",
],
MANAGER: [
  "OPERATIONS", "SUPPORT", "DISPATCHER", "CONDUCTOR",
+ "BOOTH",
],
```

### 2.3 Eliminate Role Coercion Bug in Operator Dashboard
In `apps/web/features/operator/components/staff/role-sheet.tsx`:
```diff
- member.role === "OWNER" || member.role === "DRIVER" || member.role === "BOOTH"
-   ? "ADMIN"
-   : member.role,
+ member.role === "OWNER" || member.role === "DRIVER"
+   ? "ADMIN"
+   : member.role,
```
Add `"BOOTH"` to `FALLBACK_ROLES` and `apps/web/features/operator/components/staff/invite-sheet.tsx`'s `INVITABLE_ROLES`.

### 2.4 Add Terminal Scoping to Operator Model
In `packages/db/prisma/schema.prisma`:
```prisma
model Operator {
  ...
  // Optional assigned terminal for booth agents and dispatchers
  assignedTerminalId String?
  assignedTerminal   CompanyLocation? @relation("OperatorAssignedTerminal", fields: [assignedTerminalId], references: [id])
}
```

---

## Phase 3: Sales Engine & Financial Integrity

### 3.1 Fix Destination Terminal Propagation
In `apps/booth-app/app/(tabs)/index.tsx`:
- Pass `destinationTerminalId: destStop?.terminalId` when pushing to `/sell/[tripId]`.
In `apps/booth-app/app/sell/[tripId].tsx`:
- Retrieve `destinationTerminalId` from route params or trip stops:
```diff
- setTerminals(terminal.id, "");
+ setTerminals(terminal.id, resolvedDestinationTerminalId);
```

### 3.2 Fix Passenger Search & Lookup Schema
In `packages/schemas/src/booth.ts`:
```diff
export const lookupOrCreatePassengerSchema = z.object({
- email: z.string().email(),
- fullName: z.string().min(2).max(100),
+ query: z.string().min(1), // Accepts phone or email
+ fullName: z.string().max(100).optional(),
  phone: z.string().optional(),
});
```
Update `booth.lookupOrCreatePassenger` in `apps/web/trpc/routers/booth.ts` to search by either phone number OR email address.

### 3.3 Eliminate Paystack Ghost Bookings
In `apps/booth-app/app/sell/payment.tsx`:
When `pollData?.status === "PAID"`, execute the confirmation mutation **before** navigating:
```typescript
onPaid: async () => {
  try {
    const confirmed = await confirmPaystackMutation.mutateAsync({
      holdGroupId: paystackData.holdId,
      paystackReference: paystackData.reference,
      terminalId: sellSession.terminalId,
      passengerId: sellSession.passengerId,
      passengerEmail: sellSession.passengerEmail,
      passengerName: sellSession.passengerName,
      walkedUpPassenger: true,
      passengerAccountCreated: sellSession.isNewAccount,
    });
    BoothFeedback.paymentSuccess();
    router.replace({
      pathname: "/sell/confirmation",
      params: {
        bookingId: confirmed.bookingId,
        passengerEmail: sellSession.passengerEmail,
      },
    });
  } catch (err) {
    Alert.alert("Erreur de confirmation", "Le paiement a été reçu mais la confirmation a échoué. Réessayez.");
  }
}
```

---

## Phase 4: QR Check-In & Ticket Normalization

### 4.1 Normalize Ticket Tokens in `checkInPassenger`
In `apps/web/trpc/routers/booth.ts`:
```typescript
import { parseTicketToken } from "@moja/schemas";

// In checkInPassenger:
const parsedToken = parseTicketToken(input.ticketToken);
const booking = await ctx.prisma.booking.findFirst({
  where: {
    ticketToken: parsedToken,
    companyId: ctx.companyId,
    status: "CONFIRMED",
  },
  ...
});
```

### 4.2 Add Manual Ticket Token Entry Fallback
In `apps/booth-app/app/(tabs)/checkin.tsx`:
- Add a text input below the camera viewport allowing the agent to manually type a 6-character reference code if the passenger's phone screen is cracked or dim.

---

## 5. Phase 5: Design System & Component Library Parity

### 5.1 Initialize `components.json` & Port `@rn-primitives/*`
1. Create `apps/booth-app/components.json` matching `apps/traveler-app/components.json`.
2. Add `@rn-primitives/*` and `class-variance-authority` to `apps/booth-app/package.json`.
3. Port the full 32-component shadcn suite (`button.tsx`, `input.tsx`, `dialog.tsx`, `select.tsx`, `badge.tsx`, `card.tsx`) from `apps/traveler-app/components/ui/`.
4. Wrap `apps/booth-app/app/_layout.tsx` in `<ThemeProvider value={NAV_THEME}>` and `<PortalHost />`.

### 5.2 Refactor to Feature-Driven Architecture
Reorganize `apps/booth-app/` into standard monorepo feature modules:
```
apps/booth-app/features/
├── auth/           # Login, OTP verification, session gates
├── checkin/        # QR camera scanner, manual token dialog, validation
├── reconcile/      # Daily summary cards, cash breakdown, share sheet
├── sales/          # Trip selector, seat map, passenger form, payment modal
└── terminal/       # Terminal switcher, offline pool badge
```

---

## Phase 6: Hardware Thermal Printing, Sync & Localization

### 6.1 Install & Wire Bluetooth Thermal Printer
1. Install a compatible React Native ESC/POS library in `apps/booth-app/package.json` (e.g. `react-native-esc-pos-printer` or configure the native bridge).
2. Wire `printTicket()` into `apps/booth-app/app/sell/confirmation.tsx` with auto-print toggle.
3. Build a Bluetooth printer scanning and pairing UI under `apps/booth-app/app/(tabs)/profile.tsx`.

### 6.2 Fix Offline Conflict Sync Identifier Bug
In `apps/booth-app/lib/offline-sync.ts`:
- Ensure `reportUrbanConflict` only passes valid `BoothSale.id`s returned from synced transactions, not raw hold IDs.

### 6.3 Cleanse French Locale & Eliminate Mojibake
- Re-encode `apps/booth-app/locales/fr.json` with clean UTF-8 French characters.
- Replace `"MoovMove"` with `"Moja Ride"` in `apps/booth-app/locales/en.json`.
- Port the parity test `__tests__/i18n-parity.test.ts` to `apps/booth-app`.

---

## Pre-Release Verification Checklist

- [ ] **Probe A (Auth Gate)**: Agent successfully logs in via Phone OTP and stays authenticated across app restart.
- [ ] **Probe B (Staff Invite)**: Operator admin invites cashier as `BOOTH` role from web dashboard; invite email arrives via Novu; agent accepts.
- [ ] **Probe C (Cash Sale Happy Path)**: Cashier selects trip → picks seat → creates walk-up passenger → confirms cash sale → booking is `CONFIRMED` in DB with `BoothSale` record.
- [ ] **Probe D (Paystack Happy Path)**: Cashier selects Paystack QR → passenger pays on mobile → poll detects `PAID` → `confirmPaystackSale` executes → booking is marked `PAID` with no seat release.
- [ ] **Probe E (Offline Resilience)**: Device placed in Airplane Mode → cashier completes cash sale using pre-acquired hold → reconnects → sale flushes to server without data loss.
- [ ] **Probe F (Hardware Print)**: Paper receipt prints on Bluetooth 58mm thermal printer with QR code and company header.
- [ ] **Probe G (i18n Cleanliness)**: French locale exhibits zero mojibake or question marks; English exhibits zero `MoovMove` branding.
