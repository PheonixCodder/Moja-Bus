# 17 — Dependency Matrix

| Package | Where | Version (declared) | Needed? | Notes |
|---------|-------|--------------------|---------|-------|
| @base-ui/react | ui | ^1.6.0 | YES | Match reference 1.6.0 |
| @moja/theme | ui, web | workspace | YES | Tokens |
| @moja/ui | web | workspace | YES | Primitives |
| radix-ui | ui | ^1.4.4 | NO | Unused — remove |
| @radix-ui/react-slot | ui | ^1.2.4 | NO | Unused — remove |
| @shadcn/react | ui | ^0.1.0 | NO | Unused — remove/justify |
| class-variance-authority | ui | ^0.7.1 | YES | |
| clsx | ui | ^2.1.1 | YES until cn migrate | |
| tailwind-merge | ui | ^3.4.0 | YES until cn migrate | |
| cn (npm) | reference only | — | Optional | 2026-09 |
| lucide-react | ui | ^0.561.0 | YES | iconLibrary |
| vaul | ui | ^1.1.2 | CONDITIONAL | Drawer |
| cmdk | ui | ^1.1.1 | YES | Command |
| recharts | ui | 3.8.0 | YES | Charts |
| embla-carousel-react | ui | ^8.6.0 | YES | |
| input-otp | ui | ^1.4.2 | YES | |
| react-day-picker | ui | ^10.0.1 | YES | skew vs ref ^9 |
| react-resizable-panels | ui | ^4.11.2 | YES | |
| sonner | ui | ^2.0.7 | YES | |
| next-themes | ui | ^0.4.6 | LIKELY NO | Light-only product |
| tailwindcss | ui | ^4 | YES | |
| @tailwindcss/typography | ui | ^0.5.20 | YES | |
| @tailwindcss/postcss | web | (web deps) | YES | |

# 18 — File Inventory (shadcn-related)

## Config

- `packages/ui/components.json`
- `packages/ui/package.json`
- `packages/ui/tsconfig.json`
- `packages/theme/package.json`
- `packages/theme/global.css`
- `packages/theme/tokens.ts`
- `apps/web/app/globals.css`
- `apps/web/postcss.config.mjs`
- `apps/web/package.json` (`@moja/ui`, `@moja/theme`)
- **No** `apps/web/components.json`

## UI package sources

- `packages/ui/src/components/ui/*.tsx` (62)
- `packages/ui/src/lib/utils.ts`, `initials.ts`
- `packages/ui/src/hooks/use-mobile.ts`, `use-media-query.ts`
- `packages/ui/src/styles/globals.css`

## Reference (canonical)

- `context/services/shadcn/**` (~4739 files)
- Key: `registry/bases/{base,radix,aria}/ui`, `registry/styles`, `content/docs`, `app/(app)/(create)`, `app/(app)/examples`, `app/(app)/charts`

# 19 — Legacy Patterns

| Pattern | Where | Status |
|---------|-------|--------|
| `asChild` | web + dropdown shim | Legacy Radix API on Base stack |
| Vaul drawer | drawer.tsx | Legacy vs base drawer |
| `--radix-*-height` CSS | ui globals | Legacy |
| Label+div+space-y forms | many web forms | Pre-Field |
| Local cn helper | utils.ts | Pre-2026-09 cn package |
| Inline CVA utilities | most components | Pre-cn-* style CSS |
| components.json radix-nova | packages/ui | Mislabeled / stale |

# 20 — Duplicate / Dead Code

| Item | Notes |
|------|-------|
| radix-ui dependency | Dead |
| @radix-ui/react-slot | Dead |
| @shadcn/react | Dead (no src import) |
| Duplicate Button in web | Not found |
| Duplicate cn in web | Not found (uses @moja/ui) |
| form.tsx | Absent — correct for current shadcn |
| .dark tokens | Present but unused — not dead code to delete unless desired |

# 21 — Reference Comparison Notes

| Topic | Pinned reference | Moja | Newer upstream? |
|-------|------------------|------|-----------------|
| Default base | Base UI default (Jul 2026 changelog) | Base UI in code | Same direction |
| Style field | base-nova / radix-nova | Claims radix-nova | — |
| `shadcn` CLI pkg | 4.21.0 | **Missing** | Moja behind — SHADCN-027 |
| `tw-animate-css` | ^1.4.0 + import | Missing | Moja behind — SHADCN-028 |
| `shadcn/tailwind.css` | Required import | Missing / partial hand-roll | Moja behind |
| cn | `cn` package (Sep 2026) | local utils | Moja behind |
| Component CSS | style-nova `cn-*` | inline CVA | Moja behind |
| Theme surface/selection/code | Present | Missing | Moja behind — SHADCN-029 |
| Docs site components.json | still `new-york` | n/a | Docs site lag — ignore for consumers |

# 22 — Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| CLI installs Radix into Base tree | High if CLI used | High | Phase 0–1 freeze+fix |
| Missing shadcn CSS foundation | Certain today | High | Phase 1 install+import |
| Invalid chart colors (`hsl`+hex) | Certain | Medium–High | Phase 1b sweep |
| Ghost `bg-bg-*` / `text-text-*` | Certain | Medium | Alias or replace |
| Removing asChild shim breaks app | High | Medium | Migrate consumers same PR |
| Adopting cn-* without CSS | Medium | High | All-or-nothing Phase 3 |
| Non-modal drawer a11y bugs | Medium | Medium | Audit usages; Base migrate |
| day-picker v10 API drift | Medium | Medium | Calendar regression tests |
| Accordion/nav animation fail | High | Medium | 027/028 + keyframe fallback |
| Nav menu slide utilities no-op | High | Low–Med | tw-animate-css |

# 23 — Dependency pin matrix (reaudit)

See [18-reaudit-css-packages-charts.md](./18-reaudit-css-packages-charts.md) §E for full Moja vs reference table.
