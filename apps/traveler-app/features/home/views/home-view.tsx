import { RefreshControl, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeHeader } from "../components/home-header";
import { HomeSearchWidget } from "../components/home-search-widget";
import { ActiveTripCard } from "../components/active-trip-card";
import { PromoBannerCarousel } from "../components/promo-banner-carousel";
import { PopularRoutesGrid } from "../components/popular-routes-grid";
import { FeaturedOperatorsSection } from "../components/featured-operators-section";
import { BlogNewsSection } from "../components/blog-news-section";
import { useHomeData } from "../hooks/use-home-data";
import { H_PADDING } from "../constants";

export function HomeView() {
  const insets = useSafeAreaInsets();
  const {
    refreshing,
    onRefresh,
    walletBalance,
    upcomingBooking,
    banners,
    blogPosts,
    operators,
  } = useHomeData();

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 130,
        paddingHorizontal: H_PADDING,
        gap: 24,
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
      <HomeHeader walletBalance={walletBalance} />
      
      {/* Show Live Boarding Pass if upcoming trip exists; otherwise show Quick Search Widget */}
      {upcomingBooking ? (
        <ActiveTripCard booking={upcomingBooking} />
      ) : (
        <HomeSearchWidget />
      )}

      <PromoBannerCarousel banners={banners} />
      <PopularRoutesGrid />
      <FeaturedOperatorsSection operators={operators} />
      <BlogNewsSection posts={blogPosts} />
    </ScrollView>
  );
}
