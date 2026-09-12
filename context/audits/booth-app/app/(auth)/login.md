# Audit: login.tsx

## 1. File
Exact source path: [`apps/booth-app/app/(auth)/login.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(auth)/login.tsx)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Cashier sign-in screen supporting dual-mode authentication (Email OTP and SMS Phone OTP) with automated format detection, interactive 6-digit pin entry, and redirect gate.

## 4. Responsibilities
- Detect whether input identifier is an Ivorian phone number (`+225`, `07`, `05`, `01`) or an email address.
- Normalize phone numbers to E.164 format.
- Request OTP code via Better Auth (`authClient.phoneNumber.sendOtp` or `authClient.emailOtp.sendVerificationOtp`).
- Render 6-digit `OtpInput` with auto-focus and auto-submit on completion.
- Verify OTP and call `refreshSession()`.
- Provide tactile haptic feedback on code send, verify, and errors.
- Redirect authenticated operators to `/`.

## 5. Dependencies
- `expo-router` (`router`)
- `react` (`useState`, `useRef`, `useEffect`)
- `react-i18next` (`useTranslation`)
- `react-native` (`Animated`, `View`, `Text`, `ActivityIndicator`, `StyleSheet`)
- `react-native-otp-entry` (`OtpInput`)
- [`@/features/auth/components/auth-field`](file:///C:/dev/moja-buss/apps/booth-app/features/auth/components/auth-field.tsx)
- [`@/features/auth/components/auth-button`](file:///C:/dev/moja-buss/apps/booth-app/features/auth/components/auth-button.tsx)
- [`@/features/auth/components/auth-shell`](file:///C:/dev/moja-buss/apps/booth-app/features/auth/components/auth-shell.tsx)
- [`@/constants/theme`](file:///C:/dev/moja-buss/apps/booth-app/constants/theme.ts) (`Colors`, `Palette`)
- [`@/lib/auth-client`](file:///C:/dev/moja-buss/apps/booth-app/lib/auth-client.ts) (`authClient`, `refreshSession`)
- [`@/lib/haptics`](file:///C:/dev/moja-buss/apps/booth-app/lib/haptics.ts) (`BoothFeedback`)

## 6. Consumers / Usage
- Expo Router initial unauthenticated destination.

## 7. Current Implementation
- **File Length**: 361 lines.
- **Architectural Role**: Cashier entry door.
- **Transaction-Critical Area**: HIGH (Auth gateway)
- **Key Exports**: Default export `LoginScreen`.

## 8. UI / UX Audit
- Clean step progression from identifier input to 6-digit OTP entry with slide animations.
- Auto-submit when all 6 digits are typed provides rapid cashier login.

## 9. Design-System Audit
- OtpInput theme lines 294-320 uses hardcoded colors: `rgba(238, 35, 124, 0.3)`, `rgba(238, 35, 124, 0.05)`, `Palette.rose[500]`.

## 10. Theme Audit
- Uses `Colors.light.background` and `Colors.light.textPrimary` rather than semantic tokens.

## 11. Logic Audit
- **Phone Detection**: Lines 46-58: Correctly recognizes Ivorian mobile prefixes (01, 05, 07, +225).
- **Phone Normalization**: Lines 60-68: Prepends `+225` to 10-digit local numbers.
- **Auth Error Mapping**: Lines 201-215: Maps status 403, `INVALID_OTP`, `OTP_EXPIRED`, and `TOO_MANY_ATTEMPTS` to localized i18n messages.

## 12. State Management Audit
- Clean state machine: `step`, `identifier`, `method`, `otp`, `isPending`, `message`.

## 13. Async / Side-Effect Audit
- Handles async OTP requests with loading locks (`isPending`).

## 14. Error Handling Audit
- Comprehensive error extraction via `getAuthError()`.

## 15. Offline / Synchronization Audit
- **Defect**: If cashier attempts to sign in while offline, generic error is shown. Needs explicit message explaining that login requires an active network connection.

## 16. Performance Audit
- Slide animation uses native driver (`useNativeDriver: true`).

## 17. Accessibility Audit
- OtpInput provides auto-focus. Inputs have clear placeholder and label texts.

## 18. Architecture Audit
- Clean composition of auth feature components.

## 19. Code Quality Audit
- Clean TypeScript without `any`.

## 20. Reference Comparison
- Matches mobile cashier login UX across modern transit systems.

## 21. Problems
1. [HARDCODED OTP THEME COLORS] Lines 305-317 contain raw RGBA strings and `Palette.rose[500]`.
2. [OFFLINE AUTH FEEDBACK] No proactive detection of offline state on login screen; network failures report as generic OTP send errors.

## 22. Severity
- **Classification**: `P1`
- **Rationale**: Key entry point for all cashier sessions; needs offline awareness.

## 23. Recommended Changes
1. Bind OtpInput styling to `colors.primary.DEFAULT`.
2. Check network status and display "Connexion internet requise pour se connecter" if offline.

## 24. Refactoring Plan
1. Refactor OTP theme to use central tokens.
2. Add network status check before OTP dispatch.

## 25. Test Strategy
1. Test invalid OTP displays localized error.
2. Test valid 6-digit OTP triggers redirect to `/`.

## 26. Verification Criteria
- [ ] Successful phone and email OTP sign-in.
- [ ] Correct error display for expired or invalid OTP.

## 27. Next Steps
- Execute Phase 5 refactoring.

## 28. Notes
None.
