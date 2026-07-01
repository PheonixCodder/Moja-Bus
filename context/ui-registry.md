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
- `apps/web/features/operator/views/operator-onboarding-view.tsx`: Single-route onboarding multi-step form view using Montserrat typeface, primary brand color `#ee237c`, dense-but-readable layout, small radii (<= 8px), and visible borders.
- `apps/web/features/operator/views/operator-dashboard-view.tsx`: Operator dashboard landing overview rendering company details and verification status.
- `apps/web/features/operator/views/operator-routes-view.tsx`: Full Route Builder page with drag-and-drop stop sequence reordering, Leaflet map previews, and search-equipped Combobox selectors.
- `apps/web/features/operator/views/operator-schedules-view.tsx`: 4-step Schedule Wizard page with calendar recurrence toggles, triangle fare pricing grid, and date generation preview.
- `apps/web/features/operator/views/operator-trips-view.tsx`: Dispatch Board page grouped by departure dates with seat fill indicators, inline bus assignments, and manifest drawer supporting passenger lists, check-ins, and board/delay/cancel controls.
- `apps/web/features/operator/components/operator-quick-actions.tsx`: Header-level dashboard quick actions supporting query-parameter-driven form automation.

## Platform Data (Seeded)
- **`City`**: 35 CI cities seeded via `apps/api/prisma/seed.ts`. `isMajorHub` flags Abidjan, Bouaké, Yamoussoukro, San-Pédro, Daloa, Korhogo, Man. Available via `GET /api/v1/routes/cities`.
- **`BusType`**: 7 vehicle types seeded. Available via `GET /api/v1/fleet/bus-types`.
- **`SeatLayoutTemplate`**: 5 platform-default seat grid layouts. Operator-specific layouts use `companyId`. Available via `GET /api/v1/fleet/layouts`.
- **`CompanyLocation` (Terminal)**: Operator depots from onboarding. `isTerminal=true` makes them bookable passenger stops. Linked to `City` via `cityId`. Available via `GET /api/v1/routes/terminals`.

## Backend Services
- `apps/api/src/lib/trip-generator.ts`: Auto-generates rolling 14-day `Trip`, `TripStop`, and `TripSeat` records from a Schedule + Bus. Called on schedule creation.
- `apps/api/src/routes/trips.ts`: Trip operations API — list, detail, assign bus/driver, delay, cancel, status lifecycle.
- `apps/api/src/routes/schedules.ts`: Schedule CRUD + calendar exceptions endpoint. Exceptions auto-cancel pre-generated trips.
- `apps/api/src/routes/routes-waypoints.ts`: Route + waypoint CRUD, terminals list, cities list.
- `apps/api/src/routes/fleet.ts`: Bus CRUD, bus-types list, seat layout templates list, seat layout per bus.
