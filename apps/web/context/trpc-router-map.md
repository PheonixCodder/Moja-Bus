# Web App — tRPC Router Map

Quick reference for all tRPC procedures in `apps/web/trpc/routers/`. Use this when adding new procedures or auditing existing authorization.

---

## Middleware Types
| Middleware | File | Guard |
| :--- | :--- | :--- |
| `publicProcedure` | `trpc/init.ts` | No auth required |
| `protectedProcedure` | `trpc/init.ts` | Better Auth session required |
| `operatorProcedure` | `trpc/init.ts` | Session + valid `companyId` from operator membership |
| `driverProcedure` | `trpc/init.ts` | Session + active `DriverProfile` |
| `adminProcedure` | `trpc/init.ts` | Session + `SUPER_ADMIN` role or specific permission key |

---

## Router Index

| Router File | Router Key | Domain |
| :--- | :--- | :--- |
| `routers/trips.ts` | `trips` | Trip creation, delay, arrival, schedules |
| `routers/bookings.ts` | `bookings` | Booking CRUD, seat holds, cancellations |
| `routers/drivers.ts` | `drivers` | Driver profiles, roster, verification |
| `routers/fleet.ts` | `fleet` | Bus fleet, live locations |
| `routers/routes.ts` | `routes` | Route definitions |
| `routers/passengers.ts` | `passenger` | Passenger flows, trip tracking |
| `routers/payments.ts` | `payments` | Paystack checkout, webhook handling |
| `routers/admin.ts` | `admin` | Admin operations, user management |
| `routers/operators.ts` | `operators` | Operator onboarding, settings |
| `routers/discounts.ts` | `discounts` | Promo codes, vouchers, referrals |
| `routers/notifications.ts` | `notifications` | Outbox worker, subscription |

---

*Update this file when adding new routers or procedures.*
