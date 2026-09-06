# Architecture Plan — Phase 1: Canonical Design System Foundation

## 1. Goal & Objectives
Establish a unified, multi-tier design token architecture in `@moja/theme` that serves as the single source of truth across all web dashboards (Passenger, Operator, Admin) and mobile apps (Traveler, Driver/Conductor), eliminating ghost tokens, hardcoded values, and conflicting color models.

## 2. Invariants & Standards
- **Zero Runtime Bloat**: `@moja/theme/tokens.ts` must be universally importable (Web, Node, React Native) without requiring `react-native` runtime in web/node environments.
- **Color Model**: OKLCH for CSS variables (per `31-final-design-system-blueprint.md`), with exact RGB/Hex equivalents in TypeScript for React Native Canvas/Mapbox.
- **Zero Ghost Tokens**: Deprecate and remove `--color-bg-app`, `--color-bg-card`, `--color-text-primary` in favor of canonical Tailwind v4 semantic tokens (`bg-background`, `bg-card`, `bg-card-elevated`, `text-foreground`, `text-muted-foreground`, `border-border`).
- **Semantic Status Parity**: Full tokens for `success`, `warning`, `destructive`, `info` in both light and dark themes.

## 3. Targeted Files & Changes
1. `packages/theme/tokens.ts`:
   - Re-architect with universal primitives: `Colors`, `Spacing`, `Radii`, `Typography`, `ControlHeights`.
   - Remove hard dependency on `react-native` by using safe platform detection.
2. `packages/theme/global.css`:
   - Implement complete Light & Dark OKLCH color spaces.
   - Map semantic functional colors (`success`, `warning`, `destructive`, `info`).
   - Register `@theme inline` mappings for Tailwind v4.
3. `packages/ui/src/styles/globals.css`:
   - Bind `@moja/theme/global.css` and Base UI variants.
4. `apps/traveler-app/global.css`:
   - Remove conflicting raw HSL overrides.
5. `apps/driver-app/global.css` & `constants/theme.ts`:
   - Connect Driver app to `@moja/theme` tokens, removing isolated divergent token definitions while preserving high-contrast OLED dark mode.

## 4. Verification & Gates
- `pnpm --filter @moja/theme typecheck`
- `pnpm --filter @moja/ui typecheck`
- `pnpm --filter traveler-app typecheck`
- `pnpm --filter driver-app typecheck`
- `node context/audits/scripts/generate_all_trackers.cjs`
- Git diff review ensuring zero broken imports.
