import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TRPCError } from "@trpc/server";
import {
  CAPTURE_TTL_MS,
  CaptureService,
  type CaptureServiceDeps,
  MAX_ACCURACY_METERS,
} from "../capture-service";

const COMPANY_A = "company-a";
const USER_A = "user-a";
const TERMINAL_ID = "terminal-1";
const CAPTURE_ID = "capture-1";
const TOKEN = "tkn-abcdef";
const NOW = new Date("2026-08-05T12:00:00Z");

type Row = {
  id?: string;
  locationId?: string;
  token?: string;
  expiresAt?: Date;
  status?: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracyMeters?: number | null;
  resolvedCityId?: string | null;
  resolvedMunicipalityId?: string | null;
  resolvedQuarterId?: string | null;
  reverseGeocodedAddress?: string | null;
  submitterName?: string | null;
  device?: string | null;
  companyId?: string;
  name?: string;
  addressLine1?: string | null;
  isTerminal?: boolean;
  geoCaptureStatus?: string;
  captureToken?: string | null;
  captureExpiresAt?: Date | null;
  cityId?: string | null;
  municipalityId?: string | null;
  quarterId?: string | null;
  location?: Row;
  cityRelation?: Row | null;
  municipality?: Row | null;
  quarter?: Row | null;
  company?: Row | null;
};

function captureRow(overrides: Row = {}): Row {
  return {
    id: CAPTURE_ID,
    locationId: TERMINAL_ID,
    token: TOKEN,
    expiresAt: new Date(NOW.getTime() + CAPTURE_TTL_MS),
    status: "OPEN",
    latitude: null,
    longitude: null,
    accuracyMeters: null,
    resolvedCityId: null,
    resolvedMunicipalityId: null,
    resolvedQuarterId: null,
    location: terminalRow(),
    ...overrides,
  };
}

function terminalRow(overrides: Row = {}): Row {
  return {
    id: TERMINAL_ID,
    companyId: COMPANY_A,
    name: "Adjamé Gare",
    isTerminal: true,
    geoCaptureStatus: "COMPLETE",
    captureToken: null,
    captureExpiresAt: null,
    cityId: null,
    ...overrides,
  };
}

function makeDeps(handlers: {
  row?: Row;
  terminal?: Row;
  liveCapture?: Row | null;
  resolvePlace?: CaptureServiceDeps["resolvePlace"];
  reverseGeocode?: CaptureServiceDeps["reverseGeocode"];
  submitLimiter?: (key: string) => { ok: boolean; retryAfterMs: number };
  now?: () => Date;
}): { service: CaptureService; updated: { terminal?: Row; capture?: Row } } {
  const updated: { terminal?: Row; capture?: Row } = {};

  const prisma = {
    companyLocation: {
      findFirst: async () => handlers.terminal ?? terminalRow(),
      update: async ({ data }: { data: Row }) => {
        updated.terminal = { ...(handlers.terminal ?? terminalRow()), ...data };
        return updated.terminal;
      },
    },
    locationCapture: {
      findFirst: async () => handlers.liveCapture ?? null,
      findUnique: async () => handlers.row ?? captureRow(),
      findMany: async () => [],
      create: async ({ data }: { data: Row }) => data,
      update: async ({ data }: { data: Row }) => {
        updated.capture = { ...(handlers.row ?? captureRow()), ...data };
        return updated.capture;
      },
    },
    city: { findUnique: async () => ({ id: "city-1", name: "Abidjan" }) },
    municipality: {
      findUnique: async () => ({ id: "m-1", name: "Adjamé" }),
    },
    quarter: { findUnique: async () => ({ id: "q-1", name: "Monsieur" }) },
    activityLog: { create: async () => ({}) },
    $transaction: async <T>(fn: (tx: unknown) => Promise<T>) => {
      return fn(prisma);
    },
  };

  const service = new CaptureService({
    prisma: prisma as never,
    resolvePlace:
      handlers.resolvePlace ??
      (async () => ({
        cityId: "city-1",
        cityName: "Abidjan",
        municipalityId: "m-1",
        municipalityName: "Adjamé",
        quarterId: "q-1",
        quarterName: "Monsieur",
        method: "nearest",
        distanceMeters: 45,
      })),
    ...(handlers.reverseGeocode
      ? { reverseGeocode: handlers.reverseGeocode }
      : {}),
    now: handlers.now ?? (() => NOW),
    generateToken: () => TOKEN,
    appUrl: "https://mojaride.com",
    ...(handlers.submitLimiter
      ? { submitLimiter: handlers.submitLimiter }
      : {}),
  });

  return { service, updated };
}

