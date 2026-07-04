import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Ticket } from "lucide-react";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { PublicTicketView } from "@/features/booking/views/public-ticket-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { getPrismaClient } from "@moja/db";
import { BookingReadService } from "@/features/booking/services/booking-read-service";

export const metadata = {
  title: "Digital Ticket — Moja Ride",
  description: "Your bus ticket. Show this QR code when boarding.",
};

interface PublicTicketPageProps {
  params: Promise<{ token: string }>;
}

async function assertTicketExists(token: string) {
  const decoded = decodeURIComponent(token);
  const service = new BookingReadService(getPrismaClient());
  try {
    await service.getTicketByToken(decoded);
    return decoded;
  } catch {
    notFound();
  }
}

export default async function PublicTicketPage({ params }: PublicTicketPageProps) {
  const { token: rawToken } = await params;
  const ticketToken = await assertTicketExists(rawToken);

  await prefetch(
    trpc.booking.getTicketByToken.queryOptions({ ticketToken }),
  );

  return (
    <HydrateClient>
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center gap-2">
            <Ticket className="size-5 text-[#ee237c]" />
            <Link href="/" className="text-sm font-bold text-slate-900">
              Moja Ride
            </Link>
            <span className="text-xs text-slate-500 ml-auto">Digital ticket</span>
          </div>
        </header>

        <Suspense
          fallback={
            <div className="flex justify-center py-24">
              <Spinner className="size-8 text-[#ee237c]" />
            </div>
          }
        >
          <PublicTicketView ticketToken={ticketToken} />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
