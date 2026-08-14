import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Dimensions,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowRight01Icon, Tag01Icon } from "@hugeicons/core-free-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import type { PromoBanner } from "../types";
import { H_PADDING } from "../constants";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Card fills the full content width (screen minus the 20px H_PADDING on each side)
const CARD_WIDTH = SCREEN_WIDTH - H_PADDING * 2;
const SNAP_INTERVAL = CARD_WIDTH + 12;

interface PromoBannerCarouselProps {
  banners?: PromoBanner[];
}

export function PromoBannerCarousel({ banners }: PromoBannerCarouselProps) {
  const { t } = useTranslation("home");

  const defaultBanners: PromoBanner[] = [
    {
      id: "default-1",
      title: t("weekendGetaway"),
      subtitle: t("weekendGetawayDesc"),
      badge: "15% OFF",
      imageUrl: "https://cdn.mojaride.com/banners/yamoussoukro.jpg",
      actionType: "SEARCH",
      actionPayload: {
        from: "Abidjan",
        fromText: "Abidjan (All Hubs)",
        to: "Yamoussoukro",
        toText: "Yamoussoukro",
      },
      gradientColors: ["#ee237c", "#9333ea"],
      isActive: true,
      sortOrder: 0,
    },
    {
      id: "default-2",
      title: t("vipExpressTitle"),
      subtitle: t("vipExpressDesc"),
      badge: "VIP FLEET",
      imageUrl: "https://cdn.mojaride.com/banners/sanpedro.jpg",
      actionType: "SEARCH",
      actionPayload: {
        from: "Abidjan",
        fromText: "Abidjan (All Hubs)",
        to: "San-Pédro",
        toText: "San-Pédro",
      },
      gradientColors: ["#0f172a", "#ee237c"],
      isActive: true,
      sortOrder: 1,
    },
  ];

  const displayBanners =
    banners && banners.length > 0 ? banners : defaultBanners;
  const [activeIndex, setActiveIndex] = useState(0);

  const handleBannerPress = (banner: PromoBanner) => {
    if (banner.actionType === "SEARCH") {
      const payload = banner.actionPayload || {};
      const from = payload.from || payload.originSlug || payload.origin || "";
      const to = payload.to || payload.destinationSlug || payload.destination || "";
      const fromText = payload.fromText || from;
      const toText = payload.toText || to;

      router.push({
        pathname: "/(tabs)/search",
        params: {
          from,
          fromText,
          to,
          toText,
        },
      });
    } else if (banner.actionType === "APP_SCREEN") {
      const payload = banner.actionPayload || {};
      const targetTab = payload.targetTab || "search";
      const tabs = ["search", "bookings", "tickets", "settings", "index"];
      if (tabs.includes(targetTab)) {
        router.push(`/(tabs)/${targetTab}` as any);
      } else {
        router.push(`/${targetTab}` as any);
      }
    } else if (banner.actionType === "BLOG_ARTICLE") {
      const payload = banner.actionPayload || {};
      if (payload.slug) {
        router.push(`/article/${payload.slug}` as any);
      }
    } else if (banner.actionType === "EXTERNAL_URL") {
      const payload = banner.actionPayload || {};
      if (payload.url) {
        Linking.openURL(payload.url);
      }
    }
  };

  return (
    <View className="gap-3">
      {/* Section Label */}
      <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">
        {t("homeSearch.promotionsTitle", { ns: "search" })}
      </Text>

      <FlatList
        data={displayBanners}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={{ gap: 12 }}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / SNAP_INTERVAL
          );
          setActiveIndex(index);
        }}
        renderItem={({ item }) => {
          const colors =
            item.gradientColors && item.gradientColors.length >= 2
              ? (item.gradientColors as [string, string])
              : (["#ee237c", "#9333ea"] as [string, string]);

          return (
            <Pressable
              onPress={() => handleBannerPress(item)}
              style={{ width: CARD_WIDTH }}
            >
              <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-2xl p-5 overflow-hidden"
              >
                <View className="flex-row items-center justify-between">
                  {/* Text content */}
                  <View className="flex-1 pr-4 gap-2">
                    {item.badge && (
                      <View className="self-start flex-row items-center gap-1 bg-white/20 border border-white/30 px-2.5 py-1 rounded-full">
                        <HugeiconsIcon
                          icon={Tag01Icon}
                          size={10}
                          color="#ffffff"
                        />
                        <Text className="text-[10px] font-black text-white uppercase tracking-wider">
                          {item.badge}
                        </Text>
                      </View>
                    )}
                    <Text className="text-lg font-black text-white leading-tight">
                      {item.title}
                    </Text>
                    {item.subtitle && (
                      <Text
                        className="text-xs text-white/75 leading-relaxed"
                        numberOfLines={2}
                      >
                        {item.subtitle}
                      </Text>
                    )}
                  </View>

                  {/* Arrow button */}
                  <View className="bg-white/20 border border-white/30 p-3 rounded-full">
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={18}
                      color="#ffffff"
                    />
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          );
        }}
        keyExtractor={(item) => item.id}
      />

      {/* Paging Dots */}
      {displayBanners.length > 1 && (
        <View className="flex-row justify-center items-center gap-1.5">
          {displayBanners.map((_: any, i: number) => (
            <View
              key={i}
              className={`will-change-animation h-1.5 rounded-full ${
                i === activeIndex ? "w-5 bg-rose-500" : "w-1.5 bg-slate-200"
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
}
