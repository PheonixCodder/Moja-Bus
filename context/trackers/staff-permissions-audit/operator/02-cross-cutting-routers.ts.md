# Operator Cross-Cutting tRPC Routers — Security & Catalog-Consistency Audit

Scope: every operator-accessible procedure in the cross-cutting routers + the permission helpers and ground-truth catalog.
Files audited (read in full):
1. `apps/web/trpc/routers/storage.ts`
2. `apps/web/trpc/routers/payments.ts`
3. `apps/web/trpc/routers/schedules.ts`
4. `apps/web/trpc/routers/fleet.ts`
5. `apps/web/trpc/routers/routes.ts`
6. `apps/web/trpc/routers/terminals.ts`
7. `apps/web/trpc/routers/trips.ts`
8. `apps/web/trpc/routers/booking.ts`
9. `apps/web/trpc/routers/wallet.ts`
10. `apps/web/trpc/routers/operator.ts` (+ `operator/settings.ts`, spread in via `operatorSettingsProcedures`)
11. `apps/web/lib/permissions/authorize.ts` (helpers)
12. `packages/schemas/src/permissions.ts` (40-key catalog = ground truth)
13. `apps/web/trpc/init.ts` (procedures: public / protected / operatorProcedure / operatorCompanyProcedure / adminProcedure)

Support files read for correctness: `apps/web/lib/storage/purposes.ts` (purpose registry) and `apps/web/features/payments/services/cancellation-service.ts` (company-scoping of cancels).

Ground-truth catalog (40 keys), transcribed from `permissions.ts`: routes:read/create/update/delete; terminals:read/create/update/delete/geocapture; fleet:read/create/update/delete; schedules:read/create/update/delete; trips:read/create/update/cancel/dispatch; bookings:read/update/cancel/checkin; revenue:view/export; financials:view; withdrawals:view/create; staff:read/invite/update/remove; company:view / profile:update / banking:update / compliance:update / delete; reviews:read/respond. Confirmed `getEffectivePermissions`/`hasPermission`/`assertCanGrant` all operate off this enum.

Middleware semantics (from `init.ts`): `operatorProcedure` = OPERATOR/ADMIN role, **no status/company check**. `operatorCompanyProcedure` = + requires `operator.companyId` and blocks `SUSPENDED`. `protectedProcedure` = any authenticated user, **no operator suspension check**. `adminProcedure` = platform ADMIN role. `operatorHasPermission` (authorize.ts:34-41) short-circuits to `true` for `ctx.user.role === "ADMIN"` and returns `false` for `operator.status === "SUSPENDED"`.

---

## EXECUTIVE FINDINGS (top 3)

1. **IDOR — cross-company read of compliance documents** via `storage.presignDownload` (storage.ts:165-203). Non-ADMIN operators resolve their *own* company permission context but the target `companyDocument` is fetched **without any company scope filter** (storage.ts:166-171). Any staff holding `financials:view` (base templates: FINANCE, TREASURY; plus any custom grant) can request a presigned GET URL for *another* company's private `operator-document` by iterating `documentId`/`objectKey`. Missing `doc.companyId === operator.companyId`.
2. **Dashboard leaks revenue + bookings to read-only staff** via `operator.getDashboardMetrics` (operator.ts:1613-1794). It is gated by `requireAnyPermission(["trips:read","bookings:read","company:view"])`, but unconditionally runs `booking.findMany` (operator.ts:1673-1710) and computes `revenueTodayXOF` from `pricingSnapshot.operatorNetXOF` (operator.ts:1713-1725). Base `SUPPORT` role (trips:read + bookings:read) therefore reads revenue figures and booking-notifications data with no `revenue:view` / `bookings:read` sub-gate.
3. **Catalog-inconsistent cancel / check-in gates.** `operator.checkInBooking` (operator.ts:1196), `bulkCheckInBookings` (1222), `cancelBooking` (1204), `bulkCancelBookings` (1257) are all gated on `bookings:update`, never on the catalog's dedicated `bookings:checkin` / `bookings:cancel`. The same "cancel booking" action is gated differently per router: `payments.cancelBooking` (payments.ts:110-118) requires **both** `bookings:update` AND `bookings:cancel`, while `operator.cancelBooking`/`bulkCancelBookings` require only `bookings:update`.

