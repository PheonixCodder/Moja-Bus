import { RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeHeader } from "../components/home-header";
import { ActiveTripCard } from "../components/active-trip-card";
import { PromoBannerCarousel } from "../components/promo-banner-carousel";
import { PopularRoutesGrid } from "../components/popular-routes-grid";
import { BlogNewsSection } from "../components/blog-news-section";
import { useHomeData } from "../hooks/use-home-data";

export function HomeView() {
  const insets = useSafeAreaInsets();
  const {
    refreshing,
    onRefresh,
    walletBalance,
    upcomingBooking,
    banners,
    blogPosts,
  } = useHomeData();

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: 110, // Account for custom curved bottom tab bar
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#ee237c"
          colors={["#ee237c"]}
        />
      }
    >
      <View className="px-4 space-y-5">
        <HomeHeader walletBalance={walletBalance} />
        <ActiveTripCard booking={upcomingBooking} />
        <PromoBannerCarousel banners={banners} />
        <PopularRoutesGrid />
        <BlogNewsSection posts={blogPosts} />
      </View>
    </ScrollView>
  );
}
