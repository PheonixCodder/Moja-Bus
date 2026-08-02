# Operator Onboarding Fix Tracker

Findings from a full review of the operator onboarding pipeline: signup → Better Auth hooks → 5-step onboarding → finalize → admin verification → notifications. All issues listed below were verified against the current code.

---

## Legend

- **BUG** — incorrect behavior that breaks or misleads the user flow
- **DEAD** — unused / orphaned / unreachable code
- **MISSING** — feature expected by the flow that was never implemented
- **INCONSISTENT** — conflicting rules between UI, server, and schema

---

## A. Client-side bugs

### A1. BankStep prefill and "Bank details added" indicator never work
- **Type:** BUG
- **Files:** `apps/web/features/operator/components/onboarding/bank-step.tsx:45,61`
- **Issue:** `hasBankDetails = Boolean(initialData?.company?.bankAccount)` and the prefill effect read `initialData.company.bankAccount` (singular). The `Company` model and `getOnboardingStatus` only expose `bankAccounts: BankAccount[]` (plural), so the value is always `undefined`.
- **Impact:** Returning to the BANK step never prefills the form, and the two-stage verification card always shows "Bank details added" as pending even after saving.
- **Fix:** Read `initialData?.company?.bankAccounts?.[0]` (and handle the masked `accountNumber` containing `•`).
- **Status:** ✅ FIXED (2026-08-01) — `hasBankDetails` and the prefill effect now read `initialData?.company?.bankAccounts?.[0]`; the existing `•`-mask handling stays.

### A2. Back-navigation on the roadmap does nothing
- **Type:** BUG
- **Files:** `apps/web/features/operator/hooks/useOperatorOnboarding.ts:136-154`
- **Issue:** `goToStep` for a completed step (`targetIndex < currentIndex`) shows a confirm dialog, logs a `STEP_SKIPPED` event, and invalidates the query — but the server derives `currentStep` from `completedSteps`, so the step never changes. The confirm dialog promises a state change that never happens.
- **Impact:** Completed-step buttons look clickable but are dead. Users cannot go back to edit a completed step.
- **Fix options:** (a) allow re-opening a step server-side (e.g. `saveOnboardingStep` with a `reopen` flag), or (b) disable completed-step buttons with a "re-save from settings" tooltip.
- **Status:** ✅ FIXED (2026-08-01) — option (a): new `operator.reopenOnboardingStep` mutation removes the target step from `completedSteps` (recomputes `currentStep`, resets `onboardingStatus` to `IN_PROGRESS` if it was `COMPLETED`); `goToStep` now awaits it after the confirm dialog, then invalidates `getOnboardingStatus` so the roadmap actually moves back. Re-saving the reopened step returns the operator to the next incomplete step (their previous position). Step `onBack` buttons (`onboarding-view.tsx:150,160,169,178`) benefit automatically.

### A3. PROFILE step full name never prefills
- **Type:** BUG
- **Files:** `apps/web/features/operator/components/onboarding/profile-step.tsx:74`
- **Issue:** Prefill reads `initialData.user?.fullName` / `initialData.operator?.user?.fullName`, but neither `getOnboardingStatus` (`trpc/routers/operator.ts:146-158`) nor `saveOnboardingStep`'s result includes the `user` relation on Operator.
- **Impact:** Returning to PROFILE step shows an empty name field.
- **Fix:** Add `user: { select: { fullName: true } }` to the operator include, or pass `fullName` from the session.

### A4. Orphaned `LocationsStep` component
- **Type:** DEAD
- **Files:** `apps/web/features/operator/components/onboarding/locations-step.tsx` (whole file); `packages/schemas/src/operator.ts:51-77` (`locationSchema`, `locationsStepSchema`)
- **Issue:** Component and schemas exist but `LOCATIONS` is not in `onboardingStepValues` (`packages/schemas/src/operator.ts:134-141`), is not rendered in `operator-onboarding-view.tsx`, and `saveOnboardingStep` has no LOCATIONS branch. Locations are only captured later on the Terminals page.
- **Impact:** Dead code + wasted `routes.getCities` prefetch in `onboarding/page.tsx:16` (only this component uses it).
- **Fix:** Either wire locations as a 6th step (schema enum + STEP_ORDER + view + router branch + progress total) or delete the component and schema.

### A5. `errorCode` prop on login page is ignored
- **Type:** DEAD
- **Files:** `apps/web/app/[locale]/(auth)/operator/login/page.tsx:23`; `apps/web/features/auth/views/operator-login-view.tsx:8-40`
- **Issue:** Login page passes `errorCode={params.error}` but the view never renders it — no error banner exists on the operator login page.
- **Fix:** Render the error, or remove the prop.

---

## B. Server-side bugs

