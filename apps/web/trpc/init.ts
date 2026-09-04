import { getPrismaClient } from "@moja/db";
import { canOperateRuns } from "@moja/schemas";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "@/lib/auth-server";
import { isMutationOriginAllowed } from "@/lib/mutation-origin";
import { createRateLimiter } from "@/lib/rate-limit";

export async function createContextFromHeaders(
  headers: Headers,
  resHeaders?: Headers,
) {
  let response: any;
  let res: Headers | undefined;

  try {
    const result = await auth.api.getSession({
      headers,
      returnHeaders: true,
    });
    res = result.headers;
    response = result.response;
  } catch (err) {
    console.error("[auth] getSession threw:", err);
  }

  if (!response?.user) {
    // Muted: session/token debug logging was removed (O19). Verify sessions via
    // the normal auth stack; errors are still surfaced above.
  }

  if (res && resHeaders) {
    for (const cookie of res.getSetCookie()) {
      resHeaders.append("Set-Cookie", cookie);
    }
  }

  return {
    prisma: getPrismaClient(),
    user: response?.user,
    headers,
    /** Fetch adapter response headers — use to append Set-Cookie. */
    resHeaders,
    _cache: new Map<string, unknown>(),
  };
}

export type Context = Awaited<ReturnType<typeof createContextFromHeaders>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,

  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

/**
 * CSRF POSTURE:
 * Better Auth uses SameSite=Lax cookies for sessions. To protect tRPC mutations
 * from Cross-Site Request Forgery (CSRF), we enforce an Origin header check
 * on all state-mutating procedures.
 *
 * Phase 35 (F-IN-08) — policy extracted to lib/mutation-origin.ts so the
 * matrix is unit-testable: malformed Origin → FORBIDDEN (was INTERNAL via
 * unguarded `new URL`), explicit ALLOWED_ORIGINS honored, production pins
 * https scheme, and the no-Origin bypass is documented there (native apps).
 */
const csrfMiddleware = t.middleware(({ type, next, ctx }) => {
  if (type === "mutation") {
    const allowed = isMutationOriginAllowed({
      origin: ctx.headers.get("origin"),
      host: ctx.headers.get("host"),
    });
    if (!allowed) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "CSRF check failed: Origin not allowed.",
      });
    }
  }
  return next();
});

// Phase 18 (P2-15) — baseline mutation floors. Deliberately generous so no
// legitimate flow trips them; they exist to cap flooding, not to shape
// traffic. Tighter per-endpoint limiters stay in place on top. Windows are
// per-instance (in-memory): exact for the single-container deployment,
// approximate if replicas appear — swap the store for Redis then.
const publicMutationLimiter = createRateLimiter({ windowMs: 60_000, max: 120 });
const protectedMutationLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 60,
});

function clientIpKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim();
  return `ip:${ip || headers.get("x-real-ip") || "unknown"}`;
}

