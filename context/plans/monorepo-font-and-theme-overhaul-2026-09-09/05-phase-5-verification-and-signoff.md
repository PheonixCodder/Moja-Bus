# Phase 5: Verification, Cleanup & Enterprise Sign-Off

**Target Directory:** Full Monorepo  
**Execution Type:** Automated gates, audits & zero-regression checks  

---

## 1. Objectives

1. Verify complete elimination of `Montserrat` across all directories, packages, config files, and package manifests.
2. Run full workspace typecheck across all 13 workspace projects.
3. Validate code formatting and linting across the monorepo.
4. Persist updated invariants to session memory and the Context System.

---

## 2. Verification Steps & Commands

### Step 1: Zero-Montserrat Audit
Run ripgrep pattern search for any lingering reference to Montserrat:
```bash
git grep -i "montserrat"
```
*Criteria: Must return 0 hits across all source files, CSS, configs, and package.json files.*

### Step 2: Full Monorepo Typecheck
```bash
pnpm -r typecheck
```
*Criteria: All 13 workspace projects must exit with code 0:*
- `@moja/auth`
- `@moja/config`
- `@moja/schemas`
- `@moja/shared`
- `@moja/types`
- `@moja/ui`
- `@moja/db`
- `driver-app`
- `traveler-app`
- `booth-app`
- `web`

### Step 3: Codebase Formatting & Linter Check
```bash
pnpm format
pnpm check
```
*Criteria: Biome formatting and linting pass with zero unresolved issues.*

### Step 4: Documentation & Context Persist
- Update `context/code-standards.md` to formally record:
  - **Headings**: Raleway (`font-heading`, `Raleway-Bold`, `Raleway-SemiBold`)
  - **Body / Interface**: Outfit (`font-sans`, `Outfit`, `Outfit-Medium`)
  - **Driver App**: Locked Dark Mode
  - **Traveler App**: Locked Light Mode
  - **Booth App**: Locked Light Mode
  - **Web**: Locked Light Mode
