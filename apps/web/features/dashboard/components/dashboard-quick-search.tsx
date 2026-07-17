"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Calendar } from "lucide-react";
import { CityAutocompleteField, type CityValue } from "@/features/search/components/city-autocomplete-field";
import { Button } from "@moja/ui/components/ui/button";

export function DashboardQuickSearch() {
  const router = useRouter();
  const [origin, setOrigin] = React.useState<CityValue>({ id: "", text: "" });
  const [destination, setDestination] = React.useState<CityValue>({ id: "", text: "" });
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0]!);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.id || !destination.id) {
      return;
    }
    router.push(`/search?from=${origin.id}&to=${destination.id}&date=${date}&passengers=1`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-card/40 backdrop-blur-md p-3 border border-border/60 rounded-lg mt-4"
    >
      <div className="relative">
        <CityAutocompleteField
          placeholder="Origin City"
          value={origin}
          onChange={setOrigin}
          inputClassName="w-full pl-9 h-9 text-xs bg-background/80 border-border rounded-md font-medium placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
        />
      </div>
      <div className="relative">
        <CityAutocompleteField
          placeholder="Destination City"
          value={destination}
          onChange={setDestination}
          inputClassName="w-full pl-9 h-9 text-xs bg-background/80 border-border rounded-md font-medium placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
        />
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
          <input
            type="date"
            value={date}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background/80 px-3 py-1 pl-9 text-xs shadow-xs transition-colors focus-visible:outline-hidden font-medium"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          className="h-9 px-4 shrink-0 font-semibold gap-1.5 bg-primary text-white hover:bg-primary/95"
        >
          <Search className="size-3.5" />
          Find Bus
        </Button>
      </div>
    </form>
  );
}