---

## PER-PROCEDURE GATE TABLE (operator-reachable procedures)

### storage.ts (`storageRouter`)
| Procedure | Lines | Gate | Proc type | Key in catalog? |
|---|---|---|---|---|
| `presignUpload` | 78-142 | `protectedProcedure` + role(iam) + `requirePermission(company:profile:update)` (108-111) | protected | YES |
| `presignDownload` | 148-209 | `protectedProcedure`; `requirePermission(financials:view)` (176-190) | protected | YES (but wrong key — see B/A) |

### payments.ts (`paymentsRouter`)
| Procedure | Lines | Gate | Proc type | Key in catalog? |
|---|---|---|---|---|
| `getCheckoutPricing` | 34-51 | none (`publicProcedure`) | public | n/a |
| `getHoldPricing` | 53-97 | `protectedProcedure` + ownership check (booking.userId === ctx.user.id, 78-90) | protected | n/a (self) |
| `cancelBooking` | 99-136 | `protectedProcedure`; OPERATOR branch `hasPermission(bookings:update) && hasPermission(bookings:cancel)` (110-118) | protected | YES (both) |
| `getPlatformSettings` … `listSettlementHistory` | 138-492 | `adminProcedure` | admin | n/a (not operator) |
| `listBanks` | 494-515 | `publicProcedure` | public | n/a |

### schedules.ts (`schedulesRouter`) — all `operatorCompanyProcedure`
| Procedure | Gate lines | Key(s) | Catalog? |
|---|---|---|---|
| `list` | 333 | schedules:read | YES |
| `get` | 433 | schedules:read | YES |
| `create` | 483 | schedules:create | YES |
| `retire` | 669 | schedules:update | YES |
| `delete` | 702 | schedules:delete | YES |
| `updateBasic` | 749-751 | schedules:update + trips:cancel + trips:dispatch | YES |
| `updateCalendar` | 891-893 | schedules:update + trips:cancel + trips:dispatch | YES |
| `reconcileFutureTrips` | 996-998 | schedules:update + trips:cancel + trips:dispatch | YES |
| `updateFare` | 1046 | schedules:update | YES |
| `addFare` | 1091 | schedules:update | YES |
| `deactivateFare` | 1160 | schedules:update | YES |
| `regenerateTrips` | 1223 | schedules:update | YES |
| `addException` | 1304-1305 | schedules:update + **trips:cancel** (no trips:dispatch) | YES |
| `removeException` | 1465-1466 | schedules:update + **trips:cancel** (no trips:dispatch) | YES |

### fleet.ts (`fleetRouter`) — all `operatorCompanyProcedure`
| Procedure | Gate | Key |
|---|---|---|
| `getBusTypes` | 12 | fleet:read |
| `getPermissions` | — | none (returns booleans) |
| `getLayoutTemplates` | 35 | fleet:read |
| `getCustomLayouts` | 52 | fleet:read |
| `getBuses` | 69 | fleet:read |
| `getBusDetails` | 103 | fleet:read |
| `createBus` | 123 | fleet:create |
| `updateBus` | 234 | fleet:update |
| `deleteBus` | 297 | fleet:delete |
| `toggleSeatStatus` | 365 | fleet:update |
| `createCustomLayout` | 474 | fleet:create |
| `deleteCustomLayout` | 539 | fleet:delete |
| `createBusType` | 579 | fleet:create |
| `deleteBusType` | 614 | fleet:delete |

### routes.ts (`routesRouter`) — all `operatorCompanyProcedure`
list=12 routes:read · getCities=30 requireAnyPermission(routes:read, terminals:read) · get=40 routes:read · create=65 routes:create · update=199 routes:update · delete=461 routes:delete. All company-scoped (`companyId: ctx.companyId`). **Consistent.**

### terminals.ts (`terminalsRouter`) — all `operatorCompanyProcedure`
list=40 terminals:read · create=65 terminals:create · update=120 terminals:update · delete=234 terminals:delete. All company-scoped. **Consistent.** (`terminals:geocapture` is NOT used here.)