### B1. Unreachable "no operator" branch in `getOnboardingStatus`
- **Type:** DEAD (edge case)
- **Files:** `apps/web/trpc/routers/operator.ts:164-180`; `apps/web/trpc/routers/init.ts:115-120`
- **Issue:** `operatorCompanyProcedure` middleware throws FORBIDDEN ("Operator profile or company not found.") before the query body runs when no operator profile exists, so the `operator: null` / `NOT_STARTED` return is unreachable.
- **Impact:** If the Better Auth `user.create.after` hook ever fails (or a user becomes OPERATOR via another path), the onboarding page crashes with a FORBIDDEN error instead of showing the empty state.
- **Fix:** Changed `getOnboardingStatus` to use `operatorProcedure` instead of `operatorCompanyProcedure` so the query body runs even when no operator profile exists. The existing `if (!operator)` branch (returning NOT_STARTED) is now reachable, making the onboarding page tolerant of missing profiles. This also resolves the D2 welcome-page redirect-loop risk (the crash path is eliminated).
- **Status:** ✅ FIXED (2026-08-01)

### B2. `saveOnboardingStep` COMPANY step can 500 on duplicate workEmail
- **Type:** BUG
- **Files:** `apps/web/trpc/routers/operator.ts:592-595`
- **Issue:** `user.update({ workEmail: companyData.email })` has no P2002 (unique) handling, unlike the company fields which map P2002 to a CONFLICT error (`operator.ts:552-565`). `User.workEmail` is `@unique`.
- **Impact:** Raw 500 when another operator already claimed that email as their work email.
- **Fix:** Wrap the user update in the same try/catch P2002 → CONFLICT handling.
- **Status:** ✅ FIXED (2026-08-01) — `tx.user.update` is now wrapped in a try/catch that catches `PrismaClientKnownRequestError` with code `P2002` and throws `TRPCError` `CONFLICT` with a friendly message ("This email is already used by another operator account."). The transaction still rolls back on conflict (consistent with the company P2002 handling), so the operator sees the error and can correct the email.

### B3. Document `expiresAt` never persisted
- **Type:** BUG
- **Files:** `packages/schemas/src/operator.ts:87`; `apps/web/trpc/routers/operator.ts:605-632`
- **Issue:** `documentSchema` supports `expiresAt` (for permits/insurance) but the DOCUMENTS branch ignores it when creating `CompanyDocument`.
- **Impact:** Expiry-based document review/reminders (`CompanyDocument.expiresAt`, `reminderSentAt`) can never be populated from onboarding.
- **Fix:** Pass `expiresAt: doc.expiresAt ?? null` in the `CompanyDocument.create` data.
- **Status:** ✅ FIXED (2026-08-01) — `expiresAt` is now persisted when an operator uploads a document with an expiry date (permits, insurance).

### B4. Required documents mismatch: UI 4 vs server 2
- **Type:** INCONSISTENT
- **Files:** `apps/web/features/operator/components/onboarding/documents-step.tsx:53-96` (requires BUSINESS_REGISTRATION_CERTIFICATE, TAX_CLEARANCE_CERTIFICATE, TRANSPORT_OPERATING_PERMIT, INSURANCE_CERTIFICATE); `apps/web/trpc/routers/operator.ts:305` (requires only BUSINESS_REGISTRATION_CERTIFICATE + TRANSPORT_OPERATING_PERMIT)
- **Impact:** API callers can finalize with 2 docs; UI forces 4. Server should match the UI (or vice versa) so the finalize check reflects the actual compliance policy.

### B5. `maskOperatorCompanyBank` relies on singular `company.bankAccount`
- **Type:** INCONSISTENT
- **Files:** `apps/web/trpc/routers/operator.ts:69-71`
- **Issue:** Masks `op.company.bankAccount` if present, but the schema only has `bankAccounts[]`. Harmless today (no singular field exists) but masks intent; keep as-is or clean up to `bankAccounts` only. (Root cause of A1 lives here / in the include.)

---

## C. Signup-flow bugs (Better Auth)

### C1. Phone-first operator signup keeps the temp guest email as primary email
- **Type:** BUG (high impact)
- **Files:** `apps/web/lib/auth-server.ts:169-179` (databaseHooks.user.create.before)
- **Issue:** For phone-first signups, `user.email` is the phone plugin's temp `+225xxxxxxxx@guest.mojaride.ci`. The hook keeps `email: user.email || pending.email`, so the temp address stays the user's primary email; the real email lives only in `workEmail`.
- **Impact:**
  - `operator-welcome` (Novu) is sent to `user.email` → the temp guest address → undeliverable for phone-first signups (`auth-server.ts:236-251`).
  - Later email-OTP sign-in (`authClient.signIn.emailOtp`) resolves users by primary email → phone-first operators cannot log in with email; worse, if the email OTP plugin auto-creates missing users, a duplicate TRAVELER account could be created.
