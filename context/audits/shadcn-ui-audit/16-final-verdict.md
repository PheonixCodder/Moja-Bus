# 16 — Final Verdict

## Production-readiness

**The shadcn architecture is not yet a trustworthy long-term foundation.**

Product UI can continue shipping, but **CLI upgrades and new component installs are unsafe** until configuration and a few primitive honesty issues are fixed.

Classification: **C — Hybrid**.

---

## Answers to mandatory questions

### 1. Is `@packages/ui` correctly architected as our shadcn package?

**Mostly yes** (boundaries, exports, consumption). Undermined by mislabeled preset, dead deps, and generation gap.

### 2. Is the preset architecture correct?

**No.** Code is Base UI; config claims `radix-nova`.

### 3. Is `components.json` correct?

**No.** Fix `style` → `base-nova` and `aliases.components` → `#components`.

### 4. Is `cn` correctly separated and consumed?

**Acceptably** via `@moja/ui/lib/utils`. Not yet on the 2026-09 `cn` package. Single implementation in UI package — good.

### 5. Is Base UI integrated correctly?

**Mostly.** Majority of interactive components use `@base-ui/react` correctly. Exceptions: drawer, typed shims.

### 6. Is Radix integrated correctly?

**Not actively.** Residual packages/CSS/API only.

### 7. Are Base UI and Radix accidentally mixed?

**Partially.** Not root+trigger from different libs in most files, but Vaul drawer + asChild shims + Radix CSS vars = half-migration mixture.

### 8. Are components based on the correct generation/reference?

**Partial.** Correct **primitive family** (Base) for modern shadcn; **styling generation** lags pinned reference (`cn-*` style CSS).

### 9. Which components were unnecessarily modified?

Systemic inline-CVA vs `cn-*` (all styled). Harmful extras: dropdown-menu asChild shim, tooltip `as any`, drawer left on Vaul without documentation.

### 10. Which must be rebuilt/replaced?

- **dropdown-menu** (refactor types/API)
- **tooltip** (types)
- **drawer** (rebuild to Base **or** formal KEEP Vaul)
- Optionally mass-regenerate if adopting style tokens

### 11. Is theme package architecture correct?

**Yes.** Intentional Moja brand. Keep. Dark tokens unused — not a defect.

### 12. Is Tailwind/CSS architecture correct?

**Partially.** v4 pipeline + monorepo `@source` are correct. **Foundation gap:** missing `shadcn@4.21.0` / `tw-animate-css` and their imports (SHADCN-027/028). Also style-token generation gap, incomplete animate utilities, accordion keyframe mismatch, missing surface/heading tokens.

### 13. Are forms per current shadcn architecture?

**Primitives yes; application usage no** (half-migrated; ~7 Field files).

### 14. Are charts per current architecture?

**Primitive yes; application mixed.** Three surfaces use Chart*; three bypass with raw Recharts. Multiple `hsl(var(--hex))` color bugs (SHADCN-032). Not a clean PASS.

### 15. Are app components consuming UI correctly?

**Package imports yes; composition patterns mixed** (asChild, Field, space-y).

### 16. Duplicate utilities/components?

No duplicate web shadcn tree. Dead Radix deps. Local cn vs unused upstream cn package concept.

### 17. Half-completed migrations?

**Yes:** preset label, drawer, asChild, forms, CSS keyframes, deps.

### 18. Hidden accessibility regressions?

**Likely** around menu shim, non-modal drawer, non-Field forms. Runtime **NOT VERIFIED**.

### 19. Hidden TypeScript/API problems?

**Yes** — `as any` on dropdown-menu, tooltip, phone-input.

### 20. Can we safely continue adding shadcn components?

**Not until Phase 1 (config) completes.** Even then, review `--diff` carefully under Stay-inline strategy.

### 21. Can we safely update shadcn components in the future?

**Not yet.** After Phase 1–2 and an explicit styling strategy, yes with process.

### 22. What must be fixed before UI foundation is production-ready?

1. `components.json` → `base-nova` + alias fix  
2. Install `shadcn@4.21.0` + `tw-animate-css`; import CSS (or eject equivalent)  
3. Theme token gaps + ghost `bg-bg-*` / `text-text-*` + `hsl(var(--hex))` chart fix  
4. Remove dead Radix/`@shadcn/react` deps  
5. Remove asChild shim; migrate consumers; fix tooltip types  
6. Decide drawer (Base vs documented Vaul)  
7. Decide Stay-inline vs Adopt `cn-*` style tokens  
8. Form Field + ChartContainer adoption for critical surfaces  
9. Re-run typecheck + keyboard smoke tests  

---

## Final statement

Moja’s web UI is a **credible Base UI–era shadcn port with strong package boundaries and branded theme**, overlaid by a **mislabeled radix-nova config**, **missing shadcn CSS foundation packages** (`shadcn@4.21.0`, `tw-animate-css`), a **pre–style-token CSS generation**, and **half-migrated primitives/usage (drawer, menus, forms, charts, ghost token classes)**.  

Fix configuration, CSS foundation, and honesty first. Do not rewrite the entire library by default.

**Reaudit detail:** [18-reaudit-css-packages-charts.md](./18-reaudit-css-packages-charts.md)
