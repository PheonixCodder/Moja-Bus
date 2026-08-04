import { NextResponse } from "next/server";
import { getPrismaClient } from "@moja/db";

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

  return NextResponse.json({ ...livenessBody(), db: "ok" });
}
