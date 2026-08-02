import { z } from "zod";

export const routeStatusEnum = z.enum([
  "DRAFT",
  "ACTIVE",
  "SUSPENDED",
  "ARCHIVED",
]);
export type RouteStatus = z.infer<typeof routeStatusEnum>;

export const waypointSchema = z
  .object({
    terminalId: z.string().min(1, "Terminal is required"),
    stopOrder: z.coerce.number().int().min(0),
    distanceFromOriginKm: z.coerce.number().min(0).optional().nullable(),
    allowPickup: z.boolean().default(true),
    allowDropoff: z.boolean().default(true),
  })
  .superRefine((wp, ctx) => {
    if (!wp.allowPickup && !wp.allowDropoff) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A stop must allow pickup, dropoff, or both",
        path: ["allowPickup"],
      });
    }
  });
export type WaypointInput = z.infer<typeof waypointSchema>;

// ─── Shared waypoint cross-field checks ────────────────────────────────────
// Used by both create and update schemas so the logic lives in one place.
function validateWaypointSequence(
  waypoints: WaypointInput[],
  originTerminalId: string | undefined,
  destTerminalId: string | undefined,
  ctx: z.RefinementCtx,
) {
  if (waypoints.length === 0) return;

  const seen = new Set<string>();
  for (let i = 0; i < waypoints.length; i++) {
    const wp = waypoints[i]!;

    // No waypoint may duplicate another waypoint's terminal
    if (seen.has(wp.terminalId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each stop must be a unique terminal",
        path: ["waypoints", i, "terminalId"],
      });
    }
    seen.add(wp.terminalId);

    // No waypoint may match the origin terminal
    if (originTerminalId && wp.terminalId === originTerminalId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A stop cannot be the same terminal as the origin",
        path: ["waypoints", i, "terminalId"],
      });
    }

    // No waypoint may match the destination terminal
    if (destTerminalId && wp.terminalId === destTerminalId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A stop cannot be the same terminal as the destination",
        path: ["waypoints", i, "terminalId"],
      });
    }
  }

  // Waypoint distance validation: distanceFromOriginKm must be strictly increasing across stops
  const sorted = [...waypoints].sort((a, b) => a.stopOrder - b.stopOrder);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const curr = sorted[i]!;
    if (
      prev.distanceFromOriginKm != null &&
      curr.distanceFromOriginKm != null &&
      curr.distanceFromOriginKm <= prev.distanceFromOriginKm
    ) {
      const origIdx = waypoints.findIndex(
        (w) => w.terminalId === curr.terminalId && w.stopOrder === curr.stopOrder,
      );
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          `Stop distance (${curr.distanceFromOriginKm} km) must be greater than ` +
          `the previous stop's distance (${prev.distanceFromOriginKm} km).`,
        path: ["waypoints", origIdx >= 0 ? origIdx : i, "distanceFromOriginKm"],
      });
    }
  }
}

export const createRouteSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Route name must be at least 3 characters")
      .max(120, "Route name must be 120 characters or fewer"),
    originTerminalId: z.string().min(1, "Origin terminal is required"),
    destTerminalId: z.string().min(1, "Destination terminal is required"),
    distanceKm: z.coerce.number().min(0).optional().nullable(),
    status: routeStatusEnum.default("ACTIVE"),
    waypoints: z.array(waypointSchema).max(50, "Maximum of 50 stops allowed").default([]),
  })
  .superRefine((data, ctx) => {
    // Origin and destination must differ
    if (data.originTerminalId === data.destTerminalId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Origin and destination terminals must be different",
        path: ["destTerminalId"],
      });
    }

    validateWaypointSequence(
      data.waypoints,
      data.originTerminalId,
      data.destTerminalId,
      ctx,
    );

    // Validate that no waypoint distance exceeds route total distance
    if (data.distanceKm != null && data.distanceKm > 0) {
      for (let i = 0; i < data.waypoints.length; i++) {
        const wp = data.waypoints[i]!;
        if (
          wp.distanceFromOriginKm != null &&
          wp.distanceFromOriginKm > data.distanceKm
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              `Stop distance (${wp.distanceFromOriginKm} km) cannot exceed total route distance (${data.distanceKm} km).`,
            path: ["waypoints", i, "distanceFromOriginKm"],
          });
        }
      }
    }
  });
export type CreateRouteInput = z.infer<typeof createRouteSchema>;

export const updateRouteSchema = z
  .object({
    name: z.string().trim().min(3).max(120).optional(),
    originTerminalId: z.string().min(1).optional(),
    destTerminalId: z.string().min(1).optional(),
    distanceKm: z.coerce.number().min(0).optional().nullable(),
    status: routeStatusEnum.optional(),
    waypoints: z.array(waypointSchema).max(50).optional(),
  })
  .superRefine((data, ctx) => {
    // Origin and destination conflict (only if both are being updated)
    if (
      data.originTerminalId &&
      data.destTerminalId &&
      data.originTerminalId === data.destTerminalId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Origin and destination terminals must be different",
        path: ["destTerminalId"],
      });
    }

    // Run waypoint sequence checks when waypoints are included in the update
    if (data.waypoints && data.waypoints.length > 0) {
      validateWaypointSequence(
        data.waypoints,
        data.originTerminalId,
        data.destTerminalId,
        ctx,
      );
    }
  });
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;

const baseTerminalSchema = z.object({
  name: z.string().trim().min(1, "Terminal name is required"),
  addressLine1: z.string().trim().min(1, "Address is required"),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().default("Cote d'Ivoire"),
  cityId: z.string().optional().nullable(),
  municipalityId: z.string().optional().nullable(),
  quarterId: z.string().optional().nullable(),
  latitude: z.coerce
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional()
    .nullable(),
  longitude: z.coerce
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional()
    .nullable(),
  phone: z.string().min(1, "Phone is required"),
  managerName: z.string().optional().nullable(),
  managerPhone: z.string().optional().nullable(),
  managerEmail: z
    .string()
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: "Invalid manager email address",
    })
    .optional()
    .nullable(),
  isPrimary: z.boolean().default(false),
  isTerminal: z.boolean().default(false),
  isActive: z.boolean().default(true),
  operatingHours: z.any().optional().nullable(),
});

export const createTerminalSchema = baseTerminalSchema.superRefine((data, ctx) => {
  if (data.isTerminal) {
    if (data.latitude == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Latitude is required for passenger terminals",
        path: ["latitude"],
      });
    }
    if (data.longitude == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Longitude is required for passenger terminals",
        path: ["longitude"],
      });
    }
    if (!data.cityId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "City is required for passenger terminals",
        path: ["cityId"],
      });
    }
  }
});
export type CreateTerminalInput = z.infer<typeof createTerminalSchema>;

export const updateTerminalSchema = baseTerminalSchema.partial();
export type UpdateTerminalInput = z.infer<typeof updateTerminalSchema>;
