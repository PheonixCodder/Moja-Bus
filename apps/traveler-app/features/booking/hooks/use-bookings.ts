import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

interface TrpcQuery<TInput, TOutput> {
	queryOptions: (
		input: TInput,
		opts?: { staleTime?: number },
	) => {
		queryKey: unknown[];
		queryFn: () => Promise<TOutput>;
	};
}

interface TrpcMutation<TInput, TOutput> {
	mutationOptions: () => {
		mutationFn: (input: TInput) => Promise<TOutput>;
	};
}

type BookingStatus =
	| "CONFIRMED"
	| "PENDING_PAYMENT"
	| "COMPLETED"
	| "CANCELLED"
	| "EXPIRED";

export type Booking = {
	bookingReference: string;
	ticketToken?: string;
	passengerName?: string;
	status: BookingStatus;
	companyName: string;
	origin: string;
	destination: string;
	departureTime: string;
	arrivalTime: string;
	duration?: string;
	seatLabel?: string;
	farePaidXOF?: number;
	holdExpiresAt?: string;
	amenities?: string[];
	passengers?: Array<{
		passengerName: string;
		passengerPhone: string;
		seatLabel: string;
	}>;
};

type BookingRouter = {
	listMyBookings: TrpcQuery<
		{ filter?: string; limit?: number; offset?: number },
		{ items: Booking[]; total: number }
	>;
	getBooking: TrpcQuery<{ bookingReference: string }, Booking>;
	getTicket: TrpcQuery<
		{ bookingReference?: string; ticketToken?: string },
		{ items: Booking[]; total: number }
	>;
	getTicketByToken: TrpcQuery<{ ticketToken: string }, Booking>;
};

type TypedTRPC = {
	booking: BookingRouter;
};

export function useListMyBookings(
	filter: string = "upcoming",
	limit: number = 20,
	offset: number = 0,
	enabled?: boolean,
) {
	const trpc = useTRPC() as unknown as TypedTRPC;
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
	const trpc = useTRPC() as unknown as TypedTRPC;
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
	const trpc = useTRPC() as unknown as TypedTRPC;
	return useQuery({
		...trpc.booking.getTicket.queryOptions({
			bookingReference,
			ticketToken,
		}),
		enabled: enabled ?? !!(bookingReference || ticketToken),
	});
}

export function useGetTicketByToken(ticketToken: string, enabled?: boolean) {
	const trpc = useTRPC() as unknown as TypedTRPC;
	return useQuery({
		...trpc.booking.getTicketByToken.queryOptions({ ticketToken }),
		enabled: enabled ?? !!ticketToken,
	});
}
