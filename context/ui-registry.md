# UI Registry

Living document. Updated after every component is built. Read this before building any new component - match existing patterns exactly before inventing new ones.

## How to Use
Before building any component:
1. Check whether a similar component already exists here.
2. If yes, match its exact classes and behavior.
3. If no, build it from the token and UI rules, then add it here.

After building any component, update this file with the component name, file path, and exact classes used.

## Components
- `apps/aggregator-web/components/auth-shell.tsx`: full-screen auth shell with `bg-[#07131f]`, layered radial gradients, `rounded-[2rem]`, `border border-white/10`, `bg-white/[0.06]`, and `backdrop-blur`.
- `apps/aggregator-web/components/auth-field.tsx`: auth input rows using `rounded-2xl`, `border border-white/10`, `bg-slate-950/75`, `px-4 py-3`, and cyan focus states.
- `apps/aggregator-web/components/dashboard-panel.tsx`: protected dashboard card using `bg-[#06111a]`, gradient overlays, and `rounded-[2rem]` glass panels.
- `apps/traveler-app/src/components/auth-shell.tsx`: mobile auth screen shell with dark background, decorative glow views, `SafeAreaView`, and a glass card container.
- `apps/traveler-app/src/components/auth-field.tsx`: mobile auth text input rows with rounded 18px borders, dark fill, and secondary helper text.
- `apps/traveler-app/src/components/auth-button.tsx`: shared pressable auth action with primary/secondary variants, loading spinner, and disabled state styling.
- `packages/ui/src/components/ui/*`: shared shadcn component source of truth mirrored from `demo-ui` and exposed to apps through `@moja/ui/components/ui/*`.
- `apps/aggregator-web/features/dashboard/components/dashboard-sidebar.tsx`: passenger dashboard sidebar with `bg-bg-surface`, collapsed bus logo state, grouped nav, and account dropdown.
- `apps/aggregator-web/features/dashboard/components/dashboard-header.tsx`: dashboard welcome header with session-aware greeting and search CTA.
- `apps/aggregator-web/features/dashboard/components/sessions-panel.tsx`: empty-state trips panel using the same card shell as the demo dashboard, adapted to bookings.
- `apps/aggregator-web/app/dashboard/layout.tsx`: protected dashboard layout using `SidebarProvider`, `SidebarInset`, `TooltipProvider`, and `Toaster`.
