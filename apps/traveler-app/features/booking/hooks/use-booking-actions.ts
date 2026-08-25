import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

export function useCreateHold() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	return useMutation({
		...trpc.booking.createHold.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries();
		},
	});
}

export function useInitiatePayment() {
	const trpc = useTRPC();
	return useMutation(trpc.booking.initiatePayment.mutationOptions());
}

export function useVerifyPayment() {
	const trpc = useTRPC();
	return useMutation(trpc.booking.verifyPayment.mutationOptions());
}

export function useConfirmBooking() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	return useMutation({
		...trpc.booking.confirmBooking.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries();
		},
	});
}

export function useReleaseHold() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	return useMutation({
		...trpc.booking.releaseHold.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries();
		},
	});
}

export function useCheckoutWithWallet() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	return useMutation({
		...trpc.booking.checkoutWithWallet.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries();
		},
	});
}

export function useCancelBooking() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	return useMutation({
		...trpc.payments.cancelBooking.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries();
		},
	});
}

export function useShareTicket() {
	const trpc = useTRPC();
	return useMutation(trpc.booking.shareTicket.mutationOptions());
}

export function useSubmitReview() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	return useMutation({
		...trpc.passenger.submitReview.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.passenger.getUserReviews.pathFilter());
		},
	});
}

/**
 * Phase 18 (F-PS-04) — the server's own refund quote for THIS booking
 * (per-seat, snapshot-aware). The cancel dialog renders this instead of a
 * fare figure, matching the web parity fix.
 */
export function useRefundQuote(
	bookingReference: string | undefined,
	enabled: boolean,
) {
	const trpc = useTRPC();
	return useQuery({
		...trpc.passenger.getRefundQuote.queryOptions({
			bookingReference: bookingReference ?? "",
			channel: "WALLET",
		}),
		enabled: enabled && !!bookingReference,
	});
}
