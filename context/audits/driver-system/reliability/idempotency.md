# Reliability Audit: Idempotency & Duplicate Safety

## 1. Idempotency Evaluation

Audits:
1. QR Check-ins: Safe duplicate scans return `alreadyBoarded: true`.
2. Outbox Notifications: Deduplicated via `txIdWithRecipient`.
3. License Expiration: Monthly bucket idempotency keys prevent spam.

---

## 2. Idempotency Invariants

* **`drivers.checkInPassenger`**: Idempotent. Re-scanning an already-boarded ticket does not alter `Booking.boardedAt` or trigger duplicate billing.
* **`drivers.acknowledgeUrgentDispatch`**: Idempotent. Sets `TripDriverAssignment.urgentDispatchAckAt = now()` without altering operational state.
