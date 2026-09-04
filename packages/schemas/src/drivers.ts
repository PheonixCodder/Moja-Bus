import { z } from "zod";
import { parseTicketToken } from "./ticket-token";

// ============================================
// ENUMS & CONSTANTS
// ============================================

export const DRIVER_STATUSES = [
  "OFFLINE",
  "AVAILABLE",
  "ON_DUTY",
  "ON_TRIP",
  "RESTING",
  "SUSPENDED",
] as const;

export type DriverStatus = (typeof DRIVER_STATUSES)[number];
export const DriverStatusSchema = z.enum(DRIVER_STATUSES);

export const DRIVER_VERIFICATION_STATUSES = [
  "PENDING",
  "VERIFIED",
  "REJECTED",
  "EXPIRED",
  "SUSPENDED",
] as const;

export type DriverVerificationStatus =
  (typeof DRIVER_VERIFICATION_STATUSES)[number];
export const DriverVerificationStatusSchema = z.enum(
  DRIVER_VERIFICATION_STATUSES,
);

export const DRIVER_EMPLOYMENT_TYPES = [
  "EXCLUSIVE_INTERCITY",
  "CONTRACTOR_URBAN",
  "HYBRID",
] as const;

export type DriverEmploymentType = (typeof DRIVER_EMPLOYMENT_TYPES)[number];
export const DriverEmploymentTypeSchema = z.enum(DRIVER_EMPLOYMENT_TYPES);

export const LICENSE_CATEGORIES = ["B", "C", "D", "E"] as const;
export type LicenseCategory = (typeof LICENSE_CATEGORIES)[number];
export const LicenseCategorySchema = z.enum(LICENSE_CATEGORIES);

export const DRIVER_PAY_MODELS = [
  "HOURLY",
  "PER_TRIP",
  "MONTHLY_SALARY",
] as const;
export type DriverPayModel = (typeof DRIVER_PAY_MODELS)[number];
export const DriverPayModelSchema = z.enum(DRIVER_PAY_MODELS);


// ============================================
// OPERATOR CRUD SCHEMAS
// ============================================

export const listDriversSchema = z.object({
  search: z.string().trim().optional(),
  status: DriverStatusSchema.optional(),
  verificationStatus: DriverVerificationStatusSchema.optional(),
  employmentType: DriverEmploymentTypeSchema.optional(),
  licenseCategory: LicenseCategorySchema.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
});
export type ListDriversInput = z.infer<typeof listDriversSchema>;

export const getDriverSchema = z.object({
  id: z.string().cuid(),
});
export type GetDriverInput = z.infer<typeof getDriverSchema>;

/**
 * Phase 26 (F-OP-16) — compliance-document reference as stored on the
 * profile: a PRIVATE storage object key ("documents/…", Phase 15 pipeline)
 * or a legacy absolute URL. Device-local "file://" URIs are deliberately NOT
 * accepted — that was the unverifiable-dossier defect this closes.
 */
export const driverDocReferenceSchema = z
  .string()
  .trim()
  .min(4)
  .max(512)
  .refine(
    (v) => v.startsWith("documents/") || /^https?:\/\//.test(v),
    "Must be a storage object key (documents/…) or an https URL",
  );

export const createDriverSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(100),
  email: z.string().email("Valid email required"),
  phone: z.string().min(6, "Valid phone number required"),
  licenseNumber: z.string().min(3, "License number is required").max(50),
  licenseCategory: LicenseCategorySchema.default("D"),
  licenseExpiryDate: z.coerce.date(),
  licenseFrontUrl: driverDocReferenceSchema.optional(),
  licenseBackUrl: driverDocReferenceSchema.optional(),
  yearsOfExperience: z.number().int().min(0).max(60).default(1),
  medicalClearanceDate: z.coerce.date().optional(),
  medicalDocUrl: driverDocReferenceSchema.optional(),
  employmentType: DriverEmploymentTypeSchema.default("EXCLUSIVE_INTERCITY"),
  payModel: DriverPayModelSchema.default("HOURLY"),
  payRateXOF: z.number().int().min(0).optional(),
  badgeNumber: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
  /**
   * P1-7: when the email/phone matches an existing account, the operator must
   * explicitly confirm attaching a DriverProfile to it. The first attempt
   * without this flag receives EXISTING_USER_BINDING_REQUIRED::… instead.
   */
  confirmBinding: z.boolean().optional(),
});
export type CreateDriverInput = z.infer<typeof createDriverSchema>;

