# Phase 05 — Domain Boundary & Typing Polish

> **Authority:** [`context/audits/trpc-audit/15-findings-and-recommendations.md`](file:///C:/dev/moja-buss/context/audits/trpc-audit/15-findings-and-recommendations.md) (`TRPC-SERVER-001`, `TRPC-SERVER-002`, `TRPC-SERVER-003`)  
> **Target Files:**
> - `apps/web/trpc/routers/notifications.ts` (new)
> - `apps/web/trpc/routers/public.ts`
> - `apps/web/trpc/routers/_app.ts`
> - `apps/web/trpc/init.ts`
> - `apps/web/trpc/routers/operator.ts`
> - `apps/web/trpc/routers/operator/settings.ts`

---

## 1. Objectives

1. Decouple protected push notification procedures (`getNotificationToken`, `registerPushToken`, `markNotificationAsRead`) from `publicRouter` into a dedicated, domain-aligned `notificationsRouter`.
2. Maintain 100% backwards compatibility for mobile app builds currently running in the field by re-exporting the procedures on `publicRouter` with `@deprecated` tags.
3. Eliminate all residual `any` annotations in `apps/web/trpc/init.ts`, typing Better Auth session responses, Prisma Driver Profile affiliations, and Conductor crew shims with strict types.
4. Add `@deprecated` JSDoc annotations to the flat `operatorSettingsProcedures` spread in `operatorRouter`, guiding developers toward `trpc.operator.settings.*`.

---

## 2. Implementation Steps

### Step 1: Create `notificationsRouter` (`apps/web/trpc/routers/notifications.ts`)

Create `apps/web/trpc/routers/notifications.ts` and encapsulate the Novu push notification logic:

```typescript
// apps/web/trpc/routers/notifications.ts

import { ChatOrPushProviderEnum } from "@novu/api/models/components";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import crypto from "crypto";
import { getNovuClient } from "@/lib/novu";
import { createTRPCRouter, protectedProcedure } from "../init";

export const notificationProcedures = {
	getNotificationToken: protectedProcedure.query(async ({ ctx }) => {
		const secret = process.env["NOVU_SECRET_KEY"];
		if (!secret) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Notification secret is not configured on server",
			});
		}

		const subscriberId = ctx.user.id;
		const subscriberHash = crypto
			.createHmac("sha256", secret)
			.update(subscriberId)
			.digest("hex");

		return {
			subscriberId,
			subscriberHash,
			appId: process.env["NEXT_PUBLIC_NOVU_APP_ID"] || "",
		};
	}),

	registerPushToken: protectedProcedure
		.input(z.object({ token: z.string(), platform: z.enum(["android", "ios"]) }))
		.mutation(async ({ ctx, input }) => {
			const novu = getNovuClient();
			if (!novu) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Notification service is not configured",
				});
			}

			const subscriberId = ctx.user.id;
			const providerId = ChatOrPushProviderEnum.Expo;

			try {
				await novu.subscribers.credentials.append(
					{
						providerId,
						credentials: { deviceTokens: [input.token] },
					},
					subscriberId,
				);
			} catch (err) {
				console.error("[NOVU] Failed to register push token:", err);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to register push token",
				});
			}
		}),

	markNotificationAsRead: protectedProcedure
		.input(z.object({ notificationId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const novu = getNovuClient();
			if (!novu) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Notification service is not configured",
				});
			}

			const subscriberId = ctx.user.id;
			try {
				await novu.subscribers.notifications.markAsRead({
					notificationId: input.notificationId,
					subscriberId,
				});
			} catch (err) {
				console.error("[NOVU] Failed to mark notification as read:", err);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to mark notification as read",
				});
			}
		}),
};

export const notificationsRouter = createTRPCRouter(notificationProcedures);
```

---

### Step 2: Register on `appRouter` & Alias on `publicRouter`

#### Update `apps/web/trpc/routers/_app.ts`:
```typescript
import { notificationsRouter } from "./notifications";

export const appRouter = createTRPCRouter({
  // ... existing routers
  notifications: notificationsRouter,
});
```

#### Update `apps/web/trpc/routers/public.ts`:
```typescript
import { notificationProcedures } from "./notifications";

export const publicRouter = createTRPCRouter({
  /** @deprecated Use `trpc.notifications.getNotificationToken` instead */
  getNotificationToken: notificationProcedures.getNotificationToken,

  /** @deprecated Use `trpc.notifications.registerPushToken` instead */
  registerPushToken: notificationProcedures.registerPushToken,

  /** @deprecated Use `trpc.notifications.markNotificationAsRead` instead */
  markNotificationAsRead: notificationProcedures.markNotificationAsRead,

  listOperators: publicProcedure.query(async ({ ctx }) => { ... }),
  getOperator: publicProcedure.input(...).query(async ({ ctx, input }) => { ... }),
  // ... rest of public queries
});
```

---

### Step 3: Tighten Type Safety in `apps/web/trpc/init.ts`

Replace the four residual `any` annotations:

1. **Line 14 (`response` in `createContextFromHeaders`)**:
```typescript
// BEFORE:
let response: any;

// AFTER:
let response: Awaited<ReturnType<typeof auth.api.getSession>>["response"] | undefined;
```

2. **Line 270 (`companyAffiliations` in `loadDriverProfile`)**:
```typescript
import type { Prisma } from "@moja/db";

// BEFORE:
companyAffiliations: any[];

// AFTER:
companyAffiliations: Array<
  Prisma.DriverCompanyAffiliationGetPayload<{
    include: {
      company: {
        select: {
          id: true;
          name: true;
          slug: true;
          logoUrl: true;
        };
      };
    };
  }>
>;
```

3. **Line 323 (`conductorCrewProfile` shim)**:
Define a concrete type alias matching the expected driver profile contract:
```typescript
type DriverProfileWithAffiliations = NonNullable<
  Awaited<ReturnType<typeof ctx.prisma.driverProfile.findUnique>>
> & {
  companyAffiliations: Array<{
    id: string;
    driverProfileId: string;
    companyId: string;
    isActive: boolean;
    role: string;
    badgeNumber: string | null;
    joinedAt: Date;
    company: {
      id: string;
      name: string;
      slug: string;
      logoUrl: string | null;
    };
  }>;
};

const conductorCrewProfile: DriverProfileWithAffiliations = {
  id: operatorStaff.id,
  userId: ctx.user.id,
  status: "AVAILABLE",
  verificationStatus: "VERIFIED",
  currentTripId: null,
  licenseNumber: "STAFF_CONDUCTOR",
  licenseCategory: "STAFF",
  licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  companyAffiliations: operatorStaff.company
    ? [
        {
          id: operatorStaff.id,
          driverProfileId: operatorStaff.id,
          companyId: operatorStaff.company.id,
          isActive: true,
          role: "CONDUCTOR",
          badgeNumber: null,
          joinedAt: operatorStaff.joinedAt,
          company: operatorStaff.company,
        },
      ]
    : [],
  createdAt: operatorStaff.createdAt,
  updatedAt: operatorStaff.updatedAt,
};
```

4. **Line 480 (`company` in booth procedure)**:
```typescript
// BEFORE:
const company = (operator as any).company as {
  id: string;
  name: string;
  slug: string;
  status: string;
  logoUrl: string | null;
};

// AFTER:
// Operator query already includes company selection in Prisma query; use direct property access:
const company = operator.company;
if (!company) {
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "Company details not found.",
  });
}
```

---

### Step 4: Deprecate Flat Operator Settings Spread (`apps/web/trpc/routers/operator.ts`)

In `apps/web/trpc/routers/operator/settings.ts`, add JSDoc deprecation tags to `operatorSettingsProcedures`:

```typescript
/**
 * @deprecated Use `trpc.operator.settings.<procedureName>` instead.
 * Flat procedure exports are retained only for legacy backwards compatibility.
 */
export const operatorSettingsProcedures = { ... };
```

And in `apps/web/trpc/routers/operator.ts`:
```typescript
  settings: operatorSettingsRouter,
  /** @deprecated Migrate calls to `trpc.operator.settings.*` */
  ...operatorSettingsProcedures,
```

---

## 3. Risks & Mitigations

| Risk | Severity | Mitigation |
| :--- | :---: | :--- |
| Mobile apps broken by notification move | Critical | Procedures are preserved identically under `trpc.public.*` via direct reference. Both `trpc.public.registerPushToken` and `trpc.notifications.registerPushToken` invoke the same handler. |
| Type discrepancy in conductor crew shim | Low | `DriverProfileWithAffiliations` strictly matches the return type of `loadDriverProfile` expected by driver subrouters. `pnpm turbo typecheck` guarantees compiler verification. |

---

## 4. Verification & Acceptance Criteria

1. **Compiler Typecheck**:
   ```bash
   pnpm --filter web typecheck
   pnpm turbo typecheck
   ```
   Must pass across all 12 packages with 0 errors.

2. **IDE Deprecation Strike-Through**:
   - In VSCode or Antigravity IDE, inspect `trpc.public.registerPushToken` and `trpc.operator.getSettings`.
   - Verify that TypeScript IntelliSense marks them with strikethrough (deprecated) and suggests the replacement path.

3. **Notification Token Query**:
   - Query `trpc.notifications.getNotificationToken` as an authenticated user; verify valid subscriber hash returned.
   - Query `trpc.public.getNotificationToken`; verify identical result.
