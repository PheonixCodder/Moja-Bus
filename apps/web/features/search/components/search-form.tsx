"use client";

import { Button } from "@moja/ui/components/ui/button";
import { Calendar as CalendarComponent } from "@moja/ui/components/ui/calendar";
import { Card, CardContent } from "@moja/ui/components/ui/card";
import { Input } from "@moja/ui/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@moja/ui/components/ui/popover";
import { format } from "date-fns";
import { ArrowUpDown, Calendar, Search, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useEffect, useState } from "react";
import { toast } from "sonner";
import { useCityDetails } from "../hooks/use-city-details";
import { useGeoPlaceLabel } from "../hooks/use-geo-place-label";
import { toLocalISODate } from "../lib/local-date";
import { validateSearchPair } from "../lib/validate-search-pair";
import {
  CityAutocompleteField,
  type CityValue,
} from "./city-autocomplete-field";

interface SearchFormProps {
  initialFromId: string;
  initialToId: string;
  initialFromMuni: string;
  initialToMuni: string;
  initialFromQuarter: string;
  initialToQuarter: string;
  initialDate: string;
  initialPassengers: number;
  onSearch: (criteria: {
    from: string;
    to: string;
    fromMuni: string;
    toMuni: string;
    fromQuarter: string;
    toQuarter: string;
    date: string;
    passengers: number;
  }) => void;
}

const todayISO = () => toLocalISODate(new Date());

function parseLocalDate(dateStr: string) {
  if (!dateStr) return undefined;
  const [y, m, d] = dateStr.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d));
}

export const SearchForm = memo(function SearchForm({
  initialFromId,
  initialToId,
  initialFromMuni,
  initialToMuni,
  initialFromQuarter,
  initialToQuarter,
  initialDate,
  initialPassengers,
  onSearch,
}: SearchFormProps) {
  const t = useTranslations("search");
  const [origin, setOrigin] = useState<CityValue>({
    id: initialFromId,
    text: "",
    ...(initialFromQuarter
      ? {
          municipalityId: initialFromMuni,
          quarterId: initialFromQuarter,
          level: "quarter",
        }
      : initialFromMuni
        ? { municipalityId: initialFromMuni, level: "municipality" }
        : {}),
  });
  const [destination, setDestination] = useState<CityValue>({
    id: initialToId,
    text: "",
    ...(initialToQuarter
      ? {
          municipalityId: initialToMuni,
          quarterId: initialToQuarter,
          level: "quarter",
        }
      : initialToMuni
        ? { municipalityId: initialToMuni, level: "municipality" }
        : {}),
  });
  const [date, setDate] = useState(initialDate || todayISO());
  const [passengers, setPassengers] = useState(initialPassengers);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Resolves city names for ids that arrived via the URL (deep link / SSR hydration)
  const { data: originCity } = useCityDetails(initialFromId);
  const { data: destCity } = useCityDetails(initialToId);

  // When a deep link targets a municipality or quarter, render the full
  // hierarchy label (e.g. "Abidjan (Cocody - Riviera 3)") in the box.
  const { data: originLabel } = useGeoPlaceLabel({
    cityId: initialFromId,
    municipalityId: initialFromMuni,
    quarterId: initialFromQuarter,
  });
  const { data: destLabel } = useGeoPlaceLabel({
    cityId: initialToId,
    municipalityId: initialToMuni,
    quarterId: initialToQuarter,
  });

  useEffect(() => {
    if (!originCity) return;
    const label =
      originLabel && (originLabel.municipalityName || originLabel.quarterName)
        ? [
            originLabel.cityName,
            originLabel.quarterName && originLabel.municipalityName
              ? `(${originLabel.municipalityName} - ${originLabel.quarterName})`
              : originLabel.municipalityName
                ? `(${originLabel.municipalityName})`
                : undefined,
          ]
            .filter(Boolean)
            .join(" ")
        : originCity.name;
    setOrigin((prev) => ({ ...prev, id: originCity.id, text: label }));
  }, [originCity, originLabel]);

  useEffect(() => {
    if (!destCity) return;
    const label =
      destLabel && (destLabel.municipalityName || destLabel.quarterName)
        ? [
            destLabel.cityName,
            destLabel.quarterName && destLabel.municipalityName
              ? `(${destLabel.municipalityName} - ${destLabel.quarterName})`
              : destLabel.municipalityName
                ? `(${destLabel.municipalityName})`
                : undefined,
          ]
            .filter(Boolean)
            .join(" ")
        : destCity.name;
    setDestination((prev) => ({ ...prev, id: destCity.id, text: label }));
  }, [destCity, destLabel]);

  function handleSwap() {
    const swappedOrigin: CityValue = { ...destination };
    const swappedDest: CityValue = { ...origin };
    setOrigin(swappedOrigin);
    setDestination(swappedDest);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const originVal = origin.id || origin.text.trim();
    const destVal = destination.id || destination.text.trim();

    if (!originVal) {
      toast.error(t("originRequired"));
      return;
    }
    if (!destVal) {
      toast.error(t("destinationRequired"));
      return;
    }

    const error = validateSearchPair(origin, destination);
    if (error === "sameCity") {
      toast.error(t("sameCity"));
      return;
    }

    onSearch({
      from: originVal,
      to: destVal,
      fromMuni: origin.municipalityId ?? "",
      toMuni: destination.municipalityId ?? "",
      fromQuarter: origin.quarterId ?? "",
      toQuarter: destination.quarterId ?? "",
      date,
      passengers,
    });
  }

  return (
    <Card className="bg-white/95 backdrop-blur-md shadow-2xl border border-slate-100 rounded-2xl overflow-hidden transition-all duration-300">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-3">
              <CityAutocompleteField
                label={t("leavingFrom")}
                placeholder={t("fromPlaceholder")}
                value={origin}
                onChange={setOrigin}
              />
            </div>

            <div className="lg:col-span-1 flex justify-center pb-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleSwap}
                className="h-10 w-10 p-0 rounded-full border-slate-200 hover:bg-slate-50 text-[#ee237c] active:scale-95 transition-all shadow-sm"
                title={t("swapTitle")}
              >
                <ArrowUpDown className="h-5 w-5 lg:rotate-90" />
              </Button>
            </div>

            <div className="lg:col-span-3">
              <CityAutocompleteField
                label={t("goingTo")}
                placeholder={t("toPlaceholder")}
                value={destination}
                onChange={setDestination}
              />
            </div>

            <div className="lg:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                {t("departureLabel")}
              </label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      className="relative w-full h-12 pl-10 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-left flex items-center hover:bg-white focus:bg-white focus:border-[#ee237c] focus:ring-2 focus:ring-[#ee237c]/20 transition-all outline-none text-slate-700"
                    />
                  }
                >
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  {date ? format(parseLocalDate(date)!, "PPP") : t("pickDate")}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={parseLocalDate(date)}
                    onSelect={(d) => {
                      if (d) {
                        setDate(format(d, "yyyy-MM-dd"));
                        setIsCalendarOpen(false);
                      }
                    }}
                    disabled={(d) =>
                      d < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="lg:col-span-1 relative">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                {t("travelersLabel")}
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 pointer-events-none" />
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className="pl-10 h-12 bg-slate-50 border-slate-200 focus:ring-[#ee237c] focus:border-[#ee237c] rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-[#ee237c] hover:bg-[#d01867] text-white font-semibold transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2"
              >
                <Search className="h-5 w-5" /> {t("findBus")}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
});
