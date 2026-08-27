import crypto from "node:crypto";
import type { PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import { formatLocationLabel } from "@/lib/format-location-label";
import type { GeoResolvedPlace } from "@/lib/geo/geocode-point";
import { geocodePoint } from "@/lib/geo/geocode-point";
import { loadGeoDataset } from "@/lib/geo/load-geo-dataset";
import { createReverseGeocoder } from "@/lib/geo/reverse-geocode";
import { createRateLimiter } from "@/lib/rate-limit";

/**
 * Capture-link backend (M2).
 *
 * Lifecycle:
 *   operator.createCapture → terminal PENDING_CAPTURE, LocationCapture OPEN
 *   captures.submit        → LocationCapture PENDING_CONFIRMATION (resolved ids),
 *                            terminal PENDING_CONFIRMATION + tentative lat/long
 *   captures.confirm       → LocationCapture CONFIRMED (submitter confirms preview)
 *   operator.approveCapture → LocationCapture APPROVED, terminal COMPLETE + linked city/municipality/quarter
 *   operator.rejectCapture  → LocationCapture REJECTED, terminal back PENDING_CAPTURE
 *   sweeper cron            → stale attempts EXPIRED, terminal reverts if it was complete
 *
 * The terminal stays non-bookable (not COMPLETE) until an operator approves.
 *
 * Token semantics: the token is a capability. We store the RAW token so that a
 * repeated `createCapture` can idempotently return the same share URL (operator
 * may re-open the editor to copy the link). The token is high-entropy (256 bits),
 * single-use, and expires after CAPTURE_TTL_MS, which bounds the leak window.
 */

export const CAPTURE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const MAX_ACCURACY_METERS = 150;

/**
 * Placeholder `addressLine1` for capture-mode terminals (the DB column is
 * required). Replaced by the resolved label when the operator approves.
 * Kept in sync with the editor's constant of the same name.
 */
export const CAPTURE_ADDRESS_PLACEHOLDER = "(pending GPS capture)";

export interface CaptureServiceDeps {
  prisma: PrismaClient;
  /** Geo-resolution delegate (injected for tests). */
  resolvePlace: (input: {
    latitude: number;
    longitude: number;
  }) => Promise<GeoResolvedPlace | null>;
  /** Reverse geocoder: GPS → street address. Best-effort; null on any failure. */
  reverseGeocode?: (input: {
    latitude: number;
    longitude: number;
  }) => Promise<string | null>;
  now?: () => Date;
  generateToken?: () => string;
  appUrl?: string;
  /** Injected so tests can control the window/clock. */
  submitLimiter?: (key: string) => { ok: boolean; retryAfterMs: number };
}

const defaultSubmitLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
});

function classifyDevice(userAgent: string | null): string | null {
  if (!userAgent) return null;
  if (/iPad|Tablet/i.test(userAgent)) return "tablet";
  if (/Mobile|Android|iPhone|Windows Phone/i.test(userAgent)) return "mobile";
  return "desktop";
}

export class CaptureService {
  private readonly prisma: PrismaClient;
  private readonly resolvePlace: CaptureServiceDeps["resolvePlace"];
  private readonly reverseGeocode: NonNullable<
    CaptureServiceDeps["reverseGeocode"]
  >;
  private readonly now: () => Date;
  private readonly generateToken: () => string;
  private readonly appUrl: string;
  private readonly submitLimiter: (key: string) => {
    ok: boolean;
    retryAfterMs: number;
  };

  constructor(deps: CaptureServiceDeps) {
    this.prisma = deps.prisma;
    this.resolvePlace = deps.resolvePlace;
    this.reverseGeocode = deps.reverseGeocode ?? (async () => null);
    this.now = deps.now ?? (() => new Date());
    this.generateToken =
      deps.generateToken ??
      (() => crypto.randomBytes(32).toString("base64url"));
    this.appUrl =
      deps.appUrl ?? process.env["APP_URL"] ?? "http://localhost:3000";
    this.submitLimiter = deps.submitLimiter ?? defaultSubmitLimiter;
  }

  // ── operator.createCapture ───────────────────────────────────────────────

