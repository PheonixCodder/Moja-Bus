"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plane, Calendar, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { CityAutocompleteField, type CityValue } from "@/features/search/components/city-autocomplete-field";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@moja/ui/components/ui/popover";
import { Calendar as CalendarComponent } from "@moja/ui/components/ui/calendar";
import { TrustBar } from "@/features/home/components/trustbar";

const todayISO = () => new Date().toISOString().split("T")[0]!;

function parseLocalDate(dateStr: string) {
  if (!dateStr) return undefined;
  const [y, m, d] = dateStr.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d));
}

const POPULAR = ["Abidjan", "Yamoussoukro", "San Pedro", "Bouaké", "Korhogo"];

export function HeroSearchBar() {
  const router = useRouter();

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
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="p-5 w-full">
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
                  {date ? format(parseLocalDate(date)!, "PPP") : "Pick a date"}
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
      </form>
      <TrustBar />
    </div>
  );
}