# Audit: auth-button.tsx

## 1. File
Exact source path: [`apps/booth-app/features/auth/components/auth-button.tsx`](file:///C:/dev/moja-buss/apps/booth-app/features/auth/components/auth-button.tsx)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
High-visibility action button designed specifically for cashier authentication workflows with primary and secondary visual variants and pending spinners.

## 4. Responsibilities
- Provide distinct primary (rose gradient/solid) and secondary (outline/ghost) action buttons.
- Display an `ActivityIndicator` when `isPending` is true and disable touch interactions.
- Provide a generous 52px touch target suitable for rapid finger entry on POS hardware.

## 5. Dependencies
- `react`
- `react-native` (`TouchableOpacity`, `Text`, `ActivityIndicator`, `View`)
- [`@/constants/theme`](file:///C:/dev/moja-buss/apps/booth-app/constants/theme.ts) (`Palette`)
- [`@/lib/utils`](file:///C:/dev/moja-buss/apps/booth-app/lib/utils.ts) (`cn`)

## 6. Consumers / Usage
- [`app/(auth)/login.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(auth)/login.tsx) ("Envoyer le code", "Valider", "Changer de méthode")

## 7. Current Implementation
- **File Length**: 61 lines.
- **Architectural Role**: Auth feature presentation component.
- **Transaction-Critical Area**: NO
- **Key Exports**: `AuthButton` component.

## 8. UI / UX Audit
- 52px height exceeds the 48px POS minimum requirement.
- Clear visual distinction between primary and secondary buttons.

## 9. Design-System Audit
- Duplicates `components/ui/button.tsx`. Could be a specialized wrapper over `Button`.
- Uses direct Tailwind classes (`bg-primary`, `rounded-2xl`).

## 10. Theme Audit
- Uses `Palette.rose[500]` directly on line 42 for the secondary `ActivityIndicator` instead of semantic tokens.

## 11. Logic Audit
- Correctly checks `disabled || isPending` on the `TouchableOpacity`.
- `activeOpacity={0.8}` provides responsive feedback.

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
- Missing `accessibilityRole="button"` and `accessibilityState={{ busy: isPending, disabled: disabled || isPending }}`.

## 18. Architecture Audit
- Isolated in `features/auth/components/`.

## 19. Code Quality Audit
- Well-typed props interface with default variant `"primary"`.

## 20. Reference Comparison
- Standard React Native button component.

## 21. Problems
1. [ACCESSIBILITY DEFICIT] Missing `accessibilityRole="button"` and `accessibilityState`.
2. [HAPTIC OMISSION] Does not trigger `BoothFeedback.tap()` internally; relies on parent doing so.

## 22. Severity
- **Classification**: `P2`
- **Rationale**: Accessibility and semantic token polish.

## 23. Recommended Changes
1. Add full accessibility props.
2. Integrate `BoothFeedback.tap()` on press.

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
