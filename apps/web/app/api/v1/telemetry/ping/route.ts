import { driverLocationPingSchema } from "@moja/schemas";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logTelemetryEvent } from "@/lib/telemetry-observability";
import {
  isTelemetryAuthEnforced,
  verifyTelemetryDispatchToken,
} from "@/lib/telemetry-token";
import { persistPingBatch } from "@/server/telemetry-flush";
import {
  advanceReference,
  fetchPreviousPoint,
  type PreviousPoint,
} from "@/server/telemetry-prev-point";
import { redisPub } from "@/server/telemetry-redis";
import {
  clientIpFromHeaders,
  telemetryThrottle,
} from "@/lib/telemetry-throttle";
import { validateTelemetryPing } from "@/server/telemetry-validator";

const batchPingSchema = z.object({
  pings: z.array(driverLocationPingSchema).min(1).max(100),
});

export async function POST(req: NextRequest) {
  try {
    // Phase 37 (F-IN-15) — Tier-1 coarse IP pre-gate BEFORE any auth work:
    // flooding this endpoint costs a fixed-window reject, not HMAC compute.
    const ip = clientIpFromHeaders(req.headers);
    const ipGate = telemetryThrottle.ipGate(ip);
    if (!ipGate.ok) {
      logTelemetryEvent(
        "telemetry_throttled",
        { tier: "ip", ip, retryAfterMs: ipGate.retryAfterMs },
        "warn",
      );
      return NextResponse.json(
        { success: false, error: "Telemetry throttled" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(ipGate.retryAfterMs / 1000)),
          },
        },
      );
    }

    // Phase 16 (P1-4) — dispatch-token auth on the HTTP fallback path.
    let claims: ReturnType<typeof verifyTelemetryDispatchToken> = null;
    if (isTelemetryAuthEnforced()) {
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : null;
      claims = verifyTelemetryDispatchToken(token);
      if (!claims) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 },
        );
      }
    }

    // Phase 37 (F-IN-15) — Tier-2 per-driver ceiling keyed on the VERIFIED
    // identity (never IP: co-located drivers behind one NAT must not punish
    // each other). Enforcement-off/dev falls back to the IP key so the gate
    // still exercises. Moving cadence ~12/min; drain bursts ≤5 posts.
    const driverKey = claims?.d ?? ip;
    const driverGate = telemetryThrottle.driverCeiling(driverKey);
    if (!driverGate.ok) {
      logTelemetryEvent(
        "telemetry_throttled",
        {
          tier: "driver",
          driverProfileId: claims?.d ?? null,
          ip,
          retryAfterMs: driverGate.retryAfterMs,
        },
        "warn",
      );
      return NextResponse.json(
        { success: false, error: "Telemetry throttled" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(driverGate.retryAfterMs / 1000)),
          },
        },
      );
    }

    const body = await req.json();
    const isBatch = Array.isArray(body?.pings);

    const pingsToProcess = isBatch
      ? batchPingSchema.parse(body).pings
      : [driverLocationPingSchema.parse(body)];

    let rejected = 0;
    let unauthorized = 0;
    const accepted: typeof pingsToProcess = [];

    // Phase 28 (F-TM-07) — the Haversine jump gate now runs on the HTTP path
    // (the ONLY production path). The previous point comes from the shared
    // store (DriverProfile.last* columns), then chains in-batch; only GOOD
    // fixes may become references (see telemetry-prev-point.ts).
    const referenceByDriver = new Map<string, PreviousPoint | null>();
    const previousFor = async (
      driverProfileId: string,
    ): Promise<PreviousPoint | null> => {
      const cached = referenceByDriver.get(driverProfileId);
      if (cached !== undefined) return cached;
      const point = await fetchPreviousPoint(driverProfileId);
      referenceByDriver.set(driverProfileId, point);
      return point;
    };

    for (const ping of pingsToProcess) {
      // Authenticated batches stream under the token's identity only:
      // spoofed payload ids are rejected, not rewritten.
      if (claims) {
        if (ping.driverProfileId !== claims.d) {
          unauthorized++;
          continue;
        }
        if (claims.t && ping.tripId && ping.tripId !== claims.t) {
          unauthorized++;
          continue;
        }
        if (claims.t && !ping.tripId) {
          ping.tripId = claims.t;
        }
      }

      const validation = validateTelemetryPing(
        ping,
        await previousFor(ping.driverProfileId),
      );
      if (!validation.isValid) {
        rejected++;
        logTelemetryEvent(
          "telemetry_ping_rejected",
          {
            transport: "http",
            driverProfileId: ping.driverProfileId,
            tripId: ping.tripId ?? null,
            accuracyMeters: ping.accuracyMeters ?? null,
            reason: validation.reason,
            calculatedSpeedKmh: validation.calculatedSpeedKmh ?? null,
          },
          "warn",
        );
        continue;
      }

      accepted.push(ping);
      // Only good fixes advance the reference — flagged ones stay transparent
      // to the gate but are still validated against it.
      referenceByDriver.set(
        ping.driverProfileId,
        advanceReference(
          referenceByDriver.get(ping.driverProfileId) ?? null,
          ping,
        ),
      );
    }

    if (unauthorized > 0) {
      logTelemetryEvent(
        "telemetry_ping_unauthorized",
        {
          transport: "http",
          count: unauthorized,
          claimedDriver: claims?.d ?? null,
        },
        "warn",
      );
    }

    // Phase 18 (P2-11) — direct synchronous write: nothing depends on a
    // background timer outliving this invocation. A DB failure surfaces as
    // 503 so the driver app keeps pings in its offline queue for retry.
    let persisted = 0;
    if (accepted.length > 0) {
      try {
        persisted = await persistPingBatch(accepted);
      } catch (err) {
        console.error("[Telemetry] HTTP ingest persist failed:", err);
        return NextResponse.json(
          { success: false, error: "Persistence unavailable" },
          { status: 503 },
        );
      }

      for (const ping of accepted) {
        if (!ping.tripId) continue;
        const payload = JSON.stringify({
          event: "telemetry:update",
          data: {
            driverProfileId: ping.driverProfileId,
            tripId: ping.tripId,
            latitude: ping.latitude,
            longitude: ping.longitude,
            speedKmh: ping.speedKmh,
            heading: ping.heading,
            accuracyMeters: ping.accuracyMeters,
            recordedAt: ping.recordedAt,
          },
        });
        // Phase 6 (D7 / Issue A) — publish to trip room AND operator fleet room
        // if the verified dispatch token carries company attribution `c`.
        redisPub
          .publish(`trip:${ping.tripId}:telemetry`, payload)
          .catch(() => {});

        if (claims?.c) {
          redisPub
            .publish(`operator:${claims.c}:fleet`, payload)
            .catch(() => {});
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: pingsToProcess.length,
      persisted,
      rejected,
      unauthorized,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to process telemetry ping",
      },
      { status: 400 },
    );
  }
}
