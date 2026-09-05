# Moja Ride Design & Design-Engineering Audit
## 14. Passenger Web Experience

### 1. Consumer Product Archetype & Design Intent

The passenger-facing web dashboard (`apps/web/app/[locale]/dashboard/(passenger)`) is a **consumer travel portal**, not an internal enterprise tool.
A passenger is evaluating:
- **Trust & Safety**: Is my booking secure? Is my seat confirmed?
- **Clarity**: Where do I board? When does my bus leave? What is my ticket QR code?
- **Ease of Access**: Can I quickly find a bus, top up my wallet, or view past trips?

---

### 2. Deep-Dive: The Passenger Overview Page

In `apps/web/features/dashboard/views/passenger-dashboard-view.tsx`:

#### 2.1 The Hero & Quick Search
- Lines 156–172:
  ```tsx
  <div className="bg-linear-to-r from-primary/10 via-primary/5 to-card border border-border/80 rounded-xl p-6 relative overflow-visible shadow-xs dark:bg-card">
    <div className="relative z-10 space-y-4">
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
        {t("portal")}
      </span>
      <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground">
        {t("greeting", { name: userName })}
      </h1>
      <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
        {t("welcomeDescription")}
      </p>
      <DashboardQuickSearch />
    </div>
  </div>
  ```
- **Evaluation**: Strong visual presentation. The subtle gradient background (`from-primary/10 via-primary/5 to-card`) establishes brand presence without visual clutter. Integrating `DashboardQuickSearch` directly into the welcome hero enables instant booking discovery without navigating away.

#### 2.2 Live Boarding Pass Widget
- Lines 141–154: If departure is within 24 hours (`showLivePass`), a dedicated `<LiveBoardingPass />` widget mounts at the very top of the page.
- **Evaluation**: Outstanding consumer UX design decision. Surfacing the active trip's origin, destination, seat, and QR ticket at the top of the dashboard ensures passengers don't have to hunt through booking histories while in a rush at a bus terminal.

#### 2.3 Recent Bookings Timeline
- Lines 275–380:
  - Renders recent bookings as a vertical timeline with colored status dots (`isConfirmed && "border-emerald-500 bg-emerald-500"`, `isPending && "border-amber-500 bg-amber-500"`).
  - Quick action buttons: "QR Code" (ticket), "Pay" (credit card trigger), or "Details".
  - **Evaluation**: Intuitive, high-clarity timeline layout. The primary action is prominently differentiated based on booking status.

---

### 3. Critical Flaws in the Passenger Web Surface

#### 3.1 Unconstrained Ultrawide Layout Blowout
The entire passenger dashboard view is wrapped in:
`className="flex flex-1 flex-col gap-6 p-4 lg:p-6"`
- There is no `max-w-7xl` or `max-w-6xl` container wrapper.
- On large desktop monitors (1920x1080 or 2560x1440), cards stretch the full width of the screen. Reading a single booking row requires scanning across 2,000 horizontal pixels.

#### 3.2 Radioactive Green CTA in Header
In `apps/web/features/dashboard/components/dashboard-header.tsx`:
```tsx
<Link
  href="/"
  className="inline-flex items-center gap-1.5 rounded-md bg-neon px-3 py-1.5 text-sm font-semibold text-black shadow-[0_0_12px_rgba(57,255,20,0.15),0_0_2px_rgba(57,255,20,1)] transition-shadow duration-150 hover:bg-neon/90"
>
```
A glaring visual clash that disrupts the sophisticated aesthetic established in the rest of the passenger dashboard.

#### 3.3 Ghost Token Pollution Across Passenger Views
- In `passenger-tickets-view.tsx`: Uses `bg-bg-base`, `text-text-primary`, `text-text-muted`.
- In `saved-passengers-view.tsx`: Table headers use `bg-bg-base`, row badges use `text-text-primary`.
- In `transaction-history.tsx`: Card headers and table rows use `bg-bg-base` and `text-text-muted`.
- Result: On production builds, these elements render without intended background fills or text color hierarchy.

---

### 4. Passenger Experience Scorecard

| Dimension | Score | Comments |
| :--- | :---: | :--- |
| **Trust & Security** | `7.5 / 10` | Strong QR presentation, live boarding pass, and transparent hold countdowns. |
| **Visual Hierarchy** | `6.8 / 10` | Strong hero section, but layout blows out on wide viewports. |
| **Component Consistency** | `4.2 / 10` | Fractured between semantic tokens and unstyled ghost classes (`bg-bg-base`). |
| **Information Density** | `7.0 / 10` | Appropriate breathing room for consumer travel. |
| **Accessibility** | `5.0 / 10` | Action buttons in tables lack minimum touch heights; missing `error.tsx`. |

---

### 5. Remediation Roadmap for Passenger Web

1. **Constrain Dashboard Width**: Wrap passenger dashboard content in `max-w-7xl mx-auto w-full`.
2. **Eliminate Ghost Tokens**: Replace `bg-bg-base` with `bg-card` and `text-text-primary` with `text-foreground`.
3. **Remove `bg-neon` Button**: Convert the header search CTA to standard brand magenta.
4. **Add `error.tsx`**: Prevent dashboard crashes by introducing a consumer-friendly error boundary with a "Try Again" button.
