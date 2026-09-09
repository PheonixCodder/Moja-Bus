/**
 * Booth App — Zod Input/Output Schemas (Phase B2)
 *
 * All tRPC procedure inputs for the booth.* router are validated here.
 * Exported from @moja/schemas so the booth app's tRPC client gets full
 * type inference without importing from apps/web directly.
 */
import { z } from "zod";

// ─── Terminal & Trips ──────────────────────────────────────────────────────

export const getTodayTripsSchema = z.object({
  /** CompanyLocation.id with isTerminal: true — the booth's origin terminal */
  terminalId: z.string().cuid(),
  /** "YYYY-MM-DD" in Africa/Abidjan timezone */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
});

export const getTripSeatMapSchema = z.object({
  tripId: z.string().cuid(),
});

// ─── Hold Pool (Offline Intercity) ────────────────────────────────────────

export const preAcquireHoldsSchema = z.object({
  tripId: z.string().cuid(),
  terminalId: z.string().cuid(),
  /** How many real DB holds to pre-acquire. Default 5, max 10. */
  count: z.number().int().min(1).max(10).default(5),
});

export const releaseHoldsSchema = z.object({
  holdIds: z.array(z.string().cuid()).min(1).max(20),
});

// ─── Passenger ────────────────────────────────────────────────────────────

export const lookupOrCreatePassengerSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(100),
  /** Optional — E.164 format if provided */
  phone: z.string().optional(),
});

// ─── Cash Sale ────────────────────────────────────────────────────────────

export const createCashSaleSchema = z.object({
  tripId: z.string().cuid(),
  /** Origin terminal (CompanyLocation.id) */
  terminalId: z.string().cuid(),
  /** Destination terminal (CompanyLocation.id) */
  destinationTerminalId: z.string().cuid(),

  /**
   * Intercity: one or more specific seat IDs the passenger will occupy.
   * Urban: omit seatIds and provide passengerCount instead.
   */
  seatIds: z.array(z.string().cuid()).min(1).optional(),
  /** Urban trips only — number of passengers when no specific seats apply */
  passengerCount: z.number().int().min(1).max(10).optional(),

  /**
   * Offline intercity only — the pre-acquired pool hold ID to consume.
   * When provided the hold is used as-is (validated server-side).
   * When absent a fresh hold is created inside the transaction.
   */
  holdId: z.string().cuid().optional(),

  passengerId: z.string(),
  passengerName: z.string().min(2).max(100),
  passengerEmail: z.string().email(),
  passengerPhone: z.string().optional(),

  /** XOF banknotes physically collected from the passenger */
  cashAmountXOF: z.number().int().positive(),

  wasOffline: z.boolean().default(false),
  walkedUpPassenger: z.boolean().default(false),
  passengerAccountCreated: z.boolean().default(false),

  couponCode: z.string().optional(),
});

// ─── Paystack QR Link ──────────────────────────────────────────────────────

export const initiatePaystackLinkSchema = z.object({
  tripId: z.string().cuid(),
  terminalId: z.string().cuid(),
  destinationTerminalId: z.string().cuid(),
  seatIds: z.array(z.string().cuid()).min(1).optional(),
  passengerCount: z.number().int().min(1).max(10).optional(),
  passengerId: z.string(),
  passengerEmail: z.string().email(),
  passengerName: z.string().min(2).max(100),
  passengerPhone: z.string().optional(),
  walkedUpPassenger: z.boolean().default(false),
  passengerAccountCreated: z.boolean().default(false),
  couponCode: z.string().optional(),
  /** Fare amount shown to the passenger — used for UI display only; server re-computes from DB */
  quotedAmountXOF: z.number().int().positive(),
});

export const pollPaymentStatusSchema = z.object({
  paystackReference: z.string().min(1),
});

export const confirmPaystackSaleSchema = z.object({
  holdGroupId: z.string().cuid(),
  paystackReference: z.string().min(1),
  terminalId: z.string().cuid(),
  walkedUpPassenger: z.boolean().default(false),
  passengerAccountCreated: z.boolean().default(false),
  passengerId: z.string(),
  passengerEmail: z.string().email(),
  passengerName: z.string().min(2).max(100),
});

export const cancelPendingHoldSchema = z.object({
  holdGroupId: z.string().cuid(),
});

// ─── Check-In ─────────────────────────────────────────────────────────────

export const boothCheckInSchema = z.object({
  /** JWT ticket token from the passenger's QR code */
  ticketToken: z.string().min(1),
  terminalId: z.string().cuid(),
});

// ─── Bookings List ────────────────────────────────────────────────────────

export const getTerminalBookingsSchema = z.object({
  terminalId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  paymentMethod: z.enum(["CASH", "PAYSTACK_LINK", "ALL"]).default("ALL"),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
});

// ─── Daily Reconciliation ─────────────────────────────────────────────────

export const getDailyReconciliationSchema = z.object({
  terminalId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  /** Filter by staff member — omit for full terminal reconciliation */
  staffId: z.string().cuid().optional(),
});

// ─── Urban Conflict Report ────────────────────────────────────────────────

export const reportUrbanConflictSchema = z.object({
  tripId: z.string().cuid(),
  boothSaleIds: z.array(z.string().cuid()).min(1),
  excessCount: z.number().int().positive(),
});
