# Moja Ride: Admin Dashboard UI & Scale Review

This review analyzes the current Admin Dashboard implementation across `apps/web/app/dashboard/admin`, `apps/web/features/admin`, and `packages/db/prisma/schema.prisma`. It highlights architectural, scaling, visual, and data-exposure bottlenecks, outlining a clear plan to transition the platform into an enterprise-grade control center capable of processing **1 Million+ monthly tickets**.

---

## 1. High-Scale Bottlenecks (At 1M+ Monthly Bookings)

At a volume of 1 Million+ monthly tickets, several patterns in the current tRPC routers and UI views will cause database deadlocks, out-of-memory (OOM) crashes, and browser tab freezes.

### A. In-Memory Aggregations (Database Crash Threat)
Inside [admin.ts](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/trpc/routers/admin.ts#L28-L57):
```typescript
const [successfulPayments, confirmedPricing, ...] = await Promise.all([
  ctx.prisma.externalPayment.findMany({ where: { status: "SUCCESS" } }),
  ctx.prisma.pricingSnapshot.findMany({ where: { holdGroup: { status: "CONFIRMED" } } }),
]);
const totalGMV = successfulPayments.reduce((sum, p) => sum + p.amountXOF, 0);
const totalCommission = confirmedPricing.reduce((sum, s) => sum + s.platformGrossXOF, 0);
```
*   **The Issue**: This query fetches **every successful payment and pricing snapshot** into Node.js memory to sum them using `Array.prototype.reduce`. At 1M+ tickets, this will fetch millions of rows, exhaust server RAM, cause Vercel function timeouts, and trigger database connection pool exhaustion.
*   **The Remedy**: Use native PostgreSQL aggregation queries:
    ```typescript
    const gmv = await ctx.prisma.externalPayment.aggregate({
      _sum: { amountXOF: true },
      where: { status: "SUCCESS" }
    });
    ```

### B. Local-Only UI Aggregations (Visual Bug)
Inside [admin-withdrawals-view.tsx](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/features/admin/views/admin-withdrawals-view.tsx#L105-L113):
```typescript
const kpis = {
  pendingCount: withdrawals.items.filter(i => i.status === "POSTED").length,
  pendingVolume: withdrawals.items.filter(i => i.status === "POSTED").reduce((sum, i) => sum + i.amount, 0),
};
```
*   **The Issue**: The KPIs are calculated on the client side using *only the current page's items* (max 15 rows). As the admin navigates between page 1, 2, or 3, the total pending volume KPI changes! This makes the dashboard stats meaningless.
*   **The Remedy**: Retrieve global metrics from the server via a dedicated KPI endpoint using database aggregation.

### C. DOM Bloat and Non-Virtualized Tables
*   **The Issue**: Standard HTML tables (`@moja/ui/components/ui/table`) render every row in the DOM. If filters are adjusted to show larger page limits (e.g., 100+ items per page), complex card rows will lag the browser, particularly on mobile devices.
*   **The Remedy**: Implement windowed virtualized lists (e.g., using `@tanstack/react-virtual`) for transaction tables, ledger sheets, and operations queues.

---

## 2. "Dark Data" — Schema Models Hidden from the UI

The `schema.prisma` file contains rich, critical metrics that are currently completely omitted from the Admin UI, leaving admins in the dark regarding platform security, health, and onboarding.

| Database Model | Current UI Status | Critical Missing Admin Use Case |
| :--- | :--- | :--- |
| `WebhookEvent` | ❌ Completely Hidden | **Webhook Health & Reliability**: Admins cannot see if Paystack webhooks are failing, check retry counts, or read processing logs (`error` or `processedAt`). |
| `BankAccessLog` | ❌ Completely Hidden | **Security & Audit Trails**: Because operator bank account details are decrypted at rest, admins must have a read-only log showing who decrypted what bank account, from which IP, and when. |
| `OperatorOnboarding` & `OperatorOnboardingEvent` | ❌ Completely Hidden | **Onboarding Funnel Drop-off**: Admins cannot see which step operators are stuck on (e.g. `DOCUMENTS` vs `BANK`) or analyze average registration time. |
| `ActivityLog` | ❌ Completely Hidden | **Operational History**: No trail showing which administrator suspended a company, verified a bank account, or recorded manual adjustments. |
| `BlogEvent` | ❌ Completely Hidden | **Content ROI & Conversion**: Analytics showing post view completion rates (25%, 50%, 75%, 100% read) and Call-To-Action clicks are unexposed. |
| `BlogRedirect` & `BlogSlugHistory` | ❌ Completely Hidden | **SEO Management**: Admins cannot view redirection pathways or manage active redirect aliases. |

---

## 3. Proposed Admin Dashboard Directory Restructure

The current layout under `app/dashboard/admin` uses flat subdirectories. To scale, pages must be segregated into **Domain-Driven Contexts** that separate business operations, financial clearing, configuration, and content.

### Restructured Page Tree
```
apps/web/app/dashboard/admin/
├── page.tsx                           # Global Operations Control Center (KPI charts, maps, alerts)
│
├── verifications/                      # KYC & ONBOARDING DOMAIN
│   ├── page.tsx                       # Operator Onboarding Funnel & Document Review
│   └── [companyId]/page.tsx           # Deep-Dive Document Verification View with PDF viewer
│
├── financials/                         # FINANCIAL & LEDGER CLEARING DOMAIN
│   ├── ledger/page.tsx                # Double-Entry Ledger Sheet (with Advanced search/filter)
│   ├── settlements/page.tsx           # Paystack Clearing Balance Audit & Manual Clearings
│   ├── withdrawals/page.tsx           # Self-Serve Operator Withdrawal queue
│   └── settings/page.tsx              # Commission tiers, payout policies, bank settings
│
├── operations/                         # REAL-TIME TRANSPORT DOMAIN
│   ├── dispatch/page.tsx              # Live Dispatch board (active, boarding, delayed trips)
│   ├── trips/[tripId]/page.tsx        # Single Trip Audit (view passenger seats, QR logs, reviews)
│   └── routes/page.tsx                # Terminal configurations & route maps
│
├── users/                              # DIRECTORY DOMAIN
│   ├── operators/page.tsx             # Operator staff roster, invites, and permission audits
│   └── travelers/page.tsx             # Passenger profiles, wallet balances, travel preferences
│
├── content/                            # MARKETING & CONTENT DOMAIN
│   ├── posts/page.tsx                 # Blog articles list
│   ├── posts/[postId]/page.tsx        # WYSIWYG editor / markdown revisions
│   ├── analytics/page.tsx             # Blog engagement, completed reads, CTA performance
│   └── redirects/page.tsx             # SEO redirect mappings & slug history
│
└── audit-logs/                         # COMPLIANCE DOMAIN
    ├── activity/page.tsx              # Admin & Operator activity logs
    ├── bank-access/page.tsx           # Bank account decryption access logs
    └── webhooks/page.tsx              # Paystack Webhook Event processing list
```

---

## 4. Visual & Styling Inconsistencies

Several micro-styling details, UI component selections, and layouts do not match a premium, cohesive design system.

### A. Raw Select Elements vs. Custom Comboboxes
In [admin-operations-view.tsx](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/features/admin/views/admin-operations-view.tsx#L67-L81) and other views:
```html
<select className="h-9 rounded border border-border bg-white px-2 py-1 text-xs text-slate-800 ...">
```
*   **The Issue**: Standard browser HTML `<select>` fields look cheap, are difficult to style consistently across browsers, and do not support search autocompletes. At 1,000+ companies, searching in a raw dropdown becomes impossible.
*   **The Remedy**: Standardize all selection drop-downs to use custom, virtualized comboboxes or select components built with `@base-ui/react` primitives.

### B. Card Styling Mismatches
*   **The Issue**: Shadow configurations are inconsistent: E.g., `admin-dashboard-view.tsx` uses `shadow-sm`, while `admin-withdrawals-view.tsx` uses `shadow-xs`. Background classes alternate between custom variables and hardcoded Tailwind tokens.
*   **The Remedy**: Enforce a strict style token config (e.g., standardizing on `bg-card`, `border-border`, and `shadow-sm` for container boundaries).

### C. Manual Date Formatting Mismatches
In [admin-operations-view.tsx](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/features/admin/views/admin-operations-view.tsx#L123-L132):
```typescript
new Date(trip.departureDate).toLocaleDateString("en-US", { ... })
```
*   **The Issue**: Client-side date parsing causes **hydration discrepancies** if the server timezone differs from the browser's timezone.
*   **The Remedy**: Utilize a shared date utility function (`formatHeaderDate` or a unified date parser) that enforces a single, standardized timezone output (such as UTC/Côte d'Ivoire local time).

---

## 5. Architectural Approach for a Modern Admin Dashboard

To make the dashboard scalable, clean, and highly informative, we must approach it with the following design principles:

```
┌────────────────────────────────────────────────────────┐
│               Global Admin Dashboard                   │
├────────────────────────────────────────────────────────┤
│  [ Real-Time KPIs ] [ Live Charts ] [ System Alerts ]  │
├───────────────────────┬────────────────────────────────┤
│  Real-Time Maps       │  Paystack Ledger vs. Cash Aud  │
│  - Active Departures  │  - Discrepancy checks          │
│  - Boarding Alerts    │  - Settlement reconciliation   │
└───────────────────────┴────────────────────────────────┘
```

1.  **Introduce Visual Charts & Aggregations**:
    Replace card metrics with interactive Area, Bar, and Line charts showing booking trends, payout queues, and registration volumes using `@recharts` (synchronized with TanStack query caching).
2.  **Paystack Ledger vs. Cash Audit View**:
    Create a view that queries Paystack's live cash balance via API and compares it against the local `PAYSTACK_CLEARING` ledger posted balance. If there is a discrepancy (e.g., due to offline payouts or transaction fee updates), flag it with warning banners.
3.  **Real-Time Map & Terminal Operations Board**:
    Integrate a live dispatch board that filters departures by origin terminal, intermediate stops, and destination terminal, allowing admins to track delays and seat occupancies.
4.  **KYC Document Viewer**:
    Add an interactive document review panel that mounts side-by-side: on the left, company details and registration metadata; on the right, an inline PDF/Image viewer (supporting zoom and rotation) to review permits without leaving the tab.
