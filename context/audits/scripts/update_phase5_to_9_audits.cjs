const fs = require('fs');
const path = require('path');

const auditBase = 'C:/dev/moja-buss/context/audits/booth-app';
const trackerPath = 'C:/dev/moja-buss/context/audits/booth-app-tracker.md';

console.log('Writing Phase 5 to 9 audit reports...');

// Helper to write file ensuring dir
function writeReport(relPath, content) {
  const fullPath = path.join(auditBase, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`Wrote: ${relPath}`);
}

// ----------------------------------------------------
// PHASE 5: Auth Features & Routes (52-56)
// ----------------------------------------------------

// 52. features/auth/components/auth-field.tsx
writeReport('features/auth/auth-field.md', `# Audit: auth-field.tsx

## 1. File
Exact source path: [\`apps/booth-app/features/auth/components/auth-field.tsx\`](file:///C:/dev/moja-buss/apps/booth-app/features/auth/components/auth-field.tsx)

## 2. Status
- **Audit Status**: \`AUDITED\`
- **Refactor Status**: \`READY\`
- **Verification Status**: \`PENDING\`

## 3. Purpose
Specialized text input field with animated focus states, label typography, and custom borders tailored for the cashier authentication screen.

## 4. Responsibilities
- Render an input label with semantic muted typography.
- Provide focus and blur visual feedback using border highlight styling.
- Forward standard \`TextInputProps\` (autoCapitalize, keyboardType, onSubmitEditing).
- Present an ergonomic minimum touch target (52px height) for cashier fingers.

## 5. Dependencies
- \`react\` (\`useState\`)
- \`react-native\` (\`TextInput\`, \`View\`, \`Text\`, \`TextInputProps\`)
- [\`@/lib/utils\`](file:///C:/dev/moja-buss/apps/booth-app/lib/utils.ts) (\`cn\`)
- [\`@/constants/theme\`](file:///C:/dev/moja-buss/apps/booth-app/constants/theme.ts) (\`Colors\`)

## 6. Consumers / Usage
- [\`app/(auth)/login.tsx\`](file:///C:/dev/moja-buss/apps/booth-app/app/(auth)/login.tsx) (Phone/Email credential input)

## 7. Current Implementation
- **File Length**: 52 lines.
- **Architectural Role**: Auth feature presentation primitive.
- **Transaction-Critical Area**: NO
- **Key Exports**: \`AuthField\` component.

## 8. UI / UX Audit
- Clean card-like input with rounded corners (16px) and 52px height.
- Label positioned clearly above the input.
- Lacks inline error text presentation (errors are rendered separately in \`login.tsx\`).

## 9. Design-System Audit
- **Primitive Duplication**: Duplicates logic that exists in [\`components/ui/input.tsx\`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/input.tsx).
- Hardcoded styles on line 23: \`rgba(238, 35, 124, 0.3)\` and \`rgba(238, 35, 124, 0.05)\` instead of using NativeWind semantic classes (\`border-primary/30 bg-primary/5\`).

## 10. Theme Audit
- References \`Colors.light.textPrimary\` and \`Colors.light.textSecondary\` directly instead of semantic Tailwind tokens.

## 11. Logic Audit
- Local focus tracking via \`isFocused\` state works reliably.
- \`editable\` prop properly styles opacity when disabled.

## 12. State Management Audit
- Local component state only (\`isFocused\`).

## 13. Async / Side-Effect Audit
- No async operations or side-effects.

## 14. Error Handling Audit
- Component does not handle errors internally; expects parent to pass error styles if needed.

## 15. Offline / Synchronization Audit
- Pure UI component; not impacted by network state.

## 16. Performance Audit
- Lightweight render tree, no unnecessary re-renders.

## 17. Accessibility Audit
- Missing explicit \`accessibilityLabel\` and \`accessibilityHint\`.

## 18. Architecture Audit
- Belongs in \`features/auth/components/\`, cleanly isolated from core business logic.

## 19. Code Quality Audit
- Fully typed with TypeScript interfaces extending \`TextInputProps\`.

## 20. Reference Comparison
- Matches standard mobile auth field patterns.

## 21. Problems
1. [HARDCODED COLOR VALUES] Line 23 uses hardcoded RGBA values (\`rgba(238, 35, 124, 0.3)\`) rather than Tailwind semantic classes or design tokens.
2. [COMPONENT DUPLICATION] Does not reuse the audited \`components/ui/input.tsx\` primitive.

## 22. Severity
- **Classification**: \`P2\`
- **Rationale**: Cosmetic design-system token mismatch in auth UI.

## 23. Recommended Changes
1. Replace hardcoded RGBA strings with \`border-primary/30\` and \`bg-primary/5\`.
2. Add accessibility labels.

## 24. Refactoring Plan
1. Refactor styles to use Tailwind classes consistently with NativeWind.

## 25. Test Strategy
1. Verify visual focus ring on iOS and Android simulators.

## 26. Verification Criteria
- [ ] No hardcoded RGBA color values.
- [ ] Proper focus border state.

## 27. Next Steps
- Implement semantic token cleanup during Phase 5 refactoring.

## 28. Notes
None.
`);

