# Moja Ride — Comprehensive Monorepo Avatar & Profile Representation Audit
## Audit Hub & Exact Occurrence Catalog

> **Audit Context**: Exhaustive inventory of every single location where an avatar, profile photo, carrier logo badge, or user initials circle is rendered or uploaded across the Moja Ride monorepo (Web dashboards, public portal, mobile apps, and shared components).

---

### Executive Summary

Across the entire codebase, **41 distinct locations across 27 files** render or handle an Avatar / Profile Representation:
- **Canonical Design System Primitive (`<Avatar>`, `<AvatarImage>`, `<AvatarFallback>`)**: Used in **24 distinct locations**.
- **Ad-Hoc / Custom Initials Circle Badges (`rounded-full` / `rounded-xl` with `.slice(0, 2)`)**: Used in **11 distinct locations**.
- **Avatar Upload Fields (`ImageUploadField` shape="circle" / Expo ImagePicker)**: Used in **2 distinct locations**.
- **Mobile Nativewind Implementations (`apps/traveler-app` & `apps/driver-app`)**: Used in **4 distinct locations**.

---

### Master Occurrence Matrix

| Surface / Domain | File & Path | Component / View Context | Implementation Pattern | Entity Represented | Image Fallback / Initials Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **01. Navigation & Headers** | `apps/web/features/home/components/home-header.tsx` | Desktop User Nav Trigger (L237) | Canonical `<Avatar>` (`h-10 w-10`) | Authenticated User | `user.image` -> Initials fallback |
| **01. Navigation & Headers** | `apps/web/features/home/components/home-header.tsx` | Desktop Popover Header (L258) | Canonical `<Avatar>` (`h-10 w-10`) | Authenticated User | `user.image` -> Initials fallback |
| **01. Navigation & Headers** | `apps/web/features/home/components/home-header.tsx` | Mobile Menu Toggle (L382) | Canonical `<Avatar>` (`h-8 w-8`) | Authenticated User | `user.image` -> Initials fallback |
| **01. Navigation & Headers** | `apps/web/features/dashboard/components/dashboard-sidebar.tsx` | Passenger Sidebar Footer Button (L215) | Canonical `<Avatar>` (`h-8 w-8`) | Passenger User | Initials (`userInitials`) |
| **01. Navigation & Headers** | `apps/web/features/dashboard/components/dashboard-sidebar.tsx` | Passenger Sidebar Menu Header (L244) | Canonical `<Avatar>` (`h-8 w-8`) | Passenger User | Initials (`userInitials`) |
| **01. Navigation & Headers** | `apps/web/features/operator/components/operator-sidebar.tsx` | Operator Sidebar Footer Trigger (L421) | Canonical `<Avatar>` (`size-6`) | Operator Staff / User | `operator.profilePhotoUrl` / `user.image` -> Initials fallback |
| **01. Navigation & Headers** | `apps/web/features/admin/components/admin-sidebar.tsx` | Admin Sidebar Footer Trigger (L427) | Canonical `<Avatar>` (`size-6`) | Platform Admin | Initials (`userInitials`) |
| **02. Staff Management** | `apps/web/features/admin/components/staff/member-avatar.tsx` | `AdminMemberAvatar` Shared Primitive (L33) | Canonical `<Avatar>` (`size sm/md/lg`) | Admin Staff Member | `profilePhotoUrl` -> Color-coded hash initials |
| **02. Staff Management** | `apps/web/features/admin/components/staff/admin-staff-member-row.tsx` | Admin Staff Table Row (L72) | Uses `AdminMemberAvatar` | Admin Staff Member | Passes name & photo URL to primitive |
| **02. Staff Management** | `apps/web/features/operator/components/staff/member-avatar.tsx` | `MemberAvatar` Shared Primitive (L29) | Canonical `<Avatar>` (`size sm/md/lg`) | Operator Staff Member | `profilePhotoUrl` -> Color-coded hash initials |
| **02. Staff Management** | `apps/web/features/operator/components/staff/staff-member-row.tsx` | Operator Staff Table Row (L71) | Uses `MemberAvatar` | Operator Staff Member | Passes name & photo URL to primitive |
| **03. Admin User Management** | `apps/web/features/admin/components/travelers-columns.tsx` | Travelers Table View (L116) | Canonical `<Avatar>` (`size-10`) | Traveler / Passenger User | `user.image` -> Hash-toned initials |
| **03. Admin User Management** | `apps/web/features/admin/components/travelers-grid.tsx` | Travelers Card Grid (L146) | Canonical `<Avatar>` (`size-16`) | Traveler / Passenger User | `user.image` -> Hash-toned initials |
| **03. Admin User Management** | `apps/web/features/admin/components/operators-columns.tsx` | Operators Table View (L135) | Canonical `<Avatar>` (`h-9 w-9`) | Operator User | `operator.avatar` -> Hash-toned initials |
| **03. Admin User Management** | `apps/web/features/admin/components/operators-grid.tsx` | Operators Card Grid (L147) | Canonical `<Avatar>` (`h-16 w-16`) | Operator User | `operator.avatar` -> Hash-toned initials |
| **03. Admin User Management** | `apps/web/features/admin/components/user-profile-header.tsx` | Profile Detail Hero Card (L95) | Custom Container (`h-20 w-20 rounded-xl`) | Any User (Traveler/Operator/Admin) | Hash-toned background with 2-letter initials |
| **03. Admin User Management** | `apps/web/features/admin/views/admin-traveler-profile-view.tsx` | Traveler Profile Detail (L69) | Delegates to `UserProfileHeader` | Traveler User | Rendered via header component |
| **03. Admin User Management** | `apps/web/features/admin/views/admin-operator-profile-view.tsx` | Operator Profile Detail (L90) | Delegates to `UserProfileHeader` | Operator User | Rendered via header component |
| **04. Settings & Profiles** | `apps/web/features/passenger/views/passenger-settings-view.tsx` | Passenger Profile Tab (L187) | `ImageUploadField` (`shape="circle" h-20 w-20`) | Passenger User | Current `user.image` preview with live upload |
| **04. Settings & Profiles** | `apps/web/features/operator/settings/components/personal-profile-section.tsx` | Operator Settings Personal Profile (L48) | Canonical `<Avatar>` (`w-16 h-16 border`) | Operator Staff Person | `profilePhotoUrl` / `user.image` -> First initial |
| **04. Settings & Profiles** | `apps/web/features/operator/settings/components/profile-section.tsx` | Operator Settings Company Profile (L51) | Canonical `<Avatar>` (`w-16 h-16 border`) | Carrier Company Logo | `company.logoUrl` -> Company initial |
| **04. Settings & Profiles** | `apps/web/features/admin/views/admin-settings-view.tsx` | Platform Commission / Financial Settings | *No User Avatar* | System Config | Purely financial rules & tiers |
| **05. Driver Management** | `apps/web/features/operator/views/operator-drivers-view.tsx` | Operator Drivers Roster (L331) | Canonical `<Avatar>` (`size-11`) | Driver | `driver.user.image` -> 2-letter uppercase initials |
| **05. Driver Management** | `apps/web/features/operator/views/driver-detail-view.tsx` | Driver Detail Header (L104) | Canonical `<Avatar>` (`size-20`) | Driver | `driver.user.image` -> 2-letter uppercase initials |
| **05. Driver Management** | `apps/web/features/operator/components/drivers/marketplace-driver-card.tsx` | Marketplace Driver Card (L188) | Canonical `<Avatar>` (`size-14`) | Marketplace Driver | `driver.user.image` -> 2-letter uppercase initials |
| **05. Driver Management** | `apps/web/features/operator/components/drivers/driver-public-profile-sheet.tsx` | Public Driver Profile Sheet (L183) | Canonical `<Avatar>` (`size-16`) | Marketplace Driver | `driver.user.image` -> 2-letter uppercase initials |
| **05. Driver Management** | `apps/web/features/operator/views/operator-sent-offers-view.tsx` | Operator Sent Offers Table (L404) | Canonical `<Avatar>` (`size-12`) | Offered Driver | `driverProfile.user.image` -> 2-letter initials |
| **05. Driver Management** | `apps/web/features/operator/views/operator-fleet-map-view.tsx` | Fleet Map Live Driver Row (L202) | Canonical `<Avatar>` (`size-10`) | Active On-Duty Driver | `driver.user.image` -> 2-letter initials |
| **05. Driver Management** | `apps/web/features/admin/views/admin-marketplace-view.tsx` | Admin Marketplace Offer Row (L201) | Canonical `<Avatar>` (`size-7`) | Marketplace Driver | `driverProfile.user.image` -> 2-letter initials |
| **05. Driver Management** | `apps/web/features/admin/views/admin-marketplace-view.tsx` | Admin Marketplace Driver Row (L564) | Canonical `<Avatar>` (`size-8`) | Marketplace Driver | `driver.image` -> 2-letter initials |
| **06. Operations & Dispatch** | `apps/web/features/operator/components/trips/driver-assignment-rows.tsx` | Trip Manifest Driver Assignment (L209) | Canonical `<Avatar>` (`size-4`) | Primary/Relief/Conductor | 2-letter initials fallback (`size-4`) |
| **06. Operations & Dispatch** | `apps/web/features/admin/components/dispatch-trip-list.tsx` | Admin Dispatch Trip Group (L254) | Canonical `<Avatar>` (`size-8`) | Bus Company / Carrier Logo | `group.logoUrl` -> 2-letter company initials |
| **06. Operations & Dispatch** | `apps/web/features/admin/components/routes/admin-routes-table.tsx` | Admin Routes Table Company Cell (L84) | Canonical `<Avatar>` (`size-6`) | Bus Company / Carrier Logo | `route.company.logoUrl` -> 2-letter company initials |
| **07. Admin Audit & Governance** | `apps/web/features/admin/components/audit/bank-access/bank-access-logs-table.tsx` | Bank Access Audit Logs (L119) | Canonical `<Avatar>` (`h-6 w-6`) | Auditor / Admin User | 2-letter uppercase initials |
| **07. Admin Audit & Governance** | `apps/web/features/admin/components/withdrawals-columns.tsx` | Withdrawals Table Company Cell (L45) | Canonical `<Avatar>` (`size-8`) | Bus Company Logo | 1-letter uppercase company initial |
| **07. Admin Audit & Governance** | `apps/web/features/admin/components/verifications-columns.tsx` | Carrier Verification Table (L116) | Ad-hoc Badge (`size-9 rounded-lg`) | Carrier Company | 2-letter uppercase company initial |
| **07. Admin Audit & Governance** | `apps/web/features/admin/components/settlements-history-table.tsx` | Settlements Table Operator Cell (L166) | Ad-hoc Badge (`h-7 w-7 rounded-lg`) | Operator Carrier | 2-letter uppercase operator name |
| **07. Admin Audit & Governance** | `apps/web/features/admin/views/admin-inquiries-view.tsx` | Inquiries Table User Cell (L228) | Ad-hoc Badge (`size-7 rounded-full`) | Contact Inquirer | 2-letter uppercase initials |
| **07. Admin Audit & Governance** | `apps/web/features/admin/components/inquiries/inquiry-detail-drawer.tsx` | Inquiry Detail Drawer Header (L139) | Ad-hoc Badge (`size-9 rounded-full`) | Contact Inquirer | 2-letter uppercase initials |
| **08. Booking & Travelers** | `apps/web/features/booking/components/booking-details.tsx` | Booking Detail Summary Drawer (L177) | Canonical `<Avatar>` (`size-9 after:rounded-sm`) | Bus Company Logo | 2-letter uppercase company name |
| **08. Booking & Travelers** | `apps/web/features/passenger/views/saved-passengers-view.tsx` | Saved Passengers Table List (L266) | Ad-hoc Badge (`w-9 h-9 rounded-full`) | Saved Passenger Person | Hash-colored 2-letter initials |
| **09. Traveler Mobile App** | `apps/traveler-app/features/settings/components/profile-hero.tsx` | Traveler Profile Screen Hero (L28) | Mobile `<Avatar>` (`size-20`) | Traveler Passenger | `image` uri -> 2-letter uppercase initials |
| **09. Traveler Mobile App** | `apps/traveler-app/features/settings/components/personal-info-avatar.tsx` | Personal Info Edit Avatar (L172) | Mobile `<Avatar>` (`size-20`) | Traveler Passenger | `image` uri -> Initials + Camera overlay |
| **09. Traveler Mobile App** | `apps/traveler-app/features/settings/components/passenger-card.tsx` | Saved Passenger Mobile Card (L36) | Ad-hoc Badge (`w-10 h-10 rounded-full`) | Saved Passenger | 2-letter uppercase initials |
| **10. Driver Mobile App** | `apps/driver-app/features/profile/screens/profile-view.tsx` | In-Cab Driver Profile Card (L168) | Custom Container (`w-14 h-14 rounded-2xl`) | Driver Cockpit User | 2-letter uppercase driver initials |

