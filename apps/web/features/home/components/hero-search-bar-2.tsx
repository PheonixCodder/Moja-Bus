"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plane, Calendar, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { CityAutocompleteField, type CityValue } from "@/features/search/components/city-autocomplete-field";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@moja/ui/components/ui/popover";
import { Calendar as CalendarComponent } from "@moja/ui/components/ui/calendar";
import { TrustBar } from "@/features/home/components/trustbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";

const todayISO = () => new Date().toISOString().split("T")[0]!;

function parseLocalDate(dateStr: string) {
  if (!dateStr) return undefined;
  const [y, m, d] = dateStr.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d));
}

const POPULAR = ["Abidjan", "Yamoussoukro", "San Pedro", "Bouaké", "Korhogo"];

export interface HeroSearchBarProps {
  showTrustBar?: boolean;
  className?: string;
}

export function HeroSearchBar({ showTrustBar = true, className }: HeroSearchBarProps = {}) {
  const router = useRouter();
  const t = useTranslations("landing.hero");

  const [origin, setOrigin] = useState<CityValue>({ id: "", text: "" });
  const [destination, setDestination] = useState<CityValue>({ id: "", text: "" });

  const [date, setDate] = useState(todayISO());
  const [travelers, setTravelers] = useState(1);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);


  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const originVal = origin.id || origin.text.trim();
    const destVal = destination.id || destination.text.trim();

    if (!originVal) {
      toast.error(t("validation.noOrigin"));
      return;
    }
    if (!destVal) {
      toast.error(t("validation.noDestination"));
      return;
    }

    const sameCity = origin.id && destination.id && origin.id === destination.id;
    const bothCityLevel = origin.level !== "municipality" && origin.level !== "quarter"
      && destination.level !== "municipality" && destination.level !== "quarter";
    const sameMunicipality = origin.municipalityId && destination.municipalityId
      && origin.municipalityId === destination.municipalityId;
    const mixedGranularity = origin.id === destination.id && (
      (origin.level === "city" && destination.level === "municipality") ||
      (origin.level === "municipality" && destination.level === "city")
    );

    if ((!sameCity && originVal === destVal) || (sameCity && (bothCityLevel || sameMunicipality))) {
      toast.error(t("validation.sameCity"));
      return;
    }
    if (sameCity && mixedGranularity) {
      toast.error(t("validation.refineUrban"));
      return;
    }
    const sp = new URLSearchParams({
      from: originVal,
      to: destVal,
      date,
      passengers: String(travelers),
    });
    if (sameCity && origin.municipalityId) sp.set("fromMuni", origin.municipalityId);
    if (sameCity && destination.municipalityId) sp.set("toMuni", destination.municipalityId);
    router.push(`/search?${sp.toString()}`);
  }

  return (
    <div className={className || "w-full"}>
      <form onSubmit={handleSearch} className="p-5 w-full">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {/* From */}
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-slate-900 mb-2">{t("from")}</label>
            <CityAutocompleteField
              placeholder={t("departurePlaceholder")}
              value={origin}
              onChange={setOrigin}
              hideIcon={true}
              inputClassName="w-full h-12 px-4 rounded-xl border-none bg-slate-100 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#ee237c]/20 transition-all outline-none"
            />
          </div>

          {/* To */}
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-slate-900 mb-2">{t("to")}</label>
            <CityAutocompleteField
              placeholder={t("destinationPlaceholder")}
              value={destination}
              onChange={setDestination}
              hideIcon={true}
              inputClassName="w-full h-12 px-4 rounded-xl border-none bg-slate-100 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#ee237c]/20 transition-all outline-none"
            />
          </div>

          {/* Date */}
          <div className="w-full md:w-[220px]">
            <label className="block text-sm font-bold text-slate-900 mb-2">{t("date")}</label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className="relative w-full h-12 px-4 rounded-xl border-none bg-slate-100 text-sm font-medium text-left flex items-center hover:bg-slate-200 focus:bg-white focus:ring-2 focus:ring-[#ee237c]/20 transition-all outline-none text-slate-800"
                  />
                }
              >
                <Calendar className="w-4 h-4 text-slate-500 mr-2 shrink-0 pointer-events-none" />
                <span className="flex-1 truncate">
                  {date ? format(parseLocalDate(date)!, "PPP") : t("pickDate")}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-500 ml-2 shrink-0 pointer-events-none" />
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
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Passengers */}
          <div className="w-full md:w-[130px]">
            <label className="block text-sm font-bold text-slate-900 mb-2">{t("passengers")}</label>
            <Select
              value={String(travelers)}
              onValueChange={(val) => setTravelers(Number(val))}
            >
              <SelectTrigger className="w-full h-[48px]! px-4 rounded-lg border-none bg-slate-100 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#ee237c]/20 transition-all outline-none">
                <SelectValue placeholder={t("guest", { count: 1 })} />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <SelectItem className={"h-12!"} key={n} value={String(n)}>
                    {n === 1 ? t("guest", { count: n }) : t("guests", { count: n })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search button */}
          <div className="w-full md:w-auto">
            <Button
              type="submit"
              className="w-full md:w-auto h-12 px-8 rounded-xl bg-[#ee237c] text-white font-bold text-sm hover:bg-[#c71d65] hover:shadow-lg transition-all flex items-center justify-center border-0"
            >
              {t("search")}
              <Plane className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Popular destinations */}
        <div className="flex flex-wrap items-center gap-2 mt-5">
          <span className="text-xs text-slate-500 font-medium">{t("popular")}</span>
          {POPULAR.map((dest) => (
            <button
              key={dest}
              type="button"
              onClick={() => setDestination({ id: dest, text: dest })}
              className="text-xs font-medium px-3 py-1 rounded-full bg-slate-50 hover:bg-pink-50 text-slate-600 hover:text-[#ee237c] border border-slate-200 hover:border-pink-200 transition-all duration-150"
            >
              {dest}
            </button>
          ))}
        </div>
      </form>
      {showTrustBar && <TrustBar />}
    </div>
  );
}