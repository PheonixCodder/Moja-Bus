# Memory

**Session:** i18n Phase A4-2 — Fleet, Routes, Schedules, Terminals  
**Date:** 2026-07-24

## Summary  
Completed i18n wiring for 4 core operator ERP pages (Fleet, Routes, Schedules, Terminals) — all page metadata, views, and sub-components now use `useTranslations`/`getTranslations` with expanded EN/FR namespaces.

## Completed Work
- **Fleet**: `page.tsx` metadata, `operator-fleet-view.tsx` (1177-line file with 6 inline components: BusCard, CustomLayoutCard, PlatformLayoutCard, LayoutPreviewCanvas, LayoutsPanel, SeatMapFetcher) — all hardcoded strings replaced
- **Routes**: `page.tsx` + view + 4 sub-components (route-card, route-form-drawer, delete-route-dialog, route-success-panel)
- **Schedules**: `page.tsx` + view + 10 sub-components (schedule-toolbar, schedule-card, schedule-success-banner, schedule-delete-dialog, schedule-edit-drawer, wizard-stepper, route-picker-step, calendar-step, pricing-step, preview-step) — wizard step labels, toast messages, all UI strings
- **Terminals**: `page.tsx` + view + 2 sub-components (terminals-table, terminal-editor-sheet)
- Message files: 250+ keys added across 4 namespaces in both en.json and fr.json

## Next Steps  
Wire remaining operator pages: staff, revenue, bookings, withdraw, reviews, settings (5 sub-pages). Then admin dashboard (23 pages).

## Key Namespaces  
- `operatorDashboard.fleet` — fleet management (KPI, bus cards, layouts, statuses)
- `operatorDashboard.routes` — routes & waypoints (KPI, status filters, success panel)
- `operatorDashboard.schedules` — schedules (wizard, toast messages, success banner, preview)
- `operatorDashboard.terminals` — terminals & locations (KPI, toasts, delete dialog)

## Known State  
- `tsc --noEmit` passes with only pre-existing errors (privacy page types, admin bank-access module import, booking-details arg, search-sort-bar optional chain)