export const updateDriverSchema = z.object({
  id: z.string().cuid(),
  licenseNumber: z.string().min(3).max(50).optional(),
  licenseCategory: LicenseCategorySchema.optional(),
  licenseExpiryDate: z.coerce.date().optional(),
  licenseFrontUrl: driverDocReferenceSchema.optional(),
  licenseBackUrl: driverDocReferenceSchema.optional(),
  yearsOfExperience: z.number().int().min(0).max(60).optional(),
  medicalClearanceDate: z.coerce.date().optional(),
  medicalDocUrl: driverDocReferenceSchema.optional(),
  // Phase 31 (D8-a) — `status` REMOVED from operator updateDriver: the only
  // UI caller never sent it, and a generic status write bypassed the
  // Phase-06 run-state convergence matrix. State transitions go through
  // their dedicated surfaces.
  employmentType: DriverEmploymentTypeSchema.optional(),
  payModel: DriverPayModelSchema.optional(),
  payRateXOF: z.number().int().min(0).optional(),
  badgeNumber: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;

export const verifyDriverSchema = z.object({
  id: z.string().cuid(),
  verificationStatus: z.enum(["VERIFIED", "REJECTED", "SUSPENDED"]),
  rejectionReason: z.string().max(500).optional(),
});
export type VerifyDriverInput = z.infer<typeof verifyDriverSchema>;

// ============================================
// DISPATCH & TRIP ASSIGNMENT SCHEMAS
// ============================================

/** Turnaround buffer between two assignments for the same driver (minutes). */
export const DRIVER_TURNAROUND_BUFFER_MINUTES = 45;
/** Interval fallbacks when a schedule has no estimatedMinutes (minutes). */
export const INTERCITY_TRIP_DEFAULT_MINUTES = 8 * 60;
export const URBAN_TRIP_DEFAULT_MINUTES = 2 * 60;
/** Departures closer than this trigger the urgent dispatch alert (hours). */
export const URGENT_DISPATCH_WINDOW_HOURS = 2;

/** CI commercial license ordering: B < C < D < E. */
const LICENSE_ORDER = ["B", "C", "D", "E"] as const;
export function licenseMeetsRequirement(
  driverLicense: string,
  required: string | null | undefined,
): boolean {
  if (!required) return true;
  const di = LICENSE_ORDER.indexOf(
    driverLicense as (typeof LICENSE_ORDER)[number],
  );
  const ri = LICENSE_ORDER.indexOf(required as (typeof LICENSE_ORDER)[number]);
  if (di === -1) return false;
  return di >= ri;
}

/**
 * Phase 14 (F-OP-03/F-DV-12) — licence validity gates.
 *
 * The legally meaningful question for a TRIP-scoped gate is not "is the
 * licence valid today" but "will it be valid through the trip": a licence
 * that expires mid-run is exactly as unusable as an expired one. Callers
 * pass `throughDate` = trip estimatedArrival where a trip is in scope, or
 * `now` for scope-less checks (shift start). Null expiry = no data = allowed
 * (pre-Phase-14 rows); blocking on missing data would lock out every legacy
 * driver until an operator edits their record.
 */
export function isLicenseUsableThrough(
  licenseExpiryDate: Date | string | null | undefined,
  throughDate: Date,
): boolean {
  if (!licenseExpiryDate) return true;
  return new Date(licenseExpiryDate).getTime() >= throughDate.getTime();
}

export type LicenseExpiryStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED";

/** UI badge state; EXPIRING_SOON window is 30 days (ui-rules yellow/red). */
export function licenseExpiryStatus(
  licenseExpiryDate: Date | string | null | undefined,
  now: Date = new Date(),
): LicenseExpiryStatus {
  if (!licenseExpiryDate) return "VALID";
  const t = new Date(licenseExpiryDate).getTime();
  if (t < now.getTime()) return "EXPIRED";
  if (t <= now.getTime() + 30 * 24 * 60 * 60 * 1000) return "EXPIRING_SOON";
  return "VALID";
}

/** Driver statuses that may operate runs / take duty shifts. */
const OPERABLE_VERIFICATION_STATUSES = new Set(["VERIFIED"]);
export function canOperateRuns(verificationStatus: string): boolean {
  return OPERABLE_VERIFICATION_STATUSES.has(verificationStatus);
}

export const assignDriverToTripSchema = z.object({
  tripId: z.string().cuid(),
  driverProfileId: z.string().cuid(),
  role: z.enum(["PRIMARY", "RELIEF"]).default("PRIMARY"),
  startStopOrder: z.number().int().min(0).default(0),
  endStopOrder: z.number().int().min(1).optional(),
  /** Required when replacing an existing PRIMARY with a different driver. */
  replacePrimary: z.boolean().optional(),
});
export type AssignDriverToTripInput = z.infer<typeof assignDriverToTripSchema>;

export const unassignDriverFromTripSchema = z.object({
  tripId: z.string().cuid(),
  driverProfileId: z.string().cuid(),
  role: z.enum(["PRIMARY", "RELIEF"]).default("PRIMARY"),
});
export type UnassignDriverFromTripInput = z.infer<
  typeof unassignDriverFromTripSchema
>;

export const assignConductorToTripSchema = z.object({
  tripId: z.string().cuid(),
  staffId: z.string().cuid(),
});
export type AssignConductorToTripInput = z.infer<
  typeof assignConductorToTripSchema
>;

export const unassignConductorFromTripSchema = z.object({
  tripId: z.string().cuid(),
});
export type UnassignConductorFromTripInput = z.infer<
  typeof unassignConductorFromTripSchema
>;

export const listAssignableDriversSchema = z.object({
  tripId: z.string().cuid(),
});
export type ListAssignableDriversInput = z.infer<
  typeof listAssignableDriversSchema
>;

// ============================================
// REAL-TIME TELEMETRY & SHIFT SCHEMAS
// ============================================

export const driverPingSchema = z.object({
  driverProfileId: z.string().cuid(),
  tripId: z.string().cuid().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).optional(),
  speedKmh: z.number().min(0).max(250).default(0),
  accuracyMeters: z.number().min(0).default(5),
  altitudeMeters: z.number().optional(),
  // Phase 13 — anomaly flags from the client detector.
  // Overspeed is RECOMPUTED server-side from speedKmh (authoritative);
  // the flag is accepted only for schema compatibility.
  isOverspeed: z.boolean().optional(),
  isHarshBraking: z.boolean().optional(),
  recordedAt: z.coerce.date().default(() => new Date()),
});
export type DriverPingInput = z.infer<typeof driverPingSchema>;

export const driverLocationPingSchema = driverPingSchema;
export type DriverLocationPingInput = DriverPingInput;

export const driverBatchPingSchema = z.object({
  pings: z.array(driverPingSchema).min(1).max(100),
});
export type DriverBatchPingInput = z.infer<typeof driverBatchPingSchema>;

export const driverShiftToggleSchema = z.object({
  // Phase 14/17 (F-DV-07) — optional to match reality: single-affiliation
  // drivers omit it and the router falls back to their most recent hire,
  // deterministically. Multi-affiliation drivers should send it explicitly.
  companyId: z.string().cuid().optional(),
  onDuty: z.boolean(),
  serviceType: z.enum(["INTERCITY", "URBAN"]).default("INTERCITY"),
});
export type DriverShiftToggleInput = z.infer<typeof driverShiftToggleSchema>;

// Phase 2C (DRV-P1-04) — Mandated rest break tracking & RESTING state
export const driverLogRestBreakSchema = z.object({
  shiftId: z.string().cuid().optional(),
  durationMinutes: z.number().int().min(5).max(120).default(30),
  note: z.string().trim().max(200).optional(),
});
export type DriverLogRestBreakInput = z.infer<typeof driverLogRestBreakSchema>;

export const driverResumeDutySchema = z
  .object({
    shiftId: z.string().cuid().optional(),
  })
  .optional();
export type DriverResumeDutyInput = z.infer<typeof driverResumeDutySchema>;

// Phase 2D (DRV-P1-07) — Vehicle Breakdown & Emergency Dispatch Protocol
export const driverBreakdownTypeSchema = z.enum([
  "ENGINE",
  "TIRE",
  "TRANSMISSION",
  "ELECTRICAL",
  "BRAKE",
  "ACCIDENT",
  "OTHER",
]);
export type DriverBreakdownType = z.infer<typeof driverBreakdownTypeSchema>;

export const driverReportVehicleBreakdownSchema = z.object({
  tripId: z.string().cuid(),
  breakdownType: driverBreakdownTypeSchema,
  description: z.string().trim().min(3, "Description is required").max(500),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().optional(),
  delayMinutes: z.number().int().min(15).max(600).default(60),
});
export type DriverReportVehicleBreakdownInput = z.infer<
  typeof driverReportVehicleBreakdownSchema
>;

// ============================================
// PASSENGER REVIEW SCHEMAS (3-WAY RATING)
// ============================================

export const submitTripReviewSchema = z.object({
  bookingId: z.string().cuid(),
  rating: z.number().int().min(1).max(5), // Overall
  driverRating: z.number().int().min(1).max(5).optional(), // Driver safety & behavior
  busRating: z.number().int().min(1).max(5).optional(), // Vehicle cleanliness & AC
  punctualityRating: z.number().int().min(1).max(5).optional(), // On-time performance
  content: z.string().trim().max(1000).optional(),
});
export type SubmitTripReviewInput = z.infer<typeof submitTripReviewSchema>;

// ============================================
// MOBILE DRIVER SELF-SERVICE SCHEMAS
// ============================================

export const driverSelfRegisterSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(100),
  email: z.string().email().optional(),
  phone: z.string().min(6, "Valid phone number required"),
  licenseNumber: z.string().min(3, "License number is required").max(50),
  licenseCategory: LicenseCategorySchema.default("D"),
  licenseExpiryDate: z.coerce.date(),
  licenseFrontUrl: z.string().optional(),
  licenseBackUrl: z.string().optional(),
  yearsOfExperience: z.number().int().min(0).max(60).default(1),
  selfieUrl: z.string().optional(),
  medicalDocUrl: z.string().optional(),
  // Phase 15 (F-DV-05) — previously collected by the wizard and silently
  // dropped; now persisted and honored.
  nationalIdNumber: z.string().max(50).optional(),
  employmentType: DriverEmploymentTypeSchema.optional(),
  carrierInviteCode: z.string().trim().optional(),
});
export type DriverSelfRegisterInput = z.infer<typeof driverSelfRegisterSchema>;