// 53. features/auth/components/auth-button.tsx
writeReport('features/auth/auth-button.md', `# Audit: auth-button.tsx

## 1. File
Exact source path: [\`apps/booth-app/features/auth/components/auth-button.tsx\`](file:///C:/dev/moja-buss/apps/booth-app/features/auth/components/auth-button.tsx)

## 2. Status
- **Audit Status**: \`AUDITED\`
- **Refactor Status**: \`READY\`
- **Verification Status**: \`PENDING\`

## 3. Purpose
High-visibility action button designed specifically for cashier authentication workflows with primary and secondary visual variants and pending spinners.

## 4. Responsibilities
- Provide distinct primary (rose gradient/solid) and secondary (outline/ghost) action buttons.
- Display an \`ActivityIndicator\` when \`isPending\` is true and disable touch interactions.
- Provide a generous 52px touch target suitable for rapid finger entry on POS hardware.

## 5. Dependencies
- \`react\`
- \`react-native\` (\`TouchableOpacity\`, \`Text\`, \`ActivityIndicator\`, \`View\`)
- [\`@/constants/theme\`](file:///C:/dev/moja-buss/apps/booth-app/constants/theme.ts) (\`Palette\`)
- [\`@/lib/utils\`](file:///C:/dev/moja-buss/apps/booth-app/lib/utils.ts) (\`cn\`)

## 6. Consumers / Usage
- [\`app/(auth)/login.tsx\`](file:///C:/dev/moja-buss/apps/booth-app/app/(auth)/login.tsx) ("Envoyer le code", "Valider", "Changer de méthode")

## 7. Current Implementation
- **File Length**: 61 lines.
- **Architectural Role**: Auth feature presentation component.
- **Transaction-Critical Area**: NO
- **Key Exports**: \`AuthButton\` component.

## 8. UI / UX Audit
- 52px height exceeds the 48px POS minimum requirement.
- Clear visual distinction between primary and secondary buttons.

## 9. Design-System Audit
- Duplicates \`components/ui/button.tsx\`. Could be a specialized wrapper over \`Button\`.
- Uses direct Tailwind classes (\`bg-primary\`, \`rounded-2xl\`).

## 10. Theme Audit
- Uses \`Palette.rose[500]\` directly on line 42 for the secondary \`ActivityIndicator\` instead of semantic tokens.

## 11. Logic Audit
- Correctly checks \`disabled || isPending\` on the \`TouchableOpacity\`.
- \`activeOpacity={0.8}\` provides responsive feedback.

## 12. State Management Audit
- Stateless presentation component.

## 13. Async / Side-Effect Audit
- No async operations.

## 14. Error Handling Audit
- Not applicable.

## 15. Offline / Synchronization Audit
- Not applicable.

## 16. Performance Audit
- Clean, fast functional component.

## 17. Accessibility Audit
- Missing \`accessibilityRole="button"\` and \`accessibilityState={{ busy: isPending, disabled: disabled || isPending }}\`.

## 18. Architecture Audit
- Isolated in \`features/auth/components/\`.

## 19. Code Quality Audit
- Well-typed props interface with default variant \`"primary"\`.

## 20. Reference Comparison
- Standard React Native button component.

## 21. Problems
1. [ACCESSIBILITY DEFICIT] Missing \`accessibilityRole="button"\` and \`accessibilityState\`.
2. [HAPTIC OMISSION] Does not trigger \`BoothFeedback.tap()\` internally; relies on parent doing so.

## 22. Severity
- **Classification**: \`P2\`
- **Rationale**: Accessibility and semantic token polish.

## 23. Recommended Changes
1. Add full accessibility props.
2. Integrate \`BoothFeedback.tap()\` on press.

## 24. Refactoring Plan
1. Add accessibility props and token cleanup.

## 25. Test Strategy
1. Verify button tap triggers onPress, shows spinner when pending.

## 26. Verification Criteria
- [ ] Accessibility props present.
- [ ] Disabled state prevents clicks.

## 27. Next Steps
- Polish during Phase 5 refactoring.

## 28. Notes
None.
`);

