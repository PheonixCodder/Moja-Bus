# Passenger Tickets Wallet Redesign

## Goal
The user requested a premium redesign for the passenger tickets page (`/dashboard/tickets`). Using the `best-dashboard-setup` (specifically the `ecommerce`, `productivity`, and `finance` modules) as a benchmark, the layout was updated from a basic list with cramped modal dialogs to a beautiful, modern "Digital Wallet".

## Changes Made
- **Routing & Architecture**:
  - Deleted the dedicated dashboard sub-route `apps/web/app/dashboard/(passenger)/tickets/[reference]/page.tsx`.
  - Deleted the old `ticket-detail-view.tsx` file, integrating its business logic completely into a sleek slide-over Sheet.
- **Main Wallet View (`passenger-tickets-view.tsx`)**:
  - Created a responsive Grid layout for displaying tickets (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).
  - Implemented custom CSS to style the ticket cards as authentic "Ticket Stubs" featuring decorative perforated edges and sleek route displays.
  - Replaced the cramped `Dialog` with a full-height slide-over `Sheet` that acts as the container for the selected ticket's details.
  - Relocated the "Cancel Booking" action to a persistent, sticky footer at the bottom of the Sheet.
- **Digital Boarding Pass Polish (`digital-ticket-card.tsx`)**:
  - Enhanced the internal ticket component with premium visual accents (blurred radial background gradients).
  - Adjusted padding and typography so the QR Code remains bold and highly scannable within the 400px width of the slide-over Sheet.

## Validation Strategy
The user can navigate to the **Tickets** page on the passenger dashboard to view the new layout.
- The user will see a beautifully formatted grid of "ticket stub" cards.
- Clicking any ticket will cause the Slide-over Sheet to appear from the right edge with the full digital boarding pass.
- The "Cancel Booking" and "Share" flows will operate flawlessly from inside the Sheet context.
- The TypeScript build process has been verified and confirmed that all removed route references were successfully pruned.