export const driverUpdateStatusSchema = z.object({
  status: z.enum(["OFFLINE", "AVAILABLE", "ON_DUTY", "RESTING"]),
});
export type DriverUpdateStatusInput = z.infer<typeof driverUpdateStatusSchema>;

export const driverGetMyTripsSchema = z.object({
  filter: z.enum(["TODAY", "UPCOMING", "COMPLETED", "ALL"]).default("TODAY"),
  // Phase 19 (P3-13) — dual-mode switcher filter; omitted = all modes.
  serviceType: z.enum(["INTERCITY", "URBAN"]).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});
export type DriverGetMyTripsInput = z.infer<typeof driverGetMyTripsSchema>;

export const driverCheckInPassengerSchema = z.object({
  // Accepts bare durable tokens, pt. presentation tokens, ticket URLs and
  // legacy JSON payloads — parseTicketToken normalizes camera output (Phase 02).
  ticketToken: z.preprocess(
    parseTicketToken,
    z.string().min(1, "Ticket token is required"),
  ),
  tripId: z.string().cuid().optional(),
});
export type DriverCheckInPassengerInput = z.infer<
  typeof driverCheckInPassengerSchema
>;

export const driverManualCheckInSchema = z.object({
  bookingId: z.string().cuid(),
  tripId: z.string().cuid(),
});
export type DriverManualCheckInInput = z.infer<
  typeof driverManualCheckInSchema