// 54. features/auth/components/auth-shell.tsx
writeReport('features/auth/auth-shell.md', `# Audit: auth-shell.tsx

## 1. File
Exact source path: [\`apps/booth-app/features/auth/components/auth-shell.tsx\`](file:///C:/dev/moja-buss/apps/booth-app/features/auth/components/auth-shell.tsx)

## 2. Status
- **Audit Status**: \`AUDITED\`
- **Refactor Status**: \`READY\`
- **Verification Status**: \`PENDING\`

## 3. Purpose
Outer scaffolding and branded framing for authentication screens, providing logo presentation, badge, title, subtitle, and keyboard-avoiding container.

## 4. Responsibilities
- Wrap login content in a \`KeyboardAvoidingView\` with platform-specific behavior.
- Render Moja Bus branding logo with proper aspect ratio.
- Provide a consistent typography header with title, subtitle, and badge.
- Support scrollable content on small POS screen sizes.

## 5. Dependencies
- \`react\`
- \`react-native\` (\`KeyboardAvoidingView\`, \`ScrollView\`, \`Image\`, \`View\`, \`Text\`, \`Platform\`)
- [\`@/constants/theme\`](file:///C:/dev/moja-buss/apps/booth-app/constants/theme.ts) (\`Colors\`)

## 6. Consumers / Usage
- [\`app/(auth)/login.tsx\`](file:///C:/dev/moja-buss/apps/booth-app/app/(auth)/login.tsx)

## 7. Current Implementation
- **File Length**: 71 lines.
- **Architectural Role**: Auth presentation shell.
- **Transaction-Critical Area**: NO
- **Key Exports**: \`AuthShell\` component.

## 8. UI / UX Audit
- Clean centered card layout with ample breathing room.
- On small 4-inch or 5-inch handheld POS terminals (e.g. Sunmi V2), large padding (py-10) might push the OTP input off-screen.

## 9. Design-System Audit
- Good use of Tailwind layout classes (\`gap-6\`, \`rounded-3xl\`, \`shadow-sm\`).

## 10. Theme Audit
- Background uses \`Colors.light.background\`.

## 11. Logic Audit
- \`KeyboardAvoidingView\` behavior properly switches between \`"padding"\` (iOS) and \`"height"\` (Android).

## 12. State Management Audit
- Stateless container component.

## 13. Async / Side-Effect Audit
- No async operations.

## 14. Error Handling Audit
- Not applicable.

## 15. Offline / Synchronization Audit
- Not applicable.

## 16. Performance Audit
- Renders smoothly.

## 17. Accessibility Audit
- Logo has \`accessibilityRole="image"\` and accessibility label.

## 18. Architecture Audit
- Clean component encapsulation.

## 19. Code Quality Audit
- Typescript props interface clearly documented.

## 20. Reference Comparison
- Matches modern mobile auth scaffolding.

## 21. Problems
1. [SMALL SCREEN SCROLL PADDING] Large vertical padding (\`py-10\`) risks clipping inputs on 480x800 POS screens when software keyboard opens.

## 22. Severity
- **Classification**: \`P2\`
- **Rationale**: Layout responsiveness on compact handheld POS devices.

## 23. Recommended Changes
1. Use safe area insets and responsive padding (\`py-6\` on small screens).

## 24. Refactoring Plan
1. Adjust padding and scroll properties.

## 25. Test Strategy
1. Test on Android simulator with 480x800 resolution and software keyboard open.

## 26. Verification Criteria
- [ ] Entire OTP form visible without clipping on small screens.

## 27. Next Steps
- Polish during Phase 5 refactoring.

## 28. Notes
None.
`);

// 55. app/(auth)/_layout.tsx
writeReport('app/(auth)/_layout.md', `# Audit: app/(auth)/_layout.tsx

## 1. File
Exact source path: [\`apps/booth-app/app/(auth)/_layout.tsx\`](file:///C:/dev/moja-buss/apps/booth-app/app/(auth)/_layout.tsx)

## 2. Status
- **Audit Status**: \`AUDITED\`
- **Refactor Status**: \`READY\`
- **Verification Status**: \`PENDING\`

## 3. Purpose
Route group stack layout for authentication routes in Expo Router.

## 4. Responsibilities
- Define Stack navigator with headers hidden.
- Set unified background color for auth screens.

## 5. Dependencies
- \`expo-router\` (\`Stack\`)
- [\`@/constants/theme\`](file:///C:/dev/moja-buss/apps/booth-app/constants/theme.ts) (\`Colors\`)

## 6. Consumers / Usage
- Expo Router framework.

## 7. Current Implementation
- **File Length**: 14 lines.
- **Architectural Role**: Route layout.
- **Transaction-Critical Area**: NO
- **Key Exports**: Default export \`AuthLayout\`.

## 8. UI / UX Audit
- Clean headerless presentation.

## 9. Design-System Audit
- Line 9 uses \`Colors.light.background\` directly.

## 10. Theme Audit
- Inconsistent with root layout which uses \`colors.neutral.background\`.

## 11. Logic Audit
- Standard minimal Expo Router stack layout.

## 12. State Management Audit
- None.

## 13. Async / Side-Effect Audit
- None.

## 14. Error Handling Audit
- None.

## 15. Offline / Synchronization Audit
- None.

## 16. Performance Audit
- Zero overhead.

## 17. Accessibility Audit
- None.

## 18. Architecture Audit
- Standard Expo Router group layout.

## 19. Code Quality Audit
- Clean, concise TypeScript.

## 20. Reference Comparison
- Matches Expo Router conventions.

## 21. Problems
1. [THEME TOKEN INCONSISTENCY] Line 9 uses \`Colors.light.background\` rather than \`colors.neutral.background\`.

## 22. Severity
- **Classification**: \`P2\`
- **Rationale**: Minor token import consistency.

## 23. Recommended Changes
1. Change to \`colors.neutral.background\` from \`@/constants/theme\`.

## 24. Refactoring Plan
1. One-line token update.

## 25. Test Strategy
1. Verify auth screen background displays correctly.

## 26. Verification Criteria
- [ ] \`colors.neutral.background\` imported correctly.

## 27. Next Steps
- Update during Phase 5.

## 28. Notes
None.
`);

