import { z } from "zod";

/**
 * PostHog Cloud EU Ingestion and Host Endpoints
 */
export const POSTHOG_EU_HOST = "https://eu.i.posthog.com";
export const POSTHOG_EU_ASSETS_HOST = "https://eu-assets.i.posthog.com";
export const POSTHOG_EU_UI_HOST = "https://eu.posthog.com";

/**
 * Recommended SDK Defaults date per PostHog reference
 */
export const POSTHOG_SDK_DEFAULTS = "2026-05-30";

/**
 * Web ingestion reverse proxy path
 */
export const POSTHOG_INGEST_PROXY_PATH = "/ingest";

// ============================================================================
// Event Schemas & Taxonomy
// ============================================================================

// 1. Passenger & Booking Funnel
export const TripSearchedEventSchema = z.object({
  origin_id: z.string().optional(),
  destination_id: z.string().optional(),
  origin_name: z.string().optional(),
  destination_name: z.string().optional(),
  departure_date: z.string().optional(),
  passenger_count: z.number().int().positive().default(1),
  source: z.enum(["web", "traveler-app"]).default("web"),
});
export type TripSearchedEvent = z.infer<typeof TripSearchedEventSchema>;

export const SearchResultsViewedEventSchema = z.object({
  results_count: z.number().int().nonnegative(),
  has_results: z.boolean(),
  origin_name: z.string().optional(),
  destination_name: z.string().optional(),
});
export type SearchResultsViewedEvent = z.infer<typeof SearchResultsViewedEventSchema>;

export const TripSelectedEventSchema = z.object({
  schedule_id: z.string(),
  operator_id: z.string().optional(),
  price: z.number().nonnegative(),
  departure_time: z.string().optional(),
});
export type TripSelectedEvent = z.infer<typeof TripSelectedEventSchema>;

export const SeatsSelectedEventSchema = z.object({
  schedule_id: z.string(),
  seat_numbers: z.array(z.string()),
  seat_count: z.number().int().positive(),
  total_amount: z.number().nonnegative(),
});
export type SeatsSelectedEvent = z.infer<typeof SeatsSelectedEventSchema>;

export const CheckoutStartedEventSchema = z.object({
  hold_id: z.string().optional(),
  schedule_id: z.string(),
  amount: z.number().nonnegative(),
  currency: z.string().default("XOF"),
  seat_count: z.number().int().positive(),
});
export type CheckoutStartedEvent = z.infer<typeof CheckoutStartedEventSchema>;

export const PaymentInitiatedEventSchema = z.object({
  booking_id: z.string().optional(),
  amount: z.number().nonnegative(),
  currency: z.string().default("XOF"),
  payment_method: z.string(),
  reference: z.string().optional(),
});
export type PaymentInitiatedEvent = z.infer<typeof PaymentInitiatedEventSchema>;

export const BookingCompletedEventSchema = z.object({
  booking_id: z.string(),
  ticket_count: z.number().int().positive(),
  total_amount: z.number().nonnegative(),
  currency: z.string().default("XOF"),
  operator_id: z.string().optional(),
  payment_method: z.string().optional(),
});
export type BookingCompletedEvent = z.infer<typeof BookingCompletedEventSchema>;

export const TicketViewedEventSchema = z.object({
  booking_id: z.string(),
  trip_id: z.string().optional(),
  is_offline: z.boolean().default(false),
});
export type TicketViewedEvent = z.infer<typeof TicketViewedEventSchema>;

// 2. Driver Funnel
export const DriverOnboardingStepCompletedEventSchema = z.object({
  step_name: z.string(),
  step_index: z.number().int().nonnegative(),
});
export type DriverOnboardingStepCompletedEvent = z.infer<typeof DriverOnboardingStepCompletedEventSchema>;

export const DriverLicenseUploadedEventSchema = z.object({
  document_type: z.string(),
  file_extension: z.string().optional(),
});
export type DriverLicenseUploadedEvent = z.infer<typeof DriverLicenseUploadedEventSchema>;

export const DriverOfferViewedEventSchema = z.object({
  offer_id: z.string(),
  route_name: z.string().optional(),
  compensation_amount: z.number().optional(),
});
export type DriverOfferViewedEvent = z.infer<typeof DriverOfferViewedEventSchema>;

