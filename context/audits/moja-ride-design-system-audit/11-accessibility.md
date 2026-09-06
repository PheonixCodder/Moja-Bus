# Moja Ride Design & Design-Engineering Audit
## 11. Accessibility (a11y) & Inclusive Design

### 1. WCAG 2.1 Compliance Audit Summary

The Moja Ride monorepo exhibits significant accessibility violations across WCAG 2.1 AA criteria, particularly in **touch target sizing**, **semantic element structure**, **color contrast**, and **focus management**:

| WCAG Criteria | Severity | Status | Primary Violations |
| :--- | :---: | :---: | :--- |
| **2.5.5 Target Size** (AAA / Mobile Best Practice) | **P0** | **FAIL** | Buttons sized at `h-7` (28px), `h-8` (32px), `h-6` (24px). |
| **1.4.3 Contrast (Minimum)** (AA) | **P1** | **FAIL** | Faint gray text from ghost tokens; hardcoded `text-slate-900` in dark contexts; low-contrast pastel pink seat selections. |
| **2.1.1 Keyboard Navigation** (AA) | **P1** | **FAIL** | Clickable `<div>` elements and table rows without keyboard event handlers or `role="button"`. |
| **2.4.7 Focus Visible** (AA) | **P2** | **PARTIAL** | Base UI buttons have visible rings; custom cards and clickable rows strip focus outlines. |
| **4.1.2 Name, Role, Value** (AA) | **P2** | **FAIL** | Custom tab bars in drawers built with raw `div` tags lacking ARIA tab roles and `aria-selected`. |
| **2.3.3 Animation from Interactions** (AAA) | **P3** | **PARTIAL** | Web CSS defines `@media (prefers-reduced-motion)` for some elements, but Reanimated animations on mobile ignore system reduced-motion settings. |

---

### 2. Deep-Dive: Target Size Violations (Touch Ergonomics)

Mobile touch guidelines (Apple Human Interface Guidelines specify minimum **44x44 pt**, Google Material Design specifies **48x48 dp**):

#### Violations in Codebase
1. **`@moja/ui/src/components/ui/button.tsx`**:
   - `size="xs"`: `h-6` (24px)
   - `size="sm"`: `h-7` (28px)
   - `size="default"`: `h-8` (32px)
   - When these buttons are rendered on mobile browsers or responsive views, they represent a severe motor accessibility hazard.
2. **`apps/traveler-app/components/ui/button.tsx`**:
   - `size="sm"`: `h-9 sm:h-8` (36px desktop / 32px small screen)
   - Falls 12px short of Apple's minimum 44px touch target.
3. **`apps/web/features/passenger/views/saved-passengers-view.tsx` line 308**:
   - Edit/Delete action trigger: `text-[10px] font-extrabold py-0.5 px-2 rounded-md`. The effective hit target is less than 20px in height.

---

### 3. Semantic Structure & Keyboard Navigation

#### Clickable `<div>` Elements Without Keyboard Accessibility
In `apps/web/features/admin/components/campaigns/admin-campaign-drawer.tsx` lines 231, 244, 257, 270:
```tsx
<div
  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${...}`}
  onClick={() => setActiveTab("redemptions")}
>
  ...
</div>
```
- **The Violation**: Custom tab switching implemented via `<div onClick=...>`:
  - Missing `role="tab"`
  - Missing `tabIndex={0}`
  - Missing `aria-selected={activeTab === "redemptions"}`
  - Missing `onKeyDown` handler (Enter / Space bar)
  - A keyboard-only or screen-reader user cannot focus, tab to, or activate these tabs.

#### Clickable Cards in Verification Queue
In `apps/web/features/admin/views/admin-driver-verifications-view.tsx` lines 112, 135, 158:
```tsx
<div
  className={`p-5 rounded-2xl border cursor-pointer transition-all ${...}`}
  onClick={() => handleFilterStatus(filter.status)}
>
```
- Interactive filter card implemented as a plain `div`. Unreachable via Tab key navigation.

---

### 4. Color-Only State Communication

WCAG 1.4.1 requires that color is not used as the sole visual means of conveying information or indicating an action:
- **Passenger Seat Map (`passenger-seat-map.tsx`)**:
  - Web seat status is indicated by green (Available), amber (Held), gray (Sold), and pink (Selected).
  - While text labels appear on hover, a color-blind user (e.g. protanopia or deuteranopia) struggles to distinguish between the pale green (`bg-emerald-50`) and pale amber (`bg-amber-50`) seat backgrounds.
  - **Remediation**: Add explicit geometric iconography or pattern differentiation (e.g. checkmark icon for selected, lock icon for held, dot pattern for sold).

---

### 5. Accessibility Remediation Roadmap

1. **Enforce 44px Minimum Touch Targets**:
   - In `@moja/ui/button.tsx`, ensure all mobile-exposed sizes have `min-h-[44px]` or use transparent padding expansion (`touch-target-expansion`).
2. **Eliminate All Clickable `div` Anti-Patterns**:
   - Codemod all `<div onClick=...>` instances to `<button type="button">` or wrap in `@base-ui/react` primitives.
3. **Audit Color Blindness on Seat Map**:
   - Supplement colors with secondary visual indicators (patterns, icons, letter badges).
4. **Implement Focus-Visible Rings Across All Interactive Elements**:
   - Enforce `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` on all custom cards and table rows.
