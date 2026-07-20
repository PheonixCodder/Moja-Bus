# UI Registry

Living document. Updated after every component is built. Read this before building any new component - match existing patterns exactly before inventing new ones.

## How to Use
Before building any component:
1. Check whether a similar component already exists here.
2. If yes, match its exact classes and behavior.
3. If no, build it from the token and UI rules, then add it here.

After building any component, update this file with the component name, file path, and exact classes used.

## Components
- `apps/web/components/auth-shell.tsx`: full-screen auth shell with `bg-[#07131f]`, layered radial gradients, `rounded-[2rem]`, `border border-white/10`, `bg-white/[0.06]`, and `backdrop-blur`.
- `apps/web/components/auth-field.tsx`: auth input rows using `rounded-2xl`, `border border-white/10`, `bg-slate-950/75`, `px-4 py-3`, and cyan focus states.
- `apps/web/components/dashboard-panel.tsx`: protected dashboard card using `bg-[#06111a]`, gradient overlays, and `rounded-[2rem]` glass panels.
- `apps/app/src/components/auth-shell.tsx`: mobile auth screen shell with dark background, decorative glow views, `SafeAreaView`, and a glass card container.
- `apps/app/src/components/auth-field.tsx`: mobile auth text input rows with rounded 18px borders, dark fill, and secondary helper text.
- `apps/app/src/components/auth-button.tsx`: shared pressable auth action with primary/secondary variants, loading spinner, and disabled state styling.
- `packages/ui/src/components/ui/*`: shared shadcn component source of truth mirrored from `demo-ui` and exposed to apps through `@moja/ui/components/ui/*`.
- `apps/web/features/dashboard/components/dashboard-sidebar.tsx`: passenger dashboard sidebar redesigned to match best-dashboard-setup layout structure, custom grouped nav, traveler support card, and NavUser ellipsis dropdown footer.
- `apps/web/features/dashboard/components/dashboard-header.tsx`: dashboard welcome header with session-aware greeting and search CTA.
- `apps/web/features/dashboard/components/sessions-panel.tsx`: empty-state trips panel using the same card shell as the demo dashboard, adapted to bookings.
- `apps/web/features/passenger/views/passenger-wallet-view.tsx`: Client-side view component displaying live Available/Reserved balances, top-up dialogue, and dynamic ledger transaction history table.
- `apps/web/features/admin/views/admin-settlements-view.tsx`: Admin treasury cockpit displaying central clearing and revenue balance cards, an emergency manual settlement panel, and a class-filterable ledger auditor.
- `apps/web/features/admin/views/admin-withdrawals-view.tsx`: Payout monitoring queue view displaying KPI summaries, status filters, and manual override dialogs.
- `apps/web/app/dashboard/admin/withdrawals/page.tsx`: Page container prefetching withdrawals queue data and rendering `AdminWithdrawalsView`.
- `apps/web/app/dashboard/(passenger)/wallet/page.tsx`: Suspense-bound container page prefetching passenger wallet data and rendering `PassengerWalletView`.
- `apps/web/app/dashboard/(passenger)/layout.tsx`: redesigned passenger dashboard layout using SidebarProvider and SidebarInset with unified h-12 sticky header, search shortcut tag button, and integrated notification inbox.
- `apps/web/features/operator/views/operator-onboarding-view.tsx`: Single-route onboarding multi-step form view using Montserrat typeface, primary brand color `#ee237c`, dense-but-readable layout, small radii (<= 8px), and visible borders.
- `apps/web/features/operator/views/operator-dashboard-view.tsx`: Operator dashboard landing overview rendering company details and verification status.
- `apps/web/features/operator/views/operator-fleet-view.tsx`: Fleet management dashboard with bus table grid and Add Bus popover form.
- `apps/web/features/operator/views/operator-routes-view.tsx`: Full Route Builder page with drag-and-drop stop sequence reordering, Leaflet map previews, and search-equipped Combobox selectors.
- `apps/web/features/operator/views/operator-schedules-view.tsx`: Thin orchestrator — list filters/pagination (nuqs), IAM-gated actions, 4-step wizard, edit drawer. Components under `features/operator/components/schedules/`.
- `apps/web/features/operator/views/operator-trips-view.tsx`: Thin Dispatch Board orchestrator — nuqs filters, Abidjan day grouping, pagination, IAM-gated fleet/actions. Composes `features/operator/components/trips/*`.
- `apps/web/features/operator/components/trips/`: Trip card, toolbar, status badge, segment occupancy, manifest drawer (board/depart/arrive/delay/cancel, gate/notes, check-in).
- `apps/web/features/operator/views/operator-bookings-view.tsx`: Bookings list with nuqs filters/pagination, check-in scanner, CSV export, detail drawer cancel via `operator.cancelBooking`.
- `apps/web/features/operator/views/operator-withdraw-view.tsx`: Self-serve operator payout withdrawal portal displaying Available vs Escrow (`liveReservedBalance`); bank-not-verified banner gates withdraw.
- `apps/web/features/operator/components/revenue/transaction-ledger-table.tsx`: Ledger table with CSV export via `operator.exportLedgerCsv`.
- `apps/web/app/dashboard/operator/(dashboard)/withdraw/page.tsx`: Page wrapper for `OperatorWithdrawView`.
- `apps/web/features/operator/components/operator-quick-actions.tsx`: Header-level dashboard quick actions supporting query-parameter-driven form automation.

