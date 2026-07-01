import { z } from "zod";

export const busStatusEnum = z.enum([
  "ACTIVE",
  "INACTIVE",
  "MAINTENANCE",
  "RETIRED",
]);
export type BusStatus = z.infer<typeof busStatusEnum>;

export const seatTypeEnum = z.enum([
  "PASSENGER_WINDOW",
  "PASSENGER_AISLE",
  "PASSENGER_MIDDLE",
  "DRIVER_AREA",
  "EMPTY_SPACE",
]);
export type SeatType = z.infer<typeof seatTypeEnum>;

export const createBusSchema = z.object({
  registrationPlate: z
    .string()
    .min(3, "Plate number must be at least 3 characters")
    .regex(/^[A-Z0-9 -]+$/i, "Invalid plate number format"),
  internalName: z.string().optional().nullable(),
  manufactureYear: z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional()
    .nullable(),
  status: busStatusEnum.default("ACTIVE"),
  notes: z.string().optional().nullable(),
  layoutTemplateId: z.string().min(1, "Layout template is required"),
  busTypeId: z.string().min(1, "Bus type is required"),
});
export type CreateBusInput = z.infer<typeof createBusSchema>;

export const updateBusSchema = createBusSchema.partial();
export type UpdateBusInput = z.infer<typeof updateBusSchema>;
