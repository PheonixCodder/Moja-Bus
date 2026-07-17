"use client";

import * as React from "react";
import QRCode from "react-qr-code";
import { ArrowRight, Calendar, Armchair } from "lucide-react";

interface LiveBoardingProps {
  origin: string;
  destination: string;
  departureTime: Date;
  seatId: string;
  qrPayload: string;
}

export function LiveBoardingPass({
  origin,
  destination,
  departureTime,
  seatId,
  qrPayload,
}: LiveBoardingProps) {
  const [timeLeft, setTimeLeft] = React.useState("");

  React.useEffect(() => {
    const updateCountdown = () => {
      const diff = new Date(departureTime).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft("Boarding Closed / In Transit");
        return;
      }
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`Departs in ${hrs}h ${mins}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [departureTime]);

  return (
    <div className="bg-linear-to-r from-emerald-500/10 via-emerald-500/5 to-card border border-emerald-500/30 rounded-xl p-5 relative overflow-hidden shadow-xs dark:bg-card">
      <div className="flex flex-col sm:flex-row gap-5 items-center">
        <div className="bg-white p-2.5 rounded-lg border border-border shadow-xs shrink-0">
          <QRCode value={qrPayload} size={88} />
        </div>
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full animate-pulse">
              Live Boarding Pass
            </span>
            <span className="text-[10px] font-bold text-muted-foreground font-mono">
              {timeLeft}
            </span>
          </div>
          <h3 className="text-sm font-extrabold text-foreground flex items-center justify-center sm:justify-start gap-1.5">
            <span>{origin}</span>
            <ArrowRight className="size-3.5 text-muted-foreground" />
            <span>{destination}</span>
          </h3>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5 text-muted-foreground" />{" "}
              {new Date(departureTime).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Armchair className="size-3.5 text-muted-foreground" /> Seat {seatId}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
