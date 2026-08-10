"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import { Bus } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { buttonVariants } from "@moja/ui/components/ui/button";
import { Card, CardContent } from "@moja/ui/components/ui/card";
import { Badge } from "@moja/ui/components/ui/badge";
import { formatDateWithWeekday } from "@/lib/format-date";
import { formatDepartureTime, formatPriceXOF, formatTripDuration } from "../lib/format";
import { formatLocationLabel } from "@/lib/format-location-label";
import { AmenityChips } from "@/features/booking/lib/amenities";
import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@/trpc/client";

type SearchOffer = RouterOutputs["search"]["search"]["offers"][number];

export const OfferCard = memo(function OfferCard({
  offer,
  passengers = 1,
}: {
  offer: SearchOffer;
  passengers?: number;
}) {
  const t = useTranslations("search");
  const isSoldOut = offer.availability.status === "SOLD_OUT";
  const [, setBookingOfferId] = useQueryState("bookingOfferId", { history: "push" });
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const isUrban = offer.serviceType === "URBAN";

  const handlePrefetch = () => {
    if (isSoldOut) return;
    void queryClient.prefetchQuery(trpc.booking.getTripDetails.queryOptions({ offerId: offer.offerId }));
    void queryClient.prefetchQuery(trpc.booking.getSeatAvailability.queryOptions({ offerId: offer.offerId }));
  };

  async function handleSelectSeats() {
    if (isSoldOut) return;

    await setBookingOfferId(offer.offerId);
  }

  return (
    <Card 
      className="border border-slate-100 hover:border-pink-200 transition-all duration-300 shadow-sm hover:shadow-md rounded-2xl overflow-hidden group"
      onMouseEnter={handlePrefetch}
      onTouchStart={handlePrefetch}
    >
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-stretch justify-between gap-6">
          <div className="flex-grow space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-pink-100 border border-pink-200 text-[#ee237c] font-black flex items-center justify-center tracking-tighter">
                {offer.companyName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-2 leading-tight">
                  {offer.companyName}
                  {offer.isExpress && (
                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 text-[10px] font-semibold py-0">
                      {t("express")}
                    </Badge>
                  )}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-semibold text-slate-400">{offer.busTypeName}</span>
                  <Badge
                    className={cn(
                      "text-[10px] font-bold py-0.5 px-2 rounded-full border",
                      offer.seatClass === "VIP"
                        ? "bg-amber-100 text-amber-900 border-amber-300 shadow-sm"
                        : offer.seatClass === "STANDARD"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-slate-100 text-slate-700 border-slate-200",
                    )}
                  >
                    {t(`seatClass.${offer.seatClass}`)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-2 py-2">
              <div className="md:col-span-2">
                <span className="text-lg md:text-xl font-bold font-montserrat text-slate-800">
                  {formatDepartureTime(offer.departureTime)}
                </span>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  {formatDateWithWeekday(offer.departureTime)}
                </p>
                <p className="text-xs font-bold text-slate-500 mt-0.5 truncate">
                  {offer.originTerminalName}
                </p>
                <span className="text-[10px] font-semibold text-slate-400">{formatLocationLabel({ cityName: offer.originCityName, municipalityName: offer.originMunicipalityName, quarterName: offer.originQuarterName, isUrban })}</span>
              </div>

              <div className="md:col-span-3 flex flex-col items-center justify-center px-4 my-2 md:my-0">
                <span className="text-xs font-semibold text-slate-400 mb-1">
                  {formatTripDuration(offer.durationMinutes)}
                </span>
                <div className="w-full h-[2px] bg-slate-200 relative flex items-center justify-center">
                  <div className="absolute h-2 w-2 rounded-full bg-slate-300 left-0" />
                  <Bus className="h-4 w-4 text-slate-300 bg-white px-0.5 z-10" />
                  <div className="absolute h-2 w-2 rounded-full bg-[#ee237c] right-0" />
                </div>
                <span className="text-[10px] font-semibold text-slate-400 mt-1">
                  {offer.stopCount === 0
                    ? t("directRoute")
                    : offer.stopCount > 1
                      ? t("stopsPlural", { count: offer.stopCount })
                      : t("stops", { count: offer.stopCount })}
                </span>
              </div>

              <div className="md:col-span-2 text-left md:text-right">
                <span className="text-lg md:text-xl font-bold font-montserrat text-slate-800">
                  {formatDepartureTime(offer.arrivalTime)}
                </span>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  {formatDateWithWeekday(offer.arrivalTime)}
                </p>
                <p className="text-xs font-bold text-slate-500 mt-0.5 truncate">
                  {offer.destinationTerminalName}
                </p>
                <span className="text-[10px] font-semibold text-slate-400">{formatLocationLabel({ cityName: offer.destinationCityName, municipalityName: offer.destinationMunicipalityName, quarterName: offer.destinationQuarterName, isUrban })}</span>
              </div>
            </div>
          </div>

          <div className="hidden md:block w-[1px] bg-slate-100 self-stretch my-1" />

          <div className="flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-4 min-w-[160px]">
            <div className="text-left md:text-right">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                {t("totalFor", { count: passengers })}
              </span>
              <span className="text-2xl font-black font-montserrat text-[#ee237c] tracking-tight">
                {formatPriceXOF(offer.priceXOF)}
              </span>
            </div>

            <div className="space-y-2 w-full md:w-auto">
              <button
                onClick={() => void handleSelectSeats()}
                disabled={isSoldOut}
                className={cn(
                  buttonVariants(),
                  "w-full h-10 px-6 rounded-xl font-bold text-sm transition-all duration-200",
                  isSoldOut
                    ? "bg-slate-200 text-slate-400 pointer-events-none"
                    : "bg-[#ee237c] hover:bg-[#d01867] text-white shadow-md shadow-pink-500/10 active:scale-[0.98]",
                )}
              >
                {isSoldOut ? t("soldOut") : t("selectSeats")}
              </button>

              <div className="text-center md:text-right">
                {isSoldOut ? (
                  <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 text-[10px] font-semibold py-0.5">
                    {t("fullyBooked")}
                  </Badge>
                ) : offer.availability.status === "FEW_LEFT" ? (
                  <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border border-amber-200 text-[10px] font-semibold py-0.5 animate-pulse">
                    {t("onlyLeft", { count: offer.availability.remaining })}
                  </Badge>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-600 block">
                    {t("seatsAvailable", { count: offer.availability.remaining })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {offer.amenities.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <AmenityChips amenities={offer.amenities} />
          </div>
        )}
      </CardContent>
    </Card>
  );
});