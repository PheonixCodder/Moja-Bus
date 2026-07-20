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

export const assignBusSchema = z.object({
  busId: z.string().min(1, "Bus is required"),
});
/** @deprecated Use assignBusSchema */
export const assignBusDriverSchema = assignBusSchema;
export type AssignBusInput = z.infer<typeof assignBusSchema>;
export type AssignBusDriverInput = AssignBusInput;

export const delayTripSchema = z.object({
  delayMinutes: z.coerce.number().int().min(1, "Delay must be positive"),
  notes: z.string().optional().nullable(),
});
export type DelayTripInput = z.infer<typeof delayTripSchema>;

export const cancelTripSchema = z.object({
  cancelReason: z.string().min(1, "Reason is required"),
});
export type CancelTripInput = z.infer<typeof cancelTripSchema>;
