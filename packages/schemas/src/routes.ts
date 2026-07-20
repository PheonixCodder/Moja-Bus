import { z } from "zod";

export const routeStatusEnum = z.enum([
  "DRAFT",
  "ACTIVE",
  "SUSPENDED",
  "ARCHIVED",
]);
export type RouteStatus = z.infer<typeof routeStatusEnum>;

export const waypointSchema = z.object({
  terminalId: z.string().min(1, "Terminal is required"),
  stopOrder: z.coerce.number().int().min(0),
  offsetMinutes: z.coerce.number().int().min(1, "Intermediate stop must be at least 1 minute from origin"),
  dwellMinutes: z.coerce.number().int().min(0).default(15),
  distanceFromOriginKm: z.coerce.number().min(0).optional().nullable(),
  allowPickup: z.boolean().default(true),
  allowDropoff: z.boolean().default(true),
});
export type WaypointInput = z.infer<typeof waypointSchema>;

export const createRouteSchema = z
  .object({
    name: z.string().min(3, "Route name must be at least 3 characters").max(120, "Route name must be 120 characters or fewer"),
    originTerminalId: z.string().min(1, "Origin terminal is required"),
    destTerminalId: z.string().min(1, "Destination terminal is required"),
    distanceKm: z.coerce.number().min(0).optional().nullable(),
    estimatedDurationMin: z.coerce.number().int().min(1).optional().nullable(),
    status: routeStatusEnum.default("ACTIVE"),
    waypoints: z.array(waypointSchema).max(50, "Maximum of 50 stops allowed").default([]),
  })
  .refine(
    (data) => data.originTerminalId !== data.destTerminalId,
    { message: "Origin and destination terminals must be different", path: ["destTerminalId"] },
  );
export type CreateRouteInput = z.infer<typeof createRouteSchema>;

export const updateRouteSchema = z
  .object({
    name: z.string().min(3).max(120).optional(),
    originTerminalId: z.string().min(1).optional(),
    destTerminalId: z.string().min(1).optional(),
    distanceKm: z.coerce.number().min(0).optional().nullable(),
    estimatedDurationMin: z.coerce.number().int().min(1).optional().nullable(),
    status: routeStatusEnum.optional(),
    waypoints: z.array(waypointSchema).max(50).optional(),
  })
  .refine(
    (data) =>
      !data.originTerminalId ||
      !data.destTerminalId ||
      data.originTerminalId !== data.destTerminalId,
    { message: "Origin and destination terminals must be different", path: ["destTerminalId"] },
  );
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;

export const createTerminalSchema = z.object({
  name: z.string().min(1, "Terminal name is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().default("Cote d'Ivoire"),
  cityId: z.string().optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  phone: z.string().min(1, "Phone is required"),
  managerName: z.string().optional().nullable(),
  managerPhone: z.string().optional().nullable(),
  managerEmail: z.string().optional().nullable(),
  isPrimary: z.boolean().default(false),
  isTerminal: z.boolean().default(false),
  isActive: z.boolean().default(true),
  operatingHours: z.any().optional().nullable(),
});
export type CreateTerminalInput = z.infer<typeof createTerminalSchema>;

export const updateTerminalSchema = createTerminalSchema.partial();
export type UpdateTerminalInput = z.infer<typeof updateTerminalSchema>;
