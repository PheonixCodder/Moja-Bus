"use client";

import { Bus } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";

interface SearchEmptyStateProps {
  onQuickSearch: (criteria: { from: string; to: string; date: string }) => void;
}

export function SearchEmptyState({ onQuickSearch }: SearchEmptyStateProps) {
  return (
    <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm max-w-lg mx-auto px-6">
      <div className="bg-pink-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6 text-[#ee237c]">
        <Bus className="h-10 w-10 animate-pulse" />
      </div>
      <h3 className="text-xl font-bold font-montserrat mb-2">Ready to Explore?</h3>
      <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
        Enter your departure location, destination, date, and passenger
        details above to find intercity bus departures.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-pink-200 text-[#ee237c] hover:bg-pink-50 text-xs font-semibold"
          onClick={() =>
            onQuickSearch({
              from: "abidjan-cuid",
              to: "bouake-cuid",
              date: new Date().toISOString().split("T")[0]!,
            })
          }
        >
          Abidjan ➔ Bouaké
        </Button>
      </div>
    </div>
  );
}