### trips.ts (`tripsRouter`) — all `operatorCompanyProcedure`
create=25 trips:create · list=168 trips:read · statusCounts=314 trips:read · get=335 trips:read · getManifest=413 trips:read · getSeatMap=480 trips:read · assignBus=510 trips:update · delay=718 trips:update · cancel=880 trips:cancel · updateStatus=923 trips:update · updateNotes=1082 trips:update · setGate=1098 trips:update · toggleSingleTripSeatStatus=1184 trips:update. All company-scoped. **Consistent.** (`trips:dispatch` never used here — only in schedules.ts.)

### booking.ts / wallet.ts — passenger-facing
Every procedure is `publicProcedure`/`protectedProcedure` with **own-user** scope (hold ownership via `assertHoldOwnedByUser`, booking by `userId`, wallet by `userId`). No operator-company data read/written. Notably `getTicketByToken` (booking.ts:206-211) is **public** and returns a full ticket given only the ticket token — token is a bearer secret (intended for ticket sharing), but is the only passenger PII exposure with no auth and no ownership check; acceptable by design, flagged for completeness.

### operator.ts (`operatorRouter`) + settings.ts (`operatorSettingsProcedures`)
| Procedure | Gate | Dec |
|---|---|---|
| `checkAccountStatus` | public (88) | enumeration (see A) |
| `initSignup` | public | n/a |
| `getOnboardingStatus` | operatorProcedure **only, no key** (143) | **wrong/missing key (see A)** |
| `completeOnboarding` | 257 company:profile:update | |
| `resubmitVerification` | 375 company:profile:update | |
| `validateSlug` | operatorCompanyProcedure **no key** (446) | minor |
| `saveOnboardingStep` | 458 company:profile:update (**multiplexes BANK+COMPLIANCE**) | **wrong key (see A)** |
| `reopenOnboardingStep` | 943 company:profile:update | |
| `getShellContext` | operatorCompanyProcedure **no key** (994) | deliberate (comment) |
| `…operatorSettingsProcedures` | settings.ts | see below |
| `logOnboardingEvent` | operatorCompanyProcedure **no key** (1031) | own-scope, ok |
| `listBookings` | 1056 bookings:read | |
| `globalSearch` | 1065, per-section `operatorHasPermission` (bookings:read / trips:read / staff:read) | |
| `exportBookingsCsv` | 1159 **revenue:export** | PII export gate → debatable |
| `getBooking` | 1188 bookings:read | |
| `checkInBooking` | 1196 **bookings:update** | **should be bookings:checkin** |
| `cancelBooking` | 1204 **bookings:update** | **should include bookings:cancel** |
| `bulkCheckInBookings` | 1222 bookings:update | should be bookings:checkin |
| `bulkCancelBookings` | 1257 bookings:update | should include bookings:cancel |
| `listReviews` | 1293 reviews:read | |
| `respondToReview` | 1343 reviews:respond (+ companyId scope) | |
| `getRevenueAnalytics` | 1362 revenue:view | |
| `getLedgerEntries` | 1518 revenue:view | |
| `exportLedgerCsv` | 1577 **revenue:view** | **should be revenue:export** |
| `getDashboardMetrics` | 1616 requireAnyPermission(trips:read,bookings:read,company:view) | **revenue/booking leakage (see A)** |
| `getSnapshotTimeSeries` | 1808 revenue:view | |
| `getAccountSnapshot` | 1845 revenue:view | |
| `getWithdrawalControls` | 1874 withdrawals:view | |
| `requestWithdrawalChallenge` | 1893 withdrawals:create | |
| `requestWithdrawal` | 1937 withdrawals:create | company-scoped (ctx.companyId) |
| `listWithdrawals` | 2319 withdrawals:view | company-scoped |

settings.ts (`operatorSettingsProcedures`):
| Procedure | Gate | Dec |
|---|---|---|
| `getSettings` | 39 company:view | masked, ok |
| `updateCompany` | 83 company:profile:update | |
| `updateProfile` | 122 **no key** | own profile, ok |
| `updateBankAccount` | 159 company:banking:update | company-scoped |
| `updateBank` | 244 requireOwner | @deprecated |
| `revealBankAccount` | 358 company:view + OWNER role | @deprecated; full account number |
| `listBankAccounts` | 590 requireAnyPermission(company:view, financials:view) | masked |
| `addBankAccount` | 412 company:banking:update | |
| `setDefaultBankAccount` | 469 requireOwner | @deprecated |
| `deleteBankAccount` | 509 requireOwner | OK but not banking:update |
| `addDocument` | 538 company:compliance:update | |
| `deleteDocument` | 564 company:compliance:update | |