## Platform Data (Seeded via `packages/db/prisma/seed.ts`)
- **`City`**: 35 CI cities seeded. `isMajorHub` flags Abidjan, Bouaké, Yamoussoukro, San-Pédro, Daloa, Korhogo, Man.
| **AddBusModal** | Dialog | Operator / Fleet | Modal to register new vehicles, now includes grouped layout picker with quick access to the layout builder. |
| **SeatMapPreview** | Component | Operator / Fleet | Shared interactive/readonly grid canvas for visualizing a seat layout. |
| **LayoutBuilderSheet** | Sheet | Operator / Fleet | Advanced 3-step wizard (Configure, Design, Preview) for operators to create custom layout grid maps. |
- **`BusType`**: 7 vehicle types seeded.
- **`SeatLayoutTemplate`**: 5 platform-default seat grid layouts. Operator-specific layouts use `companyId`.
- **`CompanyLocation` (Terminal)**: Operator depots from onboarding. `isTerminal=true` makes them bookable passenger stops. Linked to `City` via `cityId`.

## Backend Services (tRPC Routers under `apps/web/trpc/routers`)
- `apps/web/features/operator/views/operator-schedules-view.tsx`: Thin orchestrator for schedule list, 4-step create wizard, edit drawer, retire/delete. Composes `features/operator/components/schedules/*`.
- `apps/web/features/operator/components/schedules/`: Wizard steps, toolbar, card, edit drawer, delete dialog, success banner.
- `apps/web/lib/schedule-trip-window.ts`: Shared candidate departure dates (preview + generator).
- `apps/web/lib/trip-generator.ts`: Auto-generates rolling 14-day `Trip`, `TripStop`, and `TripSeat` records from a Schedule + preferred bus. Honors `isActive`, EXTRA_SERVICE, MODIFIED override time.
- `apps/web/app/api/cron/generate-trips/route.ts`: Daily cron extends active schedules (vercel `0 2 * * *`).
- `apps/web/trpc/routers/trips.ts`: Trip operations — paginated list (`scheduleId`, status, date window), detail, `assignBus`, delay (incremental), cancel with refunds, status lifecycle graph, gate/notes.
- `apps/web/trpc/routers/schedules.ts`: Schedule CRUD, retire, reconcileFutureTrips, fare add/update/deactivate, safe exceptions.
- `apps/web/trpc/routers/routes.ts`: Route + waypoint CRUD procedures.
- `apps/web/trpc/routers/terminals.ts`: Terminals list procedure.
- `apps/web/trpc/routers/fleet.ts`: Bus CRUD, bus-types list, seat layout templates list, seat layout per bus.
- `apps/web/trpc/routers/staff.ts`: Staff list, invitation, and role management.
