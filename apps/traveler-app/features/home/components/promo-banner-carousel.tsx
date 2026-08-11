import { useState } from "react";
import { View, Text, Pressable, FlatList, Image, Dimensions, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowRight01Icon, Tag01Icon } from "@hugeicons/core-free-icons";
import { router } from "expo-router";
import type { PromoBanner } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;

interface PromoBannerCarouselProps {
  banners?: PromoBanner[];
}

const DEFAULT_BANNERS: PromoBanner[] = [
  {
    id: "default-1",
    title: "15% OFF Weekend Getaway",
    subtitle: "Travel from Abidjan to Yamoussoukro in luxury comfort",
    badge: "15% OFF",
    imageUrl: "https://cdn.mojaride.com/banners/yamoussoukro.jpg",
    actionType: "SEARCH",
    actionPayload: { originSlug: "abidjan", destinationSlug: "yamoussoukro" },
    gradientColors: ["#ee237c", "#9333ea"],
    isActive: true,
    sortOrder: 0,
  },
  {
    id: "default-2",
    title: "VIP Express Buses Available",
    subtitle: "Reclining seats & AC on San-Pédro routes",
    badge: "VIP FLEET",
    imageUrl: "https://cdn.mojaride.com/banners/sanpedro.jpg",
    actionType: "SEARCH",
    actionPayload: { originSlug: "abidjan", destinationSlug: "san-pedro" },
    gradientColors: ["#0f172a", "#ee237c"],
    isActive: true,
    sortOrder: 1,
  },
];

export function PromoBannerCarousel({ banners }: PromoBannerCarouselProps) {
  const displayBanners = banners && banners.length > 0 ? banners : DEFAULT_BANNERS;
  const [activeIndex, setActiveIndex] = useState(0);

  const handleBannerPress = (banner: PromoBanner) => {
    if (banner.actionType === "SEARCH") {
      const payload = banner.actionPayload || {};
      router.push({
        pathname: "/(tabs)/search",
        params: {
          origin: payload.originSlug,
          destination: payload.destinationSlug,
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
    <View className="space-y-2">
      <View className="flex-row items-center justify-between px-1">
        <Text className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex-row items-center gap-1">
          Promotions & Offers 🔥
        </Text>
      </View>

      <FlatList
        data={displayBanners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + 12));
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
              style={{ width: CARD_WIDTH, marginRight: 12 }}
            >
              <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, overflow: "hidden", padding: 16 }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3 space-y-1">
                    {item.badge && (
                      <View className="bg-white/20 self-start px-2 py-0.5 rounded-full flex-row items-center gap-1 border border-white/30">
                        <HugeiconsIcon icon={Tag01Icon} size={10} color="#ffffff" />
                        <Text className="text-[10px] font-black text-white uppercase">
                          {item.badge}
                        </Text>
                      </View>
                    )}
                    <Text className="text-base font-black text-white leading-tight">
                      {item.title}
                    </Text>
                    {item.subtitle && (
                      <Text className="text-xs text-white/80" numberOfLines={2}>
                        {item.subtitle}
                      </Text>
                    )}
                  </View>

                  <View className="bg-white/20 p-2.5 rounded-full border border-white/30">
                    <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#ffffff" />
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
        <View className="flex-row justify-center items-center gap-1.5 pt-1">
          {displayBanners.map((_, i) => (
            <View
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex ? "w-5 bg-rose-600" : "w-1.5 bg-slate-200"
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
}
