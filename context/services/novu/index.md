# Novu — Moja Ride Notification Integration

**Package**: `@novu/node` (server), `@novu/react` (web inbox)  
**Docs Folder**: `context/services/novu/` (contains event files per audience)  
**Pattern**: All notification triggers flow through the **Transactional Outbox** — never fire `novu.trigger()` directly inside user-facing request handlers.

---

## 1. Outbox Pattern (REQUIRED)

```
User Action → tRPC Router → $transaction {
  Core DB Mutation,
  NotificationOutbox.create(type, payload, recipientId, txId)
} → Outbox Worker (every ~1 min) → novu.trigger(workflowId, payload)
```

> [!CAUTION]
> Never call `novu.trigger()` directly inside a tRPC mutation or Next.js API handler. Always enqueue through the outbox table.

---

## 2. Subscriber Identity

Every Novu subscriber is identified by **`user.id`** (UUID string) — NOT by email or phone. This is a platform-wide ruling to ensure proper channel routing when a user changes their email/phone.

```ts
await novu.trigger({
  workflowId: "passenger-booking-confirmed",
  to: { subscriberId: booking.userId },   // ← Always user.id
  payload: { ... },
});
```

---

## 3. Workflow Index

| Workflow ID | Trigger Event | Audience | Channels |
| :--- | :--- | :--- | :--- |
| `passenger-booking-confirmed` | Booking created | Passenger | Email, In-App, Push |
| `passenger-trip-cancelled` | Trip/booking cancelled | Passenger | Email, In-App, Push |
| `passenger-trip-delayed` | Trip delay recorded | Passenger | Push, In-App |
| `driver-dispatch-urgent` | Urgent dispatch offer | Driver | Push |
| `operator-driver-verified` | Driver verification complete | Operator | Email, In-App |
| `operator-bank-verified` | Bank account verified | Operator | Email |
| `operator-conflict-alert` | Scheduling conflict | Operator | Email, In-App |

See individual event files in this folder for full payload schemas.

---

## 4. Transaction ID Deduplication

Use day-bucketed, recipient-scoped transaction IDs to prevent same-day duplicate sends:
```ts
const txId = `${type}-${recipientId.slice(0, 8)}-${toDateKey(new Date())}`;
```

---

## 5. Outbox Contract Files
- `admin-events.md` — Admin notification payloads
- `auth-events.md` — OTP, verification notifications
- `operator-events.md` — Operator-facing notices
- `passenger-events.md` — Passenger journey notifications
- `payment-events.md` — Payment, refund, escrow notifications
