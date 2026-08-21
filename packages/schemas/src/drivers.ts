import { z } from "zod";

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

export type DriverVerificationStatus = (typeof DRIVER_VERIFICATION_STATUSES)[number];
export const DriverVerificationStatusSchema = z.enum(DRIVER_VERIFICATION_STATUSES);

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

export const createDriverSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(100),
  email: z.string().email("Valid email required"),
  phone: z.string().min(6, "Valid phone number required"),
  licenseNumber: z.string().min(3, "License number is required").max(50),
  licenseCategory: LicenseCategorySchema.default("D"),
  licenseExpiryDate: z.coerce.date(),
  licenseFrontUrl: z.string().url().optional(),
  licenseBackUrl: z.string().url().optional(),
  yearsOfExperience: z.number().int().min(0).max(60).default(1),
  medicalClearanceDate: z.coerce.date().optional(),
  medicalDocUrl: z.string().url().optional(),
  employmentType: DriverEmploymentTypeSchema.default("EXCLUSIVE_INTERCITY"),
  badgeNumber: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});
export type CreateDriverInput = z.infer<typeof createDriverSchema>;

export const updateDriverSchema = z.object({
  id: z.string().cuid(),
  licenseNumber: z.string().min(3).max(50).optional(),
  licenseCategory: LicenseCategorySchema.optional(),
  licenseExpiryDate: z.coerce.date().optional(),
  licenseFrontUrl: z.string().url().optional(),
  licenseBackUrl: z.string().url().optional(),
  yearsOfExperience: z.number().int().min(0).max(60).optional(),
  medicalClearanceDate: z.coerce.date().optional(),
  medicalDocUrl: z.string().url().optional(),
  status: DriverStatusSchema.optional(),
  employmentType: DriverEmploymentTypeSchema.optional(),
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

export const assignDriverToTripSchema = z.object({
  tripId: z.string().cuid(),
  driverProfileId: z.string().cuid(),
  role: z.enum(["PRIMARY", "RELIEF", "CONDUCTOR"]).default("PRIMARY"),
  startStopOrder: z.number().int().min(0).default(0),
  endStopOrder: z.number().int().min(1).optional(),
});
export type AssignDriverToTripInput = z.infer<typeof assignDriverToTripSchema>;

export const unassignDriverFromTripSchema = z.object({
  tripId: z.string().cuid(),
  driverProfileId: z.string().cuid(),
  role: z.enum(["PRIMARY", "RELIEF", "CONDUCTOR"]).default("PRIMARY"),
});
export type UnassignDriverFromTripInput = z.infer<typeof unassignDriverFromTripSchema>;

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
  batteryPercent: z.number().int().min(0).max(100).optional(),
  isCharging: z.boolean().optional(),
  networkType: z.string().optional(),
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
  companyId: z.string().cuid(),
  onDuty: z.boolean(),
  serviceType: z.enum(["INTERCITY", "URBAN"]).default("INTERCITY"),
});
export type DriverShiftToggleInput = z.infer<typeof driverShiftToggleSchema>;

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
