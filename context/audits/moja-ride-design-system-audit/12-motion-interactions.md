# Moja Ride Design & Design-Engineering Audit
## 12. Motion & Micro-Interactions

### 1. Motion Architecture & Tech Stack

The monorepo uses different motion engines across web and mobile:
- **Web (`apps/web`)**: Tailwind CSS v4 animation utilities, Base UI enter/exit keyframes, and `framer-motion` (v12.42.2 installed in `package.json`).
- **Mobile (`traveler-app` & `driver-app`)**: `react-native-reanimated` (v4.5.1) and `expo-haptics`.

---

### 2. Micro-Interaction Quality by Platform

#### 2.1 Driver Mobile App (Benchmark Standard)
`apps/driver-app` demonstrates exceptional micro-interaction engineering tailored for real-world driving conditions:
- **Tactile Haptic Feedback**: Every significant interaction fires haptic feedback via `DriverFeedback`:
  ```ts
  // apps/driver-app/lib/haptics.ts
  DriverFeedback.tap();    // On tab switch, button press, filter selection
  DriverFeedback.success();// On successful QR ticket scan
  DriverFeedback.error();  // On invalid ticket or duplicate check-in
  DriverFeedback.impact(); // On emergency dispatch alerts
  ```
- **Tab Bar Motion**: Fluid spring transition (`Easing.bezier(0.25, 0.1, 0.25, 1)`) with a 220ms duration smoothly sliding the active indicator pill beneath the driver's finger.
- **Button Feedback**: `TouchableOpacity` active opacity of `0.8` combined with physical haptic impulse.

#### 2.2 Traveler Mobile App
- **Curved Tab Bar**: Implements Reanimated transitions for icon translation (`labelTranslateY`) and label fading (`labelOpacity`).
- **Shortcomings**:
  - Haptic feedback is implemented inconsistently: booking card press has light impact, but tab bar buttons do not trigger haptics.
  - Ticket Sheet modal uses stock React Native `<Modal animationType="slide">`, missing the fluid gesture-dismiss spring physics of `@gorhom/bottom-sheet` or modern iOS sheet controllers.

#### 2.3 Web Dashboards
- **Sidebar Motion**: Base UI / Tailwind collapsible animations (`--animate-collapsible-down: collapsible-down 0.2s ease-out`). Very smooth and predictable.
- **Card Hover States**:
  - In `passenger-dashboard-view.tsx`: `hover:-translate-y-0.5 transition-all duration-300`. Subtle and high-quality.
  - However, in `dashboard-header.tsx`:
    `shadow-[0_0_12px_rgba(57,255,20,0.15),0_0_2px_rgba(57,255,20,1)] transition-shadow duration-150`
    Rogue styling causing harsh glow expansion on hover.
- **Drawer & Dialog Motion**:
  In `packages/ui/src/styles/globals.css`:
  ```css
  --animate-enter: enter 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --animate-exit: exit 150ms cubic-bezier(0.4, 0, 0.2, 1);
  ```
  Fast, clean 150ms transitions that avoid sluggishness.

---

### 3. Missing Motion Capabilities

1. **Page Transitions**: Next.js App Router navigation is abrupt. Neither `framer-motion` nor the React View Transitions API is utilized to animate route transitions between dashboard pages.
2. **List Reordering Motion**: When trips or schedule stops are filtered or sorted, list items instantly jump into place without FLIP (First, Last, Invert, Play) transition animations.
3. **Optimistic Check-In Feedback**: In `operator-bookings-view.tsx`, when an operator checks in a passenger, the row briefly freezes until the mutation resolves, rather than displaying an instantaneous optimistic checkmark.

---

### 4. Motion System Recommendations

1. **Adopt React View Transitions**:
   Enable Next.js view transitions for seamless route transitions between overview pages and detail drawers.
2. **Implement Gesture-Dismissable Sheets in Traveler App**:
   Upgrade the traveler ticket sheet to a true gesture-driven bottom sheet with spring physics and inertia.
3. **Respect Reduced Motion System-Wide**:
   Ensure `prefers-reduced-motion: reduce` disables transform transitions on web, and `AccessibilityInfo.isReduceMotionEnabled` disables Reanimated timing transitions on mobile.
