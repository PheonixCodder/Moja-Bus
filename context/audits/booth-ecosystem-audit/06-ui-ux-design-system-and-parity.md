# Module 06: UI/UX Architecture & Design System Parity

> **Audit Context**: UI Component Library, Tailwind/Nativewind Setup, Design Tokens & Screen-by-Screen Parity vs Golden Reference  
> **Target Files**: `apps/booth-app/components/*`, `apps/booth-app/app/*`, `apps/booth-app/global.css`, `apps/booth-app/constants/*`  
> **Comparative Targets**: `apps/traveler-app/components/*`, `apps/traveler-app/features/*`, `apps/traveler-app/global.css`, `apps/traveler-app/components.json`  

---

## 1. UI Architecture & Primitive Gulf

The difference in frontend engineering quality between `apps/traveler-app` and `apps/booth-app` represents an immense gap:

```mermaid
graph LR
    subgraph Traveler App (Golden Standard)
        TA_CompJson["components.json (shadcn-compatible)"]
        TA_RNPrimitives["@rn-primitives/* (32 Primitives)"]
        TA_CVA["class-variance-authority"]
        TA_Features["Feature Components (Clean Modular Structure)"]
        TA_Portals["@rn-primitives/portal (Sheets, Modals, Popovers)"]
        TA_CompJson --> TA_RNPrimitives --> TA_CVA --> TA_Features
    end

    subgraph Booth App (Current State)
        BA_NoConfig["NO components.json"]
        BA_Primitives["5 Hand-Rolled Components (Capitalized Files)"]
        BA_RawJSX["Screens use raw TouchableOpacity & Text with inline styles"]
        BA_NoPortals["Zero Portals, Sheets, or Accessible Overlays"]
    end
```

### Comprehensive Component Inventory Comparison

| Primitive Category | Traveler App (`apps/traveler-app/components/ui/`) | Booth App (`apps/booth-app/components/ui/`) | Assessment |
| :--- | :--- | :--- | :--- |
| **Buttons & Action** | `button.tsx` (CVA, 7 variants, size scale, icon support) | `Button.tsx` (Hand-rolled, no CVA) | Inconsistent styling and props. |
| **Forms & Input** | `input.tsx`, `textarea.tsx`, `label.tsx`, `checkbox.tsx`, `radio-group.tsx`, `switch.tsx` | `Input.tsx` (Single hand-rolled text input) | Missing checkboxes, switches, and radio groups. |
| **Overlays & Dialogs** | `dialog.tsx`, `alert-dialog.tsx`, `popover.tsx`, `tooltip.tsx`, `context-menu.tsx`, `dropdown-menu.tsx`, `menubar.tsx` | **NONE** (Uses raw RN `Alert.alert` or `Modal`) | Substandard, non-accessible modal experiences. |
| **Selection & Menus** | `select.tsx` (Portal-driven accessible select sheet) | **NONE** (Raw inline lists) | Severe UX handicap in multi-option selectors. |
| **Feedback & Status** | `badge.tsx`, `progress.tsx`, `skeleton.tsx`, `alert.tsx` | `Badge.tsx` (Hand-rolled) | Missing loading skeletons and progress bars. |
| **Typography** | `text.tsx` (Unified typography tokens) | `Text.tsx` (`BoothText` component) | Dead component; screens bypass `BoothText`. |
| **Layout & Containers** | `card.tsx`, `accordion.tsx`, `collapsible.tsx`, `tabs.tsx`, `separator.tsx`, `aspect-ratio.tsx` | `Card.tsx` (Basic View wrapper) | Missing tabs, accordions, and collapsibles. |
| **Total Components** | **32 production primitives** | **5 basic wrappers** | **84% primitive deficit** |

---

## 2. Screen-by-Screen UI Implementation Map

Below is a detailed audit of every screen file in `apps/booth-app` compared to equivalent screens in `apps/traveler-app`:

