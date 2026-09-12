# Plan — Operator Master Asset Import & Export System

## What we are building
A comprehensive, Apollo-style CSV import and export system for Moja-Bus operators. This system enables transport operators to bulk-export their existing master assets (Terminals, Fleets, Routes, and Schedules) and bulk-import new or updated data using downloadable sample CSV templates. The import workflow includes automated column-header detection, interactive field mapping with required/optional indicators, client-side preview with inline Zod validation error indicators, and safe batch committing with configurable duplicate-detection (skip or upsert) modes.

---

## Vocabulary agreed
- **Operator Master Assets**: The 4 core foundational entities configured by transport operators:
  - **Terminals** (`CompanyLocation` with `isTerminal: true`)
  - **Fleets** (`Bus` records with assigned `BusType` and `SeatLayoutTemplate`)
  - **Routes** (`Route` with `originTerminalId`, `destTerminalId`, and ordered `RouteWaypoint`s)
  - **Schedules** (`Schedule` with `ServiceCalendar`, departure cadences, and baseline `Fare`s)
- **Apollo-Style Importer**: A 4-step wizard modal:
  1. *Template Download & File Upload* (drag & drop CSV/TSV)
  2. *Column Mapping* (auto-matches known headers, provides dropdown selection for custom headers)
  3. *Validation Preview* (highlights missing/invalid cells row-by-row before touching the DB)
  4. *Commit Summary* (reports created, updated, and skipped records with error export)
- **Flat Timetable Model**: A simplified, single-row CSV structure for schedules containing the route name, departure time, operating days, duration, base fare in XOF, and optional preferred bus plate.
- **Upsert Strategy**: A user-controlled toggle allowing operators to either skip duplicate records (matched on unique business keys) or update existing records in-place.

---

## Decisions made
- **Modular Per-Entity Importers**:
  - Importers live directly on their corresponding dashboard tabs (`/dashboard/operator/terminals`, `/fleet`, `/routes`, `/schedules`).
  - Powered by a single reusable frontend component (`<CsvImportModal />`) configured with entity-specific schemas and mapping definitions.
- **Schedules Included via Flat Timetable Format**:
  - Schedules will support bulk import/export using point-to-point base fares. Intermediate multi-stop segment pricing can be fine-tuned in the schedule editor if needed.
- **Collision & Duplicate Handling**:
  - Default behavior is **Skip & Warn** (safe against accidental data loss).
  - A toggle enables **Upsert Mode** (updates existing terminals by name, fleets by registration plate, routes by name, schedules by route name + departure time).
- **Preview-First Fault Tolerance**:
  - Validation occurs in memory during the preview step before sending data to the server.
  - Operators can choose to "Skip invalid rows and import valid ones" or cancel and fix their CSV.

---

## Assumptions
- Terminal imports require existing canonical platform cities (`City`); unmapped cities will trigger a validation warning instructing the operator to select a valid city from the supported Côte d'Ivoire list.
- Fleet imports will associate with an operator's default or selected `BusType` and `SeatLayoutTemplate` (e.g. standard 50-seater or minibus) if not specified in the CSV.
- Routes require terminals to already be present in the operator's account prior to route import.
- Schedules require routes to already exist prior to schedule import.

---

## Implementation steps

### Phase 1: Shared Import/Export Infrastructure (packages & shared components)
1. **CSV Engine Utility (`apps/web/lib/csv/`)**:
   - Build lightweight, browser-safe CSV parser and serializer utilities (handling quotes, commas, CRLF, and UTF-8 encoding).
   - Create template generators that produce CSV sample files with header descriptions and 2 realistic sample rows for each asset type.
2. **Generic Modal UI (`apps/web/components/csv-importer/`)**:
   - **`CsvImportModal.tsx`**: Multi-step dialog (Upload → Map Columns → Preview Table → Done).
   - **`ColumnMapper.tsx`**: Auto-detects columns using alias fuzzy matching (e.g., `"Nom" | "Name" | "Terminal"` → `name`).
   - **`ValidationPreview.tsx`**: Renders a paginated table showing valid rows in green and invalid rows with red badges detailing Zod validation errors.

### Phase 2: Terminals Import & Export
1. **tRPC Router (`apps/web/trpc/routers/terminals.ts`)**:
   - Add `exportCsv`: Returns all operator company locations as a structured CSV string.
   - Add `batchImport`: Accepts mapped rows, validates against `createTerminalSchema`, handles city lookup, and performs batch insert/upsert in a transaction.
2. **Operator UI (`apps/web/app/[locale]/dashboard/operator/(dashboard)/terminals/`)**:
   - Add "Export CSV" and "Import CSV" buttons to the terminals header toolbar.

### Phase 3: Fleet Import & Export
1. **tRPC Router (`apps/web/trpc/routers/fleet.ts`)**:
   - Add `exportCsv`: Returns fleet list (plates, internal names, bus types, seat classes).
   - Add `batchImport`: Validates registration plates, matches `busTypeId` and `layoutTemplateId`, generates seats, and registers vehicles.
2. **Operator UI (`apps/web/app/[locale]/dashboard/operator/(dashboard)/fleet/`)**:
   - Add "Export CSV" and "Import CSV" buttons to the fleet management page.

### Phase 4: Routes Import & Export
1. **tRPC Router (`apps/web/trpc/routers/routes.ts`)**:
   - Add `exportCsv`: Exports routes, distance, origin, destination, and stop sequences.
   - Add `batchImport`: Resolves `originTerminalName` and `destTerminalName` to `id`s within `ctx.companyId`, derives `serviceType` (URBAN/INTERCITY), and saves routes with waypoints.
2. **Operator UI (`apps/web/app/[locale]/dashboard/operator/(dashboard)/routes/`)**:
   - Integrate import/export actions into the route list view.

### Phase 5: Schedules Import & Export
1. **tRPC Router (`apps/web/trpc/routers/schedules.ts`)**:
   - Add `exportCsv`: Exports timetable departures, days of week, base fares, and assigned buses.
   - Add `batchImport`: Matches route names, creates `ServiceCalendar`, generates primary `Fare` records, and assigns `preferredBusId` by plate.
2. **Operator UI (`apps/web/app/[locale]/dashboard/operator/(dashboard)/schedules/`)**:
   - Integrate import/export actions into the schedule list view.

---

## Status: COMPLETED ✅

All 5 phases have been fully implemented and verified:
- **Phase 1 (Shared Engine & UI)**: RFC-4180 parser/serializer, fuzzy header matcher, templates with downloadable samples, and 4-step `<CsvImportModal />` wizard. (8/8 unit tests pass).
- **Phase 2 (Terminals)**: `terminals.exportCsv` & `terminals.batchImport` with canonical city matching, skip/upsert, and UI integration.
- **Phase 3 (Fleet)**: `fleet.exportCsv` & `fleet.batchImport` with default bus type & seat template resolution, automatic seat generation, and UI integration.
- **Phase 4 (Routes)**: `routes.exportCsv` & `routes.batchImport` with origin/destination terminal name lookup, serviceType derivation, skip/upsert, and UI integration.
- **Phase 5 (Schedules)**: `schedules.exportCsv` & `schedules.batchImport` with `parseOperatingDays` (French & English day tokens, DAILY, WEEKDAYS, WEEKENDS), route & bus plate resolution, `ServiceCalendar`, primary `Fare` creation, automatic trip generation for next 14 days, and UI integration in `OperatorSchedulesView` and `ScheduleToolbar`.

