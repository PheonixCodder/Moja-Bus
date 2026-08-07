import { z } from "zod";
import { createCaptureService } from "@/features/capture/services/capture-service";
import { requireAnyPermission } from "@/lib/permissions/authorize";
import {
  createTRPCRouter,
  operatorCompanyProcedure,
  publicProcedure,
} from "../init";

const tokenSchema = z.object({ token: z.string().min(1) });

const captureIdSchema = z.object({ captureId: z.string().min(1) });

const submitSchema = z.object({
  token: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().int().min(0),
  submitterName: z.string().trim().max(200).optional(),
  submitterPhone: z.string().trim().max(30).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const capturesRouter = createTRPCRouter({
  /**
   * OPERATOR — mint a shareable capture link for a terminal.
   * `terminals:update`. Idempotent: re-generating returns the live attempt's URL.
   */
  createCapture: operatorCompanyProcedure
    .input(z.object({ terminalId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      requireAnyPermission(ctx, ["terminals:update", "terminals:geocapture"]);
      const service = createCaptureService(ctx.prisma);
      return service.createCapture({ terminalId: input.terminalId });
    }),

  /**
   * PUBLIC — display-safe terminal info for the share page.
   */
  getInfo: publicProcedure.input(tokenSchema).query(async ({ ctx, input }) => {
    const service = createCaptureService(ctx.prisma);
    return service.getInfo({ token: input.token });
  }),

  /**
   * PUBLIC — submit GPS coordinates + accuracy. Accuracy > 150m is rejected.
   */
  submit: publicProcedure
    .input(submitSchema)
    .mutation(async ({ ctx, input }) => {
      const forwarded = ctx.headers.get("x-forwarded-for");
      const ip =
        forwarded?.split(",")[0]?.trim() ||
        ctx.headers.get("x-real-ip") ||
        null;
      const userAgent = ctx.headers.get("user-agent");
      const service = createCaptureService(ctx.prisma);
      return service.submit({
        token: input.token,
        latitude: input.latitude,
        longitude: input.longitude,
        accuracyMeters: input.accuracyMeters,
        submitterName: input.submitterName,
        submitterPhone: input.submitterPhone,
        notes: input.notes,
        ip,
        userAgent,
      });
    }),

  /**
   * PUBLIC — submitter confirms the resolved preview (final "yes, correct").
   */
  confirm: publicProcedure
    .input(tokenSchema)
    .mutation(async ({ ctx, input }) => {
      const service = createCaptureService(ctx.prisma);
      return service.confirm({ token: input.token });
    }),

  /**
   * OPERATOR — approve a confirmed capture: terminal becomes COMPLETE + geo-linked.
   */
  approveCapture: operatorCompanyProcedure
    .input(captureIdSchema)
    .mutation(async ({ ctx, input }) => {
      requireAnyPermission(ctx, ["terminals:update", "terminals:geocapture"]);
      const service = createCaptureService(ctx.prisma);
      return service.approveCapture({
        companyId: ctx.companyId,
        userId: ctx.user.id,
        captureId: input.captureId,
      });
    }),

  /**
   * OPERATOR — reject a capture: attempt REJECTED, terminal back to PENDING_CAPTURE.
   */
  rejectCapture: operatorCompanyProcedure
    .input(captureIdSchema)
    .mutation(async ({ ctx, input }) => {
      requireAnyPermission(ctx, ["terminals:update", "terminals:geocapture"]);
      const service = createCaptureService(ctx.prisma);
      return service.rejectCapture({
        companyId: ctx.companyId,
        userId: ctx.user.id,
        captureId: input.captureId,
      });
    }),
});