function expectError(code: TRPCError["code"], pattern?: RegExp) {
  return (err: unknown) => {
    assert.ok(err instanceof TRPCError, `expected TRPCError, got ${err}`);
    assert.equal(err.code, code);
    if (pattern) assert.match(err.message, pattern);
    return true;
  };
}

describe("CaptureService.createCapture", () => {
  it("mints a single-use token and flips the terminal to PENDING_CAPTURE", async () => {
    const { service, updated } = makeDeps({});
    const result = await service.createCapture({ terminalId: TERMINAL_ID });

    assert.equal(result.token, TOKEN);
    assert.equal(result.url, `https://mojaride.com/capture/${TOKEN}`);
    assert.ok(result.expiresAt > NOW);
    assert.equal(updated.terminal?.geoCaptureStatus, "PENDING_CAPTURE");
    assert.equal(updated.terminal?.captureToken, TOKEN);
  });

  it("rejects non-terminals", async () => {
    const { service } = makeDeps({
      terminal: terminalRow({ isTerminal: false }),
    });
    await assert.rejects(
      () => service.createCapture({ terminalId: TERMINAL_ID }),
      expectError("BAD_REQUEST", /terminals/i),
    );
  });

  it("returns the live attempt idempotently instead of minting a new token", async () => {
    const liveExpiry = new Date(NOW.getTime() + 1000);
    const { service } = makeDeps({
      liveCapture: captureRow({
        token: "existing-token",
        expiresAt: liveExpiry,
        status: "OPEN",
      }),
    });
    const result = await service.createCapture({ terminalId: TERMINAL_ID });
    assert.equal(result.token, "existing-token");
    assert.equal(result.url, "https://mojaride.com/capture/existing-token");
    assert.equal(result.expiresAt, liveExpiry);
  });
});

describe("CaptureService.getInfo", () => {
  it("returns display-safe terminal info", async () => {
    const { service } = makeDeps({
      row: captureRow({
        location: {
          ...terminalRow(),
          name: "Adjamé Gare",
          addressLine1: "Rue 12",
          cityRelation: { name: "Abidjan" },
          municipality: { name: "Adjamé" },
          quarter: { name: "Monsieur" },
          company: { name: "Acme Transport" },
        },
      }),
    });
    const info = await service.getInfo({ token: TOKEN });
    assert.equal(info.location.name, "Adjamé Gare");
    assert.equal(info.location.cityName, "Abidjan");
    assert.equal(info.companyName, "Acme Transport");
    assert.equal(info.status, "OPEN");
  });

  it("rejects an expired link and marks it EXPIRED", async () => {
    const { service, updated } = makeDeps({
      row: captureRow({
        status: "OPEN",
        expiresAt: new Date(NOW.getTime() - 1000),
      }),
    });
    await assert.rejects(
      () => service.getInfo({ token: TOKEN }),
      expectError("BAD_REQUEST", /expired/i),
    );
    assert.equal(updated.capture?.status, "EXPIRED");
  });

  it("rejects a rejected capture", async () => {
    const { service } = makeDeps({ row: captureRow({ status: "REJECTED" }) });
    await assert.rejects(
      () => service.getInfo({ token: TOKEN }),
      expectError("BAD_REQUEST", /rejected/i),
    );
  });

  it("rejects a capture that was already approved", async () => {
    const { service } = makeDeps({ row: captureRow({ status: "APPROVED" }) });
    await assert.rejects(
      () => service.getInfo({ token: TOKEN }),
      expectError("BAD_REQUEST", /already been approved/i),
    );
  });
});

