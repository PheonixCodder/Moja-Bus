import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import type { BookingFilterType } from "./use-bookings";

export function useBookingPrefetch() {
	const queryClient = useQueryClient();
	const trpc = useTRPC();

	const prefetchBookings = (filter: BookingFilterType = "upcoming") => {
		queryClient.prefetchQuery(
			trpc.booking.listMyBookings.queryOptions({ filter, limit: 20, offset: 0 }),
		);
	};

	const prefetchStats = () => {
		queryClient.prefetchQuery(
			trpc.passenger.getDashboardStats.queryOptions(undefined, {
				staleTime: 60_000,
			}),
		);
	};

	const prefetchBookingDetail = (bookingReference: string) => {
		if (!bookingReference) return;
		queryClient.prefetchQuery(
			trpc.booking.getBooking.queryOptions({ bookingReference }),
		);
	};

	const prefetchTicket = (bookingReference: string) => {
		if (!bookingReference) return;
		queryClient.prefetchQuery(
			trpc.booking.getTicket.queryOptions({
				bookingReference,
				ticketToken: "",
			}),
		);
	};

	return {
		prefetchBookings,
		prefetchStats,
		prefetchBookingDetail,
		prefetchTicket,
	};
}
