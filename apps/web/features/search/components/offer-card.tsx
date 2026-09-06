"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import { Bus } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { Button, buttonVariants } from "@moja/ui/components/ui/button";
import { Card, CardContent } from "@moja/ui/components/ui/card";
import { Badge } from "@moja/ui/components/ui/badge";
import { CarrierAvatar } from "@moja/ui/components/ui/carrier-avatar";
import { formatDateWithWeekday } from "@/lib/format-date";
import {
  formatDepartureTime,
  formatPriceXOF,
  formatTripDuration,
} from "../lib/format";
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
  const [, setBookingOfferId] = useQueryState("bookingOfferId", {
    history: "push",
  });
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const isUrban = offer.serviceType === "URBAN";

  const handlePrefetch = () => {
    if (isSoldOut) return;
    void queryClient.prefetchQuery(
      trpc.booking.getTripDetails.queryOptions({ offerId: offer.offerId }),
    );
    void queryClient.prefetchQuery(
      trpc.booking.getSeatAvailability.queryOptions({ offerId: offer.offerId }),
    );
  };

  async function handleSelectSeats() {
    if (isSoldOut) return;

    await setBookingOfferId(offer.offerId);
  }

  return (
    <Card
      className="border border-border hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md rounded-2xl overflow-hidden group bg-card"
      onMouseEnter={handlePrefetch}
      onTouchStart={handlePrefetch}
    >
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-stretch justify-between gap-6">
          <div className="flex-grow space-y-4">
            <div className="flex items-center gap-3">
              <CarrierAvatar
                name={offer.companyName}
                logoUrl={offer.companyLogoUrl}
                size="md"
              />
              <div>
                <h4 className="font-bold text-foreground flex items-center gap-2 leading-tight">
                  {offer.companyName}
                  {offer.isExpress && (
                    <Badge className="bg-success/10 text-success hover:bg-success/20 border border-success/20 text-[10px] font-semibold py-0">
                      {t("express")}
                    </Badge>
                  )}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {offer.busTypeName}
                  </span>
                  <Badge
                    className={cn(
                      "text-[10px] font-bold py-0.5 px-2 rounded-full border",
                      offer.seatClass === "VIP"
                        ? "bg-warning/10 text-warning border-warning/30 shadow-sm"
                        : offer.seatClass === "STANDARD"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-muted text-muted-foreground border-border",
                    )}
                  >
                    {t(`seatClass.${offer.seatClass}`)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-2 py-2">
              <div className="md:col-span-2">
                <span className="text-lg md:text-xl font-bold font-heading text-foreground">
                  {formatDepartureTime(offer.departureTime)}
                </span>
                <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
                  {formatDateWithWeekday(offer.departureTime)}
                </p>
                <p className="text-xs font-bold text-muted-foreground mt-0.5 truncate">
                  {offer.originTerminalName}
                </p>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {formatLocationLabel({
                    cityName: offer.originCityName,
                    municipalityName: offer.originMunicipalityName,
                    quarterName: offer.originQuarterName,
                    isUrban,
                  })}
                </span>
              </div>

              <div className="md:col-span-3 flex flex-col items-center justify-center px-4 my-2 md:my-0">
                <span className="text-xs font-semibold text-muted-foreground mb-1">
                  {formatTripDuration(offer.durationMinutes)}
                </span>
                <div className="w-full h-[2px] bg-border relative flex items-center justify-center">
                  <div className="absolute h-2 w-2 rounded-full bg-border left-0" />
                  <Bus className="h-4 w-4 text-muted-foreground bg-card px-0.5 z-10" />
                  <div className="absolute h-2 w-2 rounded-full bg-primary right-0" />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground mt-1">
                  {offer.stopCount === 0
                    ? t("directRoute")
                    : offer.stopCount > 1
                      ? t("stopsPlural", { count: offer.stopCount })
                      : t("stops", { count: offer.stopCount })}
                </span>
              </div>

              <div className="md:col-span-2 text-left md:text-right">
                <span className="text-lg md:text-xl font-bold font-heading text-foreground">
                  {formatDepartureTime(offer.arrivalTime)}
                </span>
                <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
                  {formatDateWithWeekday(offer.arrivalTime)}
                </p>
                <p className="text-xs font-bold text-muted-foreground mt-0.5 truncate">
                  {offer.destinationTerminalName}
                </p>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {formatLocationLabel({
                    cityName: offer.destinationCityName,
                    municipalityName: offer.destinationMunicipalityName,
                    quarterName: offer.destinationQuarterName,
                    isUrban,
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:block w-[1px] bg-border self-stretch my-1" />

          <div className="flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-4 min-w-[160px]">
            <div className="text-left md:text-right">
              <span className="text-xs font-bold text-muted-foreground block uppercase tracking-wider">
                {t("totalFor", { count: passengers })}
              </span>
              <span className="text-2xl font-black font-heading text-primary tracking-tight">
                {formatPriceXOF(offer.priceXOF)}
              </span>
            </div>

            <div className="space-y-2 w-full md:w-auto">
              <Button
                onClick={() => void handleSelectSeats()}
                disabled={isSoldOut}
                className={cn(
                  "w-full h-10 px-6 rounded-xl font-bold text-sm transition-all duration-200",
                  isSoldOut
                    ? "bg-muted text-muted-foreground pointer-events-none shadow-none"
                    : "shadow-md active:scale-[0.98]",
                )}
              >
                {isSoldOut ? t("soldOut") : t("selectSeats")}
              </Button>

              <div className="text-center md:text-right">
                {isSoldOut ? (
                  <Badge className="bg-muted text-muted-foreground hover:bg-muted text-[10px] font-semibold py-0.5">
                    {t("fullyBooked")}
                  </Badge>
                ) : offer.availability.status === "FEW_LEFT" ? (
                  <Badge className="bg-warning/10 text-warning hover:bg-warning/20 border border-warning/30 text-[10px] font-semibold py-0.5 animate-pulse">
                    {t("onlyLeft", { count: offer.availability.remaining })}
                  </Badge>
                ) : (
                  <span className="text-[10px] font-semibold text-success block">
                    {t("seatsAvailable", {
                      count: offer.availability.remaining,
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {offer.amenities.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <AmenityChips amenities={offer.amenities} />
          </div>
        )}
      </CardContent>
    </Card>
  );
});
