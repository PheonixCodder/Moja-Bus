# Moja Bus Driver System — UI Registry

Living catalog of components for the Driver ERP and Mobile Application. Match existing components before creating new ones.

---

## 1. Operator Web ERP Components (`apps/web/features/operator/drivers`)

| Component Name | File Path | Description & Classes |
| :--- | :--- | :--- |
| `OperatorDriversView` | `apps/web/features/operator/views/operator-drivers-view.tsx` | Main driver directory table, filters, KPI cards, and action buttons |
| `DriverDetailView` | `apps/web/features/operator/views/driver-detail-view.tsx` | Driver profile passport, compliance document viewer, and review history |
| `AddDriverModal` | `apps/web/features/operator/components/drivers/add-driver-modal.tsx` | Multi-step modal for registering driver, license details, and document upload |
| `DriverStatusBadge` | `apps/web/features/operator/components/drivers/driver-status-badge.tsx` | Colored pill badge with live pulsing dot for `ON_DUTY` / `ON_TRIP` |
| `DriverCareerStatsCard` | `apps/web/features/operator/components/drivers/driver-career-stats-card.tsx` | Lifetime KPI cards (Rating, Trips, Distance Km, Safety Score) |
| `LiveFleetMap` | `apps/web/features/operator/components/drivers/live-fleet-map.tsx` | Mapbox / Leaflet interactive fleet map with live moving bus markers |

---

## 2. Driver Mobile App Components (`apps/driver-app/components`)

| Component Name | File Path | Description & Classes |
| :--- | :--- | :--- |
| `DriverShiftHeader` | `apps/driver-app/components/driver-shift-header.tsx` | Top bar with operator switch dropdown and On Duty / Off Duty toggle |
| `ActiveTripHud` | `apps/driver-app/features/trips/components/active-trip-hud.tsx` | In-vehicle large-digit speedometer, GPS status, and next stop card |
| `StopChecklistCard` | `apps/driver-app/features/trips/components/stop-checklist-card.tsx` | Step-by-step waypoint card with arrival/departure action buttons |
| `QrTicketScanner` | `apps/driver-app/features/scanner/components/qr-ticket-scanner.tsx` | Camera overlay with barcode targeting box and scan status feedback |
| `PassengerManifestList` | `apps/driver-app/features/trips/components/passenger-manifest-list.tsx` | Searchable list of passengers with seat labels and boarding checkmarks |
| `DriverCareerPassport` | `apps/driver-app/features/profile/components/driver-career-passport.tsx` | Driver lifetime badge, ratings breakdown, and career verification stamp |