describe("CaptureService.submit", () => {
  it("rejects accuracy above the threshold", async () => {
    const { service } = makeDeps({});
    await assert.rejects(
      () =>
        service.submit({
          token: TOKEN,
          latitude: 5.35,
          longitude: -4.02,
          accuracyMeters: MAX_ACCURACY_METERS + 1,
        }),
      expectError("BAD_REQUEST", /accuracy/i),
    );
  });

  it("rejects when rate-limited", async () => {
    const { service } = makeDeps({
      submitLimiter: () => ({ ok: false, retryAfterMs: 5000 }),
    });
    await assert.rejects(
      () =>
        service.submit({
          token: TOKEN,
          latitude: 5.35,
          longitude: -4.02,
          accuracyMeters: 20,
        }),
      expectError("TOO_MANY_REQUESTS"),
    );
  });

  it("resolves the GPS point and moves the capture to PENDING_CONFIRMATION", async () => {
    const { service, updated } = makeDeps({});
    const result = await service.submit({
      token: TOKEN,
      latitude: 5.351,
      longitude: -4.021,
      accuracyMeters: 18,
      submitterName: "Fatou",
      submitterPhone: "+2250700000000",
      notes: "At the main gate",
      ip: "1.2.3.4",
      userAgent: "Mozilla/5.0 (Linux; Android 13)",
    });

    assert.equal(result.status, "PENDING_CONFIRMATION");
    assert.equal(result.resolved.municipalityName, "Adjamé");
    assert.equal(updated.capture?.status, "PENDING_CONFIRMATION");
    assert.equal(updated.capture?.resolvedMunicipalityId, "m-1");
    assert.equal(updated.capture?.submitterName, "Fatou");
    assert.equal(updated.capture?.device, "mobile");
    assert.equal(updated.terminal?.geoCaptureStatus, "PENDING_CONFIRMATION");
    assert.equal(updated.terminal?.latitude, 5.351);
  });

  it("rejects a token that was already submitted", async () => {
    const { service } = makeDeps({
      row: captureRow({
        status: "PENDING_CONFIRMATION",
        resolvedMunicipalityId: "m-1",
      }),
    });
    await assert.rejects(
      () =>
        service.submit({
          token: TOKEN,
          latitude: 5.35,
          longitude: -4.02,
          accuracyMeters: 20,
        }),
      expectError("BAD_REQUEST", /already been submitted/i),
    );
  });

  it("rejects submitting to a capture that was already approved", async () => {
    const { service } = makeDeps({
      row: captureRow({
        status: "APPROVED",
        resolvedMunicipalityId: "m-1",
      }),
    });
    await assert.rejects(
      () =>
        service.submit({
          token: TOKEN,
          latitude: 5.35,
          longitude: -4.02,
          accuracyMeters: 20,
        }),
      expectError("BAD_REQUEST", /already been completed/i),
    );
  });

  it("rejects when the GPS point cannot be resolved", async () => {
    const { service } = makeDeps({ resolvePlace: async () => null });
    await assert.rejects(
      () =>
        service.submit({
          token: TOKEN,
          latitude: 99,
          longitude: 99,
          accuracyMeters: 20,
        }),
      expectError("BAD_REQUEST", /could not match/i),
    );
  });

  it("stores and returns the reverse-geocoded street address", async () => {
    const { service, updated } = makeDeps({
      reverseGeocode: async () => "12 Rue du Commerce, Adjamé",
    });
    const result = await service.submit({
      token: TOKEN,
      latitude: 5.351,
      longitude: -4.021,
      accuracyMeters: 18,
    });

    assert.equal(result.resolvedAddress, "12 Rue du Commerce, Adjamé");
    assert.equal(
      updated.capture?.reverseGeocodedAddress,
      "12 Rue du Commerce, Adjamé",
    );
  });

  it("stores null address and succeeds when reverse geocoding fails", async () => {
    const { service, updated } = makeDeps({
      reverseGeocode: async () => null,
    });
    const result = await service.submit({
      token: TOKEN,
      latitude: 5.351,
      longitude: -4.021,
      accuracyMeters: 18,
    });

    assert.equal(result.status, "PENDING_CONFIRMATION");
    assert.equal(updated.capture?.reverseGeocodedAddress, null);
  });
});

