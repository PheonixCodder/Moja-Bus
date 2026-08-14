import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { usePrefetchGuard } from "@/lib/prefetch-guard";
import {
	BOOKINGS_LIST_LIMIT,
	TICKETS_LIST_LIMIT,
	bookingsListInput,
} from "../constants/query-keys";
import type { BookingFilterType } from "./use-bookings";

export function useBookingPrefetch() {
	const queryClient = useQueryClient();
	const trpc = useTRPC();
	const { prefetchIfAuthed } = usePrefetchGuard();

	const prefetchBookings = (
		filter: BookingFilterType = "upcoming",
		limit: number = BOOKINGS_LIST_LIMIT,
	) => {
		prefetchIfAuthed(() => {
			queryClient.prefetchQuery(
				trpc.booking.listMyBookings.queryOptions(
					bookingsListInput(filter, limit),
				),
			);
		});
	};

	const prefetchTicketsList = () => {
		prefetchBookings("upcoming", TICKETS_LIST_LIMIT);
	};

	const prefetchStats = () => {
		prefetchIfAuthed(() => {
			queryClient.prefetchQuery(
				trpc.passenger.getDashboardStats.queryOptions(undefined, {
					staleTime: 60_000,
				}),
			);
		});
	};

	const prefetchBookingDetail = (bookingReference: string) => {
		if (!bookingReference) return;
		prefetchIfAuthed(() => {
			queryClient.prefetchQuery(
				trpc.booking.getBooking.queryOptions({ bookingReference }),
			);
		});
	};

	const prefetchTicket = (bookingReference: string) => {
		if (!bookingReference) return;
		prefetchIfAuthed(() => {
			queryClient.prefetchQuery(
				trpc.booking.getTicket.queryOptions({
					bookingReference,
					ticketToken: "",
				}),
			);
		});
	};

	const prefetchTicketByToken = (ticketToken: string) => {
		if (!ticketToken) return;
		queryClient.prefetchQuery(
			trpc.booking.getTicketByToken.queryOptions({ ticketToken }),
		);
	};

	return {
		prefetchBookings,
		prefetchTicketsList,
		prefetchStats,
		prefetchBookingDetail,
		prefetchTicket,
		prefetchTicketByToken,
	};
}