// 56. app/(auth)/login.tsx
writeReport('app/(auth)/login.md', `# Audit: login.tsx

## 1. File
Exact source path: [\`apps/booth-app/app/(auth)/login.tsx\`](file:///C:/dev/moja-buss/apps/booth-app/app/(auth)/login.tsx)

## 2. Status
- **Audit Status**: \`AUDITED\`
- **Refactor Status**: \`READY\`
- **Verification Status**: \`PENDING\`

## 3. Purpose
Cashier sign-in screen supporting dual-mode authentication (Email OTP and SMS Phone OTP) with automated format detection, interactive 6-digit pin entry, and redirect gate.

## 4. Responsibilities
- Detect whether input identifier is an Ivorian phone number (\`+225\`, \`07\`, \`05\`, \`01\`) or an email address.
- Normalize phone numbers to E.164 format.
- Request OTP code via Better Auth (\`authClient.phoneNumber.sendOtp\` or \`authClient.emailOtp.sendVerificationOtp\`).
- Render 6-digit \`OtpInput\` with auto-focus and auto-submit on completion.
- Verify OTP and call \`refreshSession()\`.
- Provide tactile haptic feedback on code send, verify, and errors.
- Redirect authenticated operators to \`/\`.

## 5. Dependencies
- \`expo-router\` (\`router\`)
- \`react\` (\`useState\`, \`useRef\`, \`useEffect\`)
- \`react-i18next\` (\`useTranslation\`)
- \`react-native\` (\`Animated\`, \`View\`, \`Text\`, \`ActivityIndicator\`, \`StyleSheet\`)
- \`react-native-otp-entry\` (\`OtpInput\`)
- [\`@/features/auth/components/auth-field\`](file:///C:/dev/moja-buss/apps/booth-app/features/auth/components/auth-field.tsx)
- [\`@/features/auth/components/auth-button\`](file:///C:/dev/moja-buss/apps/booth-app/features/auth/components/auth-button.tsx)
- [\`@/features/auth/components/auth-shell\`](file:///C:/dev/moja-buss/apps/booth-app/features/auth/components/auth-shell.tsx)
- [\`@/constants/theme\`](file:///C:/dev/moja-buss/apps/booth-app/constants/theme.ts) (\`Colors\`, \`Palette\`)
- [\`@/lib/auth-client\`](file:///C:/dev/moja-buss/apps/booth-app/lib/auth-client.ts) (\`authClient\`, \`refreshSession\`)
- [\`@/lib/haptics\`](file:///C:/dev/moja-buss/apps/booth-app/lib/haptics.ts) (\`BoothFeedback\`)

## 6. Consumers / Usage
- Expo Router initial unauthenticated destination.

## 7. Current Implementation
- **File Length**: 361 lines.
- **Architectural Role**: Cashier entry door.
- **Transaction-Critical Area**: HIGH (Auth gateway)
- **Key Exports**: Default export \`LoginScreen\`.

## 8. UI / UX Audit
- Clean step progression from identifier input to 6-digit OTP entry with slide animations.
- Auto-submit when all 6 digits are typed provides rapid cashier login.

## 9. Design-System Audit
- OtpInput theme lines 294-320 uses hardcoded colors: \`rgba(238, 35, 124, 0.3)\`, \`rgba(238, 35, 124, 0.05)\`, \`Palette.rose[500]\`.

## 10. Theme Audit
- Uses \`Colors.light.background\` and \`Colors.light.textPrimary\` rather than semantic tokens.

## 11. Logic Audit
- **Phone Detection**: Lines 46-58: Correctly recognizes Ivorian mobile prefixes (01, 05, 07, +225).
- **Phone Normalization**: Lines 60-68: Prepends \`+225\` to 10-digit local numbers.
- **Auth Error Mapping**: Lines 201-215: Maps status 403, \`INVALID_OTP\`, \`OTP_EXPIRED\`, and \`TOO_MANY_ATTEMPTS\` to localized i18n messages.

## 12. State Management Audit
- Clean state machine: \`step\`, \`identifier\`, \`method\`, \`otp\`, \`isPending\`, \`message\`.

## 13. Async / Side-Effect Audit
- Handles async OTP requests with loading locks (\`isPending\`).

## 14. Error Handling Audit
- Comprehensive error extraction via \`getAuthError()\`.

## 15. Offline / Synchronization Audit
- **Defect**: If cashier attempts to sign in while offline, generic error is shown. Needs explicit message explaining that login requires an active network connection.

## 16. Performance Audit
- Slide animation uses native driver (\`useNativeDriver: true\`).

## 17. Accessibility Audit
- OtpInput provides auto-focus. Inputs have clear placeholder and label texts.

## 18. Architecture Audit
- Clean composition of auth feature components.

## 19. Code Quality Audit
- Clean TypeScript without \`any\`.

## 20. Reference Comparison
- Matches mobile cashier login UX across modern transit systems.

## 21. Problems
1. [HARDCODED OTP THEME COLORS] Lines 305-317 contain raw RGBA strings and \`Palette.rose[500]\`.
2. [OFFLINE AUTH FEEDBACK] No proactive detection of offline state on login screen; network failures report as generic OTP send errors.

## 22. Severity
- **Classification**: \`P1\`
- **Rationale**: Key entry point for all cashier sessions; needs offline awareness.

## 23. Recommended Changes
1. Bind OtpInput styling to \`colors.primary.DEFAULT\`.
2. Check network status and display "Connexion internet requise pour se connecter" if offline.

## 24. Refactoring Plan
1. Refactor OTP theme to use central tokens.
2. Add network status check before OTP dispatch.

## 25. Test Strategy
1. Test invalid OTP displays localized error.
2. Test valid 6-digit OTP triggers redirect to \`/\`.

## 26. Verification Criteria
- [ ] Successful phone and email OTP sign-in.
- [ ] Correct error display for expired or invalid OTP.

## 27. Next Steps
- Execute Phase 5 refactoring.

## 28. Notes
None.
`);

