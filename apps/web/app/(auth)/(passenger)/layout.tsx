import type { ReactNode } from "react";
import { Command } from "lucide-react";

export default function PassengerAuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-bg-surface">
      <div className="grid min-h-screen justify-center p-2 lg:grid-cols-2">
        {/* Right Cover Column (Desktop only) */}
        <div className="relative order-2 hidden h-full rounded-3xl bg-primary lg:flex flex-col justify-between p-12 text-white">
          <div className="space-y-2">
            <Command className="size-10 text-white" />
            <h1 className="font-bold text-3xl tracking-tight">Moja Ride</h1>
            <p className="text-sm opacity-90 max-w-md">
              Intercity bus travel across Côte d'Ivoire. Book tickets, track fleets, and travel with ease.
            </p>
          </div>

          <div className="flex gap-6 pt-10 border-t border-white/20">
            <div className="flex-1 space-y-1">
              <h2 className="font-bold text-sm">Seamless Booking</h2>
              <p className="text-xs opacity-80 leading-relaxed">
                Select your seat, pay via Mobile Money or Card, and get your digital ticket instantly.
              </p>
            </div>
            <div className="w-[1px] bg-white/20 h-auto" />
            <div className="flex-1 space-y-1">
              <h2 className="font-bold text-sm">Digital Wallet & Refunds</h2>
              <p className="text-xs opacity-80 leading-relaxed">
                Keep funds in your Moja Wallet, get instant refunds, and checkout with zero convenience fees.
              </p>
            </div>
          </div>
        </div>

        {/* Left Form Column */}
        <div className="relative order-1 flex h-full">{children}</div>
      </div>
    </main>
  );
}