- **Fix:** Use `email: pending.email` (the collected real email) unconditionally in the before hook.
- **Status:** ✅ FIXED (2026-08-01) — `auth-server.ts` before hook now sets `email: pending.email` unconditionally; combined with K1 (details button gate) a real email is always collected on step 2.

### C2. `initSignup` writes a dummy OTP hash that is never used
- **Type:** DEAD
- **Files:** `apps/web/trpc/routers/operator.ts:118-122`
- **Issue:** `otpHash` is a sha256 of a random UUID; Better Auth owns OTP generation/verification. `PendingOperatorSignup.otpHash` / `attempts` / `expiresAt` are never consumed (except delete-on-create in the hook).
- **Impact:** Confusing dead state; transient rows also never get cleaned up when the user abandons signup.
- **Fix:** Drop the hash fields from the model or add a cleanup job for expired pending signups.

### C3. `verifySignupOtp` / `completeSignup` schemas imported but procedures never defined
- **Type:** DEAD
- **Files:** `apps/web/trpc/routers/operator.ts:16-17`; `packages/schemas/src/operator.ts:182-191`
- **Issue:** `verifySignupOtpSchema` and `completeSignupSchema` are imported into the operator router but no procedures use them (superseded by Better Auth email OTP + DB hooks).
- **Fix:** Remove imports + schemas, or implement as thin wrappers if kept for compatibility.

### C4. `checkAccountStatus` only matches on email — phone signups with a different email leak
- **Type:** INCONSISTENT
- **Files:** `apps/web/trpc/routers/operator.ts:86-102`
- **Issue:** Email lookup covers `email` OR `workEmail`; phone lookup only `phoneNumber` (not `workPhone`). A phone-first operator's signup identifier (`phone`) is found, but the email path is the primary route for most users — after C1, an operator whose primary email is the temp guest address will be treated as "new" when they later enter their real email.
- **Fix:** After C1, `workEmail` should be consulted in the email OR — or drop the fallback once the before-hook fix lands.

---

## D. Gating / navigation

### D1. Operator dashboard sub-pages are not gated on onboarding completion
- **Type:** INCONSISTENT (by design?)
- **Files:** `apps/web/app/[locale]/dashboard/operator/(dashboard)/layout.tsx` — only checks role; `apps/web/app/[locale]/dashboard/operator/(dashboard)/page.tsx:26-28` — root page redirects to onboarding if not COMPLETED
- **Issue:** Fleet/Routes/Schedules/Trips/Terminals/Staff pages are reachable pre-completion. The welcome page text ("What you can set up now") implies this is intentional, but nothing in the sidebar or header nudges incomplete operators back to onboarding.
- **Decision needed:** Either document as intended, or gate sub-pages (or show an onboarding banner) until `onboardingStatus === "COMPLETED"`.

### D2. Welcome page redirect loop risk
- **Type:** BUG (edge) — resolved by B1 fix
- **Files:** `apps/web/app/[locale]/dashboard/operator/welcome/page.tsx:40-42`
- **Issue:** If `completeOnboarding` sets `onboardingStatus: COMPLETED` but `completedSteps` is somehow empty/stale, `getOnboardingStatus` still returns COMPLETED (reads the operator field), so this is currently safe. The redirect loop risk was only a concern if `getOnboardingStatus` crashed (which it would for missing operator). Now that B1 makes `getOnboardingStatus` tolerant of missing profiles, the crash path is eliminated.
- **Fix:** B1 fix (change `getOnboardingStatus` to use `operatorProcedure`) resolves the crash path that would cause a redirect/crash cycle. Both welcome and dashboard pages consistently use `operator.onboardingStatus` for their redirect gates.
- **Status:** ✅ RESOLVED (2026-08-01) — by B1 fix

---

## E. Notifications

### E1. `operator-welcome` email goes to primary email — broken for phone signups
- **Type:** BUG (same root cause as C1)
- **Files:** `apps/web/lib/auth-server.ts:236-251`
- **Issue:** `novu.trigger({ to: { subscriberId: user.id, email: user.email } })` — for phone-first signups `user.email` is the temp guest address.
- **Fix:** Send to `pending.email` (real collected email) instead.
- **Status:** ✅ FIXED (2026-08-01) — `operator-welcome` trigger now sends to `pending.email` (`auth-server.ts` after hook); also guaranteed correct by C1.

