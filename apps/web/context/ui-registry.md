# Web App — UI Component Registry

Living document. Updated after every component is built or refactored. Read this before building any new UI — match existing patterns before inventing new ones.

---

## How to Use
1. Before building a new component, check this file for a similar existing pattern.
2. If a match exists — use the same component or extend it rather than duplicating.
3. If no match exists — build following `context/ui-rules.md` and `context/ui-tokens.md`, then add a row here.
4. Use `/imprint` to automate capturing component metadata after building.

---

## Layout & Shell Components

| Component | File | Notes |
| :--- | :--- | :--- |
| `DashboardLayout` | `app/dashboard/layout.tsx` | Sidebar nav + mobile drawer, operator-scoped. |
| `AdminLayout` | `app/admin/layout.tsx` | Admin hub layout with nav tabs. |
| `SiteHeader` | `components/site-header.tsx` | Passenger web top navbar, search bar, auth state. |

---

## Data Display

| Component | File | Notes |
| :--- | :--- | :--- |
| `DataTable` | `components/data-table.tsx` | shadcn table wrapper with pagination, sorting, filtering. |
| `DriverDocPreview` | `features/driver/components/driver-doc-preview.tsx` | 3-tile presigned doc viewer (license, medical, passport). |

---

## Forms & Dialogs

| Component | File | Notes |
| :--- | :--- | :--- |
| `VerifyDriverDialog` | `features/driver/components/verify-driver-dialog.tsx` | Operator driver verification with doc tiles + approval gate. |
| `AddDriverModal` | `features/driver/components/add-driver-modal.tsx` | Operator add-driver flow. |

---

## Notifications

| Component | File | Notes |
| :--- | :--- | :--- |
| `NotificationInbox` | `features/notifications/components/inbox.tsx` | Novu `<Inbox>` wrapper with Moja Ride branding. |

---

*Add new components here as they are built. Keep the table sorted by feature area.*
