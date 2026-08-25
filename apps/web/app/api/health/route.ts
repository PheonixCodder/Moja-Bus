import { getPrismaClient } from "@moja/db";
import { NextResponse } from "next/server";
import { getTelemetryBackend } from "@/server/telemetry-redis";

export const dynamic = "force-dynamic";

function livenessBody() {
  return {
    status: "ok",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    db: "skipped",
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const full = url.searchParams.get("full") === "1";

  if (!full) {
    return NextResponse.json(livenessBody());
  }

  try {
    await getPrismaClient().$queryRaw`SELECT 1`;
  } catch {
    return NextResponse.json(
      { ...livenessBody(), status: "degraded", db: "error" },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ...livenessBody(),
    db: "ok",
    // Phase 28 (F-TM-09) — active telemetry pub/sub backend is observable.
    telemetryPubSub: getTelemetryBackend(),
  });
}
