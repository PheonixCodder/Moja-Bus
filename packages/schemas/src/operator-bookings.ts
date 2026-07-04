import { z } from "zod";

export const operatorListBookingsSchema = z.object({
  filter: z.enum(["today", "upcoming", "past"]).optional().default("today"),
  tripId: z.string().optional(),
  status: z
    .enum([
      "PENDING_PAYMENT",
      "CONFIRMED",
      "CANCELLED",
      "EXPIRED",
      "COMPLETED",
    ])
    .optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

export const operatorGetBookingSchema = z.object({
  bookingId: z.string().min(1),
});

export const operatorCheckInBookingSchema = z
  .object({
    bookingId: z.string().optional(),
    ticketToken: z.string().optional(),
    tripId: z.string().optional(),
  })
  .refine((data) => data.bookingId || data.ticketToken, {
    message: "bookingId or ticketToken is required",
  });

export type OperatorListBookingsInput = z.infer<
  typeof operatorListBookingsSchema
>;
export type OperatorGetBookingInput = z.infer<typeof operatorGetBookingSchema>;
export type OperatorCheckInBookingInput = z.infer<
  typeof operatorCheckInBookingSchema
>;
