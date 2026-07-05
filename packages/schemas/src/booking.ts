import { z } from "zod";

export const offerIdSchema = z.string().min(1);

export const getTripDetailsSchema = z.object({
  offerId: offerIdSchema,
});

export const getSeatAvailabilitySchema = z.object({
  offerId: offerIdSchema,
});

export const passengerDraftSchema = z.object({
  passengerName: z.string().min(2, "Passenger name is required"),
  passengerPhone: z.string().min(6, "Phone number is required"),
});

export const createHoldSchema = z.object({
  offerId: offerIdSchema,
  passengers: z.array(
    z
      .object({
        seatId: z.string().min(1),
        savedPassengerId: z.string().min(1).optional(),
        passenger: passengerDraftSchema.optional(),
      })
      .refine((data) => data.savedPassengerId || data.passenger, {
        message: "Provide savedPassengerId or passenger details for each seat",
      }),
  ).min(1).max(6),
});

export const confirmBookingSchema = z.object({
  holdId: z.string().min(1),
});

export const releaseHoldSchema = z.object({
  holdId: z.string().min(1),
});

export const listMyBookingsSchema = z.object({
  filter: z
    .enum(["upcoming", "past", "pending"])
    .optional()
    .default("upcoming"),
  limit: z.number().int().min(1).max(50).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export const getBookingSchema = z.object({
  bookingReference: z.string().min(1),
});

export const getTicketSchema = z.object({
  bookingReference: z.string().optional(),
  ticketToken: z.string().optional(),
}).refine((data) => data.bookingReference || data.ticketToken, {
  message: "bookingReference or ticketToken is required",
});

export const getTicketByTokenSchema = z.object({
  ticketToken: z.string().min(1),
});

export const initiatePaymentSchema = z.object({
  holdId: z.string().min(1),
  provider: z
    .enum([
      "MOCK",
      "PAYSTACK",
      "WAVE",
      "ORANGE_MONEY",
      "MTN_MOMO",
      "CINETPAY",
      "CARD",
    ])
    .default("PAYSTACK"),
  payerEmail: z.string().email().optional(),
});

export const verifyPaymentSchema = z.object({
  reference: z.string().min(1),
});

export type GetTripDetailsInput = z.infer<typeof getTripDetailsSchema>;
export type GetSeatAvailabilityInput = z.infer<typeof getSeatAvailabilitySchema>;
export type CreateHoldInput = z.infer<typeof createHoldSchema>;
export type ConfirmBookingInput = z.infer<typeof confirmBookingSchema>;
export type ReleaseHoldInput = z.infer<typeof releaseHoldSchema>;
export type ListMyBookingsInput = z.infer<typeof listMyBookingsSchema>;
export type GetBookingInput = z.infer<typeof getBookingSchema>;
export type GetTicketInput = z.infer<typeof getTicketSchema>;
export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