>;

export const driverBatchSyncCheckInsSchema = z.object({
  checkIns: z
    .array(
      z.object({
        // Same forgiving scan-input contract as checkInPassenger (Phase 02).
        ticketToken: z.preprocess(
          parseTicketToken,
          z.string().min(1, "Ticket token is required"),
        ),
        tripId: z.string().cuid().optional(),
        scannedAt: z.coerce.date(),
      }),
    )
    .min(1)
    .max(200),
});
export type DriverBatchSyncCheckInsInput = z.infer<
  typeof driverBatchSyncCheckInsSchema
>;

export const driverStartTripSchema = z.object({
  tripId: z.string().cuid(),
  // Phase 31 (unnumbered audit observation) — `initialOdometerKm` removed:
  // it was accepted and silently discarded (no odometer storage exists);
  // dead inputs come back only with a purpose-built mileage feature.
});
export type DriverStartTripInput = z.infer<typeof driverStartTripSchema>;

export const driverCompleteTripSchema = z.object({
  tripId: z.string().cuid(),
  // Phase 31 — same ruling for finalOdometerKm.
});
export type DriverCompleteTripInput = z.infer<typeof driverCompleteTripSchema>;

export const driverHandoverTripControlSchema = z.object({
  tripId: z.string().cuid(),
  targetDriverProfileId: z.string().cuid().optional(),
});
export type DriverHandoverTripControlInput = z.infer<
  typeof driverHandoverTripControlSchema
