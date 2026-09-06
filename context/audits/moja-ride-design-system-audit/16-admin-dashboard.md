# Moja Ride Design & Design-Engineering Audit
## 16. Admin Dashboard

### 1. High-Authority Control Surface Archetype

The Admin Dashboard (`apps/web/app/[locale]/dashboard/admin`) is a **high-authority governance and oversight surface** for platform operators and executives.
Key responsibilities:
- **System Solvency & Treasury**: Monitoring Gross Merchandise Value (GMV), platform commissions, escrow liabilities, operator payables, and passenger wallet floats.
- **Operator Due Diligence & Verifications**: Reviewing submitted legal documents, trade registers, insurance policies, and approving/rejecting carrier licenses.
- **Platform Integrity & Abuse Prevention**: Monitoring promotion abuse, referral laundering, transaction anomalies, and dead-letter queues.
- **High-Risk Actions**: Suspending operators, freezing accounts, resolving failed withdrawals, and force-cancelling trips.

---

### 2. Deep-Dive: Admin Overview & Treasury Architecture

In `apps/web/features/admin/views/admin-dashboard-view.tsx`:

#### 2.1 The Two-Tier KPI Architecture
1. **Commercial KPIs (`DashboardKpiCards`)**:
   - GMV, Commission, Total Bookings, Pending Operators.
   - Includes percentage delta badges (`TrendingUp` / `TrendingDown`) with green/destructive color coding.
2. **Treasury & Liquidity Cards (`DashboardTreasuryCards`)**:
   - System Liquidity, Operator Payables, Passenger Wallets float.
   - **Evaluation**: Outstanding financial product architecture. Separating commercial volume from platform balance-sheet liabilities reflects mature financial engineering (benchmarked against Stripe Connect).

#### 2.2 Live Activity Feed & Platform Health
- Renders newly onboarded companies, latest bookings, active trips, and driver marketplace stats.
- Allows administrators to maintain situational awareness of the whole transport network in one view.

---

### 3. Critical Flaws in the Admin Surface

#### 3.1 The Floating Notification Bell Collision
In `apps/web/app/[locale]/dashboard/admin/layout.tsx`:
```tsx
<SidebarInset className="min-h-0 min-w-0 bg-bg-base relative">
  <div className="absolute right-4 top-1.5 z-40">
    <NotificationInbox />
  </div>
  <main className="flex min-h-0 flex-1 flex-col">{children}</main>
</SidebarInset>
```
- **The Defect**: Because the layout does not provide a common header, `<NotificationInbox />` is pinned absolutely at `top-1.5 right-4`.
- **The Consequence**: On every admin page that renders its own action buttons in the top right (e.g. "Export CSV", "New Campaign", "Filter"), the floating bell icon hovers directly on top of the button, blocking clicks.
- **Duplication**: Furthermore, every single admin page file (`users/travelers/page.tsx`, `users/operators/page.tsx`, `staff/page.tsx`, `settings/page.tsx`, `operations/page.tsx`, `content/posts/page.tsx`) must copy-paste an identical 48px `<header>` block.

#### 3.2 Dark Mode Text Inversion Crash
Across admin views:
- `admin/page.tsx` line 64: `text-slate-900`
- `admin/page.tsx` line 67: `text-slate-500`
- `withdrawals-table.tsx`: Table headers and text hardcoded to `text-slate-900`.
- If dark mode is ever activated on web, these titles and numbers will render near-black against a `#171717` dark background, rendering the administrative surface completely illegible.

#### 3.3 High-Risk Actions Lack Friction & Deliberation
- Suspending an operator or rejecting an onboarding carrier in `admin-verification-details-view.tsx` uses standard dialog buttons.
- For irreversible actions (e.g. revoking a carrier license or force-reversing a settlement), modern enterprise systems require typing the entity name (e.g. "Type SUSPEND to confirm") or displaying a high-contrast warning banner explaining downstream financial consequences (cancelled passenger trips).

---

### 4. Admin Dashboard Scorecard

| Dimension | Score | Comments |
| :--- | :---: | :--- |
| **Financial Visibility** | `8.0 / 10` | Excellent treasury metrics, GMV trends, and ledger separation. |
| **Layout Integrity** | `4.2 / 10` | Broken header architecture with floating notification bell overlaying page content. |
| **Theme Compatibility** | `3.5 / 10` | Hardcoded `slate-900` text guarantees dark mode failure. |
| **Table Implementation** | `7.0 / 10` | Uses `@tanstack/react-table` on core views, but lacks column pinning. |
| **Error Resilience** | `3.0 / 10` | Missing `error.tsx`; unhandled errors crash the entire admin panel. |

---

### 5. Admin Dashboard Remediation Roadmap

1. **Unify Admin Layout Header**:
   - Move header into `apps/web/app/[locale]/dashboard/admin/layout.tsx`.
   - Anchor `<NotificationInbox />` inside the header flow.
   - Delete manual `<header>` declarations duplicated across all 15+ admin pages.
2. **Replace Hardcoded `slate-900`**:
   - Convert all `text-slate-900` to `text-foreground` and `text-slate-500` to `text-muted-foreground`.
3. **Add `error.tsx` Boundary**:
   - Create `apps/web/app/[locale]/dashboard/admin/error.tsx` with dedicated retry and error digest reporting.
4. **Implement High-Risk Action Guardrails**:
   - Upgrade suspension and revocation dialogs with high-friction confirmation requirements.
