# Plan — Phase 2: Monorepo Packaging & Boundary Enforcement

> **Part of:** [tRPC Architecture Remediation Master Plan](./README.md)  
> **Target Workspaces:** `apps/web`, `apps/traveler-app`, `apps/driver-app`, `apps/booth-app`  
> **Status:** Ready for Review & Execution  

---

## 1. What we are building

A robust architectural firewall between the Next.js server application (`apps/web`) and the three React Native Expo client applications (`traveler-app`, `driver-app`, `booth-app`). This is achieved by:
1. Sanitizing the path mapping aliases in all three mobile `tsconfig.json` files to remove `"../web/*"`, preventing Metro bundlers from accidentally resolving and packaging backend Node.js files, database models, or server secrets.
2. Formalizing the contract export boundary in `apps/web/package.json` so that `AppRouter` is imported as an official workspace package contract (`@moja/web/trpc/router`) rather than via direct relative directory traversals (`../../web/trpc/routers/_app`).
3. Guaranteeing that the mobile build toolchains (Babel and Metro) strictly bundle client-safe code.

---

## 2. Vocabulary agreed

- **Path Alias Infiltration:** When a client application configures its compiler path mapping to search a sibling server application directory (e.g. `"@/*": ["*", "../web/*"]`). If an import is missing locally, the compiler silently reaches across the filesystem into the server codebase.
- **Node.js Runtime Leak:** When Node-only modules (such as `crypto`, `fs`, `ioredis`, `@better-auth/cli`, `server-only`) or server environment variables are inadvertently bundled into a native iOS/Android APK/IPA binary.
- **Package Type Export Boundary:** An entry in `package.json` under `"exports"` that explicitly declares which TypeScript type definitions are public for external workspace consumers, encapsulating private internal implementation details.
- **Workspace Linking:** The pnpm protocol (`workspace:*`) enabling local monorepo packages to depend on one another with explicit dependency declarations.

---

## 3. Decisions made

1. **Path Alias Strict Isolation:**
   - **Decision:** Change `"@/*": ["*", "../web/*"]` to `"@/*": ["./*"]` in `apps/traveler-app/tsconfig.json`, `apps/driver-app/tsconfig.json`, and `apps/booth-app/tsconfig.json`.
   - **Reasoning:** Sibling app traversal violates monorepo separation of concerns. Mobile apps should only resolve files within their own root directory or through declared workspace dependencies (`@moja/*`).
2. **Contract Sharing via `@moja/web` Workspace Export:**
   - **Decision:** Configure `apps/web/package.json` with a dedicated `"exports"` entry:
     ```json
     "./trpc/router": {
       "types": "./trpc/routers/_app.ts"
     }
     ```
     and add `"@moja/web": "workspace:*"` to each mobile app's `devDependencies`.
   - **Reasoning:** Rather than undertaking a massive refactor to move all 26 subrouters, Prisma queries, and auth middlewares into a separate `packages/api` directory (which would require rewriting hundreds of imports across `apps/web`), exporting only the `AppRouter` type from `apps/web` provides the exact same type safety and boundary protection with zero runtime disruption.
3. **Prevention of Accidental Runtime Bundling:**
   - **Decision:** Ensure `import type { AppRouter }` is used exclusively with the `type` modifier so that bundlers strip the import completely during compilation, ensuring zero JavaScript runtime footprint.

---

## 4. Assumptions

- `apps/web` is already named or can be named `"@moja/web"` in its `package.json` without breaking Vercel deployment scripts (which target the root directory or `apps/web` path).
- Metro bundler in Expo SDK 57 supports package export type declarations when consumed via `import type`.
- No active mobile component genuinely depends on runtime JavaScript code located in `apps/web`. Any existing runtime imports from `../web/` will be migrated to `@moja/shared`, `@moja/types`, or `@moja/ui`.

---

## 5. Implementation steps

### Step 1: Sanitize Mobile `tsconfig.json` Files

#### A. Traveler App (`apps/traveler-app/tsconfig.json`)
```diff
 {
   "compilerOptions": {
     "baseUrl": ".",
     "paths": {
-      "@/*": ["*", "../web/*"]
+      "@/*": ["./*"]
     }
   }
 }
```

#### B. Driver App (`apps/driver-app/tsconfig.json`)
```diff
 {
   "compilerOptions": {
     "baseUrl": ".",
     "paths": {
-      "@/*": ["*", "../web/*"]
+      "@/*": ["./*"]
     }
   }
 }
```

#### C. Booth App (`apps/booth-app/tsconfig.json`)
```diff
 {
   "compilerOptions": {
     "baseUrl": ".",
     "paths": {
-      "@/*": ["./*", "../web/*"]
+      "@/*": ["./*"]
     }
   }
 }
```

---

### Step 2: Configure Workspace Contract Export in `apps/web`

#### In `apps/web/package.json`:
Update package name and define exports:
```diff
 {
-  "name": "web",
+  "name": "@moja/web",
   "version": "0.1.0",
   "private": true,
+  "exports": {
+    "./trpc/router": {
+      "types": "./trpc/routers/_app.ts"
+    }
+  },
```

---

### Step 3: Link `@moja/web` to Mobile Applications

Add `@moja/web` to `devDependencies` in:
- `apps/traveler-app/package.json`
- `apps/driver-app/package.json`
- `apps/booth-app/package.json`

```diff
   "devDependencies": {
+    "@moja/web": "workspace:*",
     "@moja/typescript": "workspace:*",
...
```

Run:
```powershell
pnpm install
```

---

### Step 4: Update Router Imports in Mobile `lib/trpc.tsx`

#### In `apps/traveler-app/lib/trpc.tsx`, `apps/driver-app/lib/trpc.tsx`, `apps/booth-app/lib/trpc.tsx`:

```diff
 import { createTRPCContext } from "@trpc/tanstack-react-query";
-import type { AppRouter } from "../../web/trpc/routers/_app";
+import type { AppRouter } from "@moja/web/trpc/router";

 export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();
```

---

## 6. Verification and Testing

### 1. Leakage Defense Test
Verify that mobile apps cannot import private web files:
1. Add a dummy test import to `apps/driver-app/app/_layout.tsx`:
   ```typescript
   import { somePrivateServerUtil } from "@/lib/auth"; // does not exist in driver-app, only in apps/web
   ```
2. Run:
   ```powershell
   pnpm --filter driver-app typecheck
   ```
3. *Expected Outcome:* The compiler MUST throw `Cannot find module '@/lib/auth'`. It must NOT silently fall back to `apps/web/lib/auth`.
4. Remove the test import.

### 2. Full Workspace Typecheck
Run:
```powershell
pnpm turbo typecheck
```
*Expected Outcome:* All projects pass without relative path errors.