export const DriverOfferRespondedEventSchema = z.object({
  offer_id: z.string(),
  trip_id: z.string().optional(),
  operator_id: z.string().optional(),
  action: z.enum(["accepted", "rejected", "countered"]),
  reason: z.string().optional(),
});
export type DriverOfferRespondedEvent = z.infer<typeof DriverOfferRespondedEventSchema>;

export const DriverTripStartedEventSchema = z.object({
  trip_id: z.string(),
  vehicle_id: z.string().optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
});
export type DriverTripStartedEvent = z.infer<typeof DriverTripStartedEventSchema>;

export const PassengerCheckedInEventSchema = z.object({
  ticket_id: z.string(),
  trip_id: z.string(),
  checkin_status: z.enum(["success", "invalid", "already_used"]),
});
export type PassengerCheckedInEvent = z.infer<typeof PassengerCheckedInEventSchema>;

export const DriverTripCompletedEventSchema = z.object({
  trip_id: z.string(),
  duration_minutes: z.number().optional(),
  passenger_count: z.number().int().nonnegative().optional(),
});
export type DriverTripCompletedEvent = z.infer<typeof DriverTripCompletedEventSchema>;

// 3. Booth / Terminal Funnel
export const TerminalSessionStartedEventSchema = z.object({
  terminal_id: z.string(),
  station_id: z.string().optional(),
  agent_id: z.string(),
});
export type TerminalSessionStartedEvent = z.infer<typeof TerminalSessionStartedEventSchema>;

export const CounterTicketIssuedEventSchema = z.object({
  booking_id: z.string(),
  payment_method: z.enum(["CASH", "POS", "MOBILE_MONEY"]),
  amount: z.number().nonnegative(),
  currency: z.string().default("XOF"),
  destination: z.string().optional(),
  seat_count: z.number().int().positive().default(1),
});
export type CounterTicketIssuedEvent = z.infer<typeof CounterTicketIssuedEventSchema>;

export const ShiftReconciledEventSchema = z.object({
  terminal_id: z.string().optional(),
  agent_id: z.string(),
  total_cash_collected: z.number().nonnegative(),
  total_pos_collected: z.number().nonnegative(),
  discrepancy_amount: z.number().default(0),
});
export type ShiftReconciledEvent = z.infer<typeof ShiftReconciledEventSchema>;

// 4. Operator Portal Funnel
export const OperatorRouteCreatedEventSchema = z.object({
  route_id: z.string(),
  company_id: z.string(),
  origin: z.string(),
  destination: z.string(),
  stops_count: z.number().int().nonnegative().default(0),
});
export type OperatorRouteCreatedEvent = z.infer<typeof OperatorRouteCreatedEventSchema>;

export const OperatorTripDispatchedEventSchema = z.object({
  schedule_id: z.string(),
  company_id: z.string(),
  driver_id: z.string().optional(),
  bus_id: z.string().optional(),
});
export type OperatorTripDispatchedEvent = z.infer<typeof OperatorTripDispatchedEventSchema>;

// ============================================================================
// Map of Event Names to Types
// ============================================================================

export interface AnalyticsEvents {
  trip_searched: TripSearchedEvent;
  search_results_viewed: SearchResultsViewedEvent;
  trip_selected: TripSelectedEvent;
  seats_selected: SeatsSelectedEvent;
  checkout_started: CheckoutStartedEvent;
  payment_initiated: PaymentInitiatedEvent;
  booking_completed: BookingCompletedEvent;
  ticket_viewed: TicketViewedEvent;

  driver_onboarding_step_completed: DriverOnboardingStepCompletedEvent;
  driver_license_uploaded: DriverLicenseUploadedEvent;
  driver_offer_viewed: DriverOfferViewedEvent;
  driver_offer_responded: DriverOfferRespondedEvent;
  driver_trip_started: DriverTripStartedEvent;
  passenger_checked_in: PassengerCheckedInEvent;
  driver_trip_completed: DriverTripCompletedEvent;

  terminal_session_started: TerminalSessionStartedEvent;
  counter_ticket_issued: CounterTicketIssuedEvent;
  shift_reconciled: ShiftReconciledEvent;

  operator_route_created: OperatorRouteCreatedEvent;
  operator_trip_dispatched: OperatorTripDispatchedEvent;
}

export type EventName = keyof AnalyticsEvents;

// ============================================================================
// User Identity Types
// ============================================================================

export interface UserTraits {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  companyId?: string | null;
  platform?: "web" | "traveler-app" | "driver-app" | "booth-app";
  [key: string]: unknown;
}
