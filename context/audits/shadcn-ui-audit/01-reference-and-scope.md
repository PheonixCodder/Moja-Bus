# 01 — Reference and Scope

## Reference version

| Item | Value |
|------|-------|
| Upstream | `shadcn-ui/ui` |
| Commit | `7c9eaba1c0a6404c990c144a654792e3313c650d` |
| App copied | `apps/v4` |
| Local path | `context/services/shadcn` |
| File count (approx.) | ~4739 files under reference tree |

**Rule for this audit:** Prefer the pinned local reference over newer upstream knowledge. When newer docs differ, call it out explicitly.

---

## Audit scope

### In scope

- `apps/web` — Next.js App Router consumer
- `packages/ui` — `@moja/ui` shadcn package
- `packages/theme` — `@moja/theme` tokens + CSS
- Monorepo config that affects the above (root workspace, pnpm, TS paths)
- `context/services/shadcn` — canonical reference

### Explicitly out of scope

- `apps/driver-app`, `apps/traveler-app` and all RN/Expo UI
- Dark mode as a product feature (absence is intentional — see § Dark mode)
- Backend/tRPC/business logic except where it shapes form/UI contracts
- Pixel-perfect visual cloning of the shadcn marketing site

### Dark mode (INFO)

`.dark` CSS variables exist in `@moja/theme/global.css`. Product requirement is light-only. **Not a defect.** Broken light-theme tokens would be a defect; unused dark tokens are not.

---

## Methodology

1. **Inventory** — package.json, components.json, CSS, exports, component lists  
2. **Reference map** — docs (`content/docs`), changelog, bases (`registry/bases/{base,radix,aria}`), styles (`registry/styles/style-*.css`), create/preset (`app/(app)/(create)`), examples/charts  
3. **Conformance** — every `packages/ui/src/components/ui/*.tsx` vs matching base/radix registry file  
4. **Usage** — `@moja/ui` imports, Field usage, asChild, charts, forms across `apps/web`  
5. **Classify** — intentional design vs accidental divergence vs half-migration  
6. **Document** — findings with IDs, severity, confidence, remediation order  

### Tools / evidence sources

- graphify query (orientation)
- Static file comparison (line counts, imports, APIs)
- Grep across packages/ui and apps/web
- Changelog MDX reads (CLI v4, Base UI default, cn package, presets)
- Subagent deep dives (Base UI/Radix map; preset/CSS architecture)

### Verification status

| Check | Status |
|-------|--------|
| Static architecture | **Verified** |
| Component import/primitive map | **Verified** |
| Runtime a11y / keyboard | **NOT VERIFIED** (static only) |
| `pnpm typecheck` / build this session | **NOT VERIFIED** this session (memory claims prior green; re-run before remediation merge) |
| Browser visual QA | **NOT VERIFIED** |

---

## Canonical documentation used

| Area | Path under `context/services/shadcn` |
|------|--------------------------------------|
| Docs root | `content/docs/` |
| Changelog | `content/docs/changelog/` (esp. 2025-02-tailwind-v4, 2026-01-base-ui, 2026-03-cli-v4, 2026-04-preset*, 2026-07-base-ui-default, 2026-09-cn) |
| Base UI components | `content/docs/components/base/` |
| Radix components | `content/docs/components/radix/` |
| Forms | `content/docs/forms/` |
| Installation / monorepo | `content/docs/installation/`, changelog monorepo notes |
| Preset create UI | `app/(app)/(create)/` |
| Examples | `app/(app)/examples/` |
| Charts | `app/(app)/charts/` |
| Registry bases | `registry/bases/{base,radix,aria}/ui/` |
| Style CSS | `registry/styles/style-nova.css` (and siblings) |
| Bases metadata | `registry/bases.ts` |
| Styles metadata | `registry/styles.tsx` |

---

## Important reference nuance

The reference app’s own `components.json` still says `"style": "new-york"` — that is the **docs site’s internal config**, not the recommended consumer preset. Consumer presets are encoded as `{base}-{style}` (e.g. `base-nova`, `radix-nova`) via create/init.

Do not treat reference `components.json` as the target for Moja. Treat **registry bases + create presets + changelog** as the consumer architecture source of truth.