### E2. `admin-operator-signup-pending` email link is hardcoded to production domain
- **Type:** INCONSISTENT
- **Files:** `apps/web/features/notifications/workflows/admin/operator-signup-pending.ts:30` uses `https://mojaride.com/dashboard/admin/verification` while `operator-welcome.ts:25` correctly uses `payload.dashboardUrl`.
- **Fix:** Pass `dashboardUrl` (APP_URL) in the payload from `completeOnboarding` / `resubmitVerification` triggers (`trpc/routers/operator.ts:354-375, 424-445`).

### E3. `operator/` workflows folder is passenger-facing
- **Type:** DEAD (naming)
- **Files:** `apps/web/features/notifications/workflows/operator/*.ts`
- **Issue:** Files in the `operator/` folder (`trip-boarding`, `trip-cancelled`, `trip-delayed`, `trip-gate-updated`, `review-request`) are all **passenger** workflows; only `bus-assigned.ts` is operator-facing. Registration in `workflows/index.ts` is correct, but the folder name is misleading.
- **Fix:** Rename folder to `passenger-trips/` or split accordingly.

---

## F. Schema / infra notes

### F1. No committed Prisma migrations
- **Files:** `packages/db/package.json` — only `prisma db push`; no `migrations/` directory exists in `packages/db/prisma`.
- **Impact:** All onboarding models (`OperatorOnboarding`, `OperatorOnboardingEvent`, `PendingOperatorSignup`, etc.) exist in schema but there is no migration history or downgrade path.
- **Fix:** Consider `prisma migrate dev` to commit an initial baseline migration.

### F2. `PendingOperatorSignup` rows never expire/clean up
- **Type:** DEAD
- **Files:** `packages/db/prisma/schema.prisma:620-637` (`expiresAt` exists)
- **Issue:** Abandoned signups leave rows forever; no cron/cleanup consumes `expiresAt`.
- **Fix:** Periodic deletion of `expiresAt < now` rows (or reuse an existing job runner).

### F3. `OperatorOnboarding.lastSeenAt` is never updated by the client
- **Type:** DEAD
- **Files:** `packages/db/prisma/schema.prisma:593` (`lastSeenAt @updatedAt`)
- **Issue:** No procedure touches `lastSeenAt` after creation (only `getOnboardingStatus` reads it via the relation include indirectly). The field only changes on `operatorOnboarding.update` calls that happen on step save — acceptable, but no heartbeat/abandonment tracking exists despite `ABANDONED` event type.
- **Fix:** Optional: ping `lastSeenAt` on `getOnboardingStatus` or log `ABANDONED` events after inactivity.

---

## H. Login flow → onboarding handoff (user-reported, confirmed)

### H1. "Your onboarding is already complete" toast on a fresh operator
- **Type:** BUG
- **Files:** `apps/web/features/operator/hooks/useOperatorOnboarding.ts:51-56`; `apps/web/app/[locale]/dashboard/operator/onboarding/page.tsx:19-21`; `apps/web/trpc/routers/operator.ts:253`; `apps/web/features/auth/hooks/use-auth.ts:69-72`
- **Issue:** The toast fires only when the client query returns `onboardingStatus === "COMPLETED"`, and that status is read raw from the `Operator.onboardingStatus` column (`operator.ts:253`) — not derived from `completedSteps`. A fresh signup defaults to `NOT_STARTED` (`schema.prisma:547`) and the onboarding page server-side redirects COMPLETED operators (`page.tsx:19-21`), so a genuinely new account cannot reach the toast. Meanwhile the login flow routes **every** OPERATOR-role user to `/dashboard/operator/onboarding` after OTP verify, regardless of existing status (`use-auth.ts:69-72`).
- **Impact:** Re-using a phone/email that previously completed onboarding (leftover COMPLETED operator row) — or a stale client cache (the `getOnboardingStatus` query key is not user-scoped) — makes the client mount with COMPLETED data and show "Your onboarding is already complete" while being pushed to the dashboard with no explanation. User reported this on a fresh signup.
- **Fix:** (a) route by onboarding status right after OTP verify instead of role-only; (b) user-scope the query key or invalidate operator queries on sign-out; (c) remove the redundant client toast+push — the server redirect already handles COMPLETED.
- **Status:** ✅ FIXED (2026-08-01) — (a) `use-auth.ts` `verifyEmail` now routes ADMIN → `/dashboard/admin`, OPERATOR → status-based (`getOnboardingStatus` fetch → COMPLETED ? `/dashboard/operator` : `/dashboard/operator/onboarding`); passenger-auth-flow operator OTP verify routes by the same status fetch instead of the `isNewUser` age heuristic; (b) `signOut()` now calls `queryClient.clear()` so no stale/cross-user onboarding data survives a session switch; (c) removed the toast+push effect (`useOperatorOnboarding.ts:51-56`) — server redirects already guard both pages.

