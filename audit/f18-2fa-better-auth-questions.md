# F-18 — Withdrawal 2FA via Better Auth emailOTP: design + feasibility questions

*Handoff brief for the Better Auth agent. Goal: enforce withdrawal 2FA (F-18) in
`apps/web/trpc/routers/operator.ts` `requestWithdrawal`, reusing the existing
Better Auth `emailOTP` plugin if feasible.*

## Context
- Better Auth `^1.6.20` (installed `1.6.22`), configured in `apps/web/lib/auth-server.ts`.
- The **only** OTP/2FA mechanism present is the `emailOTP` plugin
  (`emailOTP({ sendVerificationOnSignUp:false, overrideDefaultEmailVerification:true, async sendVerificationOTP({email,otp,type}) { await sendAuthOtp({identifier:email, otp, type}) } })`).
- `User.twoFactorEnabled` exists in the Prisma schema but is **unused**. The dedicated
  `twoFactor` plugin is **not** installed.
- `sendAuthOtp` (`apps/web/lib/auth-email.ts`) routes OTPs through Novu `auth-otp`
  (`type` is just passthrough). For email it uses `identifier.includes("@")`.

## What we want to build
A withdrawal confirmation step that reuses the emailOTP plugin's OTP generation,
storage (`verification` table), expiry/attempt handling, and delivery (`sendAuthOtp`):

1. New tRPC mutation `operator.requestWithdrawalChallenge`:
   `auth.api.sendVerificationOTP({ body: { email: ctx.user.email, type: "withdrawal-2fa" }, headers })`
2. `requestWithdrawal` gains a required `twoFactorCode` input (only when the platform
   setting `require2FAForWithdrawals` is true). Before the Paystack payout it calls:
   `auth.api.checkVerificationOTP({ body: { email: ctx.user.email, type: "withdrawal-2fa", otp: twoFactorCode }, headers })`
   and proceeds only on success. `checkVerificationOTP` is ideal because it is
   **serverOnly**, does **not** sign the user in or mutate the user, and is atomic-consume
   (exactly-once → preserves the existing F-17 idempotency gate).
3. Frequency limit (independent of better-auth): if `settings.withdrawalFrequencyHours > 0`,
   reject if the company's most recent non-failed `OPERATOR_PAYOUT` (`POSTED|SETTLED|PENDING`)
   is within the last N hours.

## Feasibility questions for the Better Auth agent
1. **Custom OTP type:** `emailOTP` hardcodes `types = ["email-verification","sign-in","forget-password","change-email"]`
   and `sendVerificationOTP`/`checkVerificationOTP`/`getVerificationOTP` validate `type` with
   `z.enum(types)`. Is there a supported way to register an additional type (e.g. `"withdrawal-2fa"`)
   — a plugin option or documented extension — or is the enum fixed?
2. **If custom types are NOT supported:** is `checkVerificationOTP` usable for an arbitrary
   identifier at all, given it requires `type` ∈ the enum? (Looks like no without a custom type.)
3. **Lower-level alternative:** can a tRPC procedure replicate `resolveOTP` + `atomicVerifyOTP`
   using the plugin's internals — `ctx.context.internalAdapter.createVerificationValue` /
   `findVerificationValue` / `consumeVerificationValue` plus `opts.generateOTP` / `storeOTP` /
   `verifyStoredOTP` — with a custom identifier like `withdrawal-2fa:email`? Which of these
   internal adapters/helpers are stable/recommended to call from our own server code so we
   share storage + hashing + delivery with emailOTP?
4. **Hook type-agnostic:** confirm the `sendVerificationOTP` hook is type-agnostic (it just
   passes `type` through to `sendAuthOtp`), so a `"withdrawal-2fa"` type needs no change in
   `auth-server.ts`/`auth-email.ts`.
5. **Server-side invocation:** confirm `auth.api.checkVerificationOTP` / `auth.api.sendVerificationOTP`
   can be invoked directly from a Node tRPC procedure via `{ body, headers }` (no HTTP round-trip).
6. **Defaults:** what are the emailOTP defaults for `expiresIn` and `allowedAttempts` (attempts
   look like 3)? Should we pin specific values for withdrawal OTPs, and is that configurable per call?
7. **Recommendation:** given all the above, what is the *recommended* pattern for a
   non-auth-purpose OTP gate (withdrawal confirmation) that reuses emailOTP's storage/delivery?

## Fallback if better-auth cannot extend emailOTP
Self-contained withdrawal 2FA gate using our **own** OTP storage (a new
`withdrawalTwoFactorChallenge` model or transient field) + `sendAuthOtp` for delivery +
constant-time compare + attempt/expiry limits. Fully testable, independent of better-auth,
but more net-new code and a schema migration. Prefer the emailOTP reuse if Q1/Q3 allow.
