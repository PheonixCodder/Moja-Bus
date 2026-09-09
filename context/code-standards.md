# Code Standards & Engineering Guidelines

## 1. TypeScript & Static Typing
- Use TypeScript with strict mode enabled.
- Avoid `any` unless wrapping an untyped external dependency, and always document the exception.
- Provide explicit return types on exported services, tRPC router procedures, and database helper functions.
- Keep domain types in `@moja/types` or `@moja/schemas` to enable seamless contract parity across `web`, `traveler-app`, and `driver-app`.

---

## 2. Framework & UI Conventions
- **Web (`apps/web`)**:
  - Follow shadcn/ui composition conventions with Tailwind CSS.
  - Prefer `Field` / `FieldGroup` / `FieldLabel` / `FieldError` from `@moja/ui` for form layouts; use `flex flex-col gap-*` instead of `space-y-*` on form stacks.
  - Wrap Recharts charts in `ChartContainer` with a `ChartConfig` using `var(--chart-N)` or semantic tokens (`var(--primary)`, `var(--success)`); series strokes/fills should use `var(--color-*)`.
  - Separate server components/pages from client components (mark client-side interactives with `'use client'`).
  - Use `nuqs` for type-safe URL search parameter management.
  - Access backend state via `@/trpc/client`.
- **Mobile (`apps/traveler-app` and `apps/driver-app`)**:
  - Use Expo Router with file-based routing and typed route links.
  - Style with NativeWind utility classes matching design tokens from `@moja/theme`.
  - Handle offline and poor network states gracefully with optimistic updates and local caches.
- **Shared Components (`packages/ui`)**:
  - Keep shared UI primitive, headless, and accessible.
  - Never import app-specific business logic or routers inside `@moja/ui`.

---

## 3. API & Procedure Standards (tRPC)
- Every procedure must validate inputs with Zod schemas.
- Route procedure authorization must use appropriate middleware:
  - `publicProcedure`: Unauthenticated public routes (trip search, schedule views).
  - `protectedProcedure`: Authenticated user required.
  - `operatorProcedure`: Enforces valid `companyId` tenancy.
  - `driverProcedure`: Enforces active authenticated driver profile.
  - `adminProcedure`: Enforces super admin or specific admin staff permission keys.
- Never write raw SQL queries with `$queryRawUnsafe`. Use Prisma Client models or parameterized `$queryRaw` with typed template literals.

---

## 4. Notifications & Outbox Pattern
- Transactional messages (cancellations, refunds, delays, verification notices) MUST be enqueued to `NotificationOutbox` inside Prisma `$transaction` blocks.
- Background worker sweeps the outbox every minute and dispatches to Novu.
- Use stable, day-bucketed transaction IDs (`txId`) for deduplication where appropriate.

---

## 5. Naming Conventions & Code Style
- **Files & Directories**: `kebab-case` for general files (e.g. `driver-doc-preview.tsx`, `booking-detail.tsx`).
- **Components**: `PascalCase` (e.g. `DriverDocPreview`, `BookingCard`).
- **Functions & Hooks**: `camelCase` (e.g. `useDriverLocation`, `mintDriverDocUrl`).
- **Database Tables & Fields**: `snake_case` in database, mapped to `camelCase` in Prisma models.
- **Linting & Formatting**: Follow Biome configuration (`biome check --write`).

---

## 6. Mobile Styling Rules (NativeWind + Theme)

> Applies to: `apps/driver-app` and `apps/traveler-app`

### Rule 1 — NativeWind for All Visual Styling

All colours, typography, spacing, and border radii on UI components use NativeWind utility classes derived from `@moja/theme` CSS variables.

```tsx
// ✅ Correct — derives from CSS vars, works in dark/light automatically
<Text className="text-foreground text-sm font-medium" />
<View className="bg-card border border-border rounded-xl p-4" />
<Text className="h2" />         // shared @utility from packages/theme/global.css
<Text className="body-md" />    // uses var(--foreground) — auto dark/light

// ❌ Wrong — hardcoded, breaks if tokens change
<Text style={{ color: "#18181b", fontSize: 14 }} />
<View style={{ backgroundColor: "#ffffff" }} />
```

### Rule 2 — StyleSheet.create() Only for Layout Shells

`StyleSheet.create()` is permitted **exclusively** for:
- Dynamic values computed at runtime (e.g. `insets.top + 12`, `width * 0.6`)
- Complex platform shadows not expressible in NativeWind
- Root shell containers: `ScreenShell`, `TabBar`, `PageHeader`

Never use `StyleSheet.create()` in feature UI components — use NativeWind.

### Rule 3 — JS Constants for Non-CSS Props

Some props cannot accept a `className` string — they require a JavaScript value:
- `color` on icon components (`HugeiconsIcon`, Lucide, etc.)
- `placeholderTextColor` on `TextInput`
- `trackColor` / `thumbColor` on `Switch`
- `color` on `ActivityIndicator`
- `fill` / `stroke` on SVG elements

For these, **always** import from the app's `constants/ui-colors.ts`:

```tsx
import { IconColors, SwitchColors, PlaceholderColor } from "@/constants/ui-colors";

<HugeiconsIcon icon={ArrowLeftIcon} color={IconColors.default} />
<TextInput placeholderTextColor={PlaceholderColor} />
<Switch trackColor={{ false: SwitchColors.trackOff, true: SwitchColors.trackOn }} />
```

> **Never** use `Colors.light.*` or `Colors.dark.*` directly as prop values.
> **Never** use raw hex strings as prop values.

### Rule 4 — No New Tokens Invented Inside Apps

Any new colour, radius, or spacing needed for a feature must first be proposed
as an addition to `packages/theme/tokens.ts`. App-level constants derive from
tokens — they do not create parallel values.

```ts
// ✅ Correct — derives from centralised token
streak: Palette.orange[500]

// ❌ Wrong — invented locally
streak: "#f97316"
```

### Rule 5 — Typography via @utility Classes

Use shared typography helpers from `packages/theme/global.css`:

| Class | Size | Weight | Use for |
|-------|------|--------|---------|
| `h1`  | 28px | 700 | Screen / large title |
| `h2`  | 22px | 700 | Section title |
| `h3`  | 18px | 600 | Card / modal title |
| `h4`  | 15px | 500 | Form label / subsection |
| `body-lg` | 16px | 400 | Prominent body text |
| `body-md` | 14px | 400 | Standard body |
| `body-sm` | 12px | 400 | Secondary details |
| `caption` | 11px | 400 | Badges, timestamps |
| `micro`   | 10px | 600 | Pill labels, counts |

Add size/colour overrides with Tailwind modifiers:
```tsx
<Text className="h2 text-xl" />               // override size only
<Text className="body-md text-destructive" />  // override colour only
```

### Rule 6 — Dark / Light Mode is Forced Per App

- **Driver-app**: permanently dark — root `<View className="flex-1 dark">` in `_layout.tsx`
- **Traveler-app**: permanently light — root `<View className="flex-1 light">` in `_layout.tsx`
- Never use `useColorScheme()` to conditionally swap styles — it is overridden by the forced mode
- Never call `setColorScheme()` — the mode is architectural, not a user preference

### Rule 7 — Web App is Isolated

`packages/theme/global.css` base `--radius` value must never be changed — it is consumed
by `packages/ui` → `apps/web`. Mobile radius overrides live in each app's own `global.css`.
All changes to `packages/theme` must be **additive only** unless you also audit `apps/web`.

