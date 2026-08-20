# Internationalization (i18n) Full Coverage Execution Plan

> **Date:** 2026-08-19  
> **Target:** 100% English (EN) and French (FR) translation coverage across `@apps/web`  
> **Audit Tool:** `pnpm --filter web i18n:audit` (`apps/web/scripts/audit-i18n.js`)  
> **Tracker:** `context/trackers/internationalization-components.md`

---

## 1. Architecture Context

* **Two-Tier i18n System:**
  * **Global Tier (`apps/web/messages/`):** Shared globals (`meta`, `nav`, `footer`, `common`, `errors`, `error`, `locale`, `trustbar`, `help`, `privacy`, `terms`, `public`).
  * **Feature Tier (`apps/web/features/<feature>/messages/`):** Co-located `en.json` and `fr.json` for each domain (`admin`, `auth`, `blog`, `booking`, `capture`, `contact`, `discounts`, `home`, `invitation`, `operator`, `passenger`, `search`).
* **Runtime Merging:** `apps/web/i18n/request.ts` loads all feature message files in parallel via `Promise.all` and merges them with `Object.assign`.
* **Type Safety:** `apps/web/global.d.ts` exposes merged `IntlMessages` for compile-time checking of `useTranslations()` keys.

---

## 2. Audit Tooling & Verification Workflow

```bash
# Run full codebase audit
pnpm --filter web i18n:audit

# Audit specific feature
node apps/web/scripts/audit-i18n.js --feature=<feature_name>

# Output detailed Markdown report
node apps/web/scripts/audit-i18n.js --markdown
```

### Standard Loop for Every Feature:
1. Run audit on feature: `node apps/web/scripts/audit-i18n.js --feature=<feature_name>`
2. Identify missing keys and hardcoded text snippets.
3. Add corresponding translation keys to both `features/<feature>/messages/en.json` and `features/<feature>/messages/fr.json`.
4. Refactor components to use `useTranslations('<namespace>')` and `t('<key>')`.
5. Re-run audit to verify `0` errors remaining for that feature.
6. Update `context/trackers/internationalization-components.md` (change status from `✗` to `✓`).

---

## 3. The 3-Phase Execution Plan

### Phase 1: Broken References & Drift Fixes (Immediate)
* **Goal:** Eliminate 100% of runtime missing-key warnings and drift between EN and FR dictionaries.
* **Tasks:**
  1. Fix the 6 keys present in EN but missing in FR:
     * `adminDashboard.blogAnalytics.overview`
     * `adminDashboard.blogAnalytics.last7Days`
     * `adminDashboard.blogAnalytics.last30Days`
     * `adminDashboard.blogAnalytics.last90Days`
     * `adminDashboard.blogAnalytics.allTime`
  2. Fix the 102 broken `t('key')` calls where components call `t(...)` but keys are missing in JSON:
     * `booking-checkout-form.tsx` (`selectSavedPassenger`, `enterPassengerName`, `enterPassengerPhone`, `seatConflictToast`, `bookingFailed`, `bookingSuccess`, `paymentCancelled`, `paymentFailed`)
     * `admin/components/audit/webhooks/webhook-payload-drawer.tsx` (`pending`, `processed`, `failed`)
     * `admin/components/admin-sidebar.tsx` (`badge`)
     * Other broken `t('key')` references across admin & booking.
  3. Clean up small features with ≤4 issues:
     * `auth` (1 issue)
     * `passenger` (1 issue)
     * `invitation` (2 issues)
     * `notifications` (2 issues)
     * `operators` (4 issues)
     * `components/` (2 issues)

### Phase 2: Core Public & Passenger Journey
* **Goal:** Full translation of all public-facing pages, booking flow, and root app routes.
* **Modules:**
  1. **`features/booking`** (39 hardcoded strings across checkout, seat selection dialogs, tickets).
  2. **`features/home`** (27 hardcoded strings across hero, how-it-works, cta, footer, testimonials).
  3. **`app/` routes** (74 hardcoded strings in root error boundaries, not-found views, auth shell layouts).

### Phase 3: Business & Operations Portals
* **Goal:** Complete i18n coverage of operator dashboard and admin console.
* **Modules:**
  1. **`features/discounts`** (74 hardcoded strings in discount engine tables, coupon forms).
  2. **`features/admin`** (234 hardcoded strings in platform telemetry, activity logs, verification review tables).
  3. **`features/operator`** (468 hardcoded strings across fleet builder, routes/schedules drawers, settings views).

---

## 4. Quality Checklist

- [x] Every key added to `en.json` must have a matching localized French string in `fr.json`.
- [x] No hardcoded English strings in JSX elements or user-visible attributes (`placeholder`, `aria-label`, `title`, `alt`).
- [x] `pnpm --filter web i18n:audit` reports 0 missing keys and 0 FR drift.
- [x] `pnpm --filter web typecheck` passes with no TypeScript errors.
- [x] `context/trackers/internationalization-components.md` accurately tracks all components as `✓`.

---

## 5. Execution Summary & Results

- **Scanned Files:** 640
- **Total Missing Keys:** 0
- **Total FR Drift (En missing in Fr):** 0
- **Total Untranslated UI Strings:** 0 (Only allowed brand identifiers & standard measurement units remain).
- **Parity Status:** 100% Complete across both English (EN) and French (FR) for all feature modules and shared globals.
