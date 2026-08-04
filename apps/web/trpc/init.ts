import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import superjson from "superjson";
import { getPrismaClient } from "@moja/db";
import { auth } from "@/lib/auth-server";

export async function createContextFromHeaders(headers: Headers, resHeaders?: Headers) {
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
    const cookieHeader = headers.get("cookie") ?? "";
    const cookieNames = cookieHeader
      .split(";")
      .map((c) => c.trim().split("=")[0]);

    console.warn("[auth] no session resolved", {
      cookieLen: cookieHeader.length,
      cookieNames,
    });

    try {
      const fresh = await auth.api.getSession({
        headers,
        query: { disableCookieCache: true },
      });
      console.warn("[auth] retry bypassing cache:", {
        foundSession: !!fresh?.user,
      });
    } catch (err2) {
      console.error("[auth] retry bypassing cache threw:", err2);
    }
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
 */
const csrfMiddleware = t.middleware(({ type, next, ctx }) => {
  if (type === "mutation") {
    const origin = ctx.headers.get("origin");
    const host = ctx.headers.get("host");

    // In a browser, standard fetch/XHR sends Origin for cross-origin or POST.
    // Allow if origin matches host, or if no origin (e.g. server-side calls or direct curl if we allow it)
    // For strict CSRF, we require Origin to match the host or be a known trusted domain.
    if (origin) {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "CSRF check failed: Origin does not match Host.",
        });
      }
    }
  }
  return next();
});

export const publicProcedure = t.procedure.use(csrfMiddleware);

export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
    });
  }

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
    const cached = ctx._cache.get(cacheKey) as Awaited<ReturnType<typeof ctx.prisma.operator.findFirst>> | undefined;

    const operatorProfile = cached ?? await ctx.prisma.operator.findFirst({
      where: { userId: ctx.user.id, deletedAt: null },
      orderBy: { joinedAt: "desc" },
    });

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

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});