---

## A. Procedures a low-privilege operator (e.g. SUPPORT) can reach that read/write sensitive/other-company data with a no/wrong key (IDOR / escalation)

1. **`storage.presignDownload` — cross-company IDOR on compliance documents** (storage.ts:165-203).
   `companyDocument.findFirst` (166-171) is scoped only by `documentId`/`objectKey`, **not by the requesting operator's company**. The non-admin permission context is built from the caller's operator (176-190 `financials:view`), but the returned presigned GET URL is for `doc.objectKey` (199-202) — potentially another company's private document. Any `financials:view` holder (base SUPPORT? no — but FINANCE/TREASURY and any custom grant, incl. an ADMIN-role fallback at 177-187) can retrieve spec documents by guessing IDs/keys. **Fix: require `doc.companyId` to equal the caller's company (ADMIN exempt).**

2. **MED: `operator.getOnboardingStatus` — reads company legal + masked bank + compliance doc metadata with no key** (operator.ts:143-254). It is `operatorProcedure` (no `company:view`, no company-required, no SUSPENDED check), pulls the full `company` row (registrationNumber, taxId, legal), `company.bankAccounts` (masked), and `documents` (metadata incl. expired/superseded). Base SUPPORT (no `company:view`) can read all of it. **Key missing.**

3. **MED: `operator.getDashboardMetrics` — revenue + booking disclosures to read-only staff** (operator.ts:1613-1794). Gated by `requireAnyPermission(["trips:read","bookings:read","company:view"])` but unconditionally reads booking lists, hold-group pricing snapshots, and derives `revenueTodayXOF` (1713-1725). SUPPORT (trips:read+bookings:read) surfaces revenue/booking activity without `revenue:view`. **Sub-gate `revenue:view` + `bookings:read` by data read.**

4. **MED/HIGH (banks/payouts) — `operator.saveOnboardingStep` multiplexes BANK + COMPLIANCE writes under a single `company:profile:update`** (operator.ts:458; BANK branch 668-822, DOCUMENTS branch 613-667). Any holder of `company:profile:update` (base: OWNER/ADMIN) can:
   - rewrite/create `bankAccount` rows (714-798), register a new Paystack transfer recipient (686-702), and update `company.paystackTransferRecipientCode` (793-798) — all **without `company:banking:update`**; and
   - create PENDING `companyDocument` compliance rows (624-643) **without `company:compliance:update`**.
   Catalog-consistency gap: onboarding re-anchors vault-grade ops on the wrong key. Prefer per-step gates (banking:update / compliance:update).

5. **REF — Same-action cancel is gated inconsistently across routers.** `payments.cancelBooking` requires `bookings:update` AND `bookings:cancel` (payments.ts:110-118); `operator.cancelBooking` (1204) and `bulkCancelBookings` (1257) require only `bookings:update`. Escalation is *of-privilege* (a `bookings:update`-only grants can cancel, which the operator.ts path allows but the payments path forbids). Company scoping is enforced in `CancellationService.cancelBooking` (cancellation-service.ts:39-42: `isCompanyStaff = userCompanyId && booking.companyId === userCompanyId`), so no cross-company cancel; the defect is the weaker key on the operator router surface.

6. **LOW — Suspended-operator bypass via `protectedProcedure` routers.** `payments.cancelBooking` uses raw `hasPermission(role, perms, key)` without reading `operator.status` (payments.ts:110-118) and `storage.presignUpload`/`presignDownload` resolve the operator but the cancellation path never consults suspension. `operatorCompanyProcedure` blocks SUSPENDED, but these two routers do not. Low probability (stored perms still needed) but inconsistent with init.ts:201.

7. **MIN — `operator.checkAccountStatus` public account/role enumeration** (operator.ts:88-104): unauthenticated identifier probe reveals `{exists, role}` by email/workEmail/phone. Not an operator-permission defect, but a privacy/abuse-surface finding.