describe("CaptureService.confirm", () => {
  it("rejects confirming before submission", async () => {
    const { service } = makeDeps({ row: captureRow({ status: "OPEN" }) });
    await assert.rejects(
      () => service.confirm({ token: TOKEN }),
      expectError("BAD_REQUEST", /before confirming/i),
    );
  });

  it("confirms a PENDING_CONFIRMATION capture and returns the resolved preview", async () => {
    const { service, updated } = makeDeps({
      row: captureRow({
        status: "PENDING_CONFIRMATION",
        resolvedCityId: "city-1",
        resolvedMunicipalityId: "m-1",
        resolvedQuarterId: "q-1",
      }),
    });
    const result = await service.confirm({ token: TOKEN });
    assert.equal(result.status, "CONFIRMED");
    assert.equal(result.resolved.cityName, "Abidjan");
    assert.equal(updated.capture?.status, "CONFIRMED");
  });

  it("is idempotent when already confirmed", async () => {
    const { service } = makeDeps({
      row: captureRow({
        status: "CONFIRMED",
        resolvedCityId: "city-1",
        resolvedMunicipalityId: "m-1",
      }),
    });
    const result = await service.confirm({ token: TOKEN });
    assert.equal(result.status, "CONFIRMED");
    assert.equal(result.resolved.cityName, "Abidjan");
  });

  it("rejects confirming a capture that was already approved", async () => {
    const { service } = makeDeps({
      row: captureRow({
        status: "APPROVED",
        resolvedCityId: "city-1",
        resolvedMunicipalityId: "m-1",
      }),
    });
    await assert.rejects(
      () => service.confirm({ token: TOKEN }),
      expectError("BAD_REQUEST", /already been approved/i),
    );
  });
});

