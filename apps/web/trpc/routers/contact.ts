import {
  adminGetInquirySchema,
  adminListInquiriesSchema,
  adminUpdateInquiryStatusSchema,
  submitInquirySchema,
} from "@moja/schemas";
import { TRPCError } from "@trpc/server";
import { requireAdminPermission } from "@/lib/permissions/admin-authorize";
import { adminProcedure, createTRPCRouter, publicProcedure } from "../init";

const SUBMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const SUBMIT_MAX_PER_EMAIL = 5;

export const contactRouter = createTRPCRouter({
  submitInquiry: publicProcedure
    .input(submitInquirySchema)
    .mutation(async ({ ctx, input }) => {
      // Lightweight abuse guard: max 5 submissions per email per hour.
      const since = new Date(Date.now() - SUBMIT_WINDOW_MS);
      const recent = await ctx.prisma.contactInquiry.count({
        where: {
          email: input.email,
          createdAt: { gte: since },
        },
      });

      if (recent >= SUBMIT_MAX_PER_EMAIL) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many inquiries submitted. Please try again later.",
        });
      }

      const forwarded = ctx.headers.get("x-forwarded-for");
      const ipAddress =
        forwarded?.split(",")[0]?.trim() ||
        ctx.headers.get("x-real-ip") ||
        undefined;

      const inquiry = await ctx.prisma.contactInquiry.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone ?? null,
          subject: input.subject,
          message: input.message,
          // Set server-side from the session — null when the submitter is a guest.
          userId: ctx.user?.id ?? null,
          ipAddress: ipAddress ?? null,
          userAgent: ctx.headers.get("user-agent") ?? null,
        },
      });

      return { id: inquiry.id };
    }),

  listInquiries: adminProcedure
    .input(adminListInquiriesSchema)
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "support:inquiries:read");
      const where: Record<string, unknown> = {};

      if (input.status) {
        where["status"] = input.status;
      }

      if (input.search) {
        const q = input.search.toLowerCase();
        where["OR"] = [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { subject: { contains: q, mode: "insensitive" } },
        ];
      }

      const [items, total] = await Promise.all([
        ctx.prisma.contactInquiry.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
              },
            },
          },
        }),
        ctx.prisma.contactInquiry.count({ where }),
      ]);

      return { items, total };
    }),

  getInquiry: adminProcedure
    .input(adminGetInquirySchema)
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "support:inquiries:read");
      const inquiry = await ctx.prisma.contactInquiry.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
          resolvedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      if (!inquiry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Inquiry not found",
        });
      }

      return inquiry;
    }),

  updateInquiryStatus: adminProcedure
    .input(adminUpdateInquiryStatusSchema)
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "support:inquiries:respond");
      const { id, status, adminNote } = input;
      const isTerminal = status === "RESOLVED" || status === "CLOSED";

      return ctx.prisma.contactInquiry.update({
        where: { id },
        data: {
          status,
          ...(adminNote !== undefined ? { adminNote } : {}),
          resolvedById: isTerminal ? ctx.user.id : null,
          resolvedAt: isTerminal ? new Date() : null,
        },
      });
    }),
});
