# Moja Ride Design & Design-Engineering Audit
## 25. Design Anti-Patterns

### 1. Catalog of Detected Anti-Patterns

A design anti-pattern is an implementation pattern that superficially appears to solve a problem, but creates technical debt, visual discord, or operational friction in production.

Below is the definitive catalog of anti-patterns identified in the Moja Ride monorepo:

---

### Anti-Pattern 1: The "Ghost Token" Illusion
- **Location**: Over 32 files across `apps/web` (Passenger, Operator, Admin).
- **Manifestation**:
  ```tsx
  className="bg-bg-base text-text-primary text-text-muted hover:border-border-strong"
  ```
- **Why It Is An Anti-Pattern**:
  Developers wrote these classes believing they mapped to a unified token system. In reality, they are completely unmapped in web CSS. The classes fail silently, generating zero CSS output. Elements render with no background and inherit default text colors, masking missing styling behind browser defaults until an unexpected background exposes the flaw.

---

### Anti-Pattern 2: The "Radioactive Glow" CTA
- **Location**: `apps/web/features/dashboard/components/dashboard-header.tsx` line 36.
- **Manifestation**:
  ```tsx
  className="... bg-neon text-black shadow-[0_0_12px_rgba(57,255,20,0.15),0_0_2px_rgba(57,255,20,1)] hover:bg-neon/90"
  ```
- **Why It Is An Anti-Pattern**:
  An electric-green glowing button placed in the top header of a consumer dashboard whose brand identity is `#ee237c` magenta. It screams "copy-pasted from a dark-mode cyber template" and immediately destroys product credibility.

---

### Anti-Pattern 3: Inverted Hero Shock (Light Mode Night-Card)
- **Location**: `apps/web/features/operator/views/operator-dashboard-view.tsx` line 110.
- **Manifestation**:
  ```tsx
  className="rounded-2xl bg-slate-900 border border-slate-800 p-6 text-white shadow-lg"
  ```
- **Why It Is An Anti-Pattern**:
  In a light-mode operational dashboard, a giant pitch-black card sits at the top of the page. It commands 80% of visual weight while providing almost no operational value (just a company name and decorative bus silhouette), pushing the actual operational dispatch tables below the fold.

---

### Anti-Pattern 4: "Card Soup" Instead of Operational Tables
- **Location**: `apps/web/features/operator/views/operator-bookings-view.tsx`.
- **Manifestation**: Rendering 50 stacked `<Card>` components vertically instead of a compact tabular data grid.
- **Why It Is An Anti-Pattern**:
  Cards are designed to isolate independent, heterogeneous entities (e.g. social media posts, destination guides). For uniform, homogeneous operational records (e.g. passenger boarding lists), cards create visual bloat, force 7,000px of scrolling, and prevent column sorting.

---

### Anti-Pattern 5: The Unanchored Floating Header Overlay
- **Location**: `apps/web/app/[locale]/dashboard/admin/layout.tsx`.
- **Manifestation**:
  ```tsx
  <div className="absolute right-4 top-1.5 z-40">
    <NotificationInbox />
  </div>
  ```
- **Why It Is An Anti-Pattern**:
  Placing an absolute overlay at the layout level while child pages define their own headers creates an uncoordinated visual conflict. The notification bell physically floats over right-aligned buttons on child pages.

---

### Anti-Pattern 6: Desktop Web Prose Typography in Mobile Native
- **Location**: `apps/traveler-app/components/ui/text.tsx`.
- **Manifestation**:
  ```tsx
  h2: "border-border border-b pb-2 text-3xl font-semibold tracking-tight"
  ```
- **Why It Is An Anti-Pattern**:
  Pasting desktop markdown article typography (with horizontal rule borders and 30px font sizes) into a mobile React Native app causes layout breaks inside modal sheets and cards.

---

### Anti-Pattern 7: Muted Pastel Dilution for Core Selections
- **Location**: `apps/web/features/booking/components/passenger-seat-map.tsx` line 205.
- **Manifestation**:
  ```tsx
  isSelected ? "border-pink-400 bg-pink-100 text-pink-800 ring-2 ring-pink-300" : ...
  ```
- **Why It Is An Anti-Pattern**:
  Using Tailwind's pale pastel `pink-100` instead of the bold brand magenta (`#ee237c`). It looks like a disabled or tentative state rather than an active seat selection, and conflicts with the mobile app's solid magenta treatment.

---

### Anti-Pattern 8: Disconnected Reusable Primitives
- **Location**: `@moja/ui/src/components/ui/empty.tsx`.
- **Manifestation**: A full 105-line Base UI empty state component exists in the shared library, but is bypassed by 25+ views across the codebase.
- **Why It Is An Anti-Pattern**:
  Building reusable components in a shared package without governance or team adoption leads to "phantom architecture"—the components look great in Storybook or package exports, but are dead code in production.
