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
        toast.error("Please select a departure city");
        return;
      }
      if (!destVal) {
        toast.error("Please select a destination city");
        return;
      }
      if (originVal === destVal) {
        toast.error("Origin and destination cannot be the same");
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
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 min-w-[90px] flex flex-col items-center gap-1.5 px-4 py-4 text-xs font-semibold transition-all duration-200 border-b-2 relative ${
              activeTab === t.id
                ? `${t.border} ${t.text} ${t.bg} h-full w-full first:rounded-tl-4xl last:rounded-tr-4xl`
                : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 h-full w-full first:hover:rounded-tl-4xl last:hover:rounded-tr-4xl"
            }`}
          >
            <t.icon className={`w-5 h-5 ${activeTab === t.id ? t.text : "text-slate-400"}`} />
            <span className="flex items-center gap-1">
              {t.label}
              {t.comingSoon && (
                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-600 leading-none">
                  SOON
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
          transition={{ duration: 0.2 }}
          onSubmit={handleSearch}
          className="p-5 w-full"
        >
          {activeTab === "buses" ? (
            <>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                {/* From */}
                <div className="flex-1 w-full">
                  <label className="block text-sm font-bold text-slate-900 mb-2">From</label>
                  <CityAutocompleteField
                    placeholder="Departure city"
                    value={origin}
                    onChange={setOrigin}
                    hideIcon={true}
                    inputClassName="w-full h-12 px-4 rounded-xl border-none bg-slate-100 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#ee237c]/20 transition-all outline-none"
                  />
                </div>

                {/* To */}
                <div className="flex-1 w-full">
                  <label className="block text-sm font-bold text-slate-900 mb-2">Destination</label>
                  <CityAutocompleteField
                    placeholder="Destination city"
                    value={destination}
                    onChange={setDestination}
                    hideIcon={true}
                    inputClassName="w-full h-12 px-4 rounded-xl border-none bg-slate-100 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#ee237c]/20 transition-all outline-none"
                  />
                </div>

                {/* Date */}
                <div className="w-full md:w-[220px]">
                  <label className="block text-sm font-bold text-slate-900 mb-2">Dates</label>
                  <Popover>
                    <PopoverTrigger
                      render={
                        <button
                          type="button"
                          className="relative w-full h-12 px-4 rounded-xl border-none bg-slate-100 text-sm font-medium text-left flex items-center hover:bg-slate-200 focus:bg-white focus:ring-2 focus:ring-[#ee237c]/20 transition-all outline-none text-slate-800"
                        />
                      }
                    >
                      <Calendar className="w-4 h-4 text-slate-500 mr-2 shrink-0 pointer-events-none" />
                      <span className="flex-1 truncate">{date ? format(parseLocalDate(date)!, "PPP") : "Pick a date"}</span>
                      <ChevronDown className="w-4 h-4 text-slate-500 ml-2 shrink-0 pointer-events-none" />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={parseLocalDate(date)}
                        onSelect={(d) => d && setDate(format(d, "yyyy-MM-dd"))}
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Passengers */}
                <div className="w-full md:w-[120px]">
                  <label className="block text-sm font-bold text-slate-900 mb-2">Guests</label>
                  <div className="relative group">
                    <select
                      value={travelers}
                      onChange={(e) => setTravelers(Number(e.target.value))}
                      className="w-full h-12 px-4 pr-10 rounded-xl border-none bg-slate-100 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#ee237c]/20 transition-all outline-none appearance-none cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "Guest" : "Guests"}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                {/* Search button */}
                <div className="w-full md:w-auto">
                  <Button
                    type="submit"
                    className="w-full md:w-auto h-12 px-8 rounded-xl bg-[#ee237c] text-white font-bold text-sm hover:bg-[#c71d65] hover:shadow-lg transition-all flex items-center justify-center border-0"
                  >
                    Search Trips
                    <Plane className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

              {/* Popular destinations */}
              <div className="flex flex-wrap items-center gap-2 mt-5">
                <span className="text-xs text-slate-500 font-medium">Popular:</span>
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
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-center min-h-[140px]">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <tab.icon className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-700 mb-1">
                {tab.label} Booking
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
                We're working hard to bring {tab.label.toLowerCase()} booking to Moja Ride. Check back soon!
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                <span className="text-sm">✨</span>
                Coming Soon
              </div>
            </div>
          )}
        </motion.form>
      </AnimatePresence>
    </div>
  );
}