8. **MIN — `storage.presignUpload` honors client-supplied `staffId` for `operator-profile-photo`** (storage.ts:93-95, defaulted only when absent at 116-118). Object key = `assets/{companyId}/staff/{staffId}.webp` — public + singleton (purposes.ts:73-82). A caller with `company:profile:update` can overwrite another staff member's public avatar within the same company. Within-company integrity, low severity; company is **not** spoofable (overwritten at 115).

9. **MIN — `operator.validateslug` reads global company slug registry with no permission** (operator.ts:446-453). Slug enumeration only; low.

No true cross-company write was found in the ledger/withdrawal paths: `requestWithdrawal` (1937), `listWithdrawals` (2319), `getLedgerEntries` (1518), `getRevenueAnalytics` (1362) all derive `ctx.companyId` from the operator profile and pass it into `getOperatorReceivableAccount(companyId)` — company-scoped. `listBankAccounts` (settings:390) and `updateBankAccount` (settings:412/159) scope `bankAccount.findFirst({companyId: ctx.companyId})`. `deleteDocument`/`addDocument` scope by companyId. So those are not escalated.

## B. Storage purpose → permission mapping

There is **no single purpose→permission mapping**. The registry (`lib/storage/purposes.ts:29-103`) carries only `iam: "passenger" | "operator" | "admin"` + `visibility`, **no permission key**. Enforcement is special-cased inside the router:

- `storage.ts:108-111` — **every** operator write-purpose (`operator-document`, `operator-logo`, `operator-profile-photo`) is gated on `company:profile:update` regardless of purpose.
- `storage.ts:176-190` — `operator-document` **download** is gated on `financials:view` (specifically for reads of compliance docs), i.e. a different key than the write path.

Catalog-inconsistency: writing a compliance doc requires `company:profile:update` (upload) **and** `company:profile:update` again via settings.addDocument effectively `company:compliance:update` (settings.ts:538) — so the upload and the DB write use different keys; downloads use `financials:view`. No dedicated storage key exists in the catalog. Recommend (a) adding `company:compliance:update` for `operator-document`, `company:workProfile:update` or `staff` key for `operator-profile-photo`, `company:view` for downloads, and (b) centralizing the purpose→key map beside the registry.

## C. Catalog keys NEVER referenced by any server gate in these files

Within the borders of these 13 files (+ settings):
- `terminals:geocapture`
- `bookings:checkin` (checkin endpoints are gated on `bookings:update`)
- `bookingscancel` — see A#5 (only referenced in `payments.cancelBooking`)
- `staff:invite`
- `staff:update`
- `staff:remove`
- `company:delete`

Of these, grep over `apps/web/trpc` shows `terminals:geocapture`, `bookings:checkin`, and `company:delete` are **never referenced by any server gate anywhere in `apps/web/trpc`** (only in unit tests `lib/__tests__/permissions/authorize.test.ts`, `lib/__tests__/staff-iam.test.ts`). That is the truest "dead catalog surface": three keys that exist in the catalog but have **zero** production gate.
`staff:invite/update/remove` are live in `trpc/routers/staff.ts` (221/255/309/355/609/757/808/942) — dead only in the audited cross-cutting routers.

## D. Gates referencing keys NOT in the catalog

**None found and, structurally, none possible.** All gate helpers are typed on `PermissionKey` (`requirePermission`, `requireAnyPermission`, `operatorHasPermission`) and the arguments are string-literal keys that must satisfy `PermissionKey` at compile time (packages/schemas/src/permissions.ts:89-95). `payments.ts` imports `hasPermission` from `@moja/schemas` (typed). No hardcoded untyped strings and no `as any` on permission keys (the `as any` casts found are on role enums / Prisma inputs, not permission keys). `authorize.ts` has no string-key bypass.

## E. TODO/FIXME/@deprecated/dead code in these files

- `settings.ts:240` — `/** @deprecated ... */` on `updateBank`
- `settings.ts:354` — `/** @deprecated ... */` on `revealBankAccount` (still live; exposes full account number under `company:view` + OWNER)
- `settings.ts:465` — `/** @deprecated ... */` on `setDefaultBankAccount`
- `init.ts:11-77` — leftover **debug/diagnostic** auth instrumentation (console.warn session-diagnostics, a direct DB `session.findUnique` probe at 46-71, and a retry call at 73-84) that is effectively no-op/dead debugging and logs cookie/session internals. Should be removed before prod.
- No `TODO`/`FIXME` markers were found in any of the 13 files (grep for `TODO|FIXME|@deprecated|XXX|HACK`).

