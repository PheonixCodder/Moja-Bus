"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Bus } from "lucide-react";
import { Input } from "@moja/ui/components/ui/input";
import { Badge } from "@moja/ui/components/ui/badge";
import { useCitySearch } from "../hooks/use-city-search";

export interface CityValue {
  id: string;
  text: string;
  municipalityId?: string;
  quarterId?: string;
  level?: "city" | "municipality" | "quarter" | "terminal";
  terminalId?: string;
  terminalName?: string;
  companyName?: string;
  companyId?: string;
}

interface CityAutocompleteFieldProps {
  label?: string;
  placeholder: string;
  value: CityValue;
  onChange: (value: CityValue) => void;
  inputClassName?: string;
  hideIcon?: boolean;
}

export function CityAutocompleteField({
  label,
  placeholder,
  value,
  onChange,
  inputClassName,
  hideIcon = false,
}: CityAutocompleteFieldProps) {
  const t = useTranslations("search");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { cities, isSearchable } = useCitySearch(value.text);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
          {label}
        </label>
      )}
      <div className="relative">
        {!hideIcon && (
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
        )}
        <Input
          type="text"
          placeholder={placeholder}
          value={value.text}
          onChange={(e) => {
            onChange({ id: "", text: e.target.value });
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={
            inputClassName ||
            "pl-10 h-12 bg-slate-50 focus:bg-white border-slate-200 focus:ring-[#ee237c] focus:border-[#ee237c] rounded-xl font-medium"
          }
        />
      </div>
      {isOpen && isSearchable && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
          {cities.length > 0 ? (
            cities.map((city) => (
              <button
                key={`${city.id}|${city.municipalityId ?? ""}|${city.quarterId ?? ""}|${city.terminalId ?? ""}|${city.level ?? "city"}`}
                type="button"
                onClick={() => {
                  onChange({
                    id: city.id,
                    text: city.hierarchyLabel ?? city.name,
                    ...(city.municipalityId
                      ? { municipalityId: city.municipalityId }
                      : {}),
                    ...(city.quarterId ? { quarterId: city.quarterId } : {}),
                    ...(city.level ? { level: city.level } : {}),
                    ...(city.terminalId ? { terminalId: city.terminalId } : {}),
                    ...(city.level === "terminal" && city.name
                      ? { terminalName: city.name }
                      : {}),
                    ...(city.companyName
                      ? { companyName: city.companyName }
                      : {}),
                    ...(city.companyId ? { companyId: city.companyId } : {}),
                  });
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-pink-50 transition-colors flex items-center gap-2 font-medium"
              >
                {city.level === "terminal" ? (
                  <Bus className="h-4 w-4 text-[#ee237c]" />
                ) : (
                  <MapPin className="h-4 w-4 text-[#ee237c]" />
                )}
                <div className="flex-1 min-w-0">
                  <span>{city.hierarchyLabel ?? city.name}</span>
                  {city.isMajorHub && (
                    <Badge className="ml-2 bg-pink-100 text-pink-700 hover:bg-pink-100 text-[10px]">
                      {t("majorHub")}
                    </Badge>
                  )}
                  {city.level === "terminal" && city.companyName && (
                    <Badge className="ml-2 bg-slate-100 text-slate-600 hover:bg-slate-100 text-[10px]">
                      {city.companyName}
                    </Badge>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500">
              {t("noCitiesFound")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
