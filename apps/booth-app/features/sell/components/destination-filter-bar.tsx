import {
  Cancel01Icon,
  FlashIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Input } from "@/components/ui/input";
import { IconColors } from "@/constants/ui-colors";
import { BoothFeedback } from "@/lib/haptics";
import type { DestinationFilter } from "../types";

interface DestinationFilterBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  selectedFilter: DestinationFilter;
  onSelectFilter: (filter: DestinationFilter) => void;
  destinations: Array<{ name: string; count: number }>;
  totalCount: number;
  imminentCount: number;
}

export const DestinationFilterBar = React.memo(function DestinationFilterBar({
  search,
  onSearchChange,
  selectedFilter,
  onSelectFilter,
  destinations,
  totalCount,
  imminentCount,
}: DestinationFilterBarProps) {
  const { t } = useTranslation();

  const handleSelect = (filter: DestinationFilter) => {
    BoothFeedback.tap();
    onSelectFilter(filter);
  };

  return (
    <View className="mb-4 gap-3.5">
      {/* Search Bar */}
      <View>
        <Input
          placeholder={t("sell.searchPlaceholder")}
          value={search}
          onChangeText={onSearchChange}
          leftIcon={
            <HugeiconsIcon
              icon={Search01Icon}
              size={18}
              color={IconColors.muted}
            />
          }
          rightIcon={
            search ? (
              <Pressable
                onPress={() => {
                  BoothFeedback.tap();
                  onSearchChange("");
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={t("sell.resetSearch")}
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={18}
                  color={IconColors.muted}
                />
              </Pressable>
            ) : null
          }
        />
      </View>

      {/* Filter Chips Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {/* All Chips */}
        <Pressable
          key="filter-all"
          onPress={() => handleSelect("ALL")}
          className={`flex-row items-center gap-1.5 px-4 py-2 rounded-full border will-change-variable ${
            selectedFilter === "ALL"
              ? "bg-primary border-primary"
              : "bg-card border-border active:bg-muted"
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              selectedFilter === "ALL" ? "text-white" : "text-foreground"
            }`}
          >
            {t("sell.allDestinations")}
          </Text>
          <View
            className={`px-1.5 py-0.5 rounded-full ${
              selectedFilter === "ALL" ? "bg-white/25" : "bg-muted"
            }`}
          >
            <Text
              className={`text-[10px] font-black ${
                selectedFilter === "ALL"
                  ? "text-white"
                  : "text-muted-foreground"
              }`}
            >
              {totalCount}
            </Text>
          </View>
        </Pressable>

        {/* Departing Soon Chip */}
        {imminentCount > 0 ? (
          <Pressable
            key="filter-imminent"
            onPress={() => handleSelect("IMMINENT")}
            className={`flex-row items-center gap-1.5 px-4 py-2 rounded-full border will-change-variable ${
              selectedFilter === "IMMINENT"
                ? "bg-primary border-primary"
                : "bg-card border-border active:bg-muted"
            }`}
          >
            <HugeiconsIcon
              icon={FlashIcon}
              size={12}
              color={
                selectedFilter === "IMMINENT" ? "#ffffff" : IconColors.brand
              }
            />
            <Text
              className={`text-xs font-bold ${
                selectedFilter === "IMMINENT" ? "text-white" : "text-foreground"
              }`}
            >
              {t("sell.departingSoon")}
            </Text>
            <View
              className={`px-1.5 py-0.5 rounded-full ${
                selectedFilter === "IMMINENT" ? "bg-white/25" : "bg-muted"
              }`}
            >
              <Text
                className={`text-[10px] font-black ${
                  selectedFilter === "IMMINENT"
                    ? "text-white"
                    : "text-muted-foreground"
                }`}
              >
                {imminentCount}
              </Text>
            </View>
          </Pressable>
        ) : null}

        {/* City Destination Chips */}
        {destinations.map((dest) => {
          const isSelected = selectedFilter === dest.name;
          return (
            <Pressable
              key={`dest-${dest.name}`}
              onPress={() => handleSelect(dest.name)}
              className={`flex-row items-center gap-1.5 px-4 py-2 rounded-full border will-change-variable ${
                isSelected
                  ? "bg-primary border-primary"
                  : "bg-card border-border active:bg-muted"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  isSelected ? "text-white" : "text-foreground"
                }`}
              >
                {dest.name}
              </Text>
              <View
                className={`px-1.5 py-0.5 rounded-full ${
                  isSelected ? "bg-white/25" : "bg-muted"
                }`}
              >
                <Text
                  className={`text-[10px] font-black ${
                    isSelected ? "text-white" : "text-muted-foreground"
                  }`}
                >
                  {dest.count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Section Title */}
      <View className="pt-2">
        <Text className="text-xs font-black text-muted-foreground uppercase tracking-widest">
          {t("sell.todaySchedule")}
        </Text>
      </View>
    </View>
  );
});