---

### Detailed Analysis by Functional Category

#### 1. Sidebars & Navigation Footers
- **Passenger Web (`apps/web/features/dashboard/components/dashboard-sidebar.tsx`)**:
  - Contains **two instances**:
    - Line 215: The primary sidebar trigger button avatar (`h-8 w-8 rounded-lg grayscale`).
    - Line 244: The dropdown popover header avatar (`h-8 w-8 rounded-lg`).
  - Both render `userInitials` fallback extracted from `user?.name`.
- **Operator Web (`apps/web/features/operator/components/operator-sidebar.tsx`)**:
  - Line 421: Sidebar footer menu trigger (`size-6`).
  - Supports `operator.profilePhotoUrl`, `user?.image`, and falls back to `userInitials`.
- **Admin Web (`apps/web/features/admin/components/admin-sidebar.tsx`)**:
  - Line 427: Sidebar footer menu trigger (`size-6`).
  - Renders `userInitials` fallback inside `<AvatarFallback className="bg-sidebar-primary/15 text-[10px] font-semibold text-sidebar-primary">`.
- **Public Header (`apps/web/features/home/components/home-header.tsx`)**:
  - Line 237: Desktop trigger avatar (`h-10 w-10 rounded-full border-2`).
  - Line 258: Desktop dropdown popover header (`h-10 w-10`).
  - Line 382: Mobile hamburger menu top user avatar (`h-8 w-8 rounded-full border-2`).

