import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
} from "../init";
import {
  createPresignedDownload,
  createPresignedUpload,
  StorageError,
} from "@/lib/storage";
import { getStoragePurpose, type StorageKeyContext, type StoragePurposeId } from "@/lib/storage/purposes";
import { requirePermission } from "@/lib/permissions/authorize";

const presignUploadInput = z.object({
  purpose: z.string().min(1),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  fileSize: z.number().int().positive(),
  keyContext: z
    .object({
      companyId: z.string().optional(),
      userId: z.string().optional(),
      staffId: z.string().optional(),
      slug: z.string().optional(),
    })
    .optional(),
});

async function resolveOperator(ctx: any) {
  const operator = await ctx.prisma.operator.findFirst({
    where: { userId: ctx.user.id, deletedAt: null },
    orderBy: { joinedAt: "desc" },
  });
  if (!operator || !operator.companyId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Operator company not found.",
    });
  }
  return operator;
}

export const storageRouter = createTRPCRouter({
  /**
   * Single presign endpoint. The client always calls this with a `purpose`;
   * the server enforces IAM, resolves the object key from the session (never
   * trusting client-supplied company/user IDs), validates size/type, and
   * returns a direct-to-S3 PUT URL.
   */
  presignUpload: protectedProcedure
    .input(presignUploadInput)
    .mutation(async ({ ctx, input }) => {
      const purpose = getStoragePurpose(input.purpose);

      if (
        purpose.iam === "admin" &&
        ctx.user.role !== "ADMIN"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required.",
        });
      }

      const keyContext: StorageKeyContext = {
        ...(input.keyContext ?? {}),
      };

      if (purpose.iam === "operator") {
        if (
          ctx.user.role !== "OPERATOR" &&
          ctx.user.role !== "ADMIN"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Operator access required.",
          });
        }
        const operator = await resolveOperator(ctx);
        requirePermission(
          {
            user: { id: ctx.user.id, role: ctx.user.role },
            operator: {
              role: operator.role,
              permissions: (operator.permissions as string[]) ?? [],
              status: operator.status,
              companyId: operator.companyId!,
            },
            companyId: operator.companyId!,
          },
          "company:update",
        );
        // During onboarding the company may not exist yet (COMPANY step runs
        // before the company row is created). Key under the operator id so the
        // upload still works; it gets re-keyed under the company from settings.
        keyContext.companyId = operator.companyId ?? `pending/${operator.id}`;
        if (purpose.id === "operator-profile-photo" && !keyContext.staffId) {
          keyContext.staffId = operator.id;
        }
      }

      if (purpose.iam === "passenger") {
        keyContext.userId = ctx.user.id;
      }

      try {
        return await createPresignedUpload({
          purpose: input.purpose,
          fileName: input.fileName,
          contentType: input.contentType,
          fileSize: input.fileSize,
          keyContext,
        });
      } catch (error) {
        if (error instanceof StorageError) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: error.message,
          });
        }
        throw error;
      }
    }),

  /**
   * Returns a short-lived, IAM-gated GET URL for a PRIVATE object (compliance
   * documents). Allowed for the owning operator (company:read) or an admin.
   */
  presignDownload: protectedProcedure
    .input(
      z.object({
        purpose: z.string().min(1),
        documentId: z.string().optional(),
        objectKey: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const purpose = getStoragePurpose(input.purpose);
      if (purpose.visibility !== "private") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Purpose "${purpose.id}" is not private.`,
        });
      }

      if (purpose.id === "operator-document") {
        const doc = await ctx.prisma.companyDocument.findFirst({
          where: {
            ...(input.documentId ? { id: input.documentId } : {}),
            ...(input.objectKey ? { objectKey: input.objectKey } : {}),
          },
        });
        if (!doc) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Document not found." });
        }

        const isAdmin = ctx.user.role === "ADMIN";
        let isOwner = false;
        if (ctx.user.role === "OPERATOR") {
          const operator = await resolveOperator(ctx);
          isOwner = operator.companyId === doc.companyId;
        }

        if (!isAdmin && !isOwner) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
        }
        if (!doc.objectKey) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Document has no stored object key.",
          });
        }

        return createPresignedDownload({
          purpose: input.purpose,
          objectKey: doc.objectKey,
        });
      }

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Unsupported private purpose.",
      });
    }),
});
