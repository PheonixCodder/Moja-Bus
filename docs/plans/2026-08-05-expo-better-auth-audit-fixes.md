# Expo + Better Auth Audit Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all discrepancies between our Expo + Better Auth implementation and the official documentation, eliminating dead code, missing dependencies, and version inconsistencies.

**Architecture:** Straightforward dependency and cleanup fixes across two apps (traveler-app and web). No runtime behavior changes — only removing dead code, adding missing deps, and aligning versions.

**Tech Stack:** pnpm, Expo SDK 55+, Better Auth ^1.6.20, @better-auth/expo ^1.6.22

---

### Task 1: Install `expo-network` in traveler-app

**Files:**
- Modify: `apps/traveler-app/package.json`

**Step 1: Install the dependency**

Run: `pnpm add expo-network --filter traveler-app`
Expected: `expo-network` added to traveler-app's dependencies in package.json

**Step 2: Verify install**

Run: `cat apps/traveler-app/package.json | Select-String "expo-network"`
Expected: `"expo-network": "latest"` (or similar) appears in dependencies

**Step 3: Commit**

```bash
git add apps/traveler-app/package.json apps/traveler-app/package-lock.json
git commit -m "fix(traveler-app): add missing expo-network dependency per Expo integration docs"
```

---

### Task 2: Delete `expo-client-plugin.ts` (dead code)

**Files:**
- Delete: `apps/traveler-app/lib/expo-client-plugin.ts`

**Step 1: Verify the file is unused**

Run: `Select-String -Path apps/traveler-app -Pattern "expo-client-plugin" -Include "*.ts","*.tsx"`
Expected: Only the import in `auth-client.ts` references it (no other usages)

**Step 2: Delete the file**

Run: `Remove-Item apps/traveler-app/lib/expo-client-plugin.ts`

**Step 3: Commit**

```bash
git add apps/traveler-app/lib/expo-client-plugin.ts
git commit -m "feat(traveler-app): remove dead expo-client-plugin.ts (replaced by direct expoClient usage)"
```

---

### Task 3: Remove dead `createExpoPlugin` import from `auth-client.ts`

**Files:**
- Modify: `apps/traveler-app/lib/auth-client.ts:5`

**Step 1: Remove the unused import**

Edit `apps/traveler-app/lib/auth-client.ts` — remove line 5:
```
import { createExpoPlugin } from "./expo-client-plugin";
```

**Step 2: Verify no compile errors**

Run: `pnpm typecheck --filter traveler-app`
Expected: No type errors related to the removed import

**Step 3: Commit**

```bash
git add apps/traveler-app/lib/auth-client.ts
git commit -m "feat(traveler-app): remove unused createExpoPlugin import"
```

---

### Task 4: Remove dead `nextCookies` import from `auth-server.ts`

**Files:**
- Modify: `apps/web/lib/auth-server.ts:9`

**Step 1: Remove the unused import**

Edit `apps/web/lib/auth-server.ts` — remove line 9:
```
import { nextCookies } from "better-auth/next-js";
```

**Step 2: Verify `nextCookies` is not in the plugins array**

Run: `Select-String -Path apps/web/lib/auth-server.ts -Pattern "nextCookies"`
Expected: No matches (the import and any usage are gone)

**Step 3: Verify the server still works**

Run: `pnpm typecheck --filter web`
Expected: No type errors

**Step 4: Commit**

```bash
git add apps/web/lib/auth-server.ts
git commit -m "feat(web): remove unused nextCookies import from auth-server.ts"
```

---

### Task 5: Align `@better-auth/expo` versions between apps

**Files:**
- Modify: `apps/traveler-app/package.json`

**Step 1: Update traveler-app's `@better-auth/expo` to match web app**

Run: `pnpm add @better-auth/expo@^1.6.22 --filter traveler-app`
Expected: `@better-auth/expo` updated to `^1.6.22` in traveler-app's package.json

**Step 2: Verify version alignment**

Run:
```
Select-String -Path apps/traveler-app/package.json -Pattern "@better-auth/expo"
Select-String -Path apps/web/package.json -Pattern "@better-auth/expo"
```
Expected: Both show `^1.6.22`

**Step 3: Install updated lockfile**

Run: `pnpm install`

**Step 4: Commit**

```bash
git add apps/traveler-app/package.json apps/traveler-app/package-lock.json pnpm-lock.yaml
git commit -m "fix(traveler-app): align @better-auth/expo version with web app (^1.6.22)"
```

---

### Task 6: Add `storagePrefix` to `expoClient()` config (optional but recommended)

**Files:**
- Modify: `apps/traveler-app/lib/auth-client.ts`

**Step 1: Add `storagePrefix` to `expoClient()` config**

Edit `apps/traveler-app/lib/auth-client.ts` — add `storagePrefix` to the `expoClient` options:
```ts
expoClient({
    scheme: "traveler-app",
    storage: SecureStore,
    storagePrefix: "traveler-app",
}),
```

**Step 2: Verify type check passes**

Run: `pnpm typecheck --filter traveler-app`
Expected: No type errors

**Step 3: Commit**

```bash
git add apps/traveler-app/lib/auth-client.ts
git commit -m "feat(traveler-app): add storagePrefix to expoClient config per Expo integration docs"
```

---

### Task 7: Verify all changes compile and pass checks

**Files:** No file changes — verification only.

**Step 1: Typecheck both apps**

Run: `pnpm typecheck --filter traveler-app`
Run: `pnpm typecheck --filter web`
Expected: Both pass with no errors

**Step 2: Lint both apps**

Run: `pnpm lint --filter traveler-app`
Run: `pnpm lint --filter web`
Expected: Both pass with no errors

**Step 3: Verify traveler-app builds**

Run: `pnpm build --filter traveler-app`
Expected: Build succeeds

**Step 4: Verify web app builds**

Run: `pnpm build --filter web`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: verify all Expo + Better Auth audit fixes compile cleanly"
```