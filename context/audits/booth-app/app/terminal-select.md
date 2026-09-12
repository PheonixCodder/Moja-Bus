# Audit: terminal-select.tsx

## 1. File
Exact source path: [`apps/booth-app/app/terminal-select.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/terminal-select.tsx)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Workstation terminal selection screen allowing cashiers to select or switch their active departure terminal from a searchable list of company bus terminals.

## 4. Responsibilities
- Query available terminals via `trpc.booth.getTerminals`.
- Provide client-side search filtering by terminal name, city, and municipality.
- Allow selection of terminal, persist to [`stores/session.ts`](file:///C:/dev/moja-buss/apps/booth-app/stores/session.ts) via `setTerminal`.
- Trigger haptic feedback and redirect to `/(tabs)`.

## 5. Dependencies
- `@hugeicons/core-free-icons` (`Cancel01Icon`, `MapPinIcon`, `Search01Icon`)
- `@hugeicons/react-native` (`HugeiconsIcon`)
- `@tanstack/react-query` (`useQuery`)
- `expo-router` (`router`)
- `react` (`useState`, `useMemo`)
- `react-i18next` (`useTranslation`)
- `react-native` (`FlatList`, `Pressable`, `Text`, `View`)
- `react-native-safe-area-context` (`useSafeAreaInsets`)
- [`@/components/ui/button`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/button.tsx)
- [`@/components/ui/card`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/card.tsx)
- [`@/components/ui/input`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/input.tsx)
- [`@/components/ui/skeleton`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/skeleton.tsx)
- [`@/constants/ui-colors`](file:///C:/dev/moja-buss/apps/booth-app/constants/ui-colors.ts) (`IconColors`)
- [`@/lib/haptics`](file:///C:/dev/moja-buss/apps/booth-app/lib/haptics.ts) (`BoothFeedback`)
- [`@/lib/trpc`](file:///C:/dev/moja-buss/apps/booth-app/lib/trpc.tsx) (`useTRPC`)
- [`@/stores/session`](file:///C:/dev/moja-buss/apps/booth-app/stores/session.ts) (`useSessionStore`)

## 6. Consumers / Usage
- [`app/index.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/index.tsx) (When operator has no assigned terminal)
- [`app/(tabs)/profile.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(tabs)/profile.tsx) (Terminal switch button)

## 7. Current Implementation
- **File Length**: 216 lines.
- **Architectural Role**: Terminal assignment screen.
- **Transaction-Critical Area**: NO
- **Key Exports**: Default export `TerminalSelectScreen`.

## 8. UI / UX Audit
- Clean list of terminal cards with city and municipality subtitles.
- Instant search bar with clear button.
- 5 skeleton loading cards during query.

## 9. Design-System Audit
- Good reuse of `Input`, `Card`, `Skeleton`, and `Button` primitives.

## 10. Theme Audit
- Background uses `bg-background`, icons use `IconColors`.

## 11. Logic Audit
- Search filter correctly matches on name, city, or municipality.

## 12. State Management Audit
- Stores selected terminal in `useSessionStore`.

## 13. Async / Side-Effect Audit
- React Query handles terminal query.

## 14. Error Handling Audit
- Includes error card with retry button when query fails.

## 15. Offline / Synchronization Audit
- **Defect**: Terminal list is not cached offline. If a cashier loses internet and needs to re-select a terminal, query fails.

## 16. Performance Audit
- `useMemo` used for search filtering.

## 17. Accessibility Audit
- Clear text, accessible card tap targets.

## 18. Architecture Audit
- Clean screen architecture.

## 19. Code Quality Audit
- Fully typed `Terminal` interface.

## 20. Reference Comparison
- Standard station selection UX.

## 21. Problems
1. [HARDCODED FALLBACK STRINGS] Lines 95, 148, 158, 207 contain hardcoded French fallback text instead of complete i18n keys.
2. [OFFLINE TERMINAL CACHE] No local AsyncStorage cache of terminals for offline terminal switching.

## 22. Severity
- **Classification**: `P2`
- **Rationale**: Non-critical route; offline caching and i18n cleanup needed.

## 23. Recommended Changes
1. Cache terminal list in AsyncStorage.
2. Localize all fallback strings.

## 24. Refactoring Plan
1. Add offline cache to `getTerminals` query.
2. Replace hardcoded strings with i18n keys.

## 25. Test Strategy
1. Test searching by city name.
2. Test selection updates session and routes to tabs.

## 26. Verification Criteria
- [ ] All strings localized.
- [ ] Terminal successfully selected.

## 27. Next Steps
- Implement in Phase 7.

## 28. Notes
None.
