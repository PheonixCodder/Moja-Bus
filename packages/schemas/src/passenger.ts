import { z } from "zod";
import { passengerDraftSchema } from "./booking";

export const seatPassengerInputSchema = z
  .object({
    seatId: z.string().min(1),
    savedPassengerId: z.string().min(1).optional(),
    passenger: passengerDraftSchema.optional(),
  })
  .refine(
    (data) => data.savedPassengerId || data.passenger,
    { message: "Provide savedPassengerId or passenger details for each seat" },
  );

export const createSavedPassengerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(6, "Phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  label: z.string().max(50).optional(),
  dateOfBirth: z.coerce.date().optional(),
  idType: z.enum(["national_id", "passport", "driver_license"]).optional(),
  idNumber: z.string().max(50).optional(),
});

export const updateSavedPassengerSchema = createSavedPassengerSchema
  .partial()
  .extend({
    id: z.string().min(1),
  });

export const deleteSavedPassengerSchema = z.object({
  id: z.string().min(1),
});

export type PassengerDraft = z.infer<typeof passengerDraftSchema>;
export type SeatPassengerInput = z.infer<typeof seatPassengerInputSchema>;
export type CreateSavedPassengerInput = z.infer<typeof createSavedPassengerSchema>;
export type UpdateSavedPassengerInput = z.infer<typeof updateSavedPassengerSchema>;
