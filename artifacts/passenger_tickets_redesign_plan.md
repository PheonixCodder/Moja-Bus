# Passenger Tickets Page Redesign Plan

## Goal Description
The user wants to transform the `apps/web/app/dashboard/(passenger)/tickets` page into a premium, highly-converting digital ticket wallet. Based on an analysis of the top-tier layouts in `best-dashboard-setup` (including ecommerce drawers, productivity cards, and CRM panels), the cramped modal dialogs and dedicated `[reference]` sub-page will be replaced with a fluid, modern "List + Slide-over Sheet" architecture. 

This creates a seamless "Wallet" experience where users can view their active tickets in a beautiful grid, and clicking one elegantly slides in the full digital boarding pass without ever leaving the page.

## User Review Required
> [!NOTE]
> As requested, I will **DELETE** the `apps/web/app/dashboard/(passenger)/tickets/[reference]` directory entirely. All functionality (cancel ticket, share link, QR code) will be moved into a sleek slide-over Sheet on the main tickets page. The separate public `/tickets/[token]` route will remain untouched for sharing with others.

## Proposed Changes

### 1. Delete Dedicated Reference Route
- **[DELETE]** `apps/web/app/dashboard/(passenger)/tickets/[reference]/page.tsx`
  - Remove this route completely to enforce the single-page "Wallet" architecture.

### 2. Main Ticket Wallet View (`passenger-tickets-view.tsx`)
- **[MODIFY]** `apps/web/features/booking/views/passenger-tickets-view.tsx`
  - **Grid Layout**: Implement a responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) inspired by the clean card layouts in the `productivity` and `finance` modules.
  - **Ticket Stub Design**: Redesign the individual ticket cards in the list to look like physical ticket stubs (using CSS mask-images or radial gradients to create perforated edges).
  - **Slide-over Sheet Integration**: Replace the current `TicketDialog` with a `Sheet` (from `@moja/ui/components/ui/sheet`). When a ticket is selected, the Sheet slides in from the right edge, taking up `sm:max-w-md` width to comfortably display the full digital boarding pass.

### 3. Ticket Detail & Actions (Inside the Sheet)
- **[MODIFY]** `apps/web/features/booking/views/ticket-detail-view.tsx` (Will be integrated/refactored)
  - The logic inside `ticket-detail-view.tsx` (Cancel Booking Mutation, Share Link, loading states) will be merged directly into the `PassengerTicketsView` as the content of the slide-over `Sheet`.
  - The "Cancel Booking" flow will remain intact but will be presented as a sticky footer action at the bottom of the Sheet.
  - After migrating the logic, `ticket-detail-view.tsx` will be **deleted** to clean up the codebase.

### 4. Digital Ticket Card Polish (`digital-ticket-card.tsx`)
- **[MODIFY]** `apps/web/features/booking/components/digital-ticket-card.tsx`
  - Enhance the internal design of the digital boarding pass to match the `best-dashboard-setup` aesthetics (crisp typography, subtle borders, high-contrast QR code wrapper).
  - Ensure the layout is perfectly optimized to fit inside the new 400px wide slide-over Sheet.

## Verification Plan
### Automated Tests
Run `pnpm --filter web typecheck` to ensure the removal of the old views and the introduction of the Sheet components do not break any TypeScript contracts.

### Manual Verification
1. Navigate to the `/dashboard/tickets` page as a passenger.
2. Verify the ticket list displays as a beautiful grid of ticket stubs.
3. Click "Show Boarding Pass" on a ticket and verify a smooth Sheet slides in from the right containing the full QR code and details.
4. Verify the "Share Link" and "Cancel Booking" actions work correctly from inside the new Sheet.
5. Verify the `/dashboard/tickets/[reference]` route no longer exists.