// ----------------------------------------------------
// PHASE 6: Operational Components & Transaction Chrome (57-59)
// ----------------------------------------------------

// 57. components/offline-banner.tsx
writeReport('components/offline-banner.md', `# Audit: offline-banner.tsx

## 1. File
Exact source path: [\`apps/booth-app/components/offline-banner.tsx\`](file:///C:/dev/moja-buss/apps/booth-app/components/offline-banner.tsx)

## 2. Status
- **Audit Status**: \`AUDITED\`
- **Refactor Status**: \`READY\`
- **Verification Status**: \`PENDING\`

## 3. Purpose
Real-time operational status banner alerting the cashier of network connectivity, background synchronization progress, pending offline cash sales, hold pool expiration, and synchronization conflicts.

## 4. Responsibilities
- Monitor network status via \`useNetworkStatus\`.
- Render blue sync banner during active queue synchronization (\`syncStatus === "syncing"\`).
- Render amber alert banner when server sync conflicts are detected (\`conflictCount > 0\`).
- Render amber/red offline banner when disconnected, indicating remaining available seat holds and queued transactions.
- Compute aggregate available seat holds across all cached trip pools.

## 5. Dependencies
- \`@hugeicons/core-free-icons\` (\`Alert01Icon\`, \`WifiOff01Icon\`)
- \`@hugeicons/react-native\` (\`HugeiconsIcon\`)
- \`react\`
- \`react-i18next\` (\`useTranslation\`)
- \`react-native\` (\`ActivityIndicator\`, \`Text\`, \`View\`)
- [\`@/hooks/use-network-status\`](file:///C:/dev/moja-buss/apps/booth-app/hooks/use-network-status.ts)
- [\`@/stores/hold-pool\`](file:///C:/dev/moja-buss/apps/booth-app/stores/hold-pool.ts)
- [\`@/stores/offline-queue\`](file:///C:/dev/moja-buss/apps/booth-app/stores/offline-queue.ts)

## 6. Consumers / Usage
- [\`app/(tabs)/index.tsx\`](file:///C:/dev/moja-buss/apps/booth-app/app/(tabs)/index.tsx) (Sell tab)
- [\`app/(tabs)/bookings.tsx\`](file:///C:/dev/moja-buss/apps/booth-app/app/(tabs)/bookings.tsx) (Bookings tab)

## 7. Current Implementation
- **File Length**: 85 lines.
- **Architectural Role**: Transaction status HUD.
- **Transaction-Critical Area**: YES (Section 7)
- **Key Exports**: \`OfflineBanner\` component.

## 8. UI / UX Audit
- Clean visual hierarchy with distinct colors for sync (blue), conflict (amber), and offline (amber).
- Floating rounded banner with high contrast text.

## 9. Design-System Audit
- Uses NativeWind utility classes (\`bg-blue-500\`, \`bg-amber-500\`, \`rounded-2xl\`).

## 10. Theme Audit
- Icons use explicit \`color="white"\`, ensuring legibility against saturated warning backgrounds.

## 11. Logic Audit
- Lines 56-61: Computes \`totalAvailable\` across all pools:
  \`\`\`ts
  const totalAvailable = Object.values(pools).reduce((sum, pool) => {
    const available = pool.holds.filter(
      (h) => !h.consumed && new Date(h.expiresAt) > now,
    ).length;
    return sum + available;
  }, 0);
  \`\`\`
- Correctly evaluates pool expiration.

## 12. State Management Audit
- Subscribes to \`useHoldPoolStore\` and \`useOfflineQueue\`.

## 13. Async / Side-Effect Audit
- Pure presentation component reacting to store state.

## 14. Error Handling Audit
- Gracefully returns \`null\` when online and clean.

## 15. Offline / Synchronization Audit
- Essential HUD component for cashier awareness during connectivity dropouts.

## 16. Performance Audit
- Lines 55-65: \`Object.values(pools).reduce\` and \`.some\` run on every render without \`useMemo\`. Should be memoized.

## 17. Accessibility Audit
- Missing \`accessibilityRole="alert"\` and \`accessibilityLiveRegion="polite"\`.

## 18. Architecture Audit
- Well-placed operational component.

## 19. Code Quality Audit
- Clean TypeScript.

## 20. Reference Comparison
- Matches offline indicators in Stripe Terminal and Square POS.

## 21. Problems
1. [HARDCODED FRENCH STRINGS] Lines 29-34: \`"Synchronisation des ventes en cours..."\` and \`"\${queue.length} restante(s)"\` are hardcoded in French instead of using \`t()\`.
2. [MISSING MEMOIZATION] Pool hold calculations run on every component re-render without \`useMemo\`.
3. [OMISSION FROM SELL FUNNEL] Banner is mounted in tabs, but absent from \`app/sell/[tripId].tsx\` and \`app/sell/payment.tsx\` where cashier is actively finalizing tickets!

## 22. Severity
- **Classification**: \`P1\`
- **Rationale**: Key cashier visibility into offline sales queue; missing i18n and missing from checkout screen.

## 23. Recommended Changes
1. Extract strings to \`locales/fr.json\` and \`locales/en.json\`.
2. Wrap hold calculation in \`useMemo\`.
3. Mount \`OfflineBanner\` on \`app/sell/[tripId].tsx\` and \`app/sell/payment.tsx\`.

## 24. Refactoring Plan
1. Add i18n keys and memoize calculations.
2. Include banner in sales funnel headers.

## 25. Test Strategy
1. Toggle offline mode in DevTools/airplane mode and verify banner appearance.
2. Trigger sync and verify blue syncing badge.

## 26. Verification Criteria
- [ ] No hardcoded text strings.
- [ ] Banner visible in sales funnel during offline mode.

## 27. Next Steps
- Implement in Phase 6.

## 28. Notes
None.
`);

