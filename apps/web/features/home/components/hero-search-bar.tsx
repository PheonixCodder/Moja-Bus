"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane,
  Hotel,
  Train,
  Bus,
  Package,
  Search,
  MapPin,
  Calendar,
  Users,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import {
  CityAutocompleteField,
  type CityValue,
} from "@/features/search/components/city-autocomplete-field";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@moja/ui/components/ui/popover";
import { Calendar as CalendarComponent } from "@moja/ui/components/ui/calendar";

import { useTranslations } from "next-intl";

const todayISO = () => new Date().toISOString().split("T")[0]!;

function parseLocalDate(dateStr: string) {
  if (!dateStr) return undefined;
  const [y, m, d] = dateStr.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d));
}

const TABS = [
  {
    id: "buses",
    label: "Buses",
    icon: Bus,
    color: "from-primary to-primary/80",
    bg: "bg-primary/5",
    border: "border-primary",
    text: "text-primary",
    placeholder: { from: "From city", to: "To city" },
    comingSoon: false,
  },
  {
    id: "flights",
    label: "Flights",
    icon: Plane,
    color: "from-primary to-primary/80",
    bg: "bg-primary/5",
    border: "border-primary",
    text: "text-primary",
    placeholder: { from: "From (e.g. Abidjan)", to: "To (e.g. Paris)" },
    comingSoon: true,
  },
  {
    id: "hotels",
    label: "Hotels",
    icon: Hotel,
    color: "from-primary to-primary/80",
    bg: "bg-primary/5",
    border: "border-primary",
    text: "text-primary",
    placeholder: { from: "City or hotel name", to: "" },
    comingSoon: true,
  },
  {
    id: "trains",
    label: "Trains",
    icon: Train,
    color: "from-primary to-primary/80",
    bg: "bg-primary/5",
    border: "border-primary",
    text: "text-primary",
    placeholder: { from: "From station", to: "To station" },
    comingSoon: true,
  },
  {
    id: "packages",
    label: "Packages",
    icon: Package,
    color: "from-primary to-primary/80",
    bg: "bg-primary/5",
    border: "border-primary",
    text: "text-primary",
    placeholder: { from: "Departing from", to: "Where to?" },
    comingSoon: true,
  },
] as const;

const POPULAR = ["Abidjan", "Yamoussoukro", "San Pedro", "Bouake", "Korhogo"];

