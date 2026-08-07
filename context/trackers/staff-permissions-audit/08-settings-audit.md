# 08 — Settings Audit

Deep dive on the operator Settings feature: company / personal / banking / compliance / notifications. Files: `features/operator/settings/**`, `features/operator/settings-content.ts`, `app/[locale]/dashboard/operator/(dashboard)/settings/**`.

---

## 0. Two parallel Settings UIs

| UI | State | Notes |
|---|---|---|
| **Sub-route UI** (`settings/*` → company/personal/banking/compliance/notifications) | **ACTIVE** | All five pages under a shared `settings/layout.tsx` |
| **Tab + drawer UI** (`settings-content.ts` `SETTINGS_TABS`/`SETTINGS_ROUTES`, `settings-hub.tsx`, `settings/components/drawers/*`) | **DEAD / LEGACY** | Nothing imports `SettingsHub` or `SETTINGS_TABS`. Drawer mutations (`completeOnboarding`, `resubmitVerification`) have a latent server-side permission gap if ever remounted. |

---

## 1. Structure & navigation gating (`settings-sidebar.tsx`)

The **only** permission logic in the entire settings feature. It reads `settings.operator.role` and `settings.operator.permissions` from the `getSettings` payload — **no `useStaffPermissions()`, no `can()` anywhere in settings.**

| Tab | Route | Show condition | Line |
|---|---|---|---|
| Company Profile | `/settings/company` | `role === "OWNER" \|\| perms.includes("company:view")` | 24 |
| Personal Profile | `/settings/personal` | `show: true` ("Everyone can manage their own profile") | 31 |
| Financials & Payouts | `/settings/banking` | `role === "OWNER" \|\| perms.includes("financials:view")` | **38 — `financials:view` is NOT a real key** |
| Compliance & Docs | `/settings/compliance` | `role === "OWNER" \|\| perms.includes("company:update")` | 45 |
| Notifications | `/settings/notifications` | `show: true` | 52 |

### 🔴 The `financials:view` bug
`settings-sidebar.tsx:38` gates Financials & Payouts on `perms.includes("financials:view")`, but `PERMISSION_META` in `packages/schemas/src/permissions.ts` has **no `financials:view`** key (grep: only match is this line). Consequences:
- The tab is effectively **OWNER-only** (`role === "OWNER"` is the only true branch).
- A **FINANCE** staff — who IS server-authorized to read bank accounts (`listBankAccounts` requires `company:view`, and FINANCE has it) — **cannot see the Financials tab**.
- The main sidebar uses `revenue:view`/`withdrawals:view` for Revenue/Withdrawals, so the settings sidebar is out of sync with the rest of the app.
- `Company Profile` gate (`company:view`) and `Compliance` gate (`company:update`) use real keys; the pattern is fine, the key is wrong.

---

## 2. Server mutations vs client enforcement

| Procedure | Server guard (`operator/settings.ts`) | Client guard |
|---|---|---|
| `getSettings` | `company:view` (39) | none (nav filter only) |
| `updateCompany` | `company:update` (83) | **none** — form always rendered |
| `updateProfile` | `company:update` (125) | **none** — form always rendered |
| `updateBankAccount` | `company:update` (160) | none |
| `updateBank` | `company:update` (244) | **dead — no client caller** |
| `revealBankAccount` | `company:view` + `operator.role === "OWNER"` (357) | **dead — no client caller** |
| `listBankAccounts` | `company:view` (389) | none |
| `addBankAccount` | `company:update` (411) | none |
| `setDefaultBankAccount` | `company:update` (467) | **dead — no client caller** |
| `deleteBankAccount` | `company:update` (507) | none |
| `addDocument` | `company:update` (536) | none |
| `deleteDocument` | `company:update` (562) | none |

**The client enforces NOTHING in settings.** No edit form, upload, or delete is gated. Staff rely entirely on server FORBIDDEN toasts.

---

## 3. Per-page findings

### Company Profile (`company-profile-view.tsx`)
- Full inline edit form + "Save Changes" + logo uploader (`storage.presignUpload`, `company:update`).
- A `company:view`-only staff (default MANAGER, FINANCE) sees the whole editable form; every save → server 403.

### Personal Profile (`personal-profile-view.tsx`)
- Tab is `show: true` ("everyone can manage their own profile"), but `updateProfile` requires **`company:update`** and `getSettings` requires `company:view`; avatar upload requires `company:update`.
- **Contradiction:** the UI advertises self-service personal profile management, but only `company:update` holders (OWNER/ADMIN) can actually save.

### Banking (`banking-view.tsx`)
- "Add Account", edit pencil, delete trash — all un-gated.
- `revealBankAccount` (OWNER-only server) has **no client caller** — numbers are only ever shown masked (last-4). No inconsistency client-side because the surface doesn't exist.
- "Primary" badge is display-only — `setDefaultBankAccount` has no client caller, so users can't change the default account.

### Compliance (`compliance-view.tsx`)
- Upload slots, view, delete — un-gated.
- `storage.presignDownload` (operator-document) checks only `operator.companyId === doc.companyId` — **any staff of the company can download compliance documents**, no `company:view`/`company:update` key check.

### Notifications (`notifications/page.tsx`)
- Its own query is public; but the whole settings tree is gated by `company:view` via the layout prefetch, so it still requires `company:view`.

---

## 4. Legacy drawer gap (dead code, latent)
`verification-drawer.tsx` (unreachable) calls `operator.completeOnboarding` and `operator.resubmitVerification` — **neither has a permission key** (see router audit R1/R2). If the old hub is ever re-enabled, any staff member could flip the company to `PENDING_VERIFICATION`.

---

## 5. Settings findings

| # | Finding | Severity |
|---|---|---|
| SE1 | **`financials:view` ghost key** makes the Financials tab effectively OWNER-only, blocking FINANCE staff who are server-authorized | HIGH |
| SE2 | **Zero client-side gating** in settings — `company:view`-only staff see full edit/upload/delete UI, discover denial only via 403 toast | MEDIUM |
| SE3 | Personal Profile advertised as self-service but hard-gated on `company:update`/`company:view` | MEDIUM |
| SE4 | Footer "Settings" entry ungated (2nd entry point into the `company:view` tree) | MEDIUM |
| SE5 | `revealBankAccount` / `setDefaultBankAccount` / `updateBank` have correct server guards but no client callers (dead, drifting surface) | LOW |
| SE6 | `storage.presignDownload` for compliance docs gated by company membership, not `company:view`/`update` | MEDIUM |
| SE7 | Legacy `completeOnboarding`/`resubmitVerification` have no permission key (latent gap in dead drawer) | MEDIUM (latent) |
| SE8 | `listBankAccounts` data gate (`company:view`) vs tab nav gate (`financials:view`) reference different models | MEDIUM |
| SE9 | Company `ADMIN` can change payout destination (only `company:update` required) — consider OWNER-only for bank mutation | MEDIUM |
| SE10 | Personal data (DOB, national ID, emergency contacts) in `getSettings`/`getProfile` gated only by `company:view` | INFO |

Continue to [`09-flows.md`](./09-flows.md).
