"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane, Hotel, Train, Bus, Package, Search, MapPin, Calendar, Users, ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import { CityAutocompleteField, type CityValue } from "@/features/search/components/city-autocomplete-field";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@moja/ui/components/ui/popover";
import { Calendar as CalendarComponent } from "@moja/ui/components/ui/calendar";

import { useTranslations } from "next-intl";

const todayISO = () => new Date().toISOString().split("T")[0]!;

function parseLocalDate(dateStr: string) {
  if (!dateStr) return undefined;
  const [y, m, d] = dateStr.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d));
}

const TABS = [
  {
    id: "buses",
    label: "Buses",
    icon: Bus,
    color: "from-[#ee237c] to-[#c71d65]",
    bg: "bg-pink-50",
    border: "border-[#ee237c]",
    text: "text-[#ee237c]",
    placeholder: { from: "From city", to: "To city" },
    comingSoon: false,
  },
  {
    id: "flights",
    label: "Flights",
    icon: Plane,
    color: "from-[#ee237c] to-[#c71d65]",
    bg: "bg-pink-50",
    border: "border-[#ee237c]",
    text: "text-[#ee237c]",
    placeholder: { from: "From (e.g. Abidjan)", to: "To (e.g. Paris)" },
    comingSoon: true,
  },
  {
    id: "hotels",
    label: "Hotels",
    icon: Hotel,
    color: "from-[#ee237c] to-[#c71d65]",
    bg: "bg-pink-50",
    border: "border-[#ee237c]",
    text: "text-[#ee237c]",
    placeholder: { from: "City or hotel name", to: "" },
    comingSoon: true,
  },
  {
    id: "trains",
    label: "Trains",
    icon: Train,
    color: "from-[#ee237c] to-[#c71d65]",
    bg: "bg-pink-50",
    border: "border-[#ee237c]",
    text: "text-[#ee237c]",
    placeholder: { from: "From station", to: "To station" },
    comingSoon: true,
  },
  {
    id: "packages",
    label: "Packages",
    icon: Package,
    color: "from-[#ee237c] to-[#c71d65]",
    bg: "bg-pink-50",
    border: "border-[#ee237c]",
    text: "text-[#ee237c]",
    placeholder: { from: "Departing from", to: "Where to?" },
    comingSoon: true,
  },
] as const;

const POPULAR = ["Abidjan", "Yamoussoukro", "San Pedro", "Bouaké", "Korhogo"];

export function HeroSearchBar() {
  const t = useTranslations("landing.hero");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("buses");
  
  // For buses
  const [origin, setOrigin] = useState<CityValue>({ id: "", text: "" });
  const [destination, setDestination] = useState<CityValue>({ id: "", text: "" });
  
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
      if (originVal === destVal) {
        toast.error(t("validation.sameCity"));
        return;
      }
      const params = new URLSearchParams({
        from: originVal,
        to: destVal,
        date,
        passengers: String(travelers),
      });
      router.push(`/search?${params.toString()}`);
    } else {
      toast.info(`${tab.label} booking is coming soon!`);
    }
  }

  return (
    <div className="w-full">
      {/* Booking type tabs */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-slate-100 rounded-t-xl">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`flex-1 min-w-[90px] flex flex-col items-center gap-1.5 px-4 py-4 text-xs font-semibold transition-all duration-200 border-b-2 relative ${
              activeTab === item.id
                ? `${item.border} ${item.text} ${item.bg} h-full w-full first:rounded-tl-4xl last:rounded-tr-4xl`
                : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 h-full w-full first:hover:rounded-tl-4xl last:hover:rounded-tr-4xl"
            }`}
          >
            <item.icon className={`w-5 h-5 ${activeTab === item.id ? item.text : "text-slate-400"}`} />
            <span className="flex items-center gap-1">
              {t(`tabs.${item.id}`)}
              {item.comingSoon && (
                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-600 leading-none">
                  {t("soonBadge")}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Search form */}
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
                {/* From Field */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#ee237c]" />
                    {t("from")}
                  </label>
                  <CityAutocompleteField
                    value={origin}
                    onChange={setOrigin}
                    placeholder={t("departurePlaceholder")}
                  />
                </div>

                {/* To Field */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#ee237c]" />
                    {t("to")}
                  </label>
                  <CityAutocompleteField
                    value={destination}
                    onChange={setDestination}
                    placeholder={t("destinationPlaceholder")}
                  />
                </div>

                {/* Date Field */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#ee237c]" />
                    {t("date")}
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#ee237c]/20 transition-all text-left shadow-xs h-10"
                      >
                        <span className="truncate">
                          {date ? format(parseLocalDate(date)!, "d MMM yyyy") : t("pickDate")}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-slate-100" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={parseLocalDate(date)}
                        onSelect={(newDate) => {
                          if (newDate) {
                            setDate(format(newDate, "yyyy-MM-dd"));
                          }
                        }}
                        disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Travelers Field */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#ee237c]" />
                    {t("passengers")}
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#ee237c]/20 transition-all text-left shadow-xs h-10"
                      >
                        <span className="truncate">
                          {travelers === 1 ? t("guest", { count: 1 }) : t("guests", { count: travelers })}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-3 rounded-2xl shadow-xl border-slate-100" align="start">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">{t("passengers")}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setTravelers(Math.max(1, travelers - 1))}
                            disabled={travelers <= 1}
                            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30 hover:bg-slate-50 font-bold"
                          >
                            -
                          </button>
                          <span className="w-4 text-center text-sm font-semibold text-slate-900">
                            {travelers}
                          </span>
                          <button
                            type="button"
                            onClick={() => setTravelers(Math.min(9, travelers + 1))}
                            disabled={travelers >= 9}
                            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30 hover:bg-slate-50 font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Bottom bar: popular routes & search button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                  <span className="text-xs text-slate-400 font-medium">{t("popular")}</span>
                  {POPULAR.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setDestination({ id: city, text: city })}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-[#ee237c]/10 hover:text-[#ee237c] font-medium transition-colors"
                    >
                      {city}
                    </button>
                  ))}
                </div>

                <Button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-2.5 bg-[#ee237c] hover:bg-[#c71d65] text-white font-semibold text-sm rounded-xl shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all hover:shadow-xl hover:shadow-pink-500/30 shrink-0 h-10"
                >
                  <Search className="w-4 h-4" />
                  {t("search")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-center min-h-[140px]">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <tab.icon className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-700 mb-1">
                {t("comingSoonHeading", { service: t(`tabs.${tab.id}`) })}
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
                {t("comingSoonDesc", { service: t(`tabs.${tab.id}`).toLowerCase() })}
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
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