### H2. COMPANY step slug prefilled with `draft-{uuid}` placeholder
- **Type:** BUG
- **Files:** `apps/web/lib/auth-server.ts:200`; `apps/web/features/operator/components/onboarding/company-step.tsx:81`
- **Issue:** The `user.create` hook creates the company with `slug: draft-${companyId}`; CompanyStep prefills it verbatim, so the form shows a meaningless slug that must be replaced by hand.
- **Impact:** Operator must manually generate a real slug; slug validation (`validateSlug`) first runs against a draft placeholder.
- **Fix:** Don't prefill when the slug starts with `draft-`; auto-generate from company name (company-step.tsx:99-114 already debounces and validates an auto-generated slug).

### H3. COMPANY email not prefilled from login steps 1-2 (must be re-entered)
- **Type:** BUG
- **Files:** `apps/web/lib/auth-server.ts:174,201`; `apps/web/features/operator/components/onboarding/company-step.tsx:82`; `apps/web/features/auth/components/passenger-auth-flow.tsx:194-216`
- **Issue:** `Company.email` is set from the pending signup (the email collected in login steps 1-2) and CompanyStep prefills it — but for phone-first signups the before-hook keeps the temp guest email as the user's primary email (`email: user.email || pending.email` — guest wins, `auth-server.ts:174`) and the real collected email only lands in `workEmail`/company. Depending on the identifier used, the prefilled company email can be the guest placeholder or missing, forcing re-entry of a value already provided.
- **Impact:** Duplicate entry; risk of saving the `+225xxx@guest.mojaride.ci` address as the company email, which then breaks notifications and validation.
- **Fix:** Prefill `company.email` from the login-collected email unconditionally (`pending.email` in the before hook — same root cause/fix as C1).
- **Status:** ✅ FIXED (2026-08-01) — resolved at the root by C1 (real email is primary + `Company.email = pending.email`) and K1 (details gate guarantees a real email is always collected). No `company-step.tsx` change needed — the prefill (`company-step.tsx:82`) already works once the value is correct.

### H4. COMPANY phone not prefilled from login steps 1-2 (owner phone vs company phone)
- **Type:** BUG
- **Files:** `apps/web/lib/auth-server.ts:202`; `apps/web/features/operator/components/onboarding/company-step.tsx:83`; `apps/web/features/auth/components/passenger-auth-flow.tsx:195,216`
- **Issue:** `Company.phone` is set to the identifier/phone collected in login step 1/2 and prefilled, but that is the owner's contact number, not a dedicated company line — the user must re-enter a company phone.
- **Impact:** Company contact data is conflated with the owner's phone; user must clear and retype.
- **Fix:** Prefill from the login-collected phone; decide whether the COMPANY step should expose a distinct company-phone field instead of the owner's number.

### H5. BUSINESS REGISTRATION NUMBER prefilled with `DRAFT-{uuid}`
- **Type:** BUG
- **Files:** `apps/web/lib/auth-server.ts:203`; `apps/web/features/operator/components/onboarding/company-step.tsx:87`
- **Issue:** The hook creates `registrationNumber: DRAFT-${companyId}` and CompanyStep prefills it verbatim.
- **Impact:** Operator sees a fake registration number and may leave it; `completeOnboarding` (`operator.ts:291`) only checks non-empty, so a `DRAFT-` placeholder can pass verification.
- **Fix:** Leave the field empty when the value starts with `DRAFT-`; enforce a non-placeholder pattern before finalize.

### H6. TAX ID / NUI prefilled with `DRAFT-{uuid}`
- **Type:** BUG
- **Files:** `apps/web/lib/auth-server.ts:204`; `apps/web/features/operator/components/onboarding/company-step.tsx:88`
- **Issue:** Same as H5 for `taxId: DRAFT-${companyId}`.
- **Impact:** A fake NUI can pass `completeOnboarding`'s non-empty check (`operator.ts:291`).
- **Fix:** Leave empty when prefilled with a DRAFT placeholder; validate format on finalize.

---

## I. Step 2/3 scope changes + bank auto-verification (user-reported, confirmed)

