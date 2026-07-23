import { z } from "zod";

export const recurrenceTypeEnum = z.enum([
  "DAILY",
  "WEEKDAYS",
  "WEEKENDS",
  "CUSTOM",
]);
export type RecurrenceType = z.infer<typeof recurrenceTypeEnum>;

/** Expand recurrence presets into weekday booleans (not stored on Schedule). */
export function weekdaysFromRecurrence(
  type: RecurrenceType,
): Record<
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday",
  boolean
> {
  const allFalse = {
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
  };
  if (type === "DAILY") {
    return {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
    };
  }
  if (type === "WEEKDAYS") {
    return { ...allFalse, monday: true, tuesday: true, wednesday: true, thursday: true, friday: true };
  }
  if (type === "WEEKENDS") {
    return { ...allFalse, saturday: true, sunday: true };
  }
  return allFalse;
}

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

const hhMm = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):([0-5]\d)$/,
    "Time must be in HH:mm format",
  );

export const serviceCalendarSchema = z
  .object({
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
  })
  .superRefine((data, ctx) => {
    const hasDay =
      data.monday ||
      data.tuesday ||
      data.wednesday ||
      data.thursday ||
      data.friday ||
      data.saturday ||
      data.sunday;
    if (!hasDay) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select at least one operating day",
        path: ["monday"],
      });
    }
    if (
      data.validUntil &&
      data.validFrom &&
      new Date(data.validUntil) < new Date(data.validFrom)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Valid until must be on or after valid from",
        path: ["validUntil"],
      });
    }
  });
export type ServiceCalendarInput = z.infer<typeof serviceCalendarSchema>;

export const exceptionSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    type: exceptionTypeEnum,
    reason: exceptionReasonEnum.default("OPERATIONAL"),
    notes: z.string().optional().nullable(),
    overrideDepartureTime: hhMm.optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "MODIFIED" && !data.overrideDepartureTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Modified exceptions require an override departure time",
        path: ["overrideDepartureTime"],
      });
    }
  });
export type ExceptionInput = z.infer<typeof exceptionSchema>;

export const fareSchema = z.object({
  type: fareTypeEnum.default("FIXED"),
  seatClass: seatClassEnum,
  fromStopOrder: z.coerce.number().int().min(0).default(0),
  toStopOrder: z.coerce.number().int().min(1),
  priceXOF: z.coerce.number().int().min(1, "Price must be at least 1 XOF"),
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

export const createScheduleSchema = z
  .object({
    name: z.string().optional().nullable(),
    routeId: z.string().min(1, "Route is required"),
    /** @deprecated use preferredBusId — kept as alias for callers */
    defaultBusId: z.string().optional(),
    preferredBusId: z.string().optional(),
    departureTime: hhMm,
    calendar: serviceCalendarSchema,
    fares: z.array(fareSchema).min(1, "At least one fare is required"),
    /** Last stop order on the route (destination). Used to require full-route fare. */
    routeLastStopOrder: z.coerce.number().int().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    const busId = data.preferredBusId || data.defaultBusId;
    if (!busId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Preferred bus is required for trip pre-assignment",
        path: ["preferredBusId"],
      });
    }
    const last = data.routeLastStopOrder;
    if (last !== undefined) {
      const fullRouteFares = data.fares.filter(
        (f) => f.fromStopOrder === 0 && f.toStopOrder === last && f.priceXOF > 0,
      );
      if (fullRouteFares.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "At least one fare covering origin to destination is required",
          path: ["fares"],
        });
      } else {
        // Guard: Sub-segment fares should not cost more than the full route fare of the same class & type
        for (let i = 0; i < data.fares.length; i++) {
          const fare = data.fares[i]!;
          const isFullRoute =
            fare.fromStopOrder === 0 && fare.toStopOrder === last;
          if (!isFullRoute) {
            const matchingFullFare = fullRouteFares.find(
              (ff) => ff.seatClass === fare.seatClass && ff.type === fare.type,
            );
            if (matchingFullFare && fare.priceXOF > matchingFullFare.priceXOF) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                  `Sub-segment fare (${fare.priceXOF} XOF) cannot exceed full route fare (${matchingFullFare.priceXOF} XOF) for ${fare.seatClass} ${fare.type}`,
                path: ["fares", i, "priceXOF"],
              });
            }
          }
        }
      }
    }
  })
  .transform((data) => ({
    ...data,
    preferredBusId: (data.preferredBusId || data.defaultBusId) as string,
  }));
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;

export const updateScheduleBasicSchema = z.object({
  name: z.string().optional().nullable(),
  departureTime: hhMm.optional(),
  isActive: z.boolean().optional(),
  preferredBusId: z.string().min(1).optional().nullable(),
});
export type UpdateScheduleBasicInput = z.infer<
  typeof updateScheduleBasicSchema
>;

export const updateCalendarSchema = z
  .object({
    monday: z.boolean().optional(),
    tuesday: z.boolean().optional(),
    wednesday: z.boolean().optional(),
    thursday: z.boolean().optional(),
    friday: z.boolean().optional(),
    saturday: z.boolean().optional(),
    sunday: z.boolean().optional(),
    validFrom: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid date format"),
    validUntil: z
      .string()
      .optional()
      .nullable()
      .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid date format"),
  })
  .superRefine((data, ctx) => {
    const DAY_KEYS = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ] as const;

    // Collect only the day keys that are explicitly provided in this patch
    const providedDays = DAY_KEYS.filter((k) => data[k] !== undefined);

    // Guard: if the caller is explicitly setting ALL 7 days and every one is false, reject.
    // For partial patches (< 7 days provided) we cannot know the full stored state from the
    // schema alone — that check must happen in the tRPC router after merging with DB values.
    if (
      providedDays.length === 7 &&
      providedDays.every((k) => data[k] === false)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select at least one operating day",
        path: ["monday"],
      });
    }

    // validUntil must not be before validFrom
    if (
      data.validUntil &&
      data.validFrom &&
      new Date(data.validUntil) < new Date(data.validFrom)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Valid until must be on or after valid from",
        path: ["validUntil"],
      });
    }
  });
export type UpdateCalendarInput = z.infer<typeof updateCalendarSchema>;

export const updateFareSchema = z.object({
  priceXOF: z.coerce
    .number()
    .int()
    .min(1, "Price must be at least 1 XOF")
    .optional(),
  type: fareTypeEnum.optional(),
  seatClass: seatClassEnum.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateFareInput = z.infer<typeof updateFareSchema>;

export const addFareSchema = fareSchema;
export type AddFareInput = z.infer<typeof addFareSchema>;

export const listSchedulesSchema = z.object({
  q: z.string().optional(),
  routeId: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
  sort: z
    .enum(["departureTime_asc", "departureTime_desc", "name_asc", "updated_desc"])
    .default("departureTime_asc"),
});
export type ListSchedulesInput = z.infer<typeof listSchedulesSchema>;
