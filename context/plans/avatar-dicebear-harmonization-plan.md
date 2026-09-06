# Moja Ride — Monorepo Avatar System & DiceBear Glass Integration Plan

## 1. Executive Summary & Problem Context

Based on the **Avatar System Audit** ([`context/audits/avatar-system-audit/README.md`](file:///C:/dev/moja-buss/context/audits/avatar-system-audit/README.md)), **Prisma Schema** ([`packages/db/prisma/schema.prisma`](file:///C:/dev/moja-buss/packages/db/prisma/schema.prisma)), and **TRPC Routers** ([`apps/web/trpc/routers`](file:///C:/dev/moja-buss/apps/web/trpc/routers)), the Moja Ride monorepo currently contains **41 distinct avatar/profile occurrences across 27 files**. 

### Core Problems Being Solved:
1. **Broken Carrier / Operator Company Representation**:
   - On search trip cards ([`apps/web/features/search/components/offer-card.tsx`](file:///C:/dev/moja-buss/apps/web/features/search/components/offer-card.tsx)), carrier logos (`offer.companyLogoUrl`) are completely ignored, rendering only raw `.slice(0, 2)` text.
   - On the homepage ([`apps/web/features/home/components/home-operators-client.tsx`](file:///C:/dev/moja-buss/apps/web/features/home/components/home-operators-client.tsx)) and governance tables, initial calculation takes the first letter of up to 3 words (`UTB` instead of the first 2 words), or uses ad-hoc `div` badges.
2. **Missing Dynamic Placeholder Avatars (DiceBear)**:
   - Authenticated travelers, passengers, drivers, and internal staff without an uploaded profile photo currently fall back to plain monochromatic grey initials or hash-colored circles.
   - A unified DiceBear Glass avatar pipeline must be established across Web, `apps/traveler-app`, and `apps/driver-app`.

---

## 2. Strict Entity & Representation Policies

To eliminate confusion between **Company Carriers** and **Human Users**, we enforce a strict separation:

| Entity Type | Underlying Models | Representation Strategy | DiceBear Allowed? | Fallback Hierarchy |
| :--- | :--- | :--- | :--- | :--- |
| **Carrier / Operator Company** | `Company` (e.g. UTB, AVS, Moja Ride) | **Carrier Logo Image** | ❌ **NEVER** | **1. Logo Image** (`logoUrl`)<br>**2. 2-word Initials Badge**: First letter of the first 2 words (e.g., "Moja Ride" -> `MR`, "Abidjan Voyage Services" -> `AV`, single-word "UTB" -> `UT`). |
| **Operator Staff Member** | `Operator` / `User` (Owner, Dispatcher, Manager, Conductor) | **User Avatar** | ✅ **YES (Glass)** | **1. User Profile Image** (`profilePhotoUrl` / `image`)<br>**2. DiceBear Glassy Avatar** (`https://api.dicebear.com/10.x/glass/png?seed=${seed}&size=128`)<br>**3. User Initials**. |
| **Platform Admin** | `AdminStaff` / `User` | **User Avatar** | ✅ **YES (Glass)** | **1. User Profile Image** (`image`)<br>**2. DiceBear Glassy Avatar**<br>**3. User Initials**. |
| **Traveler / Passenger** | `PassengerProfile` / `User` | **User Avatar** | ✅ **YES (Glass)** | **1. User Profile Image** (`image`)<br>**2. DiceBear Glassy Avatar**<br>**3. User Initials**. |
| **Driver** | `DriverProfile` / `User` | **User Avatar** | ✅ **YES (Glass)** | **1. User Profile Image** (`user.image`)<br>**2. DiceBear Glassy Avatar**<br>**3. Driver Initials**. |
| **Saved Passenger (Guest/Dependent)** | `SavedPassenger` | **User Avatar** | ✅ **YES (Glass)** | **1. DiceBear Glassy Avatar** (seed: `passenger.id` or `fullName`)<br>**2. Passenger Initials**. |

---

## 3. Architecture & Technical Strategy

### 3.1 DiceBear Glassy Avatar URL Strategy
Everywhere a user avatar is needed, we strictly implement the fallback hierarchy:
```ts
// 1. Check for user custom uploaded profile image
// 2. If no profile image (or if it fails), use DiceBear Glassy Avatar
// 3. If DiceBear fails, fallback to 2-letter uppercase initials
const dicebearGlassUrl = `https://api.dicebear.com/10.x/glass/png?seed=${encodeURIComponent(seed)}&size=128`;
```

#### Why HTTP API PNG vs `react-native-svg`:
- **Visual Identity Guarantee**: DiceBear's rendering engine uses the exact same mathematical seed algorithm for both SVG and PNG. The PNG endpoint `https://api.dicebear.com/10.x/glass/png?seed=${seed}&size=128` renders the **exact same gradient colors and glassy sheen** across mobile apps (`traveler-app` and `driver-app`) as SVG on web.
- **Zero Native Dependency**: Using PNG avoids installing, configuring, and maintaining `react-native-svg` across iOS and Android builds, eliminating native bundle bloat and potential EAS build linkage issues. Standard `<Image source={{ uri }} />` or Expo Image handles caching and display smoothly.
- **Web Compatibility**: On Web (`apps/web`), `<AvatarImage>` uses standard HTML `<img>` elements via Base-UI / Radix primitives, so it loads the PNG/SVG URL without `next.config.js` remotePattern restrictions.

### 3.2 Canonical Component Primitives

1. `<CarrierAvatar>`:
   - Purpose: Exclusively for Bus Companies / Carriers (`Company` entity).
   - Props: `name: string`, `logoUrl?: string | null`, `size?: "sm" | "md" | "lg" | "xl" | number`, `shape?: "circle" | "rounded" | "square"`, `className?: string`.
   - Behavior:
     - Checks `logoUrl`. If present, renders `<AvatarImage src={logoUrl} alt={name} />`.
     - If absent or load error, renders 2-word initials:
       ```ts
       export function getCompanyInitials(name: string): string {
         const words = name.trim().split(/\s+/).filter(Boolean);
         if (words.length === 0) return "MR";
         if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
         return (words[0][0] + words[1][0]).toUpperCase();
       }
       ```
     - **Never loads DiceBear**.

2. `<UserAvatar>`:
   - Purpose: For all human profiles (Staff, Admin, Passenger, Driver).
   - Props: `name?: string | null`, `src?: string | null`, `seed?: string`, `size?: "sm" | "md" | "lg" | "xl" | number`, `className?: string`.
   - Web Behavior:
     - First tries `src` (custom user profile image).
     - If `src` is null or empty, uses `https://api.dicebear.com/10.x/glass/png?seed=${seed || name}&size=128`.
     - If image fails to load, displays `<AvatarFallback>` with user initials.
   - Mobile Behavior (`traveler-app` and `driver-app`):
     - First checks `src` (custom photo URI).
     - If empty, loads DiceBear Glass PNG via `uri: https://api.dicebear.com/10.x/glass/png?seed=${seed || name}&size=128`.
     - If load fails, renders initials badge.

---

## 4. Master Implementation Scope & Surface Catalog

### Phase 1: Shared Core Primitives & Helpers
- [ ] Implement `getCompanyInitials` and `getUserInitials` utilities in `packages/ui/src/lib/initials.ts`.
- [ ] Implement `<CarrierAvatar>` in `packages/ui/src/components/ui/carrier-avatar.tsx`.
- [ ] Implement `<UserAvatar>` in `packages/ui/src/components/ui/user-avatar.tsx`.
- [ ] Create canonical `<Avatar>` and `<UserAvatar>` primitives in `apps/driver-app/components/ui/avatar.tsx`.

### Phase 2: Web Public & Search Surfaces (`apps/web`)
- [ ] **Search Trip Cards** ([`offer-card.tsx`](file:///C:/dev/moja-buss/apps/web/features/search/components/offer-card.tsx)): Replace raw `.slice(0, 2)` div with `<CarrierAvatar name={offer.companyName} logoUrl={offer.companyLogoUrl} size="md" />`.
- [ ] **Home Page Operators** ([`home-operators-client.tsx`](file:///C:/dev/moja-buss/apps/web/features/home/components/home-operators-client.tsx)): Replace ad-hoc image/abbr block with `<CarrierAvatar name={op.name} logoUrl={op.logoUrl} shape="rounded" />`.
- [ ] **Home Header** ([`home-header.tsx`](file:///C:/dev/moja-buss/apps/web/features/home/components/home-header.tsx)): Wire `<UserAvatar name={user.name} src={user.image} seed={user.id} />` on desktop trigger, popover, and mobile hamburger.
- [ ] **Booking Details** ([`booking-details.tsx`](file:///C:/dev/moja-buss/apps/web/features/booking/components/booking-details.tsx)): Standardize bus company logo using `<CarrierAvatar>`.

### Phase 3: Web Dashboard & Staff Surfaces (`apps/web`)
- [ ] **Sidebars**:
  - Passenger Sidebar ([`dashboard-sidebar.tsx`](file:///C:/dev/moja-buss/apps/web/features/dashboard/components/dashboard-sidebar.tsx)): User avatar with profile photo -> Glassy avatar fallback.
  - Operator Sidebar ([`operator-sidebar.tsx`](file:///C:/dev/moja-buss/apps/web/features/operator/components/operator-sidebar.tsx)): Staff avatar with profile photo -> Glassy avatar fallback.
  - Admin Sidebar ([`admin-sidebar.tsx`](file:///C:/dev/moja-buss/apps/web/features/admin/components/admin-sidebar.tsx)): Admin avatar with profile photo -> Glassy avatar fallback.
- [ ] **Staff Rows & Avatars**:
  - Replace duplicate `AdminMemberAvatar` and `MemberAvatar` with unified `<UserAvatar>`.
- [ ] **User & Operator Directories**:
  - `travelers-columns.tsx` & `travelers-grid.tsx`: `<UserAvatar>` with profile photo -> Glassy avatar fallback.
  - `operators-columns.tsx` & `operators-grid.tsx`: Use `<CarrierAvatar>` for company entity, `<UserAvatar>` for staff entity.
  - `user-profile-header.tsx`: Support both entity types cleanly.
- [ ] **Driver Rosters & Marketplace**:
  - `operator-drivers-view.tsx`, `driver-detail-view.tsx`, `marketplace-driver-card.tsx`, `driver-public-profile-sheet.tsx`, `operator-sent-offers-view.tsx`: Wire `<UserAvatar>` with driver profile photo -> Glassy avatar fallback.

### Phase 4: Web Governance & Ad-Hoc Badge Remediation
- [ ] Refactor ad-hoc `div` badges to canonical primitives:
  - `verifications-columns.tsx` -> `<CarrierAvatar>`
  - `settlements-history-table.tsx` -> `<CarrierAvatar>`
  - `admin-inquiries-view.tsx` -> `<UserAvatar>`
  - `inquiry-detail-drawer.tsx` -> `<UserAvatar>`
  - `saved-passengers-view.tsx` -> `<UserAvatar>`

### Phase 5: Mobile Apps (`apps/traveler-app` & `apps/driver-app`)
- [ ] **Traveler App**:
  - Update `profile-hero.tsx` to check user photo -> DiceBear Glass PNG -> initials.
  - Update `personal-info-avatar.tsx` with user photo -> Glassy fallback.
  - Update `passenger-card.tsx` to render `<UserAvatar>` with Glassy fallback.
- [ ] **Driver App**:
  - Implement canonical `<Avatar>` and `<UserAvatar>` in `apps/driver-app`.
  - Update `profile-view.tsx` in-cab card to check driver photo -> DiceBear Glass PNG -> initials.

---

## 6. Verification & Quality Gates
1. **Strict Entity Verification**:
   - Confirm company carriers never render DiceBear and strictly follow `logoUrl` -> 2-word initials (e.g. "Moja Ride" -> `MR`).
   - Confirm all users/staff/drivers without a custom profile image render the DiceBear Glassy PNG.
2. **Typecheck Across All Monorepo Packages**:
   - `pnpm --filter @moja/ui typecheck`
   - `pnpm --filter web typecheck`
   - `pnpm --filter traveler-app typecheck`
   - `pnpm --filter driver-app typecheck`
