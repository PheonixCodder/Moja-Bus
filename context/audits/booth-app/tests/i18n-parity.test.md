# Audit: __tests__/i18n-parity.test.ts

## 1. File
Exact source path: [`apps/booth-app/__tests__/i18n-parity.test.ts`](file:///C:/dev/moja-buss/apps/booth-app/__tests__/i18n-parity.test.ts)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Automated test suite verifying structural parity between French (`locales/fr.json`) and English (`locales/en.json`) localization dictionaries and detecting UTF-8 mojibake encoding corruption.

## 4. Responsibilities
- Recursively extract nested translation keys from JSON dictionaries.
- Assert zero missing keys in French dictionary that exist in English dictionary.
- Assert zero missing keys in English dictionary that exist in French dictionary.
- Assert zero Unicode replacement characters (`\uFFFD`) or corrupted diacritic artifacts (`Ǹ`) in `fr.json`.

## 5. Dependencies
- `node:assert/strict` (`assert`)
- `node:fs` (`fs`)
- `node:path` (`path`)
- `node:test` (`test`)
- `node:url` (`fileURLToPath`)

## 6. Consumers / Usage
- Monorepo test suite (`turbo test` / `pnpm test`).

## 7. Current Implementation
- **File Length**: 49 lines.
- **Architectural Role**: CI localization verification test.
- **Transaction-Critical Area**: NO
- **Key Exports**: Automated tests.

## 8. UI / UX Audit
- Not applicable.

## 9. Design-System Audit
- Not applicable.

## 10. Theme Audit
- Not applicable.

## 11. Logic Audit
- Clean recursive key flattener:
  ```ts
  function getKeys(obj: Record<string, any>, prefix = ""): string[] {
    return Object.keys(obj).flatMap((key) => {
      const val = obj[key];
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      return typeof val === "object" && val !== null ? getKeys(val, newPrefix) : [newPrefix];
    });
  }
  ```
- Accurately checks symmetrical differences between key sets.

## 12. State Management Audit
- Stateless test runner.

## 13. Async / Side-Effect Audit
- Synchronous file reads.

## 14. Error Handling Audit
- Throws descriptive assertion errors listing the exact missing keys.

## 15. Offline / Synchronization Audit
- Not applicable.

## 16. Performance Audit
- Executes in under 15ms.

## 17. Accessibility Audit
- Not applicable.

## 18. Architecture Audit
- Native Node.js test runner (`node:test`), zero heavy testing framework overhead.

## 19. Code Quality Audit
- Concise, high-value test code.

## 20. Reference Comparison
- Matches best-in-class i18n parity testing.

## 21. Problems
1. [DICTIONARY ISOLATION] Tests parity between JSON files, but does NOT verify whether source code in `apps/booth-app` calls undefined translation keys.
2. [MISSING SPANISH TEST] If additional locales are added in the future, test is hardcoded to only `en` and `fr`.

## 22. Severity
- **Classification**: `P2`
- **Rationale**: Reliable CI test; could be extended to validate key usage in codebase.

## 23. Recommended Changes
1. Add AST or regex check verifying that `t("...")` keys in source files exist in `fr.json`.

## 24. Refactoring Plan
1. Maintain existing test suite; extend with codebase key validation.

## 25. Test Strategy
1. Run `node --test apps/booth-app/__tests__/i18n-parity.test.ts`.

## 26. Verification Criteria
- [ ] Tests pass cleanly with zero missing keys.
- [ ] No mojibake characters detected.

## 27. Next Steps
- Keep in Phase 9.

## 28. Notes
None.