describe("CaptureService.approveCapture", () => {
  it("links the terminal and flips it to COMPLETE, writing an ActivityLog", async () => {
    let logged = false;
    let approvedStatus: string | null = null;
    const prisma = {
      companyLocation: {
        update: async ({ data }: { data: Row }) => ({
          ...terminalRow(),
          ...data,
        }),
      },
      locationCapture: {
        findUnique: async () =>
          captureRow({
            status: "CONFIRMED",
            resolvedCityId: "city-1",
            resolvedMunicipalityId: "m-1",
            resolvedQuarterId: "q-1",
            latitude: 5.351,
            longitude: -4.021,
          }),
        update: async ({ data }: { data: Row }) => {
          approvedStatus = data.status ?? null;
          return {};
        },
      },
      city: { findUnique: async () => ({ id: "city-1", name: "Abidjan" }) },
      municipality: {
        findUnique: async () => ({ id: "m-1", name: "Adjamé" }),
      },
      quarter: { findUnique: async () => ({ id: "q-1", name: "Monsieur" }) },
      activityLog: {
        create: async () => {
          logged = true;
          return {};
        },
      },
      $transaction: async <T>(fn: (tx: unknown) => Promise<T>) => fn(prisma),
    };

    const service = new CaptureService({
      prisma: prisma as never,
      resolvePlace: async () => null,
      now: () => NOW,
      generateToken: () => TOKEN,
    });

    const terminal = await service.approveCapture({
      companyId: COMPANY_A,
      userId: USER_A,
      captureId: CAPTURE_ID,
    });

    assert.equal(terminal.geoCaptureStatus, "COMPLETE");
    assert.equal(terminal.cityId, "city-1");
    assert.equal(terminal.municipalityId, "m-1");
    assert.equal(terminal.quarterId, "q-1");
    assert.equal(terminal.captureToken, null);
    assert.equal(approvedStatus, "APPROVED");
    assert.ok(logged);
  });

  it("fills the placeholder address with the resolved label", async () => {
    const prisma = {
      companyLocation: {
        update: async ({ data }: { data: Row }) => ({
          ...terminalRow(),
          ...data,
        }),
      },
      locationCapture: {
        findUnique: async () =>
          captureRow({
            status: "CONFIRMED",
            resolvedCityId: "city-1",
            resolvedMunicipalityId: "m-1",
            resolvedQuarterId: "q-1",
            latitude: 5.351,
            longitude: -4.021,
            location: terminalRow({ addressLine1: "(pending GPS capture)" }),
          }),
        update: async () => ({}),
      },
      city: { findUnique: async () => ({ id: "city-1", name: "Abidjan" }) },
      municipality: {
        findUnique: async () => ({ id: "m-1", name: "Adjamé" }),
      },
      quarter: { findUnique: async () => ({ id: "q-1", name: "Monsieur" }) },
      activityLog: { create: async () => ({}) },
      $transaction: async <T>(fn: (tx: unknown) => Promise<T>) => fn(prisma),
    };

    const service = new CaptureService({
      prisma: prisma as never,
      resolvePlace: async () => null,
      now: () => NOW,
      generateToken: () => TOKEN,
    });

    const terminal = await service.approveCapture({
      companyId: COMPANY_A,
      userId: USER_A,
      captureId: CAPTURE_ID,
    });

    assert.equal(terminal.addressLine1, "Abidjan (Adjamé - Monsieur)");
  });

  it("prefers the reverse-geocoded street address over the hierarchy label", async () => {
    const prisma = {
      companyLocation: {
        update: async ({ data }: { data: Row }) => ({
          ...terminalRow(),
          ...data,
        }),
      },
      locationCapture: {
        findUnique: async () =>
          captureRow({
            status: "CONFIRMED",
            resolvedCityId: "city-1",
            resolvedMunicipalityId: "m-1",
            resolvedQuarterId: "q-1",
            latitude: 5.351,
            longitude: -4.021,
            reverseGeocodedAddress: "12 Rue du Commerce, Adjamé",
            location: terminalRow({ addressLine1: "(pending GPS capture)" }),
          }),
        update: async () => ({}),
      },
      city: { findUnique: async () => ({ id: "city-1", name: "Abidjan" }) },
      municipality: {
        findUnique: async () => ({ id: "m-1", name: "Adjamé" }),
      },
      quarter: { findUnique: async () => ({ id: "q-1", name: "Monsieur" }) },
      activityLog: { create: async () => ({}) },
      $transaction: async <T>(fn: (tx: unknown) => Promise<T>) => fn(prisma),
    };

    const service = new CaptureService({
      prisma: prisma as never,
      resolvePlace: async () => null,
      now: () => NOW,
      generateToken: () => TOKEN,
    });

    const terminal = await service.approveCapture({
      companyId: COMPANY_A,
      userId: USER_A,
      captureId: CAPTURE_ID,
    });

    assert.equal(terminal.addressLine1, "12 Rue du Commerce, Adjamé");
  });

  it("leaves a real address untouched on approval", async () => {
    const baseTerminal = terminalRow({ addressLine1: "Rue du Commerce 12" });
    const prisma = {
      companyLocation: {
        update: async ({ data }: { data: Row }) => ({
          ...baseTerminal,
          ...data,
        }),
      },
      locationCapture: {
        findUnique: async () =>
          captureRow({
            status: "CONFIRMED",
            resolvedCityId: "city-1",
            resolvedMunicipalityId: "m-1",
            resolvedQuarterId: "q-1",
            latitude: 5.351,
            longitude: -4.021,
            location: terminalRow({ addressLine1: "Rue du Commerce 12" }),
          }),
        update: async () => ({}),
      },
      city: { findUnique: async () => ({ id: "city-1", name: "Abidjan" }) },
      municipality: {
        findUnique: async () => ({ id: "m-1", name: "Adjamé" }),
      },
      quarter: { findUnique: async () => ({ id: "q-1", name: "Monsieur" }) },
      activityLog: { create: async () => ({}) },
      $transaction: async <T>(fn: (tx: unknown) => Promise<T>) => fn(prisma),
    };

    const service = new CaptureService({
      prisma: prisma as never,
      resolvePlace: async () => null,
      now: () => NOW,
      generateToken: () => TOKEN,
    });

    const terminal = await service.approveCapture({
      companyId: COMPANY_A,
      userId: USER_A,
      captureId: CAPTURE_ID,
    });

    assert.equal(terminal.addressLine1, "Rue du Commerce 12");
  });

  it("refuses to approve a capture that is not CONFIRMED", async () => {
    const prisma = {
      companyLocation: { update: async () => ({}) },
      locationCapture: {
        findUnique: async () =>
          captureRow({
            status: "PENDING_CONFIRMATION",
            location: terminalRow(),
          }),
      },
      activityLog: { create: async () => ({}) },
      $transaction: async <T>(fn: (tx: unknown) => Promise<T>) => fn(prisma),
    };
    const service = new CaptureService({
      prisma: prisma as never,
      resolvePlace: async () => null,
      now: () => NOW,
      generateToken: () => TOKEN,
    });

    await assert.rejects(
      () =>
        service.approveCapture({
          companyId: COMPANY_A,
          userId: USER_A,
          captureId: CAPTURE_ID,
        }),
      expectError("BAD_REQUEST", /has not confirmed/i),
    );
  });

  it("refuses to touch a capture from another company", async () => {
    const prisma = {
      locationCapture: {
        findUnique: async () =>
          captureRow({
            status: "CONFIRMED",
            location: terminalRow({ companyId: "company-b" }),
          }),
      },
      $transaction: async <T>(fn: (tx: unknown) => Promise<T>) => fn(prisma),
    };
    const service = new CaptureService({
      prisma: prisma as never,
      resolvePlace: async () => null,
      now: () => NOW,
      generateToken: () => TOKEN,
    });

    await assert.rejects(
      () =>
        service.approveCapture({
          companyId: COMPANY_A,
          userId: USER_A,
          captureId: CAPTURE_ID,
        }),
      expectError("NOT_FOUND"),
    );
  });
});