>;

export const driverReportDelaySchema = z.object({
  tripId: z.string().cuid(),
  reason: z.enum([
    "TRAFFIC",
    "BREAKDOWN",
    "WEATHER",
    "POLICE_CHECKPOINT",
    "ACCIDENT",
    "OTHER",
  ]),
  delayMinutes: z.number().int().min(1).max(600),
  note: z.string().max(500).optional(),
});
export type DriverReportDelayInput = z.infer<typeof driverReportDelaySchema>;

/**
 * Phase 31 (F-DV-14) — persists an urgent-dispatch acknowledgement on the
 * assignment row server-side (replaces AsyncStorage-only acks that died on
 * reinstall/re-login and re-fired the modal).
 */
export const driverAcknowledgeUrgentDispatchSchema = z.object({
  tripId: z.string().cuid(),
});
export type DriverAcknowledgeUrgentDispatchInput = z.infer<
  typeof driverAcknowledgeUrgentDispatchSchema
>;

/**
 * Phase 7 (Gap #10) — Stop-execution schemas for waypoint arrive/depart tracking.
 */
export const driverRecordStopArrivalSchema = z.object({
  tripId: z.string().cuid(),
  tripStopId: z.string().cuid(),
});
export type DriverRecordStopArrivalInput = z.infer<
  typeof driverRecordStopArrivalSchema
>;

