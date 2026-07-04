import { NextResponse } from "next/server";
import { getPrismaClient } from "@moja/db";
import { BookingReadService } from "@/features/booking/services/booking-read-service";

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
  const wantsHtml = accept.includes("text/html") && !accept.includes("application/json");

  if (wantsHtml) {
    return NextResponse.redirect(
      new URL(`/tickets/${encodeURIComponent(token)}`, request.url),
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
