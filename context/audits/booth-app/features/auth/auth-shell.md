# Audit: auth-shell.tsx

## 1. File
Exact source path: [`apps/booth-app/features/auth/components/auth-shell.tsx`](file:///C:/dev/moja-buss/apps/booth-app/features/auth/components/auth-shell.tsx)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Outer scaffolding and branded framing for authentication screens, providing logo presentation, badge, title, subtitle, and keyboard-avoiding container.

## 4. Responsibilities
- Wrap login content in a `KeyboardAvoidingView` with platform-specific behavior.
- Render Moja Bus branding logo with proper aspect ratio.
- Provide a consistent typography header with title, subtitle, and badge.
- Support scrollable content on small POS screen sizes.

## 5. Dependencies
- `react`
- `react-native` (`KeyboardAvoidingView`, `ScrollView`, `Image`, `View`, `Text`, `Platform`)
- [`@/constants/theme`](file:///C:/dev/moja-buss/apps/booth-app/constants/theme.ts) (`Colors`)

## 6. Consumers / Usage
- [`app/(auth)/login.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(auth)/login.tsx)

## 7. Current Implementation
- **File Length**: 71 lines.
- **Architectural Role**: Auth presentation shell.
- **Transaction-Critical Area**: NO
- **Key Exports**: `AuthShell` component.

## 8. UI / UX Audit
- Clean centered card layout with ample breathing room.
- On small 4-inch or 5-inch handheld POS terminals (e.g. Sunmi V2), large padding (py-10) might push the OTP input off-screen.

## 9. Design-System Audit
- Good use of Tailwind layout classes (`gap-6`, `rounded-3xl`, `shadow-sm`).

## 10. Theme Audit
- Background uses `Colors.light.background`.

## 11. Logic Audit
- `KeyboardAvoidingView` behavior properly switches between `"padding"` (iOS) and `"height"` (Android).

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
- Logo has `accessibilityRole="image"` and accessibility label.

## 18. Architecture Audit
- Clean component encapsulation.

## 19. Code Quality Audit
- Typescript props interface clearly documented.

## 20. Reference Comparison
- Matches modern mobile auth scaffolding.

## 21. Problems
1. [SMALL SCREEN SCROLL PADDING] Large vertical padding (`py-10`) risks clipping inputs on 480x800 POS screens when software keyboard opens.

## 22. Severity
- **Classification**: `P2`
- **Rationale**: Layout responsiveness on compact handheld POS devices.

## 23. Recommended Changes
1. Use safe area insets and responsive padding (`py-6` on small screens).

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
