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

// ── Custom Layout Builder ────────────────────────────────────────────────────

export const seatCellSchema = z.object({
  row: z.number().int().min(1),
  col: z.number().int().min(1),
  deck: z.number().int().default(1),
  label: z.string(),
  seatType: seatTypeEnum,
  isBookable: z.boolean(),
});
export type SeatCell = z.infer<typeof seatCellSchema>;

export const createCustomLayoutSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must be at most 60 characters"),
  busTypeId: z.string().min(1, "Bus type is required"),
  rows: z.number().int().min(2, "Minimum 2 rows").max(20, "Maximum 20 rows"),
  columns: z
    .number()
    .int()
    .min(2, "Minimum 2 columns")
    .max(6, "Maximum 6 columns"),
  hasAC: z.boolean().default(false),
  hasWifi: z.boolean().default(false),
  hasToilet: z.boolean().default(false),
  hasLuggage: z.boolean().default(true),
  seats: z.array(seatCellSchema),
});
export type CreateCustomLayoutInput = z.infer<typeof createCustomLayoutSchema>;
