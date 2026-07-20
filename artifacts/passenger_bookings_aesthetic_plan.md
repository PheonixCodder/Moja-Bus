# Passenger Bookings Page Aesthetic Polish

## Goal Description
The user wants to refine the aesthetics of the Passenger Bookings page to strictly match the professional design of the `best-dashboard-setup/logistics` benchmark. The previous iteration included a KPI strip in the left panel that felt cramped, tabs that didn't span correctly in the right panel, a lack of visual separation between the map and details, and an `OverviewTab` that lacked the professional "Avatar" profile aesthetic seen in the benchmark.

This plan addresses all aesthetic feedback to achieve a 1:1 feel with the benchmark dashboard.

## Proposed Changes

### 1. `apps/web/features/booking/components/booking-list.tsx`
- **Remove KPI Strip**: The `BookingKpiStrip` is cluttering the left panel and will be completely removed. The tab triggers (e.g., `Upcoming (2)`) already convey this information cleanly.
- **Remove Filters Button**: The non-functional `SlidersHorizontal` icon button will be removed from the `<CardHeader>` to keep the header minimal.

### 2. `apps/web/features/booking/components/booking-details.tsx`
- **Tabs Container Styling**: 
  - Update `<TabsList>` in the right panel to use `className="w-full justify-start gap-2 border-b px-4 **:data-[slot=tabs-trigger]:text-xs sm:gap-4 sm:**:data-[slot=tabs-trigger]:text-sm"`. This correctly aligns the tabs to the left while keeping the bottom border full-width, perfectly matching the benchmark.
- **Map & Panel Separation**:
  - Add a `border-b border-border` to the `div` wrapping `BookingRouteMap` so there is a definitive line separating the map from the details below.
  - Ensure the empty state (`EmptyDetailsState`) also renders this border.
- **`OverviewTab` Professional Redesign**:
  - Refactor the top of the `OverviewTab` to match `ShipmentOverview`.
  - **Header**: Display the Booking Reference as a large `<h1>` alongside the status badge and Departure Time.
  - **Operator Avatar**: Add an `Avatar` component (a square with rounded corners) displaying the operator's initials next to the operator name, mimicking the customer profile in the benchmark.
  - **Journey Grid**: Soften the labels using `text-muted-foreground` and structure the grid to mirror the benchmark's cargo details.

### 3. `apps/web/features/booking/views/passenger-bookings-view.tsx`
- **Panel Separation**:
  - Add explicit `border-l border-border` to the right panel container to ensure a solid separator line between the left list and right details panel, even on identical backgrounds.

## User Review Required
> [!NOTE]
> The `BookingKpiStrip` will be completely removed from the Bookings page to match the cleaner look of the logistics benchmark. Is this acceptable?

## Verification Plan
1. Run `pnpm --filter web typecheck` to ensure removing the KPI strip and updating imports does not break types.
2. Manually verify the UI:
   - Ensure the left panel has no KPI strip and no filters button.
   - Verify the tabs in the right panel are left-aligned with a full-width bottom border.
   - Verify the operator avatar appears in the Overview tab.
   - Ensure the border separates the map from the details, and the left panel from the right panel.
