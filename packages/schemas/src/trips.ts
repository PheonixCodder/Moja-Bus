import { z } from "zod";

export const tripStatusEnum = z.enum([
  "SCHEDULED",
  "BOARDING",
  "DEPARTED",
  "ARRIVED",
  "CANCELLED",
  "DELAYED",
]);
export type TripStatus = z.infer<typeof tripStatusEnum>;

export const assignBusDriverSchema = z.object({
  busId: z.string().min(1, "Bus is required"),
});
export type AssignBusDriverInput = z.infer<typeof assignBusDriverSchema>;

export const delayTripSchema = z.object({
  delayMinutes: z.coerce.number().int().min(0, "Delay must be positive"),
  notes: z.string().optional().nullable(),
});
export type DelayTripInput = z.infer<typeof delayTripSchema>;

export const cancelTripSchema = z.object({
  cancelReason: z.string().min(1, "Reason is required"),
});
export type CancelTripInput = z.infer<typeof cancelTripSchema>;