export const driverRecordStopDepartureSchema = z.object({
  tripId: z.string().cuid(),
  tripStopId: z.string().cuid(),
});
export type DriverRecordStopDepartureInput = z.infer<
  typeof driverRecordStopDepartureSchema
>;


// ============================================
// PHASE 9 — MARKETPLACE PREFERENCE SCHEMAS
// ============================================

export const CIV_CITY_HUBS = [
  "Abidjan",
  "Bouaké",
  "Yamoussoukro",
  "Daloa",
  "Korhogo",
  "San-Pédro",
  "Man",
  "Gagnoa",
  "Divo",
  "Abengourou",
  "Bondoukou",
  "Soubré",
] as const;
export type CivCityHub = (typeof CIV_CITY_HUBS)[number];

export const setServicePreferenceSchema = z.object({
  isAvailableForHire: z.boolean(),
  preferredType: DriverEmploymentTypeSchema,
  cityBase: z
    .enum(CIV_CITY_HUBS as unknown as [string, ...string[]])
    .optional()
    .nullable(),
  routeExperience: z
    .array(z.string().trim().max(100))
    .max(20, "Maximum 20 route entries")
    .default([]),
});
export type SetServicePreferenceInput = z.infer<
  typeof setServicePreferenceSchema
>;

export const getPublicDriverProfileSchema = z.object({
  driverProfileId: z.string().cuid(),
});
export type GetPublicDriverProfileInput = z.infer<
  typeof getPublicDriverProfileSchema
>;

export const listMarketplaceDriversSchema = z.object({
  licenseCategory: LicenseCategorySchema.optional(),
  preferredType: DriverEmploymentTypeSchema.optional(),
  cityBase: z.string().trim().optional(),
  corridor: z.string().trim().optional(),
  minRating: z.number().min(1).max(5).optional(),
  minSafetyScore: z.number().int().min(0).max(100).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});
export type ListMarketplaceDriversInput = z.infer<
  typeof listMarketplaceDriversSchema
>;

// ============================================
// PHASE 11 — EMPLOYMENT OFFER BOARD SCHEMAS
// ============================================

/** Anti-spam caps — enforced server-side in the send transaction. */
export const MAX_ACTIVE_SENT_OFFERS_PER_COMPANY = 25;
export const MAX_ACTIVE_RECEIVED_OFFERS_PER_DRIVER = 20;
/** Rolling negotiation window refreshed on every counter-offer. */
export const OFFER_EXPIRY_DAYS = 7;
/** Phase 3 (3.4) — maximum counter-offer rounds before the offer locks. */
export const MAX_COUNTER_ROUNDS = 6;

const salaryCFASchema = z
  .number()
  .int("Salary must be a whole number of CFA")
  .min(1000, "Salary must be at least 1,000 CFA")
  .max(10_000_000, "Salary exceeds maximum");

const offerStartDateFormat = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD")
  .optional()
  .nullable();

const offerNoteSchema = z.string().trim().max(2000).optional().nullable();

export const sendEmploymentOfferSchema = z.object({
  driverProfileId: z.string().cuid(),
  employmentType: DriverEmploymentTypeSchema.default("EXCLUSIVE_INTERCITY"),
  proposedSalaryCFA: salaryCFASchema,
  proposedStartDate: offerStartDateFormat,
  note: offerNoteSchema,
});
export type SendEmploymentOfferInput = z.infer<
  typeof sendEmploymentOfferSchema
>;

export const respondToOfferSchema = z
  .object({
    offerId: z.string().cuid(),
    action: z.enum(["ACCEPT", "DECLINE", "COUNTER"]),
    // COUNTER-only fields
    counterSalaryCFA: salaryCFASchema.optional(),
    counterStartDate: offerStartDateFormat,
    note: offerNoteSchema,
    // Exclusive-conflict consent: required when accepting an EXCLUSIVE_INTERCITY
    // offer while another exclusive affiliation is active.
    confirmExclusiveSwitch: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.action === "COUNTER" && val.counterSalaryCFA == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "counterSalaryCFA is required when countering",
        path: ["counterSalaryCFA"],
      });
    }
  });
