# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

## Current Status
**Phase:** Auth foundation rollout
**Last completed:** Aggregator-web dashboard shell and auth copy mirrored from demo-ui into Moja Ride content
**Next:** Search domain discovery and implementation plan

## Progress
- [x] Shared auth/session foundation
- [x] Shared theme and platform UI baseline
- [x] Shared shadcn UI package mirrored from demo-ui
- [x] Aggregator web now consumes shared shadcn components from `packages/ui`
- [x] Aggregator web dashboard shell, sidebar, and nested section pages added
- [x] Aggregator web auth views rewritten with Moja Ride content and Google social login
- [x] Root workspace and app setup
- [x] Context onboarding files and workspace rules
- [x] 3-app product scope confirmed
- [x] Agent and driver deferred from v1 product context
- [ ] Search domain contract and API wiring
- [ ] Operator KYC and fleet setup
- [ ] Passenger search, seat map, checkout, and wallet
- [ ] Passenger web shell alignment
- [ ] Operator/admin web shell alignment
- [ ] Agent sales and sync
- [ ] Driver trip operations and QR check-in

## Decisions Made During Build
- Product name: Moja Ride
- The end product is three active apps: passenger web, passenger mobile, and operator/admin web
- Passenger web and passenger mobile both support the booking flow
- Operator web is the operator/admin surface
- Agent and driver are deferred legacy staff modules
- Payments default to direct provider integrations
- Notifications default to Expo push plus SMS fallback
- Brand colors: Primary #ee237c, Font: Montserrat
- Shared Better Auth now powers traveler web and traveler mobile through the Express API
- Traveler email/password sign-up requires email verification through OTP
- Traveler mobile Google sign-in uses the native Google SDK and ID token exchange
- Existing email addresses are linked across Google and email/password sign-in
- `packages/ui` now holds the shared shadcn component source of truth copied from `demo-ui`
- `apps/aggregator-web` imports shadcn UI from `@moja/ui/components/ui/*` instead of a local app copy
- `apps/aggregator-web` now has a Moja Ride dashboard shell under `/dashboard` plus nested `/dashboard/search`, `/dashboard/bookings`, `/dashboard/tickets`, and `/dashboard/settings`
- `apps/aggregator-web` auth views now use Moja Ride copy and the shared Google social login component

## Notes
- The context files should be treated as the source of truth for future work.
- Replace the placeholder UI palette later when the final brand colors are approved.
- Reintroduce agent or driver only if the product later needs dedicated staff devices and offline flows.