#### 2. Staff Management Pages
- **Operator Staff**:
  - **Shared Component**: [`apps/web/features/operator/components/staff/member-avatar.tsx`](file:///C:/dev/moja-buss/apps/web/features/operator/components/staff/member-avatar.tsx):
    - Configured with `size="sm" | "md" | "lg"` (`h-8 w-8`, `h-10 w-10`, `h-12 w-12`).
    - Uses hash-derived background colors (`getAvatarColor`) and initials fallback (`getInitials`).
  - **Usage**: Used in [`staff-member-row.tsx`](file:///C:/dev/moja-buss/apps/web/features/operator/components/staff/staff-member-row.tsx#L71) for every row in the operator staff directory.
- **Admin Staff**:
  - **Shared Component**: [`apps/web/features/admin/components/staff/member-avatar.tsx`](file:///C:/dev/moja-buss/apps/web/features/admin/components/staff/member-avatar.tsx):
    - Identical robust primitive configured for admin staff directory.
  - **Usage**: Used in [`admin-staff-member-row.tsx`](file:///C:/dev/moja-buss/apps/web/features/admin/components/staff/admin-staff-member-row.tsx#L72) for all platform governance team rows.

#### 3. Settings Pages
- **Passenger Settings (`apps/web/features/passenger/views/passenger-settings-view.tsx`)**:
  - Line 187: Renders `<ImageUploadField purpose="passenger-avatar" shape="circle" previewClassName="h-20 w-20" />`.
  - Serves as the user's avatar preview and direct S3/storage upload interface with instant optimistic feedback.
- **Operator Settings**:
  - **Personal Profile Section** ([`personal-profile-section.tsx`](file:///C:/dev/moja-buss/apps/web/features/operator/settings/components/personal-profile-section.tsx#L48)):
    - Renders `<Avatar className="w-16 h-16 border">` displaying `operator.profilePhotoUrl` or `user.image`.
  - **Company Profile Section** ([`profile-section.tsx`](file:///C:/dev/moja-buss/apps/web/features/operator/settings/components/profile-section.tsx#L51)):
    - Renders `<Avatar className="w-16 h-16 border">` displaying the carrier's corporate logo (`company.logoUrl`).
- **Admin Settings (`apps/web/features/admin/views/admin-settings-view.tsx`)**:
  - Contains platform settings (platform take-rate commission tiers, payment gateways). **No user avatar is present** on this page.

#### 4. Admin Users & Directories
- **Travelers Directory**:
  - Table: [`travelers-columns.tsx`](file:///C:/dev/moja-buss/apps/web/features/admin/components/travelers-columns.tsx#L116) renders `size-10` `<Avatar>` with hash-derived background tone.
  - Card Grid: [`travelers-grid.tsx`](file:///C:/dev/moja-buss/apps/web/features/admin/components/travelers-grid.tsx#L146) renders `size-16` `<Avatar>`.
- **Operators Directory**:
  - Table: [`operators-columns.tsx`](file:///C:/dev/moja-buss/apps/web/features/admin/components/operators-columns.tsx#L135) renders `h-9 w-9` `<Avatar>`.
  - Card Grid: [`operators-grid.tsx`](file:///C:/dev/moja-buss/apps/web/features/admin/components/operators-grid.tsx#L147) renders `h-16 w-16` `<Avatar>`.
- **User Profile Detail Hero**:
  - [`user-profile-header.tsx`](file:///C:/dev/moja-buss/apps/web/features/admin/components/user-profile-header.tsx#L95) renders an extra-large `h-20 w-20 rounded-xl` hero badge with hash tone.
  - Reused by both [`admin-traveler-profile-view.tsx`](file:///C:/dev/moja-buss/apps/web/features/admin/views/admin-traveler-profile-view.tsx) and [`admin-operator-profile-view.tsx`](file:///C:/dev/moja-buss/apps/web/features/admin/views/admin-operator-profile-view.tsx).

#### 5. Driver Rosters, Marketplaces & Dispatch
- **Operator Roster & Detail**:
  - Drivers list: [`operator-drivers-view.tsx`](file:///C:/dev/moja-buss/apps/web/features/operator/views/operator-drivers-view.tsx#L331) (`size-11` `<Avatar>`).
  - Driver detail: [`driver-detail-view.tsx`](file:///C:/dev/moja-buss/apps/web/features/operator/views/driver-detail-view.tsx#L104) (`size-20` `<Avatar>`).
- **Marketplace & Offers**:
  - Marketplace card: [`marketplace-driver-card.tsx`](file:///C:/dev/moja-buss/apps/web/features/operator/components/drivers/marketplace-driver-card.tsx#L188) (`size-14`).
  - Driver profile sheet: [`driver-public-profile-sheet.tsx`](file:///C:/dev/moja-buss/apps/web/features/operator/components/drivers/driver-public-profile-sheet.tsx#L183) (`size-16`).
  - Sent offers view: [`operator-sent-offers-view.tsx`](file:///C:/dev/moja-buss/apps/web/features/operator/views/operator-sent-offers-view.tsx#L404) (`size-12`).
  - Admin marketplace view: [`admin-marketplace-view.tsx`](file:///C:/dev/moja-buss/apps/web/features/admin/views/admin-marketplace-view.tsx) (L201: `size-7`, L564: `size-8`).
- **Live Fleet Map**:
  - Active driver list item: [`operator-fleet-map-view.tsx`](file:///C:/dev/moja-buss/apps/web/features/operator/views/operator-fleet-map-view.tsx#L202) (`size-10`).
- **Dispatch Assignment**:
  - Active trip manifest badge: [`driver-assignment-rows.tsx`](file:///C:/dev/moja-buss/apps/web/features/operator/components/trips/driver-assignment-rows.tsx#L209) (`size-4` micro-avatar).

#### 6. Governance Tables & Ad-Hoc Initials Badges
Several governance views use ad-hoc `div` badges instead of the canonical `<Avatar>` primitive:
- [`admin-inquiries-view.tsx`](file:///C:/dev/moja-buss/apps/web/features/admin/views/admin-inquiries-view.tsx#L228): `size-7 rounded-full bg-primary/10` with 2-letter uppercase initials.
- [`inquiry-detail-drawer.tsx`](file:///C:/dev/moja-buss/apps/web/features/admin/components/inquiries/inquiry-detail-drawer.tsx#L139): `size-9 rounded-full bg-primary/10` initials badge.
- [`saved-passengers-view.tsx`](file:///C:/dev/moja-buss/apps/web/features/passenger/views/saved-passengers-view.tsx#L266): `w-9 h-9 rounded-full` color-hashed passenger initials.
- [`verifications-columns.tsx`](file:///C:/dev/moja-buss/apps/web/features/admin/components/verifications-columns.tsx#L116): `size-9 rounded-lg` company initials badge.
- [`settlements-history-table.tsx`](file:///C:/dev/moja-buss/apps/web/features/admin/components/settlements-history-table.tsx#L166): `h-7 w-7 rounded-lg` operator initials badge.

#### 7. Mobile Apps (Traveler & Driver)
- **Traveler App (`apps/traveler-app`)**:
  - [`profile-hero.tsx`](file:///C:/dev/moja-buss/apps/traveler-app/features/settings/components/profile-hero.tsx#L28): `size-20` nativewind `<Avatar>` with `<AvatarImage>` and camera icon badge.
  - [`personal-info-avatar.tsx`](file:///C:/dev/moja-buss/apps/traveler-app/features/settings/components/personal-info-avatar.tsx#L172): `size-20` interactive avatar with Expo ImagePicker upload handler and loading spinner.
  - [`passenger-card.tsx`](file:///C:/dev/moja-buss/apps/traveler-app/features/settings/components/passenger-card.tsx#L36): `w-10 h-10 rounded-full` saved passenger initials circle.
- **Driver App (`apps/driver-app`)**:
  - [`profile-view.tsx`](file:///C:/dev/moja-buss/apps/driver-app/features/profile/screens/profile-view.tsx#L168): `w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20` displaying driver initials alongside security verification checkmark.

---

### Architectural Recommendations for Full Harmonization

1. **Standardize Ad-Hoc Badges to Canonical `<Avatar>`**:
   - Refactor `saved-passengers-view.tsx`, `admin-inquiries-view.tsx`, `inquiry-detail-drawer.tsx`, `verifications-columns.tsx`, and `settlements-history-table.tsx` to use the `@moja/ui` `<Avatar>` and `<AvatarFallback>` primitive rather than raw `div`s.
2. **Promote `MemberAvatar` to `@moja/ui`**:
   - `AdminMemberAvatar` and `MemberAvatar` are nearly identical copies with color hash calculation. Consolidating into a unified `<UserAvatar name={...} src={...} size={...} />` inside `packages/ui` will eliminate duplication.
3. **Harmonize Radius**:
   - The majority use `rounded-full` (circle), while passenger sidebar uses `rounded-lg`, and user profile detail uses `rounded-xl`. We recommend formalizing token variants: `circle` (default for humans) and `square` / `rounded-md` (reserved for companies/carriers).
