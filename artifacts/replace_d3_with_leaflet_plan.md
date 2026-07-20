# Passenger Bookings Map Replacement Plan

## Goal Description
The user requested replacing the static D3 geo map in the Bookings page with the fully interactive Leaflet map (OpenStreetMap tiles) currently used in the Operator Terminals module. This provides users with familiar panning, zooming, and a clearer context of terminal locations compared to the stylized static D3 map.

## Proposed Changes

### 1. Dependency Cleanup (`apps/web/package.json`)
- **[MODIFY]** `package.json`
  - Remove `d3-geo`, `topojson-client`, `@types/d3-geo`, and `@types/topojson-client` since they are no longer needed and we will reuse the existing `leaflet` and `react-leaflet` libraries.

### 2. Interactive Map Implementation
- **[MODIFY]** `apps/web/features/booking/components/booking-route-map.tsx`
  - Completely rewrite the component to use `react-leaflet` instead of D3.
  - **TileLayer**: Use OpenStreetMap standard tiles (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`).
  - **Markers**: Use Leaflet's `divIcon` to render beautiful branded CSS circles for the origin and destination terminals, avoiding default map pins.
  - **Polyline**: Draw a dashed, primary-colored line between the origin and destination.
  - **Auto-Fit**: Implement a child component using `useMap()` to automatically calculate the bounding box (`L.latLngBounds`) between the origin and destination and call `map.fitBounds()` with padding, ensuring the route is perfectly centered when a booking is selected.
  - Default export the component to enable dynamic importing.

### 3. Dynamic Map Loading
- **[MODIFY]** `apps/web/features/booking/components/booking-details.tsx`
  - Leaflet relies heavily on the `window` object and will crash during Next.js Server-Side Rendering (SSR). 
  - Update the import for `BookingRouteMap` to use `next/dynamic` with `{ ssr: false }`.
  - Add a sleek `loading` placeholder skeleton that renders while the map bundle is being fetched on the client.

## Verification Plan
### Automated Tests
Ran `pnpm --filter web typecheck` to ensure there are no TypeScript errors with the new Leaflet props. Tests passed.

### Manual Verification
1. Navigate to the bookings dashboard.
2. Select an upcoming trip.
3. Verify the map is fully interactive (pan/zoom).
4. Verify the map automatically bounds to show both the origin and destination markers.
