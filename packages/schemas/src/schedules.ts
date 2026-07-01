import { z } from "zod";

export const recurrenceTypeEnum = z.enum([
  "DAILY",
  "WEEKDAYS",
  "WEEKENDS",
  "CUSTOM",
]);
export type RecurrenceType = z.infer<typeof recurrenceTypeEnum>;

export const exceptionTypeEnum = z.enum([
  "CANCELLED",
  "EXTRA_SERVICE",
  "MODIFIED",
]);
export type ExceptionType = z.infer<typeof exceptionTypeEnum>;

export const exceptionReasonEnum = z.enum([
  "HOLIDAY_ISLAMIC",
  "HOLIDAY_CHRISTIAN",
  "HOLIDAY_NATIONAL",
  "STRIKE",
  "WEATHER",
  "MAINTENANCE",
  "OPERATIONAL",
  "OTHER",
]);
export type ExceptionReason = z.infer<typeof exceptionReasonEnum>;

export const fareTypeEnum = z.enum([
  "FIXED",
  "PROMO",
  "HOLIDAY_SURGE",
  "EARLY_BIRD",
]);
export type FareType = z.infer<typeof fareTypeEnum>;

export const seatClassEnum = z.enum(["ECONOMY", "STANDARD", "VIP"]);
export type SeatClass = z.infer<typeof seatClassEnum>;

export const serviceCalendarSchema = z.object({
  monday: z.boolean().default(false),
  tuesday: z.boolean().default(false),
  wednesday: z.boolean().default(false),
  thursday: z.boolean().default(false),
  friday: z.boolean().default(false),
  saturday: z.boolean().default(false),
  sunday: z.boolean().default(false),
  validFrom: z
    .string()
    .min(1, "Valid from date is required")
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
  validUntil: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid date format"),
});
export type ServiceCalendarInput = z.infer<typeof serviceCalendarSchema>;

export const exceptionSchema = z.object({
  date: z
    .string()
    .min(1)
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
  type: exceptionTypeEnum,
  reason: exceptionReasonEnum.default("OPERATIONAL"),
  notes: z.string().optional().nullable(),
});
export type ExceptionInput = z.infer<typeof exceptionSchema>;

export const fareSchema = z.object({
  type: fareTypeEnum.default("FIXED"),
  seatClass: seatClassEnum,
  fromStopOrder: z.coerce.number().int().min(0).default(0),
  toStopOrder: z.coerce.number().int().min(1),
  priceXOF: z.coerce.number().int().min(0, "Price cannot be negative"),
  validFrom: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid date format"),
  validUntil: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid date format"),
});
export type FareInput = z.infer<typeof fareSchema>;

export const createScheduleSchema = z.object({
  name: z.string().optional().nullable(),
  routeId: z.string().min(1, "Route is required"),
  defaultBusId: z
    .string()
    .min(1, "Default bus is required for trip pre-assignment"),
  departureTime: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)$/,
      "Departure time must be in HH:mm format",
    ),
  calendar: serviceCalendarSchema,
  fares: z.array(fareSchema).min(1, "At least one fare is required"),
});
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;

export const updateScheduleSchema = createScheduleSchema.partial();
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;

export const updateScheduleBasicSchema = z.object({
  name: z.string().optional().nullable(),
  departureTime: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)$/,
      "Departure time must be in HH:mm format",
    )
    .optional(),
  isActive: z.boolean().optional(),
});
export type UpdateScheduleBasicInput = z.infer<
  typeof updateScheduleBasicSchema
>;

export const updateCalendarSchema = serviceCalendarSchema.partial();
export type UpdateCalendarInput = z.infer<typeof updateCalendarSchema>;

export const updateFareSchema = z.object({
  priceXOF: z.coerce
    .number()
    .int()
    .min(0, "Price cannot be negative")
    .optional(),
  type: fareTypeEnum.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateFareInput = z.infer<typeof updateFareSchema>;