| Screen File | Route | UI Implementation Quality | Critical Design Deficiencies |
| :--- | :--- | :---: | :--- |
| `app/index.tsx` | `/` | **D** | Bare `ActivityIndicator` in center of screen; unbranded cold boot experience. |
| `app/terminal-select.tsx` | `/terminal-select` | **C-** | Flat list with rudimentary borders; error state retry button literally reads `"Something went wrong"`. |
| `app/reconcile.tsx` | `/reconcile` | **C** | Monolithic text dump; relies on Android system text share rather than branded thermal receipt or PDF. |
| `app/(auth)/login.tsx` | `/(auth)/login` | **F** | Primitive text inputs; no phone detection; no OTP entry; does not use `AuthShell` or Moja brand styling. |
| `app/(tabs)/index.tsx` | `/(tabs)` | **C** | Basic search bar; trip cards lack origin/destination terminal badges, bus seat map previews, and fare badges. |
| `app/(tabs)/checkin.tsx` | `/(tabs)/checkin` | **C-** | Bare `CameraView` with unstyled 3-second overlay; lacks manual ticket token fallback entry. |
| `app/(tabs)/bookings.tsx` | `/(tabs)/bookings` | **C** | Basic horizontal filter chips; booking cards lack passenger avatar and payment channel icons. |
| `app/(tabs)/profile.tsx` | `/(tabs)/profile` | **D** | Displays raw database CUID for Company ID; raw RN `Modal` for terminal switch; unstyled logout alert. |
| `app/sell/[tripId].tsx` | `/sell/[tripId]` | **C-** | Seat map has no pinch-to-zoom for 70-passenger coaches; lacks deck switch for double-deckers. |
| `app/sell/passenger.tsx` | `/sell/passenger` | **D** | Broken search mode toggle; basic input fields; no phone country code selector (`+225`). |
| `app/sell/payment.tsx` | `/sell/payment` | **F** | Silent button failures; QR display lacks dynamic payment countdown and payment method toggle. |
| `app/sell/confirmation.tsx` | `/sell/confirmation` | **D** | Huge icon with empty share button stub (`// Phase 7: native share sheet`); no ticket receipt print button. |

---

## 3. Bypassing Primitives & Inline Class Proliferation

A major code quality problem across `apps/booth-app` is that the developers created components in `components/ui/` but then **completely ignored them** in screen implementations:

### Example from `app/sell/passenger.tsx`:
Instead of using `components/ui/Input.tsx`:
```tsx
// passenger.tsx:154-161
<TextInput
  className="flex-1 border border-input rounded-lg px-4 py-3 bg-card text-foreground"
  placeholder={t("passenger.searchPlaceholder")}
  value={searchQuery}
  onChangeText={setSearchQuery}
  keyboardType="email-address"
  autoCapitalize="none"
/>
```

### Example from `app/sell/confirmation.tsx`:
Instead of using `components/ui/Button.tsx`:
```tsx
// confirmation.tsx:68-76
<TouchableOpacity
  className="bg-primary rounded-xl py-4 flex-row items-center justify-center gap-2"
  onPress={handleSellAnother}
>
  <HugeiconsIcon icon={ShoppingCart01Icon} size={18} color="white" />
  <Text className="text-white font-semibold">
    {t("confirmation.sellAnother")}
  </Text>
</TouchableOpacity>
```

---

## 4. Theme Tokens & Dark Mode Handling

### Dark Mode Bleed Prevention
In `apps/booth-app/app/_layout.tsx:93–96`:
```tsx
<View
  className="flex-1 light"
  style={{ backgroundColor: colors.neutral.background }}
>
```
While `className="light"` forces NativeWind to resolve `:root` tokens, `booth-app` does NOT provide a React Navigation `ThemeProvider` with `NAV_THEME`.
- In `traveler-app`: Root layout wraps all stacks in `<ThemeProvider value={NAV_THEME}>`, ensuring native headers, card backgrounds, and back buttons conform to Moja brand colors.
- In `booth-app`: Missing `NAV_THEME` causes default React Navigation gray colors to bleed into headers and transitions.

### Touch Target Sizing
The booth environment is a high-velocity physical counter where cashiers interact via touch tablets or rugged POS devices.
- **Specification Requirement**: Minimum 48px touch targets for rapid entry.
- **Actual Code**: Several buttons and filter tabs in `bookings.tsx` and `index.tsx` use `py-1.5` (~32px height), causing frequent mis-taps during peak queues.
