"use client";

import { useEffect, useState } from "react";
import { ArrowUpDown, Calendar, Search, Users } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Card, CardContent } from "@moja/ui/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@moja/ui/components/ui/popover";
import { Calendar as CalendarComponent } from "@moja/ui/components/ui/calendar";
import { CityAutocompleteField, type CityValue } from "./city-autocomplete-field";
import { useCityDetails } from "../hooks/use-city-details";

interface SearchFormProps {
  initialFromId: string;
  initialToId: string;
  initialDate: string;
  initialPassengers: number;
  onSearch: (criteria: {
    from: string;
    to: string;
    date: string;
    passengers: number;
  }) => void;
}

const todayISO = () => new Date().toISOString().split("T")[0]!;

function parseLocalDate(dateStr: string) {
  if (!dateStr) return undefined;
  const [y, m, d] = dateStr.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d));
}

export function SearchForm({
  initialFromId,
  initialToId,
  initialDate,
  initialPassengers,
  onSearch,
}: SearchFormProps) {
  const [origin, setOrigin] = useState<CityValue>({ id: initialFromId, text: "" });
  const [destination, setDestination] = useState<CityValue>({ id: initialToId, text: "" });
  const [date, setDate] = useState(initialDate || todayISO());
  const [passengers, setPassengers] = useState(initialPassengers);

  // Resolves city names for ids that arrived via the URL (deep link / SSR hydration)
  const { data: originCity } = useCityDetails(initialFromId);
  const { data: destCity } = useCityDetails(initialToId);

  useEffect(() => {
    if (originCity) setOrigin({ id: originCity.id, text: originCity.name });
  }, [originCity]);

  useEffect(() => {
    if (destCity) setDestination({ id: destCity.id, text: destCity.name });
  }, [destCity]);

  function handleSwap() {
    setOrigin(destination);
    setDestination(origin);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const originVal = origin.id || origin.text.trim();
    const destVal = destination.id || destination.text.trim();

    if (!originVal) {
      toast.error("Please select a valid origin city");
      return;
    }
    if (!destVal) {
      toast.error("Please select a valid destination city");
      return;
    }
    if (originVal === destVal) {
      toast.error("Origin and destination cities cannot be the same");
      return;
    }
    onSearch({ from: originVal, to: destVal, date, passengers });
  }

  return (
    <Card className="bg-white/95 backdrop-blur-md shadow-2xl border border-slate-100 rounded-2xl overflow-hidden transition-all duration-300">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-3">
              <CityAutocompleteField
                label="Leaving From"
                placeholder="Search departure city..."
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
                title="Swap route direction"
              >
                <ArrowUpDown className="h-5 w-5 lg:rotate-90" />
              </Button>
            </div>

            <div className="lg:col-span-3">
              <CityAutocompleteField
                label="Going To"
                placeholder="Search destination city..."
                value={destination}
                onChange={setDestination}
              />
            </div>

            <div className="lg:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                Departure
              </label>
              <Popover>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      className="relative w-full h-12 pl-10 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-left flex items-center hover:bg-white focus:bg-white focus:border-[#ee237c] focus:ring-2 focus:ring-[#ee237c]/20 transition-all outline-none text-slate-700"
                    />
                  }
                >
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  {date ? format(parseLocalDate(date)!, "PPP") : "Pick a date"}
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

            <div className="lg:col-span-1 relative">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                Travelers
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
                <Search className="h-5 w-5" /> Find Bus
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}