import { useState, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Search01Icon,
  ArrowUpDownIcon,
  Location01Icon,
} from "@hugeicons/core-free-icons";
import Toast from "react-native-toast-message";
import { CitySearchField } from "@/features/search/components/city-search-field";
import type { CityValue } from "@/features/search/types";
import { toLocalISODate } from "@/features/search/lib/format";
import { validateSearchPair } from "@/features/search/lib/validate-search-pair";

// ─── Helper ──────────────────────────────────────────────────────────────────

interface HomeSearchParams extends Record<string, string | undefined> {
  from: string;
  fromText: string;
  to: string;
  toText: string;
  date: string;
  passengers: string;
  fromMuni?: string;
  fromQuarter?: string;
  toMuni?: string;
  toQuarter?: string;
}

function buildSearchParams(
  origin: CityValue,
  destination: CityValue,
): HomeSearchParams {
  return {
    from: origin.id,
    fromText: origin.text,
    to: destination.id,
    toText: destination.text,
    date: toLocalISODate(new Date()),
    passengers: "1",
    ...(origin.municipalityId ? { fromMuni: origin.municipalityId } : {}),
    ...(origin.quarterId ? { fromQuarter: origin.quarterId } : {}),
    ...(destination.municipalityId ? { toMuni: destination.municipalityId } : {}),
    ...(destination.quarterId ? { toQuarter: destination.quarterId } : {}),
  };
}

// ─── LocationRow ─────────────────────────────────────────────────────────────

interface LocationRowProps {
  label: string;
  placeholder: string;
  value: CityValue | null;
  onPress: () => void;
}

function LocationRow({ label, placeholder, value, onPress }: LocationRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-row items-center gap-2.5 py-1 active:opacity-70"
    >
      <View className="size-7 rounded-full bg-rose-100 items-center justify-center">
        <HugeiconsIcon icon={Location01Icon} size={14} color="#ee237c" />
      </View>
      <View className="flex-1">
        <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </Text>
        <Text
          className={`text-sm font-extrabold ${value ? "text-slate-900" : "text-slate-400"}`}
          numberOfLines={1}
        >
          {value ? value.text : placeholder}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── HomeSearchWidget ─────────────────────────────────────────────────────────

export function HomeSearchWidget() {
  const { t } = useTranslation("search");

  // ── City state ──
  const [origin, setOrigin] = useState<CityValue | null>(null);
  const [destination, setDestination] = useState<CityValue | null>(null);

  // ── City sheet state ──
  const [activeField, setActiveField] = useState<
    "origin" | "destination" | null
  >(null);
  const [cityQuery, setCityQuery] = useState("");

  // ── Handlers ──

  const handleSwap = useCallback(() => {
    setOrigin((prev) => {
      setDestination(prev);
      return destination;
    });
  }, [destination]);

  const handleCitySelect = useCallback(
    (city: CityValue) => {
      if (activeField === "origin") {
        setOrigin(city);
      } else {
        setDestination(city);
      }
      setActiveField(null);
      setCityQuery("");
    },
    [activeField],
  );

  const handleCloseSheet = useCallback(() => {
    setActiveField(null);
    setCityQuery("");
  }, []);

  const handleSearch = useCallback(() => {
    // Validation: both cities required
    if (!origin || !destination) {
      Toast.show({
        type: "error",
        text1: t("homeSearch.selectBothCities"),
        position: "top",
        visibilityTime: 3000,
        topOffset: 56,
      });
      return;
    }

    // Validation: must be a meaningful origin/destination pair (urban same-city OK)
    if (validateSearchPair(origin, destination) === "sameCity") {
      Toast.show({
        type: "error",
        text1: t("homeSearch.sameCityError"),
        position: "top",
        visibilityTime: 3000,
        topOffset: 56,
      });
      return;
    }

    // Navigate to search tab with fully-typed params the search page already expects
    router.push({
      pathname: "/(tabs)/search",
      params: buildSearchParams(origin, destination),
    });
  }, [origin, destination, t]);

  return (
    <>
      <View className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm gap-3">
        {/* Origin / Swap / Destination */}
        <View className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 gap-2 relative">
          {/* Origin Row */}
          <LocationRow
            label={t("homeSearch.departure")}
            placeholder={t("homeSearch.departurePlaceholder")}
            value={origin}
            onPress={() => setActiveField("origin")}
          />

          {/* Separator + Swap Button */}
          <View className="h-px bg-slate-200/80 my-0.5 justify-center">
            <Pressable
              onPress={handleSwap}
              accessibilityRole="button"
              accessibilityLabel={t("homeSearch.swap")}
              className="absolute right-2 size-7 rounded-full bg-white border border-slate-300 items-center justify-center shadow-xs active:bg-slate-100"
            >
              <HugeiconsIcon icon={ArrowUpDownIcon} size={13} color="#475569" />
            </Pressable>
          </View>

          {/* Destination Row */}
          <LocationRow
            label={t("homeSearch.destination")}
            placeholder={t("homeSearch.destinationPlaceholder")}
            value={destination}
            onPress={() => setActiveField("destination")}
          />
        </View>

        {/* Search Button — brand primary pink colour #ee237c */}
        <Pressable
          onPress={handleSearch}
          accessibilityRole="button"
          accessibilityLabel={t("homeSearch.searchButton")}
          className="bg-[#ee237c] active:bg-[#d41b6d] py-3.5 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
        >
          <HugeiconsIcon icon={Search01Icon} size={16} color="#ffffff" />
          <Text className="text-sm font-extrabold text-white">
            {t("homeSearch.searchButton")}
          </Text>
        </Pressable>
      </View>

      {/* City Selection Modal — shared from search feature */}
      <CitySearchField
        visible={activeField !== null}
        onClose={handleCloseSheet}
        onSelect={handleCitySelect}
        query={cityQuery}
        setQuery={setCityQuery}
      />
    </>
  );
}
