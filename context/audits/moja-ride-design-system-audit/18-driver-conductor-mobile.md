# Moja Ride Design & Design-Engineering Audit
## 18. Driver & Conductor Mobile App

### 1. In-Cab Operational Archetype

The Driver & Conductor Mobile App (`apps/driver-app`) is a **tactical in-vehicle operational instrument** used by bus drivers and conductors under demanding conditions:
- **Cockpit Mounting**: Mounted on bus dashboards, operated at arm's length.
- **Extreme Lighting Conditions**: Direct African sunlight during daytime, glare-sensitive darkness at night.
- **Physical Vibration & Movement**: Vehicle vibration and road bumps require very large touch targets.
- **High Stress / Split Attention**: Drivers must glance at the screen for less than 1 second to confirm passenger boarding, navigation turns, or dispatch instructions.

---

### 2. Deep-Dive: Tactical Design Engineering

#### 2.1 The High-Contrast Dark-Only Palette
In `apps/driver-app/constants/theme.ts`:
- **Background**: `#09090b` (Deep Zinc / OLED Black)
- **Surfaces**: `#18181b` (Card), `#27272a` (Elevated)
- **Text**: `#fafafa` (Primary, 16:1 contrast ratio against background)
- **Borders**: `#27272a` (Subtle), `#3f3f46` (Strong)
- **Accent**: `#ee237c` (Primary Rose)
- **Evaluation**: Exemplary design decision. Rather than forcing a light/dark theme switch that might accidentally blind a night driver, the app locks into a high-contrast dark OLED palette optimized for night and day readability in transit vehicles.

#### 2.2 In-Cab Touch Ergonomics
In `apps/driver-app/components/ui/Button.tsx`:
- `size="sm"`: `h-10` (40px)
- `size="md"`: `h-13` (52px)
- `size="lg"`: `h-15` (60px)
- In `apps/driver-app/components/ui/Input.tsx`:
  - `h-14` (56px) input height with built-in clear touch areas.
- **Evaluation**: Completely complies with physical vehicle UI standards. Drivers can reliably hit check-in and start-trip buttons even while the vehicle is idling or moving.

#### 2.3 Tactile Haptic Feedback
Every touch trigger, tab change, and scanner action fires physical haptic impulses via `DriverFeedback.tap()`, `DriverFeedback.success()`, and `DriverFeedback.error()`. Drivers receive immediate physical confirmation without taking their eyes off the road.

#### 2.4 Role-Based Interface Adaptation
In `apps/driver-app/components/TabBar.tsx` lines 50–52:
```ts
const activeTabs = isConductor
  ? TABS.filter((tab) => tab.name !== "offers" && tab.name !== "live")
  : TABS;
```
Conductors are automatically relieved of vehicle telematics and job offer interfaces, displaying only Trips, QR Scanner, and Profile.

---

### 3. Weaknesses & Siloed Architecture

1. **Complete Monorepo Isolation**:
   - `apps/driver-app` does not import `@moja/theme` or `@moja/ui`.
   - It maintains its own duplicate token file (`constants/theme.ts`) and duplicate component library (`components/ui/`).
   - PascalCase naming (`Button.tsx`, `Input.tsx`, `Card.tsx`, `Badge.tsx`) deviates from the rest of the monorepo's kebab-case convention.
2. **Hardcoded Hex Values**:
   - `Button.tsx` hardcodes hex styles in style objects (`bg-[#ee237c]`, `bg-[#27272a]`, `bg-[#ef4444]`, `bg-[#10b981]`).
   - `Input.tsx` hardcodes `#18181b`, `#d4d4d8`, `#71717a`.
   - While internally consistent, these values cannot be updated centrally from `@moja/theme`.

---

### 4. Driver Mobile Scorecard

| Dimension | Score | Comments |
| :--- | :---: | :--- |
| **In-Cab Ergonomics** | `9.2 / 10` | 52px-60px buttons, 56px inputs, tablet max-width constraint. Superb. |
| **Tactile Quality** | `9.0 / 10` | Comprehensive haptic feedback across all actions. |
| **Typography Appropriateness**| `8.5 / 10` | Custom scale (`h1` 28px, `h2` 22px, `body-md` 14px) fits vehicle UI perfectly. |
| **Design System Integration** | `2.5 / 10` | Completely disconnected from monorepo packages; hardcoded hex values. |

---

### 5. Driver Mobile Remediation Roadmap

1. **Extract Driver Design Tokens into Shared System**:
   - Elevate the driver app's semantic token model (`colors.semantic.success`, `warning`, `streak`, `neutral.elevated`) into `@moja/theme`.
2. **Replace Hardcoded Hex Styles with Theme References**:
   - Codemod `Button.tsx` and `Input.tsx` to consume tokens from `@moja/theme` rather than inline raw hex strings.
3. **Standardize Component File Naming**:
   - Rename PascalCase component files (`Button.tsx` → `button.tsx`) to match monorepo conventions.
