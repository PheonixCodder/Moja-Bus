"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plane, Calendar, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import {
  CityAutocompleteField,
  type CityValue,
} from "@/features/search/components/city-autocomplete-field";
import { validateSearchPair } from "@/features/search/lib/validate-search-pair";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@moja/ui/components/ui/popover";
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
  const [y, m, d] = dateStr.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d));
}

const POPULAR = ["Abidjan", "Yamoussoukro", "San Pedro", "Bouaké", "Korhogo"];

export interface HeroSearchBarProps {
  showTrustBar?: boolean;
  className?: string;
}

export function HeroSearchBar({
  showTrustBar = true,
  className,
}: HeroSearchBarProps = {}) {
  const router = useRouter();
  const t = useTranslations("landing.hero");

  const [origin, setOrigin] = useState<CityValue>({ id: "", text: "" });
  const [destination, setDestination] = useState<CityValue>({
    id: "",
    text: "",
  });

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

    const error = validateSearchPair(origin, destination);
    if (error === "sameCity") {
      toast.error(t("validation.sameCity"));
      return;
    }

    const sp = new URLSearchParams({
      from: originVal,
      to: destVal,
      date,
      passengers: String(travelers),
    });
    if (origin.municipalityId) sp.set("fromMuni", origin.municipalityId);
    if (destination.municipalityId)
      sp.set("toMuni", destination.municipalityId);
    if (origin.quarterId) sp.set("fromQuarter", origin.quarterId);
    if (destination.quarterId) sp.set("toQuarter", destination.quarterId);
    if (origin.terminalId) sp.set("fromTerminal", origin.terminalId);
    if (origin.terminalName) sp.set("fromTerminalName", origin.terminalName);
    if (destination.terminalId) sp.set("toTerminal", destination.terminalId);
    if (destination.terminalName)
      sp.set("toTerminalName", destination.terminalName);
    if (origin.companyName) sp.set("fromCompanyName", origin.companyName);
    if (destination.companyName)
      sp.set("toCompanyName", destination.companyName);
    router.push(`/search?${sp.toString()}`);
  }

  return (
    <div className={className || "w-full"}>
      <form onSubmit={handleSearch} className="p-5 w-full">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {/* From */}
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-foreground mb-2">
              {t("from")}
            </label>
            <CityAutocompleteField
              placeholder={t("departurePlaceholder")}
              value={origin}
              onChange={setOrigin}
              hideIcon={true}
              inputClassName="w-full h-12 px-4 rounded-xl border-none bg-muted text-sm font-medium text-foreground focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>

          {/* To */}
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-foreground mb-2">
              {t("to")}
            </label>
            <CityAutocompleteField
              placeholder={t("destinationPlaceholder")}
              value={destination}
              onChange={setDestination}
              hideIcon={true}
              inputClassName="w-full h-12 px-4 rounded-xl border-none bg-muted text-sm font-medium text-foreground focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>

          {/* Date */}
          <div className="w-full md:w-[220px]">
            <label className="block text-sm font-bold text-foreground mb-2">
              {t("date")}
            </label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    className="relative w-full h-12 px-4 rounded-xl border-none bg-muted text-sm font-medium text-left flex items-center justify-start hover:bg-muted/80 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground shadow-none font-normal"
                  />
                }
              >
                <Calendar className="w-4 h-4 text-muted-foreground mr-2 shrink-0 pointer-events-none" />
                <span className="flex-1 truncate">
                  {date ? format(parseLocalDate(date)!, "PPP") : t("pickDate")}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground ml-2 shrink-0 pointer-events-none" />
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

          {/* Passengers */}
          <div className="w-full md:w-[130px]">
            <label className="block text-sm font-bold text-foreground mb-2">
              {t("passengers")}
            </label>
            <Select
              value={String(travelers)}
              onValueChange={(val) => setTravelers(Number(val))}
            >
              <SelectTrigger className="w-full h-[48px]! px-4 rounded-lg border-none bg-muted text-sm font-medium text-foreground focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none">
                <SelectValue placeholder={t("guest", { count: 1 })} />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <SelectItem className={"h-12!"} key={n} value={String(n)}>
                    {n === 1
                      ? t("guest", { count: n })
                      : t("guests", { count: n })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search button */}
          <div className="w-full md:w-auto">
            <Button
              type="submit"
              className="w-full md:w-auto h-12 px-8 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center border-0"
            >
              {t("search")}
              <Plane className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Popular destinations */}
        <div className="flex flex-wrap items-center gap-2 mt-5">
          <span className="text-xs text-muted-foreground font-medium">
            {t("popular")}
          </span>
          {POPULAR.map((dest) => (
            <Button
              key={dest}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDestination({ id: "", text: dest })}
              className="text-xs font-medium px-3 py-1 h-auto rounded-full bg-muted/40 hover:bg-primary/10 text-muted-foreground hover:text-primary border-border hover:border-primary/20 transition-all duration-150 shadow-none"
            >
              {dest}
            </Button>
          ))}
        </div>
      </form>
      {showTrustBar && <TrustBar />}
    </div>
  );
}