// 58. components/paystack-qr.tsx
writeReport('components/paystack-qr.md', `# Audit: paystack-qr.tsx

## 1. File
Exact source path: [\`apps/booth-app/components/paystack-qr.tsx\`](file:///C:/dev/moja-buss/apps/booth-app/components/paystack-qr.tsx)

## 2. Status
- **Audit Status**: \`AUDITED\`
- **Refactor Status**: \`READY\`
- **Verification Status**: \`PENDING\`

## 3. Purpose
Interactive QR code payment modal displaying dynamic Paystack checkout QR, live polling query for transaction authorization, countdown timeout timer, and fallback link clipboard copy.

## 4. Responsibilities
- Render high-contrast QR code via \`react-native-qrcode-svg\`.
- Poll backend status procedure \`booth.pollPaymentStatus\` every 3 seconds while active.
- Run 600-second (10-minute) countdown interval.
- Cancel hold reservation via \`booth.cancelPendingHold\` on timeout or manual cancellation.
- Copy payment link to clipboard via \`expo-clipboard\`.
- Trigger haptic feedback on successful or failed payment.

## 5. Dependencies
- \`@hugeicons/core-free-icons\` (\`Cancel01Icon\`, \`Copy01Icon\`)
- \`@hugeicons/react-native\` (\`HugeiconsIcon\`)
- \`@tanstack/react-query\` (\`useQuery\`, \`useMutation\`)
- \`expo-clipboard\` (\`Clipboard\`)
- \`react\` (\`useState\`, \`useRef\`, \`useEffect\`)
- \`react-i18next\` (\`useTranslation\`)
- \`react-native\` (\`ActivityIndicator\`, \`Text\`, \`View\`)
- \`react-native-qrcode-svg\` (\`QRCode\`)
- \`react-native-toast-message\` (\`Toast\`)
- [\`@/components/ui/button\`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/button.tsx)
- [\`@/components/ui/card\`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/card.tsx)
- [\`@/constants/ui-colors\`](file:///C:/dev/moja-buss/apps/booth-app/constants/ui-colors.ts)
- [\`@/lib/haptics\`](file:///C:/dev/moja-buss/apps/booth-app/lib/haptics.ts)
- [\`@/lib/trpc\`](file:///C:/dev/moja-buss/apps/booth-app/lib/trpc.tsx)

## 6. Consumers / Usage
- [\`app/sell/payment.tsx\`](file:///C:/dev/moja-buss/apps/booth-app/app/sell/payment.tsx) (Step 3 payment screen)

## 7. Current Implementation
- **File Length**: 165 lines.
- **Architectural Role**: Payment collection terminal.
- **Transaction-Critical Area**: YES (P0 Financial Area)
- **Key Exports**: \`PaystackQR\` component, \`PaystackQRProps\`.

## 8. UI / UX Audit
- Clean, focused checkout presentation with QR code (220x220px) easily scannable by passenger smartphone cameras across the booth counter.
- Live countdown indicator with color shift to red when remaining time < 60s.

## 9. Design-System Audit
- Reuses \`Card\` and \`Button\` primitives cleanly.

## 10. Theme Audit
- Uses semantic theme tokens and \`IconColors\`.

## 11. Logic Audit
- **Polling Loop**: Lines 45-53: Queries \`booth.pollPaymentStatus\` with \`refetchInterval: 3000\`.
- **Status Reaction**: Lines 59-67: If \`PAID\`, triggers \`paymentSuccess\` haptic and calls \`onPaid()\`. If \`FAILED\`, triggers \`invalidScan\` and \`onTimeout()\`.
- **Timer Management**: Lines 69-85: 1-second interval counts down; on expiry, calls \`cancelHold.mutate\` and \`onTimeout()\`.

## 12. State Management Audit
- Local countdown state \`secondsLeft\`.

## 13. Async / Side-Effect Audit
- Interval cleanup properly handled in \`useEffect\` return function.

## 14. Error Handling Audit
- Polling query handles network blips gracefully via React Query retries.

## 15. Offline / Synchronization Audit
- Paystack QR payments are strictly online; component is disabled when offline.

## 16. Performance Audit
- Polling stops immediately when paid, failed, or timed out.

## 17. Accessibility Audit
- QR code card has clear instructions and buttons have explicit titles.

## 18. Architecture Audit
- Self-contained payment widget.

## 19. Code Quality Audit
- Fully typed props and query options.

## 20. Reference Comparison
- Matches standard Paystack/Flutterwave in-person QR payment UX.

## 21. Problems
1. [HARDCODED STRINGS] Lines 95, 148, 159 contain hardcoded French strings (\`"Lien de paiement copié"\`, \`"Copier le lien de paiement"\`, \`"Annuler le paiement"\`) instead of using \`t()\`.
2. [HOLD LEAK ON BACK NAVIGATION] If cashier taps Android back button or swipes to dismiss rather than tapping "Annuler", \`cancelHold\` is not triggered, leaving the seat reserved on the server until the 10-minute timeout expires.

## 22. Severity
- **Classification**: \`P0\`
- **Rationale**: Payment collection and seat inventory release flow.

## 23. Recommended Changes
1. Localize all button and toast strings.
2. Ensure \`cancelHold\` is called on unmount if status is not \`PAID\`.

## 24. Refactoring Plan
1. Add cleanup on unmount for pending hold.
2. Replace hardcoded strings with i18n keys.

## 25. Test Strategy
1. Test QR generation with mock URL.
2. Test successful payment poll triggers \`onPaid\`.
3. Test timeout triggers \`cancelHold\` mutation.

## 26. Verification Criteria
- [ ] All text localized.
- [ ] Unmount properly cancels uncompleted holds.

## 27. Next Steps
- Implement in Phase 6.

## 28. Notes
None.
`);