## F. Company-edit gates: stale `company:update` vs fine-grained keys

**Yes — `company:profile:update` / `company:banking:update` / `company:compliance:update` are the only company-edit keys used.** A repo-wide grep for the literal `company:update` (old umbrella key) returns **zero** matches in `apps/web`. All company mutations in settings.ts / operator.ts are gated by the three fine-grained keys (banking:update, compliance:update, profile:update) plus `company:view` for reads. No stale `company:update`.

**Nuance (catalog consistency):** the *onboarding* path (`operator.saveOnboardingStep`, operator.ts:457) and `reopenOnboardingStep` (943) gate everything, including banking writes and compliance-doc creation, on `company:profile:update` only — the fine-grained keys exist but are not applied there. settings.ts does apply them correctly (`addDocument`/`deleteDocument` → compliance:update; `updateBankAccount`/`addBankAccount` → banking:update). So the fine-grained model is "mostly" adopted, with onboarding as the one over-broad reducer. `operator.checkAccountStatus`/withdrawal init runs under the own-company context so is not a company-edit.

## G. Procedures that should be gated but are only `protectedProcedure` / operatorCompanyProcedure / public

- **`operator.getOnboardingStatus`** (operator.ts:143) — operatorProcedure only, returns company legal + masked banking + compliance metadata. Should be `operatorCompanyProcedure` + `company:view`.
- **`operator.getDashboardMetrics`** (operator.ts:1613) — `requireAnyPermission(…)` is too weak for the revenue/booking data it reads; needs `revenue:view` sub-gate for `revenueTodayXOF` and `bookings:read` for the booking queries.
- **`operator.validateSlug`** (operator.ts:446) — operatorCompanyProcedure with no key (GLO-BAL read on company slug registry). Add a permission or drop to a harmless public check.
- **`settings.updateProfile`** (settings.ts:122) — operatorCompanyProcedure with no key; own-profile PII update (DOB, national ID). Own scope → acceptable, but note it.
- **`fleet.getPermissions`** (fleet.ts:24) — no key; returns booleans only, acceptable.
- **`payments.getHoldPricing`** (payments.ts:53) — `protectedProcedure` + **ownership check**; correctly gated (not escalatable) — no change.
- **`booking.getTicketByToken`** (booking.ts:208) — `publicProcedure` returning a full ticket by token. This is the single `public` procedure that returns passenger PII (owned+departure, passenger name/phone) in these files; it's a bearer-token design but flag for rate-limiting/review.
- **`operator.checkAccount`** (operator.ts:88) — `publicProcedure`, enumeration — see A#7.
- **`storage.presignUpload`/`presignDownload`** are `protectedProcedure` with inline role + IAM + suspension-respecting `requirePermission`; the gap is **not** "protected vs public" but the specific keys chosen (see A/B).

---

## Verified-good areas (for the record)
- routes/terminals/fleet/trips create/update/delete + read: all `operatorCompanyProcedure` + correct catalog key + company-scoped reads/writes. No cross-company.
- Schedule cancel-triggering updateBasic/updateCalendar/reconcileFutureTrips each require `trips:cancel` (and `trips:dispatch`) in addition to `schedules:update` — correct intent. (But `addException`/`removeException`, which also trigger cancels via `cancelTripWithRefunds`/`reconcileScheduleTrips`, require only `schedules:update`+`trips:cancel` and omit `trips:dispatch` — a consistency miss, not a security hole.)
- Withdrawals (`requestWithdrawal`, `requestWithdrawalChallenge`, `listWithdrawals`) correctly double-gated on `withdrawals:create/:view` and hardened with 2FA (F-18), idempotency, row-locking, frequency, and reversal-safe error handling.
- `CancellationService` enforces `companyId === userCompanyId` (cancellation-service.ts:39) — so cancel can't cross company even when the router-level gate is the weaker `bookings:update`-only.