### I1. STEP 2 (DOCUMENTS): remove Insurance Certificate and Bank Statement slots
- **Type:** CHANGE (requested removal)
- **Files:** `apps/web/features/operator/components/onboarding/documents-step.tsx:75-88` — remove the `insurance` (`INSURANCE_CERTIFICATE`) and `bank_statement` (`BANK_STATEMENT`) entries from `documentTypes`. Keep: BUSINESS_REGISTRATION_CERTIFICATE, TAX_CLEARANCE_CERTIFICATE, TRANSPORT_OPERATING_PERMIT (required) + OTHER (optional).
- **Related (NOT changed, keep as-is):** `packages/schemas/src/operator.ts:19,21` (`documentTypeEnum` still needs both values — `documentSchema` and settings reuse it), `packages/db/prisma/schema.prisma:165,167` (`CompanyDocumentType` enum — legacy rows), `messages/en.json:2068,2070` + `fr.json:2047,2049` (labels — can stay or be cleaned), and the settings-side doc lists: `features/operator/settings-content.ts:26`, `features/operator/settings/components/views/compliance-view.tsx:36`, `features/operator/settings/components/drawers/documents-drawer.tsx:42` (insurance still offered in Settings → Compliance — out of onboarding scope, decide separately).
- **Impact:** Step 2 then requires 3 documents (business registration, tax clearance, transport permit) + optional OTHER. Note: `completeOnboarding` server check (`operator.ts:305`) requires only BUSINESS_REGISTRATION_CERTIFICATE + TRANSPORT_OPERATING_PERMIT — after this change the UI/server mismatch of **B4** becomes 3 vs 2 (still must be aligned; see B4).
- **Fix:** Delete the two entries from `documentTypes` in `documents-step.tsx`; no server/schema change needed (the DOCUMENTS branch at `operator.ts:602-632` saves whatever types are posted).

### I2. STEP 3 (BANK): remove the "two-stage verification" banner
- **Type:** CHANGE (requested removal)
- **Files:** `apps/web/features/operator/components/onboarding/bank-step.tsx:116-144` (amber "Two-stage verification sub-step" card rendering "Bank details added" + "Pending verification — withdrawals enabled after admin approval"); strings: `messages/en.json:2166-2168` (`bankDetailsAdded`, `pendingVerification`, `verifiedPayouts`), `fr.json:2145-2147`.
- **Issue:** The banner is useless: it is driven by `hasBankDetails` (broken singular `bankAccount` prefill — see **A1**) and `bankVerified` (false until an admin manually approves), and it becomes entirely meaningless once I3 auto-verifies the bank at save time. Keep the green "Secure Payout Setup" security card (`bank-step.tsx:100-114`, `securityTitle`/`securityDesc`).
- **Fix:** Delete the amber card and the `bankDetailsAdded`/`pendingVerification`/`verifiedPayouts` keys (both locales); remove the now-unused `bankVerified` prop plumbing if nothing else consumes it.

### I3. STEP 3 (BANK): create the Paystack recipient and mark the account active at save time (no manual admin approval)
- **Type:** BUG / PROCESS REDESIGN (high impact)
- **Files:** `apps/web/trpc/routers/operator.ts:656-713` (BANK branch of `saveOnboardingStep`); `apps/web/trpc/routers/admin.ts:336-454` (`verifyOperator`), `865-1004` (`verifyBankAccount`), `1006+` (`rejectBankAccount`); `apps/web/features/admin/views/admin-verification-view.tsx:364-379, 386-470` (manual bank-code pick + "Verify & Register Recipient"); `apps/web/features/payments/providers/paystack-client.ts:151-186` (`paystackCreateTransferRecipient`), `232-259` (`paystackResolveAccount` — defined but **never used anywhere**); `packages/db/prisma/schema.prisma:467,476` (`isVerified @default(false)`, `paystackTransferRecipientCode String?`); `apps/web/trpc/routers/operator.ts:1870,1963` + `features/operator/views/operator-withdraw-view.tsx:68` (withdrawal gating on verified bank + recipient).
- **Issue:** The BANK step stores the account with `isVerified: false` and **no** `paystackTransferRecipientCode` — the comment at `operator.ts:659-661` even states Paystack validation is deferred to admin approval. A Paystack recipient is created **only** by an admin, in two places: `admin.verifyOperator` (admin picks the bank code manually in the approval dialog) or `admin.verifyBankAccount`. If the bank details are wrong, the admin must reject (whole-company `rejectOperator` for onboarding banks), the operator re-enters the account, and an admin reviews again — a slow, fully manual loop.
- **Impact:** Operators cannot withdraw until an admin manually processes their bank details; wrong details trigger full-company rejection instead of a bank-only correction.
- **Fix (suggested):** In the BANK branch of `saveOnboardingStep`, after persisting the encrypted account (the operator already selects the Paystack `bankCode` in the form, `bank-step.tsx:171-197` → stored at `operator.ts:673/688`):
  1. Validate the account via `paystackResolveAccount` (already implemented, currently dead code) — catches wrong account numbers immediately;
  2. Create the recipient via `paystackCreateTransferRecipient({ businessName: company.name, bankCode, accountNumber })` (same call admin uses, `admin.ts:379-383`);
  3. Persist `isVerified: true`, `paystackTransferRecipientCode`, `verificationProvider: "PAYSTACK"`, `verifiedByProvider: true`, `lastVerificationAt`, `verifiedAt`, keep `isDefault: true` handling, and mirror the recipient code onto `company.paystackTransferRecipientCode` (like `admin.ts:954-957`); also handle the `@@unique([bankName, accountNumber])` case (P2002 → friendly error);
  4. On Paystack failure, keep the account unverified, surface a clear error, and let the operator correct the fields without a full-company rejection.