// 59. components/seat-map.tsx
writeReport('components/seat-map.md', `# Audit: seat-map.tsx

## 1. File
Exact source path: [\`apps/booth-app/components/seat-map.tsx\`](file:///C:/dev/moja-buss/apps/booth-app/components/seat-map.tsx)

## 2. Status
- **Audit Status**: \`AUDITED\`
- **Refactor Status**: \`READY\`
- **Verification Status**: \`PENDING\`

## 3. Purpose
Interactive 2D bus seat visualization and selection grid rendering bus layout, driver area, available seats, occupied seats, and cashier pre-reserved offline hold pool seats.

## 4. Responsibilities
- Construct a 2D matrix grid from 1-indexed \`Seat[]\` records.
- Render bus cockpit / front cap orientation marker.
- Render seat legend with state indicators (Available, Selected, Occupied, Reserve).
- Enforce accessibility roles, labels, and disabled states on seats.
- Provide tactile haptic feedback on seat selection.
- Render selected seat confirmation banner.

## 5. Dependencies
- \`@hugeicons/core-free-icons\` (\`UserIcon\`)
- \`@hugeicons/react-native\` (\`HugeiconsIcon\`)
- \`react\`
- \`react-native\` (\`ScrollView\`, \`Text\`, \`TouchableOpacity\`, \`View\`)
- [\`@/lib/haptics\`](file:///C:/dev/moja-buss/apps/booth-app/lib/haptics.ts) (\`BoothFeedback\`)
- [\`@/constants/theme\`](file:///C:/dev/moja-buss/apps/booth-app/constants/theme.ts) (\`colors\`)
- [\`@/constants/ui-colors\`](file:///C:/dev/moja-buss/apps/booth-app/constants/ui-colors.ts) (\`IconColors\`)
- [\`@/lib/utils\`](file:///C:/dev/moja-buss/apps/booth-app/lib/utils.ts) (\`cn\`)

## 6. Consumers / Usage
- [\`app/sell/[tripId].tsx\`](file:///C:/dev/moja-buss/apps/booth-app/app/sell/[tripId].tsx) (Seat selection screen)

## 7. Current Implementation
- **File Length**: 217 lines.
- **Architectural Role**: Core transaction UI visualizer.
- **Transaction-Critical Area**: YES (P0 Inventory Allocation)
- **Key Exports**: \`SeatMap\` component, \`Seat\`, \`SeatMapProps\`.

## 8. UI / UX Audit
- Clean visual layout representing physical bus arrangement.
- Cockpit indicator helps cashiers orient passengers (window vs aisle).
- Touch target: 44x44px (\`w-11 h-11\`) satisfies Apple HIG touch guidelines.

## 9. Design-System Audit
- Uses NativeWind styling with semantic color tokens (\`bg-primary\`, \`bg-emerald-50\`, \`bg-amber-100\`).

## 10. Theme Audit
- Clean color contrast on all seat states.

## 11. Logic Audit
- Lines 45-61: Builds 2D grid matrix:
  \`\`\`ts
  const grid: (Seat | null)[][] = Array.from({ length: rows }, () => Array(columns).fill(null));
  for (const seat of seats) {
    if (seat.row >= 1 && seat.row <= rows && seat.col >= 1 && seat.col <= columns) {
      grid[seat.row - 1][seat.col - 1] = seat;
    }
  }
  \`\`\`
- Runs on every single render without \`useMemo\`.

## 12. State Management Audit
- Controlled component receiving \`selectedSeatId\` and \`onSeatSelect\`.

## 13. Async / Side-Effect Audit
- No async operations.

## 14. Error Handling Audit
- Safely handles missing seat records and boundary overruns.

## 15. Offline / Synchronization Audit
- Supports \`offlineAvailableSeatIds\`: highlights seats available in cashier's local hold pool during network outages with distinctive amber badge.

## 16. Performance Audit
- Imperative 2D grid construction runs every render. For 50-seat coaches, wrapping grid calculation in \`useMemo\` will improve scroll fluidity.

## 17. Accessibility Audit
- Excellent accessibility implementation on lines 170-175:
  \`\`\`tsx
  accessibilityRole="button"
  accessibilityLabel={\`Siège \${seat.label}, \${isSelected ? "sélectionné" : isAvailable ? "disponible" : "occupé"}\`}
  accessibilityState={{ selected: isSelected, disabled: isOccupied }}
  \`\`\`

## 18. Architecture Audit
- Decoupled from backend tRPC models, consuming pure \`Seat\` interface.

## 19. Code Quality Audit
- Fully typed with TypeScript.

## 20. Reference Comparison
- Matches airline and long-distance coach seat selectors.

## 21. Problems
1. [HARDCODED FRENCH STRINGS] Lines 71, 76, 81, 87, 96, 171, 201, 204: All legend and accessibility strings are hardcoded in French instead of using \`useTranslation\`.
2. [UNMEMOIZED GRID ALLOCATION] 2D matrix is re-allocated on every re-render.

## 22. Severity
- **Classification**: \`P0\`
- **Rationale**: Core seat allocation visualizer used in every intercity ticket sale.

## 23. Recommended Changes
1. Memoize grid construction using \`useMemo([seats, rows, columns])\`.
2. Internationalize legend and accessibility strings with \`t()\`.

## 24. Refactoring Plan
1. Add \`useTranslation()\` hook and update strings.
2. Wrap grid construction in \`useMemo\`.

## 25. Test Strategy
1. Verify seat selection toggles properly.
2. Verify offline seats render with amber reserve theme.

## 26. Verification Criteria
- [ ] Zero hardcoded strings.
- [ ] Grid construction memoized.

## 27. Next Steps
- Implement in Phase 6.

## 28. Notes
None.
`);

console.log('Phase 5 and 6 reports complete.');
