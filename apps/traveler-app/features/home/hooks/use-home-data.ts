import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { useWalletBalance } from "@/hooks/use-wallet";

export function useHomeData() {
  const trpc = useTRPC() as any;
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Wallet balance
  const { data: walletData, isLoading: isWalletLoading } = useWalletBalance();

  // Upcoming bookings
  const { data: bookingsData, isLoading: isBookingsLoading } = useQuery({
    ...trpc.passenger.getBookings.queryOptions({ status: "UPCOMING", limit: 1 }),
    staleTime: 10 * 1000,
  });

  // Active promo banners from tRPC
  const { data: bannersData, isLoading: isBannersLoading } = useQuery({
    ...trpc.blog.listActiveBanners.queryOptions(),
    staleTime: 60 * 1000,
  });

  // Published blog articles for Travel News feed
  const { data: blogPostsData, isLoading: isBlogLoading } = useQuery({
    ...trpc.blog.getPublishedPosts.queryOptions({ limit: 5 }),
    staleTime: 5 * 60 * 1000,
  });

  // Verified regional bus carriers
  const { data: operatorsData, isLoading: isOperatorsLoading } = useQuery({
    ...trpc.public.listOperators.queryOptions(),
    staleTime: 10 * 60 * 1000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries();
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const upcomingBooking = (bookingsData as any)?.items?.[0] || null;
  const banners = (bannersData as any[]) || [];
  const blogPosts = (blogPostsData as any)?.posts || [];
  const operators = (operatorsData as any[]) || [];

  return {
    refreshing,
    onRefresh,
    walletBalance: walletData?.availableBalance ?? 0,
    upcomingBooking,
    banners,
    blogPosts,
    operators,
    isLoading:
      isWalletLoading ||
      isBookingsLoading ||
      isBannersLoading ||
      isBlogLoading ||
      isOperatorsLoading,
  };
}