export function HeroSearchBar() {
  const t = useTranslations("landing.hero");
  const router = useRouter();
  const [activeTab, setActiveTab] =
    useState<(typeof TABS)[number]["id"]>("buses");

  const [origin, setOrigin] = useState<CityValue>({ id: "", text: "" });
  const [destination, setDestination] = useState<CityValue>({
    id: "",
    text: "",
  });
  const [date, setDate] = useState(todayISO());
  const [travelers, setTravelers] = useState(1);

  const tab = TABS.find((t) => t.id === activeTab)!;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (activeTab === "buses") {
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
      if (
        originVal === destVal &&
        !origin.terminalId &&
        !destination.terminalId
      ) {
        toast.error(t("validation.sameCity"));
        return;
      }
      const params = new URLSearchParams({
        from: originVal,
        to: destVal,
        date,
        passengers: String(travelers),
      });
      if (origin.municipalityId) params.set("fromMuni", origin.municipalityId);
      if (destination.municipalityId)
        params.set("toMuni", destination.municipalityId);
      if (origin.quarterId) params.set("fromQuarter", origin.quarterId);
      if (destination.quarterId) params.set("toQuarter", destination.quarterId);
      if (origin.terminalId) params.set("fromTerminal", origin.terminalId);
      if (destination.terminalId)
        params.set("toTerminal", destination.terminalId);
      router.push(`/search?${params.toString()}`);
    } else {
      toast.info(`${tab.label} booking is coming soon!`);
    }
  }

  return (
    <div className="w-full">
      <div className="flex overflow-x-auto scrollbar-hide border-b border-border rounded-t-xl">
        {TABS.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant="ghost"
            onClick={() => setActiveTab(item.id)}
            className={`flex-1 min-w-[90px] h-auto flex flex-col items-center gap-1.5 px-4 py-4 text-xs font-semibold transition-all duration-200 border-b-2 rounded-none shadow-none ${
              activeTab === item.id
                ? `${item.border} ${item.text} ${item.bg} first:rounded-tl-4xl last:rounded-tr-4xl`
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 first:hover:rounded-tl-4xl last:hover:rounded-tr-4xl"
            }`}
          >
            <item.icon
              className={`w-5 h-5 ${activeTab === item.id ? item.text : "text-muted-foreground/60"}`}
            />
            <span className="flex items-center gap-1">
              {t(`tabs.${item.id}`)}
              {item.comingSoon && (
                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-warning/10 text-warning leading-none">
                  {t("soonBadge")}
                </span>
              )}
            </span>
          </Button>
        ))}
      </div>

      <AnimatePresence mode="popLayout">
        <motion.form
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          onSubmit={handleSearch}
          className="p-5 md:p-6"
        >
          {activeTab === "buses" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {t("from")}
                  </label>
                  <CityAutocompleteField
                    value={origin}
                    onChange={setOrigin}
                    placeholder={t("departurePlaceholder")}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {t("to")}
                  </label>
                  <CityAutocompleteField
                    value={destination}
                    onChange={setDestination}
                    placeholder={t("destinationPlaceholder")}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    {t("date")}
                  </label>
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-medium hover:border-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-left shadow-xs h-10 font-normal"
                        />
                      }
                    >
                      <span className="truncate">
                        {date
                          ? format(parseLocalDate(date)!, "d MMM yyyy")
                          : t("pickDate")}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 rounded-2xl shadow-xl border-border"
                      align="start"
                    >
                      <CalendarComponent
                        mode="single"
                        selected={parseLocalDate(date)}
                        onSelect={(newDate) => {
                          if (newDate) setDate(format(newDate, "yyyy-MM-dd"));
                        }}
                        disabled={{
                          before: new Date(new Date().setHours(0, 0, 0, 0)),
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    {t("passengers")}
                  </label>
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-medium hover:border-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-left shadow-xs h-10 font-normal"
                        />
                      }
                    >
                      <span className="truncate">
                        {travelers === 1
                          ? t("guest", { count: 1 })
                          : t("guests", { count: travelers })}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-48 p-3 rounded-2xl shadow-xl border-border"
                      align="start"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {t("passengers")}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              setTravelers(Math.max(1, travelers - 1))
                            }
                            disabled={travelers <= 1}
                            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground disabled:opacity-30 hover:bg-muted font-bold p-0"
                          >
                            -
                          </Button>
                          <span className="w-4 text-center text-sm font-semibold text-foreground">
                            {travelers}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              setTravelers(Math.min(9, travelers + 1))
                            }
                            disabled={travelers >= 9}
                            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground disabled:opacity-30 hover:bg-muted font-bold p-0"
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-border">
                <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                  <span className="text-xs text-muted-foreground/70 font-medium">
                    {t("popular")}
                  </span>
                  {POPULAR.map((city) => (
                    <Button
                      key={city}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDestination({ id: city, text: city })}
                      className="text-xs px-2.5 py-1 h-auto rounded-lg bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary font-medium transition-colors shadow-none"
                    >
                      {city}
                    </Button>
                  ))}
                </div>
                <Button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-2.5 font-semibold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all shrink-0 h-10"
                >
                  <Search className="w-4 h-4" />
                  {t("search")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-center min-h-[140px]">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                <tab.icon className="w-6 h-6 text-muted-foreground/60" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">
                {t("comingSoonHeading", { service: t(`tabs.${tab.id}`) })}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                {t("comingSoonDesc", {
                  service: t(`tabs.${tab.id}`).toLowerCase(),
                })}
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning/10 border border-warning/30 text-warning text-xs font-semibold">
                <span className="text-sm">✨</span>
                {t("comingSoonBadge")}
              </div>
            </div>
          )}
        </motion.form>
      </AnimatePresence>
    </div>
  );
}