describe("CaptureService.rejectCapture", () => {
  it("marks the capture REJECTED and returns the terminal to PENDING_CAPTURE", async () => {
    let logged = false;
    const prisma = {
      companyLocation: {
        update: async ({ data }: { data: Row }) => ({
          ...terminalRow(),
          ...data,
        }),
      },
      locationCapture: {
        findUnique: async () =>
          captureRow({ status: "CONFIRMED", location: terminalRow() }),
        update: async ({ data }: { data: Row }) => ({
          ...captureRow(),
          ...data,
        }),
      },
      activityLog: {
        create: async () => {
          logged = true;
          return {};
        },
      },
      $transaction: async <T>(fn: (tx: unknown) => Promise<T>) => fn(prisma),
    };
    const service = new CaptureService({
      prisma: prisma as never,
      resolvePlace: async () => null,
      now: () => NOW,
      generateToken: () => TOKEN,
    });

    const result = await service.rejectCapture({
      companyId: COMPANY_A,
      userId: USER_A,
      captureId: CAPTURE_ID,
    });
    assert.equal(result.success, true);
    assert.ok(logged);
  });
});

describe("CaptureService.sweepExpired", () => {
  it("expires stale captures", async () => {
    let updatedCount = 0;
    const prisma = {
      locationCapture: {
        findMany: async () => [{ id: CAPTURE_ID, locationId: TERMINAL_ID }],
        update: async () => {
          updatedCount++;
          return {};
        },
      },
      companyLocation: {
        findUnique: async () => terminalRow({ cityId: "city-1" }),
        update: async () => ({}),
      },
      $transaction: async <T>(fn: (tx: unknown) => Promise<T>) => fn(prisma),
    };
    const service = new CaptureService({
      prisma: prisma as never,
      resolvePlace: async () => null,
      now: () => NOW,
      generateToken: () => TOKEN,
    });

    const result = await service.sweepExpired();
    assert.equal(result.success, true);
    assert.equal(result.count, 1);
    assert.equal(updatedCount, 1);
  });
});