- **Follow-up decision:** Post-onboarding bank changes in Settings (`trpc/routers/operator/settings.ts:145,321` add banks with `isVerified: false`) use the same manual loop via `admin.verifyBankAccount`/`rejectBankAccount` and the bank UI in `admin-verification-view.tsx` — decide whether to apply the same auto-verification there or keep admin review for settings-only changes. The `bankVerified` flag in `getOnboardingStatus` (`operator.ts:186`) and the withdraw gating (`operator.ts:1870`, `operator-withdraw-view.tsx:68`) will start working correctly as soon as onboarding banks are auto-verified.

---

## J. STEP 4 (PROFILE) scope changes (user-reported, confirmed)

### J1. PROFILE step must show the Full Name collected on login step 2 (rest entered fresh)
- **Type:** BUG
- **Files:** `apps/web/features/auth/components/passenger-auth-flow.tsx:213-214` (login details step sends `ownerName` → `pending.ownerName`); `apps/web/lib/auth-server.ts:175-176` (`user.fullName = pending.ownerName` in the `user.create.after` hook); `apps/web/features/operator/components/onboarding/profile-step.tsx:74` (prefill reads `initialData.user?.fullName || initialData.operator?.user?.fullName`); `apps/web/trpc/routers/operator.ts:146-158` (`getOnboardingStatus` — the `operator` include has no `user` relation and there is no top-level `user`).
- **Issue:** The Full Name entered on login step 2 IS stored (`User.fullName`), and the PROFILE step already tries to prefill it — but the prefill can never work because `getOnboardingStatus` never returns the user (same root cause as **A3**). Only Full Name is available from login; company name and phone/email belong to the COMPANY step, so everything else on PROFILE must be entered fresh.
- **Fix:** Add `user: { select: { fullName: true } }` to the operator include in `getOnboardingStatus` (or return the session user's `fullName` at the top level), so `profile-step.tsx:74` prefills it. `User.fullName` is also re-synced at PROFILE save (`operator.ts:746`), so the value stays consistent.

### J2. Remove the Emergency Contact section completely from the PROFILE step
- **Type:** CHANGE (requested removal)
- **Files:** `apps/web/features/operator/components/onboarding/profile-step.tsx:52-53,82-83,105-106,320-358` (state, prefill, payload, "Emergency Contacts" UI with `contactName`/`contactPhone` inputs)
- **Issue:** Emergency contact (name + phone) is collected on the onboarding PROFILE step.
- **Related consumers (keep or purge together):** `packages/schemas/src/operator.ts:118-119` (`profileStepSchema` fields); `packages/db/prisma/schema.prisma:559-560` (Operator columns); `apps/web/trpc/routers/operator.ts:760-761` (PROFILE save branch); `apps/web/trpc/routers/operator/settings.ts:124-125` + `features/operator/settings/components/views/personal-profile-view.tsx:30-31,165-183` (Settings → Personal Profile still collects them); `apps/web/trpc/routers/staff.ts:196-197` (returned to privileged callers); `apps/web/features/admin/views/admin-operator-profile-view.tsx:204-205` (admin displays them); `messages/en.json:2208` + `fr.json:2187` (`emergencyContact` label).
- **Fix:** Remove the section + state + payload from `profile-step.tsx`. Decision needed: purge the feature entirely (schema fields, settings UI, staff/admin output, translations) or only the onboarding step.

### J3. Date of Birth: make required and replace the calendar popover with a type-friendly masked input
- **Type:** BUG / CHANGE
- **Files:** `apps/web/features/operator/components/onboarding/profile-step.tsx:242-256` (uses `DatePicker`); `packages/ui/src/components/ui/date-picker.tsx` (shadcn calendar-in-popover — navigating decades back requires repeated arrow clicks); `packages/schemas/src/operator.ts:113` (`dateOfBirth: z.string().optional().nullable()`); `apps/web/trpc/routers/operator.ts:753-755` (PROFILE branch saves `new Date(profileData.dateOfBirth)` or `null`); `packages/db/prisma/schema.prisma:552` (`dateOfBirth DateTime?`); `profile-step.tsx:112` (`canContinue` = fullName + role only).
- **Issue:** DOB is optional end-to-end (schema, UI gate, server, DB) and the current picker is painful for birth dates (10-20 years of clicks).
- **Fix:**
  1. Make DOB **required**: `profileStepSchema.dateOfBirth` non-optional, include it in `canContinue` (profile-step.tsx:112), enforce in the PROFILE branch (`operator.ts:742-763`), keep the DB column nullable if desired but require it at API level.
  2. Replace `DatePicker` with a custom masked input (e.g. the provided `DobInput` using `PatternFormat` from `react-number-format`): type `MM/DD/YYYY` directly with inline validation (invalid month/day/year). Notes:
     - `react-number-format` is **not currently a dependency** (`apps/web` has `react-phone-number-input` + `date-fns` only) — add it, or hand-roll the masking with a plain input.
     - The component must emit ISO `YYYY-MM-DD` — the schema is a string and the server does `new Date(profileData.dateOfBirth)` (`operator.ts:754`); the prefill at `profile-step.tsx:77` also reads `op.dateOfBirth.split("T")[0]`.
     - Import from `@moja/ui/components/ui/input` (not `@/components/ui/input`).
     - Existing translation keys `dateOfBirth` / `dateOfBirthPlaceholder` (`en.json`/`fr.json` profile namespace) can be reused.
- **Status:** ✅ FIXED (2026-08-01) — masked MM/DD/YYYY text input replaced the `DatePicker`; DOB is required (`canContinue` includes it, submit gates on it). **Follow-up BUG (fixed 2026-08-02):** the initial masked-input implementation was a controlled input whose `value` derived from `dateOfBirth` (valid ISO only); `parseDobInput` returns `""` for any incomplete entry, so every keystroke wiped the field. Added a separate `dobInput` raw-text state — `value` reflects the raw text, `onChange` stores it and syncs the parsed ISO only when valid, `onBlur` errors when text exists without a valid date, and prefill seeds both states.

---

## K. Login flow UX (user-reported, confirmed, fixed)

### K1. Details step Continue button must be disabled until all fields are provided
- **Type:** CHANGE (requested)
- **Files:** `apps/web/features/auth/components/passenger-auth-flow.tsx` — details step submit button
- **Issue:** The Continue button was only disabled while a request was pending; with empty Company Name / Full Name / Phone/Email it was clickable and just showed a toast. This allowed incomplete signups (e.g. phone-only) which previously forced the phone plugin's temp guest email derivation downstream.
- **Fix:** Button now `disabled` until `companyName`, `ownerName`, and the collected Phone (email method) or Email (phone method) are all non-empty AND terms are accepted (`detailsValid`).
- **Status:** ✅ FIXED (2026-08-01)

### K2. OTP verify must show a spinner and block double submission
- **Type:** BUG
- **Files:** `apps/web/features/auth/components/passenger-auth-flow.tsx` — `handleVerifyCode` operator branch + OTP submit button
- **Issue:** The operator OTP verification called `authClient.phoneNumber.verify` / `signIn.emailOtp` with **no** pending state — no spinner, button re-clickable (rapid double-submits) and no feedback while the request was in flight.
- **Fix:** Added `otpVerifying` state wrapped around the operator verify call (reset in `finally`, included in `isPending`); the OTP submit button now renders a `Spinner` + "Verifying..." while pending and is disabled. Passenger path already had pending state via `useAuth` and now shows the spinner too.
- **Status:** ✅ FIXED (2026-08-01)

---

## G. Suggested fix order

1. **C1 + E1 + H3** — phone-first signup email bug + company email prefill (account/notification integrity) ✅
2. **H1** — false "onboarding already complete" toast (status-based routing + query-key scoping) ✅
3. **A1** — BankStep prefill + verification indicator ✅
4. **A2** — back-navigation on roadmap ✅
5. **B2** — workEmail P2002 ✅
6. **B3** — persist `expiresAt` ✅
7. **B4** — align required docs UI vs server ✅
8. **A3** — PROFILE fullName prefill ✅
9. **B1** — unreachable "no operator" branch in `getOnboardingStatus` ✅
10. **E2** — admin email uses APP_URL ✅
11. **A4** — orphaned LocationsStep component ✅
12. **C3** — remove unused verifySignupOtpSchema / completeSignupSchema ✅
13. **C2** — drop dummy OTP hash from initSignup ✅
14. **F2** — cleanup expired PendingOperatorSignup rows ✅
12. **H2 / H5 / H6** — strip `draft-*` / `DRAFT-*` placeholders from COMPANY prefill ✅
13. **H4** — company phone field semantics ✅
14. **I3** — auto-create Paystack recipient + auto-verify bank on STEP 3 save ✅
15. **I2** — remove the two-stage verification banner on STEP 3 ✅
16. **I1** — remove Insurance Certificate + Bank Statement from STEP 2 ✅
17. **J1** — prefill PROFILE Full Name from login step 2 (fix A3 together) ✅
18. **J3** — make DOB required + custom masked DOB input ✅
19. **J2** — remove Emergency Contact from PROFILE step ✅
20. **F1** — migration baseline