function enforceMutationLimit(
  type: "query" | "mutation" | "subscription",
  key: string,
  limiter: ReturnType<typeof createRateLimiter>,
) {
  if (type !== "mutation") return;
  const result = limiter(key);
  if (!result.ok) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Too many requests — retry in ${Math.ceil(result.retryAfterMs / 1000)}s.`,
    });
  }
}

export const publicProcedure = t.procedure
  .use(csrfMiddleware)
  .use(({ type, ctx, next }) => {
    enforceMutationLimit(type, clientIpKey(ctx.headers), publicMutationLimiter);
    return next();
  });

export const protectedProcedure = publicProcedure.use(({ ctx, type, next }) => {
  if (!ctx.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
    });
  }

  enforceMutationLimit(type, `user:${ctx.user.id}`, protectedMutationLimiter);

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const operatorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "OPERATOR" && ctx.user.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to access operator endpoints.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const operatorCompanyProcedure = operatorProcedure.use(
  async ({ ctx, next }) => {
    const cacheKey = `operator:${ctx.user.id}`;
    const cached = ctx._cache.get(cacheKey) as
      | Awaited<ReturnType<typeof ctx.prisma.operator.findFirst>>
      | undefined;

    const operatorProfile =
      cached ??
      (await ctx.prisma.operator.findFirst({
        where: { userId: ctx.user.id, deletedAt: null },
        orderBy: { joinedAt: "desc" },
      }));

    if (!cached && operatorProfile) {
      ctx._cache.set(cacheKey, operatorProfile);
    }

    if (!operatorProfile || !operatorProfile.companyId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Operator profile or company not found.",
      });
    }

    if (operatorProfile.status === "SUSPENDED") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Your account has been suspended.",
      });
    }

    return next({
      ctx: {
        ...ctx,
        operator: operatorProfile,
        companyId: operatorProfile.companyId,
      },
    });
  },
);

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  // ADMIN-role is only authoritative when backed by a live AdminStaff profile.
  // This single gate protects the *entire* admin surface (admin.ts, payments
  // admin procedures, contact admin) from: (a) role-ADMIN users with no staff
  // row, and (b) SUSPENDED staff whose underlying user.role is still ADMIN.
  // (Permits per-procedure keys, enforced below via requireAdminPermission.)
  const adminStaff = await ctx.prisma.adminStaff.findUnique({
    where: { userId: ctx.user.id, deletedAt: null },
  });
  if (!adminStaff) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin staff profile not found",
    });
  }
  if (adminStaff.status === "SUSPENDED") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your admin access is suspended",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      adminStaff,
    },
  });
});

export const adminStaffProcedure = adminProcedure;

/**
 * Shared loader for every driver-facing procedure: resolves the caller's
 * DriverProfile (per-request cache) or refuses access.
 */
const loadDriverProfile = protectedProcedure.use(async ({ ctx, next }) => {
  const cacheKey = `driver:${ctx.user.id}`;
  const cached = ctx._cache.get(cacheKey) as
    | (Awaited<ReturnType<typeof ctx.prisma.driverProfile.findUnique>> & {
        companyAffiliations: any[];
      })
    | undefined;

  const driverProfile =
    cached ??
    (await ctx.prisma.driverProfile.findUnique({
      where: { userId: ctx.user.id },
      include: {
        companyAffiliations: {
          where: { isActive: true },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    }));

  if (!cached && driverProfile) {
    ctx._cache.set(cacheKey, driverProfile);
  }

  if (!driverProfile) {
    // If the caller is an OPERATOR staff member with role === "CONDUCTOR",
    // allow them access to crew features (trips, passenger check-in, manifest)
    // without requiring an external DriverProfile.
    const operatorStaff = await ctx.prisma.operator.findFirst({
      where: {
        userId: ctx.user.id,
        role: "CONDUCTOR",
        status: "ACTIVE",
        deletedAt: null,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
      },
    });

    if (operatorStaff) {
      const conductorCrewProfile: any = {
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
                companyId: operatorStaff.companyId,
                driverProfileId: operatorStaff.id,
                company: operatorStaff.company,
                isActive: true,
              },
            ]
          : [],
        operatorStaff,
      };

      return next({
        ctx: {
          ...ctx,
          driver: conductorCrewProfile,
        },
      });
    }

    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Driver profile not found. Please complete driver registration first.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      driver: driverProfile,
    },
  });
});

/**
 * Phase 06 (F-DV-04) — reads a suspended driver may still reach even though
 * they are otherwise read-only: telemetry tokens are capability grants and
 * urgent dispatch drives actions, so both stay sealed.
 */
const SUSPENDED_DENIED_READS = new Set([
  "getTelemetryToken",
  "getMyUrgentDispatches",
]);

import { canDriverInvokeMutation } from "@/lib/driver-authorization";

export const driverProcedure = loadDriverProfile.use(
  ({ ctx, type, path, next }) => {
    const procedureName = path.split(".").pop() ?? "";

    if (ctx.driver.verificationStatus === "SUSPENDED") {
      if (type !== "query" || SUSPENDED_DENIED_READS.has(procedureName)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Your driver account is suspended — you have read-only access. Contact your operator.",
        });
      }
    } else if (type === "mutation") {
      if (
        !canDriverInvokeMutation(
          ctx.driver.verificationStatus,
          ctx.driver.currentTripId,
          procedureName,
        )
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Your license verification is not approved yet — operational actions and starting runs are locked until an operator verifies your account.",
        });
      }
    }

    return next({ ctx });
  },
);
