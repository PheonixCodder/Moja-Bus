import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import superjson from "superjson";
import { getPrismaClient } from "@moja/db";
import { auth } from "@/lib/auth-server";

export async function createContextFromHeaders(headers: Headers) {
  const session = await auth.api.getSession({
    headers,
  });

  const source = headers.get("x-trpc-source") ?? "unknown";

  console.log(">>> tRPC Request from", source, "by", session?.user?.email);

  return {
    prisma: getPrismaClient(),
    user: session?.user,
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
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
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
    const operatorProfile = await ctx.prisma.operator.findFirst({
      where: { userId: ctx.user.id, deletedAt: null },
      orderBy: { joinedAt: "desc" },
    });

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

export const operatorStaffManageProcedure = operatorCompanyProcedure.use(
  ({ ctx, next }) => {
    if (ctx.operator.role !== "OWNER" && ctx.operator.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to manage staff.",
      });
    }
    return next({ ctx });
  },
);
