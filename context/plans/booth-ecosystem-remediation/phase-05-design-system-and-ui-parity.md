# Phase 05: Design System & Feature-Driven UI Parity

> **Phase Focus**: Port 32 shadcn Primitives from `traveler-app`, Configure `components.json`, and Adopt Feature-Driven Architecture  
> **Defects Resolved**: `BTH-P2-01`, `BTH-P2-02`, `BTH-P2-05`, `BTH-P3-04`  

---

## 1. Problem Definition & Root Causes

1. **84% Component Deficit (`BTH-P2-01`)**: `apps/booth-app` possesses only 5 custom components (`Button.tsx`, `Input.tsx`, `Card.tsx`, `Badge.tsx`, `Text.tsx`), while `apps/traveler-app` includes 32 accessible primitives built with `@rn-primitives/*`.
2. **Missing `components.json` (`BTH-P2-02`)**: `booth-app` has no shadcn CLI configuration, preventing use of standard component generators.
3. **Monolithic Screens (`BTH-P2-05`)**: Screen files in `app/sell/` intermingle data fetching, state mutations, and raw JSX styling.
4. **Bypassed Primitives**: Screens ignore the existing `components/ui/` folder and write ad-hoc inline `<TouchableOpacity>` and `<Text>` elements.
5. **Small Touch Targets (`BTH-P3-04`)**: Critical action elements use `py-1.5` (~32px height), causing frequent mis-taps on counter tablets.

---

## 2. Implementation Specifications

### Step 1: Create `components.json`
File: `apps/booth-app/components.json`
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "global.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### Step 2: Install UI Dependencies
In `apps/booth-app/package.json`, add:
```json
"@rn-primitives/accordion": "^1.5.2",
"@rn-primitives/alert-dialog": "^1.5.2",
"@rn-primitives/aspect-ratio": "^1.5.2",
"@rn-primitives/avatar": "^1.5.2",
"@rn-primitives/checkbox": "^1.5.2",
"@rn-primitives/collapsible": "^1.5.2",
"@rn-primitives/dialog": "^1.5.2",
"@rn-primitives/dropdown-menu": "^1.5.2",
"@rn-primitives/label": "^1.5.2",
"@rn-primitives/popover": "^1.5.2",
"@rn-primitives/portal": "~1.4.0",
"@rn-primitives/progress": "^1.5.2",
"@rn-primitives/radio-group": "^1.5.2",
"@rn-primitives/select": "^1.5.2",
"@rn-primitives/separator": "^1.5.2",
"@rn-primitives/slot": "^1.5.2",
"@rn-primitives/switch": "^1.5.2",
"@rn-primitives/tabs": "^1.5.2",
"@rn-primitives/tooltip": "^1.5.2",
"class-variance-authority": "^0.7.1"
```

### Step 3: Port Primitive Suite from `traveler-app`
Copy the validated, accessibility-compliant primitives from `apps/traveler-app/components/ui/` to `apps/booth-app/components/ui/`:
```
apps/booth-app/components/ui/
├── alert-dialog.tsx
├── alert.tsx
├── avatar.tsx
├── badge.tsx
├── button.tsx
├── card.tsx
├── checkbox.tsx
├── dialog.tsx
├── dropdown-menu.tsx
├── input.tsx
├── label.tsx
├── popover.tsx
├── progress.tsx
├── radio-group.tsx
├── select.tsx
├── separator.tsx
├── skeleton.tsx
├── switch.tsx
├── tabs.tsx
├── text.tsx
└── tooltip.tsx
```
*Note: Deprecate and remove legacy capitalized files (`Button.tsx`, `Input.tsx`, `Card.tsx`, `Badge.tsx`, `Text.tsx`).*

### Step 4: Add Navigation Theme & Portal Host
File: `apps/booth-app/app/_layout.tsx`
```tsx
import { PortalHost } from "@rn-primitives/portal";
import { ThemeProvider } from "expo-router";
import { NAV_THEME } from "@/lib/theme";

// Inside RootLayout JSX:
<ThemeProvider value={NAV_THEME}>
  <View className="flex-1 light" style={{ backgroundColor: colors.neutral.background }}>
    <Stack ...>
      ...
    </Stack>
    <Toast />
    <PortalHost />
  </View>
</ThemeProvider>
```

### Step 5: Restructure to Feature Modules
Organize domain code matching monorepo conventions:
```
apps/booth-app/features/
├── auth/
│   ├── components/auth-shell.tsx
│   └── screens/login.tsx
├── checkin/
│   ├── components/manual-entry-sheet.tsx
│   └── screens/checkin-view.tsx
├── reconcile/
│   ├── components/summary-stat-card.tsx
│   └── screens/reconcile-view.tsx
├── sales/
│   ├── components/passenger-seat-map.tsx
│   ├── components/passenger-form.tsx
│   ├── components/paystack-qr-modal.tsx
│   └── screens/trip-seat-view.tsx
└── terminal/
    └── screens/terminal-select-view.tsx
```

### Step 6: Enforce Cockpit Touch Targets
- Minimum touch height: 48px (`min-h-[48px] h-12`).
- Primary checkout buttons: 56px (`min-h-[56px] h-14`).
- Minimum spacing between adjacent seat buttons: 8px to prevent double-touches on small touch screens.

---

## 3. Verification & Acceptance Criteria

- [ ] **Probe 5.1**: Run `pnpm --filter booth-app typecheck` and verify clean compilation.
- [ ] **Probe 5.2**: Inspect components in React Native debugger; verify all dialogs and select sheets mount through `<PortalHost />` without layout clipping.
- [ ] **Probe 5.3**: Check touch target bounding boxes with accessibility inspector; verify no interactive button has a touch target smaller than 48px.
