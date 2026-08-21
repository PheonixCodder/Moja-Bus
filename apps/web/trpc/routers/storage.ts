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
import { requirePermission, requireAnyPermission, type PermissionContext } from "@/lib/permissions/authorize";

type OperatorCtx = {
  prisma: { operator: { findFirst: (args: any) => Promise<any> } };
  user: { id: string };
};

async function resolveOperator(ctx: OperatorCtx) {
  const operator = await ctx.prisma.operator.findFirst({
    where: { userId: ctx.user.id, deletedAt: null },
    orderBy: { joinedAt: "desc" },
  });
  if (!operator) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Operator profile not found.",
    });
  }
  return operator as {
    id: string;
    role: string;
    permissions: unknown;
    status: string;
    companyId: string | null;
  };
}

function operatorPermissionContext(
  ctx: { user: { id: string; role: string } },
  operator: { role: string; permissions: unknown; status: string; companyId: string | null },
): PermissionContext {
  return {
    user: { id: ctx.user.id, role: ctx.user.role },
    operator: {
      role: operator.role,
      permissions: (operator.permissions as string[]) ?? [],
      status: operator.status,
      companyId: operator.companyId ?? "",
    },
    companyId: operator.companyId ?? "",
  };
}

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
          operatorPermissionContext(ctx, operator),
          "company:profile:update",
        );
        // During onboarding the company may not exist yet (COMPANY step runs
        // before the company row is created). Key under the operator id so the
        // upload still works; it gets re-keyed under the company from settings.
        keyContext.companyId = operator.companyId ?? `pending/${operator.id}`;
        // O15: never trust a client-supplied staffId for profile photos — the
        // caller's operator id is the only allowed owner of that key.
        if (purpose.id === "operator-profile-photo") {
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
         const isAdmin = ctx.user.role === "ADMIN";
         const caller = isAdmin ? undefined : await resolveOperator(ctx);
         const callerCompanyId = caller?.companyId ?? undefined;

         const doc = await ctx.prisma.companyDocument.findFirst({
           where: {
             ...(input.documentId ? { id: input.documentId } : {}),
             ...(input.objectKey ? { objectKey: input.objectKey } : {}),
             // Non-admin operators may only ever reach documents belonging to
             // their own company (prevents cross-company IDOR via documentId).
             ...(callerCompanyId ? { companyId: callerCompanyId } : {}),
           },
         });
         if (!doc) {
           throw new TRPCError({ code: "NOT_FOUND", message: "Document not found." });
         }

         requireAnyPermission(
           isAdmin
             ? {
                 user: { id: ctx.user.id, role: ctx.user.role },
                 operator: {
                   role: "OWNER",
                   permissions: [],
                   status: "ACTIVE",
                   companyId: doc.companyId,
                 },
                 companyId: doc.companyId,
               }
             : operatorPermissionContext(ctx, caller!),
           ["company:compliance:update", "company:view", "financials:view"],
         );

         // Defense-in-depth: even if the caller reaches here, the document must
         // belong to their company (non-admin) or an explicit admin target.
         if (!isAdmin && doc.companyId !== callerCompanyId) {
           throw new TRPCError({
             code: "FORBIDDEN",
             message: "Access denied: document does not belong to your company.",
           });
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
