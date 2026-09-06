# Moja Ride Design & Design-Engineering Audit
## 28. Missing Design Capabilities

### 1. The Benchmark Against World-Class Transport Systems

When comparing Moja Ride conceptually against industry-leading transit, logistics, and fintech platforms (Uber, Airbnb, Stripe, Linear, Vercel), several critical design-system capabilities are conspicuously absent.

---

### 2. The 10 Missing Design Capabilities

#### 1. Domain Status Badge System
- **What is Missing**: A centralized, type-safe status component mapping all backend schema enums (`TripStatus`, `BookingStatus`, `CarrierStatus`, `WithdrawalStatus`, `StaffStatus`) to standardized colors, semantic dot indicators, and localized labels.
- **Why It Matters**: Prevents 15+ conflicting re-declarations across the monorepo.

#### 2. Universal `<CurrencyAmount>` Formatter Component
- **What is Missing**: A shared formatting primitive handling XOF/FCFA currency values with:
  - Non-breaking spaces (`&nbsp;`)
  - Compact vs full notations (`12.5K FCFA` vs `12 500 FCFA`)
  - Locale-aware thousands separators
  - Standardized tabular numerals (`tabular-nums font-sans`).
- **Why It Matters**: Eliminates currency notation drift and financial display jitter.

#### 3. Native Button Loading State Machine
- **What is Missing**: An integrated `loading?: boolean` prop on `Button` that:
  - Retains original button dimensions to prevent layout shift.
  - Automatically sets `disabled` and `aria-busy="true"`.
  - Replaces or prefixes the icon with a standardized spinner.
- **Why It Matters**: Eliminates manual `<Spinner>` insertion across 40+ form components.

#### 4. Shared Mobile Screen Container (`ScreenShell`) in Traveler App
- **What is Missing**: A standardized screen wrapper in `apps/traveler-app` matching the quality of `apps/driver-app/components/ui/ScreenShell.tsx`.
  - Handles `useSafeAreaInsets` automatically.
  - Enforces standard horizontal padding (16px or 20px).
  - Handles keyboard avoidance (`KeyboardAvoidingView`) on iOS and Android.
- **Why It Matters**: Prevents every mobile screen from reinventing safe-area padding and scroll views.

#### 5. High-Density Operational Data Table Pattern
- **What is Missing**: A pre-composed, high-density React Table template in `@moja/ui` featuring:
  - Compact row heights (40px–44px)
  - Column pinning for selection checkboxes and action menus
  - Built-in pagination and sorting
  - Keyboard navigation (Up/Down arrow keys).
- **Why It Matters**: Enables the Operator Dashboard to decommission its cumbersome 50-card booking list.

#### 6. Cross-Platform Token Synchronization Pipeline
- **What is Missing**: A build tool (Style Dictionary or custom token generator) compiling `@moja/theme/tokens.ts` into:
  - Tailwind CSS v4 variables for Web
  - NativeWind v4 theme variables for Traveler Mobile
  - TypeScript constants for Driver Mobile.
- **Why It Matters**: Ensures a color or spacing change in the design system propagates instantly across all three products without manual copy-pasting.

#### 7. Fluid Bottom Sheet Controller for Mobile
- **What is Missing**: A gesture-driven bottom sheet library (e.g. `@gorhom/bottom-sheet`) with native spring physics, drag handle friction, and keyboard elevation.
- **Why It Matters**: Replaces stock React Native modal sheets with smooth iOS/Android native interaction quality.

#### 8. High-Friction Action Confirmation Component
- **What is Missing**: A dedicated high-security confirmation dialog for destructive or high-risk administrative operations (revoking operator licenses, force-cancelling trips, clawing back payouts). Requires typing the entity reference or confirmation phrase.
- **Why It Matters**: Prevents catastrophic accidental clicks by administrators.

#### 9. Automated Token Governance & Linting
- **What is Missing**: Biome / ESLint rules that actively flag and fail CI when:
  - An undefined utility class is detected (e.g. `bg-bg-base`, `text-text-primary`).
  - Raw color utilities (`bg-slate-900`, `text-slate-500`) are used where semantic tokens exist (`bg-card`, `text-muted-foreground`).
  - An interactive `div` is missing keyboard accessibility attributes.
- **Why It Matters**: Prevents design drift from re-entering the codebase.

#### 10. Living Design System Documentation (Storybook / Catalog)
- **What is Missing**: An interactive component catalog displaying all variants, sizes, and states of `@moja/ui` components with accessibility annotations.
- **Why It Matters**: Developers cannot use components they do not know exist, which is why `@moja/ui/empty.tsx` was abandoned.
