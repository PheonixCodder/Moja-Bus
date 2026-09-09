# Phase 8 — Notifications

> **Status**: ⬜ Not started  
> **Depends on**: Phase 2 (outbox entries already written in tRPC mutations)  
> **Blocks**: Nothing

---

## Objective

Define the three Novu notification workflows triggered by the booth app, wire up the outbox worker, and add the urban conflict alert to the operator ERP trip detail page in `apps/web`.

---

## 8.1 — New Novu Workflows

Three new workflows must be created. All follow the existing transactional outbox pattern — `NotificationOutbox` rows are written inside `$transaction` and a background worker dispatches them.

---

### Workflow 1: `booth-ticket-created`

**Trigger**: After any booth sale is confirmed (cash or Paystack).

**Channels**: Email only (SMS optional — passenger may not have app yet)

**Recipient**: The passenger (`User.email`)

**Email subject**: `Votre billet Moja Ride — {{bookingReference}}`

**Email body**:
```
Bonjour {{passengerName}},

Votre billet a été enregistré au guichet Moja Ride.

━━━━━━━━━━━━━━━━━
VOTRE BILLET
━━━━━━━━━━━━━━━━━
Référence : {{bookingReference}}
Trajet    : {{originTerminalName}} → {{destTerminalName}}
Départ    : {{departureDate}}
Siège     : {{seatNumber}}
Montant   : {{amountXOF}} XOF
━━━━━━━━━━━━━━━━━

Présentez le QR code ci-dessous à l'embarquement :

[QR CODE IMAGE — {{ticketToken}}]

{{#if isNewAccount}}
────────────────
Votre compte Moja Ride a été créé avec cette adresse e-mail.
Cliquez ici pour définir votre mot de passe et accéder à votre espace :
{{verificationUrl}}
────────────────
{{/if}}

L'équipe Moja Ride
```

**Payload shape** (written to `outboxMessage.payload`):
```typescript
{
  email: string;
  passengerName: string;
  bookingReference: string;
  originTerminalName: string;
  destTerminalName: string;
  departureDate: string; // formatted
  seatNumber: string | null;
  amountXOF: number;
  ticketToken: string;
  isNewAccount: boolean;
  verificationUrl?: string; // Better Auth email verification link
}
```

---

### Workflow 2: `booth-account-created`

**Trigger**: When a new TRAVELER account is created at the booth counter.

**Channels**: Email

**Recipient**: The newly created passenger

**Email subject**: `Bienvenue sur Moja Ride — Activez votre compte`

**Email body**:
```
Bonjour {{passengerName}},

Un compte Moja Ride vient d'être créé pour vous au guichet de {{terminalName}}.

Votre adresse e-mail : {{email}}

Pour accéder à votre compte et gérer vos voyages, définissez votre mot de passe :

[BOUTON : Activer mon compte → {{verificationUrl}}]

Ce lien est valable 48 heures.

Si vous n'avez pas acheté de billet aujourd'hui, ignorez cet e-mail.

L'équipe Moja Ride
```

**Payload shape**:
```typescript
{
  email: string;
  passengerName: string;
  terminalName: string;
  verificationUrl: string; // Better Auth email verification link — generated server-side
}
```

**Note**: The `verificationUrl` must be generated using Better Auth's email verification token API at the time of outbox processing, not at account creation time.

---

### Workflow 3: `booth-urban-conflict`

**Trigger**: When the booth offline sync detects urban trip overbooking.

**Channels**: In-app (operator dashboard) + Email to company MANAGER/ADMIN/OWNER

**Recipient**: All MANAGER/ADMIN/OWNER operators of the company (fan-out by companyId)

**Email subject**: `⚠️ Conflit de capacité — {{tripRoute}} ({{tripDate}})`

**Email body**:
```
Alerte Guichet Moja Ride,

Un conflit de capacité a été détecté suite à des ventes hors ligne.

Trajet : {{tripRoute}}
Date   : {{tripDate}}
Excès  : {{excessCount}} réservation(s) au-delà de la capacité

Agent  : {{staffName}} — Terminal : {{terminalName}}

Consultez le tableau de bord opérateur pour résoudre ce conflit :
[Voir le voyage →]

L'équipe Moja Ride
```

**Payload shape**:
```typescript
{
  companyId: string; // Fan-out to all managers
  tripId: string;
  tripRoute: string;
  tripDate: string;
  excessCount: number;
  staffName: string;
  terminalName: string;
  boothSaleIds: string[];
}
```

---

## 8.2 — Outbox Worker Updates

**File**: Find the existing outbox worker (likely `apps/web/workers/notification-worker.ts` or similar)

Add handlers for the three new workflow IDs:

```typescript
case "booth-ticket-created": {
  const payload = JSON.parse(message.payload) as BoothTicketCreatedPayload;

  // Generate QR code data URL for email embedding
  // (or use a link to the ticket QR page)

  await novu.trigger({
    workflowId: "booth-ticket-created",
    to: { subscriberId: message.recipientId, email: payload.email },
    payload: {
      passengerName: payload.passengerName,
      bookingReference: payload.bookingReference,
      originTerminalName: payload.originTerminalName,
      destTerminalName: payload.destTerminalName,
      departureDate: payload.departureDate,
      seatNumber: payload.seatNumber ?? "Auto-assigné",
      amountXOF: payload.amountXOF.toLocaleString("fr-CI"),
      ticketToken: payload.ticketToken,
      isNewAccount: payload.isNewAccount,
      verificationUrl: payload.verificationUrl ?? null,
    },
  });
  break;
}

case "booth-account-created": {
  const payload = JSON.parse(message.payload) as BoothAccountCreatedPayload;

  // Generate verification URL via Better Auth
  const verificationToken = await auth.api.createEmailVerificationToken({
    userId: message.recipientId,
    redirectTo: `${process.env.APP_URL}/verify-email`,
  });

  await novu.trigger({
    workflowId: "booth-account-created",
    to: { subscriberId: message.recipientId, email: payload.email },
    payload: {
      passengerName: payload.passengerName,
      email: payload.email,
      terminalName: payload.terminalName,
      verificationUrl: verificationToken.url,
    },
  });
  break;
}

case "booth-urban-conflict": {
  const payload = JSON.parse(message.payload) as BoothUrbanConflictPayload;

  // Fan out to all MANAGER/ADMIN/OWNER operators of this company
  const managers = await prisma.operator.findMany({
    where: {
      companyId: payload.companyId,
      role: { in: ["MANAGER", "ADMIN", "OWNER"] },
      isActive: true,
      deletedAt: null,
    },
    include: { user: { select: { id: true, email: true, fullName: true } } },
  });

  for (const manager of managers) {
    await novu.trigger({
      workflowId: "booth-urban-conflict",
      to: { subscriberId: manager.user.id, email: manager.user.email },
      payload: {
        tripRoute: payload.tripRoute,
        tripDate: payload.tripDate,
        excessCount: payload.excessCount,
        staffName: payload.staffName,
        terminalName: payload.terminalName,
        tripLink: `${process.env.APP_URL}/dashboard/operator/trips/${payload.tripId}`,
      },
    });
  }
  break;
}
```

---

## 8.3 — ERP: Urban Conflict Surface in `apps/web`

### Where it shows in the ERP

**A) Operator Trips List** — badge on affected trips:

**File**: Find the trip card component in `apps/web/features/operator/views/` or similar.

Add to the trip card:
```typescript
// If trip has booth_sale records with hasConflict=true, show badge
const hasBoothConflict = trip.boothSales?.some((s) => s.hasConflict);

{hasBoothConflict && (
  <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
    <AlertTriangle className="h-3 w-3" />
    Conflit guichet
  </div>
)}
```

**B) Trip Detail Page** — dismissable warning banner:

**File**: `apps/web/app/[locale]/dashboard/operator/(dashboard)/trips/[tripId]/page.tsx` (or the trip detail view)

Add above the main content area:
```typescript
// Fetch conflicting booth sales for this trip
const conflictSales = await prisma.boothSale.findMany({
  where: { booking: { tripId: params.tripId }, hasConflict: true },
  include: {
    staff: { include: { user: { select: { fullName: true } } } },
    terminal: { select: { name: true } },
  },
});

// In the JSX:
{conflictSales.length > 0 && (
  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3 items-start">
    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
    <div>
      <p className="font-semibold text-amber-800">
        Conflit de capacité guichet hors ligne
      </p>
      <p className="text-amber-700 text-sm mt-0.5">
        {conflictSales.length} réservation(s) excèdent la capacité suite à des ventes
        hors ligne. Agent : {conflictSales[0]?.staff.user.fullName} —
        Terminal : {conflictSales[0]?.terminal.name}
      </p>
      <p className="text-amber-600 text-xs mt-1">
        Examinez les réservations ci-dessous et annulez les excédentaires si nécessaire.
      </p>
    </div>
  </div>
)}
```

**Add to the tRPC operator trips router** — include booth conflict data:

In `apps/web/trpc/routers/trips.ts`, inside the trip detail query, add:
```typescript
boothSales: {
  where: { hasConflict: true },
  select: {
    id: true,
    hasConflict: true,
    conflictDetails: true,
    staffId: true,
    terminalId: true,
    confirmedAt: true,
    staff: { select: { user: { select: { fullName: true } } } },
    terminal: { select: { name: true } },
  },
},
```

---

## 8.4 — Verification Checklist

```bash
# Workflow IDs must match exactly between:
# - outboxMessage.workflowId (written in tRPC mutations)
# - Novu dashboard workflow slugs
# - Worker case statements

# Manual tests:
# 1. Complete a cash sale → email arrives at passenger address with QR ✓
# 2. Create a walk-up account → "Activez votre compte" email arrives ✓
# 3. Force urban conflict (offline + sync) → operator gets conflict email ✓
# 4. Conflict banner shows in ERP trips list ✓
# 5. Conflict banner shows in ERP trip detail ✓
```

---

## 8.5 — Notes

- The `verificationUrl` for `booth-account-created` is generated at **dispatch time** (in the outbox worker), not at account creation time. This ensures the link is always fresh and hasn't expired.
- `booth-urban-conflict` fans out to ALL managers — this is intentional so no one can claim they weren't notified.
- The ERP conflict banner is informational only — operators decide how to resolve (cancel excess bookings manually, contact passengers). There is no automated resolution in v1.
- Do NOT send `booth-account-created` if `passengerAccountCreated = false` (existing user). The mutation already handles this conditional in the outbox enqueue logic.
