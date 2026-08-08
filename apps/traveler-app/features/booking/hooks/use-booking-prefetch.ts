import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

export function useBookingPrefetch() {
	const queryClient = useQueryClient();
	const trpc = useTRPC() as any;

	const prefetchBookings = (
		filter: "upcoming" | "pending" | "past" | "confirmed" = "upcoming",
	) => {
		if (!trpc?.booking?.listMyBookings?.queryOptions) return;
		queryClient.prefetchQuery(
			trpc.booking.listMyBookings.queryOptions({ filter, limit: 20, offset: 0 }),
		);
	};

	const prefetchStats = () => {
		if (!trpc?.passenger?.getDashboardStats?.queryOptions) return;
		queryClient.prefetchQuery(
			trpc.passenger.getDashboardStats.queryOptions(undefined, {
				staleTime: 60_000,
			}),
		);
	};

	const prefetchBookingDetail = (bookingReference: string) => {
		if (!trpc?.booking?.getBooking?.queryOptions || !bookingReference) return;
		queryClient.prefetchQuery(
			trpc.booking.getBooking.queryOptions({ bookingReference }),
		);
	};

	const prefetchTicket = (bookingReference: string) => {
		if (!trpc?.booking?.getTicket?.queryOptions || !bookingReference) return;
		queryClient.prefetchQuery(
			trpc.booking.getTicket.queryOptions({ bookingReference }),
		);
	};

	return {
		prefetchBookings,
		prefetchStats,
		prefetchBookingDetail,
		prefetchTicket,
	};
}
