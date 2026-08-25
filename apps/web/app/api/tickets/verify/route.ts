import { getPrismaClient } from "@moja/db";
import { NextResponse } from "next/server";
import { BookingReadService } from "@/features/booking/services/booking-read-service";
import { getAppOrigin } from "@/lib/app-origin";

/**
 * P3-8 — ACCEPTED v1 RISK (documented consciously, Phase 19):
 * signed tokens (pt.<payload>.<sig>) are strictly validated; the raw-string
 * grace window (any ≥16-char token matching a live booking reference) remains
 * open until departure to keep rural offline scanning functional. Exploitation
 * requires possession of the booking reference AND gate context. Revisit if
 * ticket fraud ever appears in ops reports — enforcement is a ~5-line change
 * in BookingReadService.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { valid: false, message: "Missing ticket token" },
      { status: 400 },
    );
  }

  const accept = request.headers.get("accept") ?? "";
  const wantsHtml =
    accept.includes("text/html") && !accept.includes("application/json");

  if (wantsHtml) {
    return NextResponse.redirect(
      new URL(
        `/tickets/${encodeURIComponent(token)}`,
        getAppOrigin(new URL(request.url).origin),
      ),
    );
  }

  const service = new BookingReadService(getPrismaClient());
  const result = await service.verifyTicketByToken(token);

  if (!result.valid) {
    return NextResponse.json(
      { valid: false, message: "Invalid or inactive ticket" },
      { status: 404 },
    );
  }

  return NextResponse.json(result);
}
