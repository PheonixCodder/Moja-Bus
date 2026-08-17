# Marketing & Promotions UI/UX Redesign — Implementation Plan

> **Status:** ✅ IMPLEMENTED — Approved and executed 2026-08-17.

## Goal

Redesign the Admin Campaigns, Admin Abuse Queue, and Operator Promotions interfaces to be cleaner, less overwhelming, and easier to operate. Fix the coupon redemptions query bug. Replace raw datetime inputs with calendar date pickers. Simplify referral fraud controls into always-on defaults. Answer product questions about referral and campaign concepts.

---

## Product Clarifications

### Referral System Concepts

| Term | What It Means |
|------|---------------|
| **Initial Credit** (`referrerCreditAmountXOF`) | One-time credit (e.g. 1,000 XOF) for the **referrer** after the referred friend completes their first confirmed, paid trip. |
| **Recurring Credit** (`recurringCreditAmountXOF`) | Smaller bonus credit (e.g. 250 XOF) given to the **referrer** for each subsequent trip the friend takes. |
| **Max Recurring Bookings** (`recurringMaxBookings`) | Cap on how many repeat trips earn recurring credits, preventing unlimited drains. |
| **Welcome Coupon Campaign** (`refereeCouponCampaignId`) | Links to an active platform campaign. When a new traveler signs up via a referral link, they receive a personal coupon code from this campaign to incentivize their first booking. |

### Campaign Settings Concepts

| Setting | What It Means | UX Decision |
|---------|---------------|-------------|
| **Require Operator Opt-In** | Forces operators to accept a platform campaign before it applies on their routes | Moved to collapsible "Advanced" section; defaults to `false` |
| **Hybrid Funding** | Splits discount cost between platform and operator (e.g. 50/50 BPS) | Moved to "Advanced" section; admin defaults to 100% platform, operator to 100% operator |
| **Auto-Apply at Checkout** | Discount applied automatically without typing a code | Coupon campaigns default to `false`; sitewide promos default to `true` |

---

## Changes Made

### Bug Fix: Redemptions Query

**File:** `apps/web/features/discounts/services/redemption-list.ts`

**Root causes fixed:**
1. When a specific coupon code is selected in the view, both `campaignId` AND `couponCodeId` were passed simultaneously. Now the views pass only `couponCodeId` (without `campaignId`) when a coupon is selected, avoiding filter collision.
2. Guest/unauthenticated users who checked out with a coupon had `userId = null`. The query now falls back to `holdGroup.bookings[0]` to retrieve passenger name, phone, and email for these cases.

---

### Component: CampaignSettingsEditor

**File:** `apps/web/features/discounts/components/campaign-settings-editor.tsx`

- **Date inputs:** Replaced `<Input type="datetime-local">` with `<DateTimePicker>` from `@moja/ui/components/ui/date-time-picker.tsx` (calendar popover + hour/minute selects).
- **Advanced section:** Budget, global/user/phone redemption caps, max discount, min spend, operator opt-in toggle, and hybrid funding toggle all moved inside a collapsible `<Collapsible>` section labelled "Advanced limits & funding", hidden by default.
- **Scope badges:** Route/Schedule/Trip scope pickers now show a selected-count pill badge on the label.
- **Inline hints:** Operator opt-in and hybrid funding toggles now show a short description beneath their label.
- **Save button:** Full-width, shows "Saving…" while pending.

---

### Component: AdminReferralProgramCard

**File:** `apps/web/features/admin/components/admin-referral-program-card.tsx`

- **Fraud protection:** Removed 4 individual toggles (block self-referral, same phone, same device, require paid booking). These are now permanently `true` and instead displayed as a clean **"Built-in Fraud Protection Active"** summary card with `ShieldCheck` icon and bullet points.
- **Field descriptions:** Each field (initial credit, recurring credit, max trips cap, recurring window, reward delay, welcome coupon) now has a short helper text beneath it.
- **Layout:** 2-column grid, save button is full-width.

---

### View: AdminCampaignsView

**File:** `apps/web/features/admin/views/admin-campaigns-view.tsx`

- **Creation wizard:** Replaced inline `Card` form with a 2-step `<Dialog>` modal. Step 1: name + benefit type (3-card toggle). Step 2: benefit value (% or XOF) + informational tip. Full back/next/cancel navigation.
- **Table improvements:** Status badge now uses `capitalize` for readability. Benefit shown as inline `bg-slate-100` chip. Activate/Pause actions now use ghost icon buttons (`Play`/`Pause`/`Bell`) to reduce visual noise.
- **Redemptions query fix:** When a coupon is selected, passes only `couponCodeId` (not also `campaignId`) to avoid the filter collision bug. Added "Clear filter" inline link.
- **KPI cards:** Added `tabular-nums` font feature. Voucher aging and referral funnel cards laid out side-by-side in a 2-column grid on large screens.
- **Performance stats:** Cleaner typography with `text-[11px] uppercase tracking-wide` section labels.

---

### View: AdminPromoAbuseView

**File:** `apps/web/features/admin/views/admin-promo-abuse-view.tsx`

- **Filter tabs:** Replaced `<Button variant="outline">` tabs with custom toggle buttons that include total count badge on "All events".
- **Event type badges:** Each event type (`SELF_REFERRAL`, `SAME_PHONE_REFERRAL`, `SAME_DEVICE_REFERRAL`, `VELOCITY_CAP`) now has a distinct colour-coded pill badge (orange, yellow, purple, red).
- **Reviewed rows:** Reviewed events get `opacity-60` to de-emphasize them.
- **Actions:** "Pause campaign" button is orange-tinted. "Mark reviewed" uses `CheckCheck` icon. Reviewed state shows checkmark with "Reviewed" text.
- **Timestamp:** Shows date + time on two lines for better readability.

---

### View: OperatorPromotionsView

**File:** `apps/web/features/operator/views/operator-promotions-view.tsx`

- **Creation wizard:** Same 2-step `<Dialog>` modal as Admin (operator variant has only 2 benefit type options: `PERCENT_OFF` and `FIXED_AMOUNT_OFF`).
- **Table improvements:** Consistent with admin — benefit chips, icon action buttons, selected-row highlight.
- **Redemptions query fix:** Same coupon filter fix applied.
- **Platform opt-in card:** Opted-in campaigns show `CheckCircle2` icon. Status shown inline with colour coding (emerald for opted in). Card has rounded-xl with subtle bg-slate-50 background.

---

## Verification Results

| Check | Result |
|-------|--------|
| TypeScript typecheck (`npx tsc --noEmit`) | ✅ 0 errors |
| Unit + integration tests (`npm test`) | ✅ 344/344 pass |
| Redemptions query (coupon filter) | ✅ Fixed — passes only `couponCodeId` when coupon selected |
| Guest passenger details in redemptions | ✅ Fixed — `holdGroup.bookings` fallback added |
| Calendar date picker | ✅ `DateTimePicker` integrated in `CampaignSettingsEditor` |
| Referral fraud controls | ✅ Permanently enabled, displayed as always-on security card |