export type RespondToOfferInput = z.infer<typeof respondToOfferSchema>;

export const respondToCounterOfferSchema = z
  .object({
    offerId: z.string().cuid(),
    action: z.enum(["ACCEPT_COUNTER", "DECLINE_COUNTER", "COUNTER_BACK"]),
    // COUNTER_BACK-only fields
    newSalaryCFA: salaryCFASchema.optional(),
    newStartDate: offerStartDateFormat,
    note: offerNoteSchema,
  })
  .superRefine((val, ctx) => {
    if (val.action === "COUNTER_BACK" && val.newSalaryCFA == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "newSalaryCFA is required when countering back",
        path: ["newSalaryCFA"],
      });
    }
  });
export type RespondToCounterOfferInput = z.infer<
  typeof respondToCounterOfferSchema
>;

export const listSentOffersSchema = z.object({
  status: z
    .enum([
      "ACTIVE",
      "PENDING",
      "COUNTERED",
      "ACCEPTED",
      "DECLINED",
      "EXPIRED",
      "WITHDRAWN",
    ])
    .optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});
export type ListSentOffersInput = z.infer<typeof listSentOffersSchema>;

export const listMyOffersSchema = z.object({
  status: z
    .enum([
      "ACTIVE",
      "PENDING",
      "COUNTERED",
      "ACCEPTED",
      "DECLINED",
      "EXPIRED",
      "WITHDRAWN",
    ])
    .optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});
export type ListMyOffersInput = z.infer<typeof listMyOffersSchema>;

export const withdrawOfferSchema = z.object({
  offerId: z.string().cuid(),
});
export type WithdrawOfferInput = z.infer<typeof withdrawOfferSchema>;

/** Marks all unseen offers as VIEWED (firstViewedAt + event row) — called by the driver offers screen on open. */
export const markMyOffersSeenSchema = z.object({});
export type MarkMyOffersSeenInput = z.infer<typeof markMyOffersSeenSchema>;

// ============================================
// PHASE 14 — ADMIN MARKETPLACE CONTROLS SCHEMAS
// ============================================

/** Soft cap on concurrently featured drivers so featured-first sorting stays meaningful. */
export const MAX_FEATURED_DRIVERS = 20;

export const adminSetDriverMarketplaceStatusSchema = z
  .object({
    driverProfileId: z.string().cuid(),
    action: z.enum(["FEATURE", "UNFEATURE", "SUSPEND", "RESTORE"]),
    /** Mandatory for SUSPEND — persisted to the admin activity log + notification. */
    reason: z.string().trim().min(3, "Reason is required").max(1000).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.action === "SUSPEND" && !val.reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A reason is required when suspending a driver",
        path: ["reason"],
      });
    }
  });
export type AdminSetDriverMarketplaceStatusInput = z.infer<
  typeof adminSetDriverMarketplaceStatusSchema
>;

export const adminListMarketplaceDriversSchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z
    .enum(["ALL", "AVAILABLE", "FEATURED", "SUSPENDED", "OFF_MARKET"])
    .default("ALL"),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});
export type AdminListMarketplaceDriversInput = z.infer<
  typeof adminListMarketplaceDriversSchema
>;

export const adminListAllOffersSchema = z.object({
  status: z
    .enum([
      "ALL",
      "ACTIVE",
      "PENDING",
      "COUNTERED",
      "ACCEPTED",
      "DECLINED",
      "EXPIRED",
      "WITHDRAWN",
    ])
    .default("ALL"),
  search: z.string().trim().max(100).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(15),
});
export type AdminListAllOffersInput = z.infer<typeof adminListAllOffersSchema>;