  async createCapture(input: { terminalId: string }) {
    const terminal = await this.prisma.companyLocation.findFirst({
      where: { id: input.terminalId },
    });
    if (!terminal) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Terminal not found.",
      });
    }
    if (!terminal.isTerminal) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Capture links can only be generated for terminals.",
      });
    }

    // Idempotent: a live attempt (OPEN / PENDING_CONFIRMATION / CONFIRMED and
    // not yet expired) is re-shared as-is so re-opening the editor returns the
    // same URL instead of invalidating the link the submitter already has.
    const live = await this.prisma.locationCapture.findFirst({
      where: {
        locationId: terminal.id,
        status: { in: ["OPEN", "PENDING_CONFIRMATION", "CONFIRMED"] },
        expiresAt: { gt: this.now() },
      },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
    if (live) {
      return {
        url: `${this.appUrl}/capture/${live.token}`,
        token: live.token,
        expiresAt: live.expiresAt,
      };
    }

    const token = this.generateToken();
    const expiresAt = new Date(this.now().getTime() + CAPTURE_TTL_MS);

    await this.prisma.$transaction(async (tx) => {
      await tx.companyLocation.update({
        where: { id: terminal.id },
        data: {
          geoCaptureStatus: "PENDING_CAPTURE",
          captureToken: token,
          captureExpiresAt: expiresAt,
        },
      });
      await tx.locationCapture.create({
        data: { locationId: terminal.id, token, expiresAt, status: "OPEN" },
      });
    });

    return {
      url: `${this.appUrl}/capture/${token}`,
      token,
      expiresAt,
    };
  }

  // ── captures.getInfo (public, display-safe) ──────────────────────────────

  async getInfo(input: { token: string }) {
    const capture = await this.prisma.locationCapture.findUnique({
      where: { token: input.token },
      include: {
        location: {
          include: {
            cityRelation: true,
            municipality: true,
            quarter: true,
            company: { select: { name: true } },
          },
        },
      },
    });
    if (!capture) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "This capture link is invalid or has expired.",
      });
    }

    const expired = capture.expiresAt < this.now();
    if (expired && capture.status !== "EXPIRED") {
      await this.markExpired(capture.id);
    }
    if (expired || capture.status === "EXPIRED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This capture link has expired. Please ask for a new one.",
      });
    }
    if (capture.status === "REJECTED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This capture link was rejected by the operator.",
      });
    }
    if (capture.status === "APPROVED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This capture has already been approved.",
      });
    }

    const loc = capture.location;
    return {
      status: capture.status,
      expiresAt: capture.expiresAt,
      location: {
        id: loc.id,
        name: loc.name,
        addressLine1: loc.addressLine1,
        cityName: loc.cityRelation?.name ?? null,
        municipalityName: loc.municipality?.name ?? null,
        quarterName: loc.quarter?.name ?? null,
      },
      companyName: loc.company?.name ?? null,
    };
  }

  // ── captures.submit (public, rate-limited, accuracy-gated) ───────────────

  async submit(input: {
    token: string;
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    submitterName?: string | undefined;
    submitterPhone?: string | undefined;
    notes?: string | undefined;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    if (input.accuracyMeters > MAX_ACCURACY_METERS) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Location accuracy is too low (${input.accuracyMeters}m). Please move to an open area and retry.`,
      });
    }

    // Rate limit by token AND ip (best-effort per-instance window).
    const limiterKey = input.ip ? `${input.token}:${input.ip}` : input.token;
    const limited = this.submitLimiter(limiterKey);
    if (!limited.ok) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many attempts. Please try again later.",
      });
    }

    const capture = await this.prisma.locationCapture.findUnique({
      where: { token: input.token },
      include: { location: true },
    });
    if (!capture) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "This capture link is invalid or has expired.",
      });
    }

    const expired = capture.expiresAt < this.now();
    if (expired && capture.status !== "EXPIRED") {
      await this.markExpired(capture.id);
    }
    if (expired || capture.status === "EXPIRED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This capture link has expired. Please ask for a new one.",
      });
    }
    if (capture.status !== "OPEN") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          capture.status === "CONFIRMED" || capture.status === "APPROVED"
            ? "This capture link has already been completed."
            : "This capture link has already been submitted.",
      });
    }

    const resolved = await this.resolvePlace({
      latitude: input.latitude,
      longitude: input.longitude,
    });
    if (!resolved) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "We could not match your location to a known city. Please retry from the exact terminal location.",
      });
    }

    const capturedAt = this.now();
    const reverseGeocodedAddress = await this.reverseGeocode({
      latitude: input.latitude,
      longitude: input.longitude,
    });
    await this.prisma.$transaction(async (tx) => {
      await tx.locationCapture.update({
        where: { id: capture.id },
        data: {
          status: "PENDING_CONFIRMATION",
          latitude: input.latitude,
          longitude: input.longitude,
          accuracyMeters: input.accuracyMeters,
          capturedAt,
          device: classifyDevice(input.userAgent ?? null),
          userAgent: input.userAgent ?? null,
          ip: input.ip ?? null,
          resolvedCityId: resolved.cityId,
          resolvedMunicipalityId: resolved.municipalityId,
          resolvedQuarterId: resolved.quarterId,
          reverseGeocodedAddress,
          submitterName: input.submitterName ?? null,
          submitterPhone: input.submitterPhone ?? null,
          notes: input.notes ?? null,
          resolvedAt: capturedAt,
        },
      });
      await tx.companyLocation.update({
        where: { id: capture.locationId },
        data: {
          geoCaptureStatus: "PENDING_CONFIRMATION",
          latitude: input.latitude,
          longitude: input.longitude,
        },
      });
    });

    return {
      status: "PENDING_CONFIRMATION" as const,
      resolved,
      resolvedAddress: reverseGeocodedAddress,
      accuracyMeters: input.accuracyMeters,
      latitude: input.latitude,
      longitude: input.longitude,
    };
  }

  // ── captures.confirm (public) ────────────────────────────────────────────

  async confirm(input: { token: string }) {
    const capture = await this.prisma.locationCapture.findUnique({
      where: { token: input.token },
    });
    if (!capture) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "This capture link is invalid or has expired.",
      });
    }

    const expired = capture.expiresAt < this.now();
    if (expired && capture.status !== "EXPIRED") {
      await this.markExpired(capture.id);
    }
    if (expired || capture.status === "EXPIRED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This capture link has expired. Please ask for a new one.",
      });
    }
    if (capture.status === "OPEN") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Share your location before confirming.",
      });
    }
    if (capture.status === "REJECTED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This capture link was rejected by the operator.",
      });
    }
    if (capture.status === "CONFIRMED") {
      // Already confirmed — return the stored preview again (idempotent).
      return {
        status: "CONFIRMED" as const,
        resolved: await this.previewFromCapture(capture),
      };
    }
    if (capture.status === "APPROVED") {
      // Terminal already geo-linked by the operator — a fresh attempt is moot.
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This capture has already been approved.",
      });
    }

    const updated = await this.prisma.locationCapture.update({
      where: { id: capture.id },
      data: { status: "CONFIRMED" },
    });

    return {
      status: "CONFIRMED" as const,
      resolved: await this.previewFromCapture(updated),
    };
  }

  // ── operator.approveCapture / rejectCapture ──────────────────────────────

  async approveCapture(input: {
    companyId: string;
    userId: string;
    captureId: string;
  }) {
    const capture = await this.findCaptureInCompany(
      input.captureId,
      input.companyId,
    );

    if (capture.status !== "CONFIRMED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          capture.status === "PENDING_CONFIRMATION"
            ? "The submitter has not confirmed this capture yet."
            : "This capture is not awaiting approval.",
      });
    }
    if (!capture.resolvedMunicipalityId || !capture.resolvedCityId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "This capture has no resolved location and cannot be approved.",
      });
    }

    // Auto-derive the full address for capture-created terminals (which are
    // created with a placeholder addressLine1). Leave a real address alone.
    // Prefer the reverse-geocoded street address; fall back to the hierarchy
    // label (city / municipality / quarter) when no street address is known.
    const preview = await this.previewFromCapture(capture);
    const resolvedLabel = formatLocationLabel({
      cityName: preview.cityName,
      municipalityName: preview.municipalityName,
      quarterName: preview.quarterName,
      isUrban: false,
    });
    const derivedAddress =
      capture.reverseGeocodedAddress?.trim() || resolvedLabel || null;
    const fillAddress =
      !capture.locationAddressLine1 ||
      capture.locationAddressLine1 === CAPTURE_ADDRESS_PLACEHOLDER;

    const terminal = await this.prisma.$transaction(async (tx) => {
      await tx.locationCapture.update({
        where: { id: capture.id },
        data: { status: "APPROVED" },
      });
      const updated = await tx.companyLocation.update({
        where: { id: capture.locationId },
        data: {
          geoCaptureStatus: "COMPLETE",
          cityId: capture.resolvedCityId,
          municipalityId: capture.resolvedMunicipalityId,
          quarterId: capture.resolvedQuarterId,
          ...(fillAddress && derivedAddress
            ? { addressLine1: derivedAddress }
            : {}),
          ...(capture.latitude != null ? { latitude: capture.latitude } : {}),
          ...(capture.longitude != null
            ? { longitude: capture.longitude }
            : {}),
          captureToken: null,
          captureExpiresAt: null,
        },
        include: { cityRelation: true, municipality: true, quarter: true },
      });
      await tx.activityLog.create({
        data: {
          companyId: input.companyId,
          userId: input.userId,
          action: "CAPTURE_APPROVED",
          description: `Approved GPS capture for terminal "${capture.locationName}".`,
          metadata: {
            captureId: capture.id,
            cityId: capture.resolvedCityId,
            municipalityId: capture.resolvedMunicipalityId,
            quarterId: capture.resolvedQuarterId,
            latitude: capture.latitude,
            longitude: capture.longitude,
            addressLine1: derivedAddress,
          },
        },
      });
      return updated;
    });

    return terminal;
  }

  async rejectCapture(input: {
    companyId: string;
    userId: string;
    captureId: string;
  }) {
    const capture = await this.findCaptureInCompany(
      input.captureId,
      input.companyId,
    );

    if (capture.status === "REJECTED" || capture.status === "EXPIRED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This capture has already been resolved.",
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.locationCapture.update({
        where: { id: capture.id },
        data: { status: "REJECTED" },
      });
      await tx.companyLocation.update({
        where: { id: capture.locationId },
        data: {
          geoCaptureStatus: "PENDING_CAPTURE",
          captureToken: null,
          captureExpiresAt: null,
        },
      });
      await tx.activityLog.create({
        data: {
          companyId: input.companyId,
          userId: input.userId,
          action: "CAPTURE_REJECTED",
          description: `Rejected GPS capture for terminal "${capture.locationName}".`,
          metadata: {
            captureId: capture.id,
            latitude: capture.latitude,
            longitude: capture.longitude,
          },
        },
      });
    });

    return { success: true as const };
  }

  // ── cron sweeper ─────────────────────────────────────────────────────────

  async sweepExpired() {
    const now = this.now();
    const stale = await this.prisma.locationCapture.findMany({
      where: {
        status: { in: ["OPEN", "PENDING_CONFIRMATION", "CONFIRMED"] },
        expiresAt: { lt: now },
      },
      select: { id: true, locationId: true },
    });

    for (const capture of stale) {
      await this.prisma.$transaction(async (tx) => {
        await tx.locationCapture.update({
          where: { id: capture.id },
          data: { status: "EXPIRED" },
        });
        const terminal = await tx.companyLocation.findUnique({
          where: { id: capture.locationId },
          select: { id: true, cityId: true },
        });
        if (!terminal) return;
        // A terminal that was geo-complete before the capture attempt reverts
        // to COMPLETE (restores bookable). A bare pending terminal (no city yet)
        // stays PENDING_CAPTURE so the operator can mint a fresh link.
        await tx.companyLocation.update({
          where: { id: terminal.id },
          data: {
            geoCaptureStatus: terminal.cityId ? "COMPLETE" : "PENDING_CAPTURE",
            captureToken: null,
            captureExpiresAt: null,
          },
        });
      });
    }

    return { success: true as const, count: stale.length };
  }

  // ── internals ────────────────────────────────────────────────────────────

  private async markExpired(captureId: string) {
    await this.prisma.locationCapture.update({
      where: { id: captureId },
      data: { status: "EXPIRED" },
    });
  }

  private async findCaptureInCompany(captureId: string, companyId: string) {
    const capture = await this.prisma.locationCapture.findUnique({
      where: { id: captureId },
      include: {
        location: {
          select: { companyId: true, name: true, addressLine1: true },
        },
      },
    });
    if (!capture || capture.location.companyId !== companyId) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Capture not found." });
    }
    return {
      ...capture,
      locationName: capture.location.name,
      locationAddressLine1: capture.location.addressLine1,
    };
  }

  private async previewFromCapture(capture: {
    resolvedCityId: string | null;
    resolvedMunicipalityId: string | null;
    resolvedQuarterId: string | null;
  }) {
    const [city, municipality, quarter] = await Promise.all([
      capture.resolvedCityId
        ? this.prisma.city.findUnique({ where: { id: capture.resolvedCityId } })
        : null,
      capture.resolvedMunicipalityId
        ? this.prisma.municipality.findUnique({
            where: { id: capture.resolvedMunicipalityId },
          })
        : null,
      capture.resolvedQuarterId
        ? this.prisma.quarter.findUnique({
            where: { id: capture.resolvedQuarterId },
          })
        : null,
    ]);

    return {
      cityId: capture.resolvedCityId,
      cityName: city?.name ?? null,
      municipalityId: capture.resolvedMunicipalityId,
      municipalityName: municipality?.name ?? null,
      quarterId: capture.resolvedQuarterId,
      quarterName: quarter?.name ?? null,
    };
  }
}

/** Default resolver used by the tRPC layer: full offline dataset → pure engine. */
export function createCaptureService(prisma: PrismaClient): CaptureService {
  const reverseGeocode = createReverseGeocoder();
  return new CaptureService({
    prisma,
    resolvePlace: async (input) => {
      const { municipalities, quarters } = await loadGeoDataset(prisma);
      return geocodePoint({
        latitude: input.latitude,
        longitude: input.longitude,
        municipalities,
        quarters,
      });
    },
    reverseGeocode,
  });
}
