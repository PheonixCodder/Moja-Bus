import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

interface TrpcMutation<TInput, TOutput> {
	mutationOptions: () => {
		mutationFn: (input: TInput) => Promise<TOutput>;
	};
}

type BookingRouter = {
	createHold: TrpcMutation<
		{
			offerId: string;
			passengers: Array<{
				seatId: string;
				savedPassengerId?: string;
				passenger?: { passengerName: string; passengerPhone: string };
			}>;
		},
		{
			holdId: string;
			holdExpiresAt: string;
			bookingReferences: string[];
			totalAmountXOF: number;
		}
	>;
	initiatePayment: TrpcMutation<
		{ holdId: string; payerEmail?: string },
		{ authorizationUrl: string; reference: string }
	>;
	verifyPayment: TrpcMutation<{ reference: string }, { success: boolean }>;
	confirmBooking: TrpcMutation<{ holdId: string }, unknown>;
	releaseHold: TrpcMutation<{ holdId: string }, { success: boolean }>;
	checkoutWithWallet: TrpcMutation<{ holdId: string }, unknown>;
	cancelBooking: TrpcMutation<
		{ bookingReference: string },
		{ success: boolean }
	>;
	shareTicket: TrpcMutation<
		{
			bookingReference: string;
			recipientEmail: string;
			recipientName: string;
			recipientPhone?: string;
		},
		{ success: boolean }
	>;
};

type TypedTRPC = {
	booking: BookingRouter;
};

export function useCreateHold() {
	const trpc = useTRPC() as unknown as TypedTRPC;
	const queryClient = useQueryClient();
	return useMutation({
		...trpc.booking.createHold.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries();
		},
	});
}

export function useInitiatePayment() {
	const trpc = useTRPC() as unknown as TypedTRPC;
	return useMutation(trpc.booking.initiatePayment.mutationOptions());
}

export function useVerifyPayment() {
	const trpc = useTRPC() as unknown as TypedTRPC;
	return useMutation(trpc.booking.verifyPayment.mutationOptions());
}

export function useConfirmBooking() {
	const trpc = useTRPC() as unknown as TypedTRPC;
	const queryClient = useQueryClient();
	return useMutation({
		...trpc.booking.confirmBooking.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries();
		},
	});
}

export function useReleaseHold() {
	const trpc = useTRPC() as unknown as TypedTRPC;
	const queryClient = useQueryClient();
	return useMutation({
		...trpc.booking.releaseHold.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries();
		},
	});
}

export function useCheckoutWithWallet() {
	const trpc = useTRPC() as unknown as TypedTRPC;
	const queryClient = useQueryClient();
	return useMutation({
		...trpc.booking.checkoutWithWallet.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries();
		},
	});
}

export function useCancelBooking() {
	const trpc = useTRPC() as unknown as TypedTRPC;
	const queryClient = useQueryClient();
	return useMutation({
		...trpc.booking.cancelBooking.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries();
		},
	});
}

export function useShareTicket() {
	const trpc = useTRPC() as unknown as TypedTRPC;
	return useMutation(trpc.booking.shareTicket.mutationOptions());
}
