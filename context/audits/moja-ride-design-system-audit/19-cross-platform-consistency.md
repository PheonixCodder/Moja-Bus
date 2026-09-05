# Moja Ride Design & Design-Engineering Audit
## 19. Cross-Platform Consistency Matrix

### 1. The Direct Cross-Product Comparison

To evaluate whether Moja Ride functions as a unified product ecosystem or as a loose assembly of independently built applications, we compare all 15 major design dimensions across the five platform surfaces:

| Design Element | Passenger Web | Operator Web | Admin Web | Traveler Mobile | Driver Mobile | Assessment & Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Brand Colors** | `#ee237c` + rogue `bg-neon` | `#ee237c` + pitch black banner | `#ee237c` + hardcoded `slate-900` | `#ee237c` (primary) | `#ee237c` (rose) + `#be123c` | **Design Drift**: Core magenta is shared, but diluted by rogue colors and hardcoded slates. |
| **Neutrals** | OKLCH + ghost `text-text-*` | OKLCH + ghost `bg-bg-*` | Raw Tailwind `slate-*` | HSL v3 channels | Custom `#09090b` / `#18181b` | **Design Debt**: 4 competing neutral palettes across surfaces. |
| **Typography** | Montserrat (Tailwind) | Montserrat (Tailwind) | Montserrat (Tailwind) | Montserrat (Web prose markdown) | Montserrat (Custom vehicle utilities) | **Incoherent**: Traveler mobile copies web prose; Driver has intentional scale. |
| **Buttons** | `@moja/ui` (h-8 default, no loading) | `@moja/ui` (h-8 default, no loading) | `@moja/ui` (h-8 default, no loading) | `Pressable` (h-10 default, no loading) | `TouchableOpacity` (52px/60px, has loading + haptics) | **Fragmented**: 3 distinct button implementations with different sizes and state contracts. |
| **Inputs** | `@moja/ui` (h-8 bare primitive) | `@moja/ui` (h-8 bare primitive) | `@moja/ui` (h-8 bare primitive) | `TextInput` (h-10 bare primitive) | Compound component (56px, has labels, icons, errors) | **Divergent**: Web & Traveler lack coupled error/label states; Driver is all-in-one. |
| **Cards** | Subtle gradient hero + bordered cards | Black hero + bordered cards | Bordered cards (`p-4`/`p-6`) | Bordered rounded-2xl cards | Dark OLED cards (`#18181b`) | **Acceptable**: Appropriate visual density adjustments between consumer and in-cab. |
| **Radius** | `rounded-xl` (12px) | `rounded-2xl` (16px) | `rounded-xl` (12px) | `rounded-md` (6px) / `rounded-2xl` | `rounded-2xl` (16px) | **Design Drift**: Inconsistent corner roundness across platforms. |
| **Shadows** | `shadow-xs` / inline neon shadow | `shadow-md` / `shadow-lg` | `shadow-sm` | `shadow-black/5` | Zero shadow / strong borders | **Design Drift**: No centralized elevation tokens. |
| **Spacing** | Unconstrained layout (`w-full`) | `max-w-[1400px]` centered | `max-w-7xl` centered | Varied padding | `maxWidth: 480` centered, 20px gap | **Design Drift**: Passenger web blows out on ultrawide; driver is disciplined. |
| **Navigation** | Sidebar + Sticky Header + Search | Sidebar + Sticky Header + Search | Sidebar + **No layout header** | Curved Floating SVG Tab Bar | Linear In-Cab Tab Bar + Haptics | **Design Debt**: Admin dashboard is missing layout header; mobile is intentionally differentiated. |
| **Headers** | Search + Notifications | Search + Quick Actions + Notifs | **Page-level headers with bell collision** | `PageHeader` (insets + bell) | `PageHeader` (back + title + right slot) | **Critical Flaw**: Admin layout bell blocks page buttons. |
| **Statuses** | Custom timeline dots | `TRIP_STATUS_CONFIG` | Local `STATUS_CONFIG` | Local `STATUS_CONFIG` | Local `Badge` variants | **Critical Flaw**: Same status (Departed) is purple in Admin, gray in Operator, blue in Traveler! |
| **Loading** | No `loading.tsx` (Suspense) | Full-screen spinner (`loading.tsx`) | Skeletons in views | ActivityIndicator in sheets | Screen loaders | **Fragmented**: Operator flashes full-screen spinners on tab changes. |
| **Empty States**| Ad-hoc empty divs | Ad-hoc empty divs | Ad-hoc empty divs | Ad-hoc empty views | Ad-hoc empty views | **Design Debt**: `@moja/ui/empty` is bypassed monorepo-wide. |
| **Error States**| **Missing** `error.tsx` | Implements `error.tsx` | **Missing** `error.tsx` | Unhandled error views | Alert dialogs | **P0 UX Risk**: Passenger & Admin crash completely on network errors. |
| **Motion** | Base UI CSS transitions | Base UI CSS transitions | Base UI CSS transitions | Reanimated tab bar | Reanimated tab bar + Haptics | **Acceptable**: Appropriate platform-native motion engines. |

---

### 2. Distinguishing Intentional Divergence from Design Drift

Not all cross-platform differences are bugs. It is vital to categorize variations correctly:

#### 2.1 Intentional Divergences (KEEP & PROTECT)
1. **Driver In-Cab Touch Targets (52px–60px)**:
   - *Why*: Drivers operate mobile phones and mounted tablets while vehicles are moving or idling. Large buttons prevent mis-taps.
   - *Action*: **Keep**. Do not shrink driver buttons to match web's 36px size.
2. **Driver Dark-Only Interface**:
   - *Why*: In-vehicle transit cockpits cannot switch to glaring white light during night driving.
   - *Action*: **Keep**. Preserve dark-only mode for driver/conductor screens.
3. **Traveler Curved Notch Tab Bar**:
   - *Why*: Provides distinct consumer brand personality and easy thumb reach for primary bus search.
   - *Action*: **Keep**.

#### 2.2 Accidental Design Drift (MUST UNIFY)
1. **Domain Status Badges**:
   - *Why*: A passenger, operator, and administrator should all recognize a "Departed" trip or "Confirmed" booking instantly by the same color and icon.
   - *Action*: **Unify into shared `@moja/ui` status component**.
2. **Ghost Token Pollution (`text-text-primary`, `bg-bg-base`)**:
   - *Why*: Classes designed for Driver NativeWind were accidentally copy-pasted into 32+ web files where they render unstyled.
   - *Action*: **Codemod and eliminate**.
3. **Currency & Number Formatting**:
   - *Why*: Users seeing "12 500 XOF" in one view and "12,500 FCFA" in another view lose transaction confidence.
   - *Action*: **Unify into shared `<CurrencyAmount>` component**.
4. **Header Architecture in Admin**:
   - *Why*: Admin lacks a layout header, forcing each page to recreate one while a floating notification bell blocks page action triggers.
   - *Action*: **Move header into `layout.tsx`**.
