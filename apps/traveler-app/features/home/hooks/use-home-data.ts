import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/lib/trpc";
import { useWalletBalance } from "@/hooks/use-wallet";
import {
	bookingsListInput,
	HOME_UPCOMING_LIMIT,
} from "@/features/booking/constants/query-keys";
import { mapBookingToActiveTripCard } from "../lib/map-active-trip";
import type { PassengerBookingSummary } from "@moja/types";

export function useHomeData() {
	const trpc = useTRPC() as any;
	const queryClient = useQueryClient();
	const [refreshing, setRefreshing] = useState(false);
	const { data: session } = authClient.useSession();
	const isAuthenticated = !!session?.user;

	const { data: walletData, isLoading: isWalletLoading } =
		useWalletBalance(isAuthenticated);

	const { data: bookingsData, isLoading: isBookingsLoading } = useQuery({
		...trpc.booking.listMyBookings.queryOptions(
			bookingsListInput("upcoming", HOME_UPCOMING_LIMIT),
		),
		enabled: isAuthenticated,
		staleTime: 10 * 1000,
	});

	const { data: bannersData, isLoading: isBannersLoading } = useQuery({
		...trpc.blog.listActiveBanners.queryOptions(),
		staleTime: 60 * 1000,
	});

	const { data: blogPostsData, isLoading: isBlogLoading } = useQuery({
		...trpc.blog.getPublishedPosts.queryOptions({ limit: 5 }),
		staleTime: 5 * 60 * 1000,
	});

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

	const upcomingBooking = useMemo(() => {
		const item = (bookingsData as { items?: PassengerBookingSummary[] })
			?.items?.[0];
		return item ? mapBookingToActiveTripCard(item) : null;
	}, [bookingsData]);

	const banners = (bannersData as any[]) || [];
	const blogPosts = (blogPostsData as any)?.posts || [];
	const operators = (operatorsData as any[]) || [];

	return {
		refreshing,
		onRefresh,
		isAuthenticated,
		walletBalance: isAuthenticated
			? (walletData?.availableBalance ?? 0)
			: 0,
		upcomingBooking,
		banners,
		blogPosts,
		operators,
		isLoading:
			(isAuthenticated && (isWalletLoading || isBookingsLoading)) ||
			isBannersLoading ||
			isBlogLoading ||
			isOperatorsLoading,
	};
}
