import type {
	DigitalTicketDTO,
	PassengerBookingStatus,
	PassengerBookingSummary,
} from "@moja/types";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

export type {
	PassengerBookingSummary,
	DigitalTicketDTO,
	PassengerBookingStatus,
};

// Backward-compatible alias for existing code references while migrating to PassengerBookingSummary
export type Booking = PassengerBookingSummary;

export type BookingFilterType = "upcoming" | "pending" | "past";

export function useListMyBookings(
	filter: BookingFilterType = "upcoming",
	limit: number = 20,
	offset: number = 0,
	enabled?: boolean,
) {
	const trpc = useTRPC();
	return useQuery({
		...trpc.booking.listMyBookings.queryOptions({
			filter,
			limit,
			offset,
		}),
		enabled,
	});
}

export function useGetBooking(bookingReference: string, enabled?: boolean) {
	const trpc = useTRPC();
	return useQuery({
		...trpc.booking.getBooking.queryOptions({ bookingReference }),
		enabled: enabled ?? !!bookingReference,
	});
}

export function useGetTicket(
	bookingReference?: string,
	ticketToken?: string,
	enabled?: boolean,
) {
	const trpc = useTRPC();
	return useQuery({
		...trpc.booking.getTicket.queryOptions({
			bookingReference: bookingReference ?? "",
			ticketToken: ticketToken ?? "",
		}),
		enabled: enabled ?? !!(bookingReference || ticketToken),
	});
}

export function useGetTicketByToken(ticketToken: string, enabled?: boolean) {
	const trpc = useTRPC();
	return useQuery({
		...trpc.booking.getTicketByToken.queryOptions({ ticketToken }),
		enabled: enabled ?? !!ticketToken,
	});
}
