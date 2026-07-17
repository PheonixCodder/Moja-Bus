"use client";

import { Wallet, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";

interface WalletCardProps {
  availableBalance: number;
  walletId: string;
  onOpenTopup: () => void;
}

export function WalletCard({ availableBalance, walletId, onOpenTopup }: WalletCardProps) {
  // Use the last 6 characters of the wallet ID for a clean account label
  const accountSuffix = walletId ? walletId.slice(-6).toUpperCase() : "XXXXXX";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-hover to-pink-700 text-white p-6 sm:p-8 shadow-lg shadow-primary/10 flex flex-col justify-between min-h-[220px]">
      {/* Visual background details - subtle radial glow using white/pink masks */}
      <div className="absolute top-0 right-0 w-[260px] h-[260px] bg-white/10 rounded-full blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[180px] h-[180px] bg-black/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Section */}
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white backdrop-blur-md">
            <Wallet className="size-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold tracking-wider uppercase text-white/90">
              Moja Wallet
            </h2>
            <p className="text-[10px] text-white/70 font-mono tracking-tight mt-0.5">
              Account ID: MW-{accountSuffix}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
          <ShieldCheck className="size-3.5 text-emerald-300" />
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-white">Verified</span>
        </div>
      </div>

      {/* Balance Details */}
      <div className="my-5 relative z-10">
        <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
          Available Balance
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-4xl sm:text-5xl font-black tracking-tight font-display">
            {availableBalance.toLocaleString()}
          </span>
          <span className="text-lg font-bold text-white/80">XOF</span>
        </div>
      </div>

      {/* Footer Section */}
      <div className="flex items-center justify-between border-t border-white/10 pt-4 relative z-10">
        <p className="text-[10px] text-white/70 font-semibold leading-none">
          Pre-funded Travel Account
        </p>
        
        <Button
          onClick={onOpenTopup}
          className="bg-white text-primary hover:bg-white/95 font-black h-10 px-5 rounded-xl shadow-md hover:shadow-lg transition-all gap-1.5 text-xs"
        >
          <Plus className="w-4 h-4" /> Top Up Wallet
        </Button>
      </div>
    </div>
  );
}
