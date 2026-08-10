import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

export interface UserReviewDTO {
	bookingId: string;
	rating: number;
	content: string | null;
}

export interface SubmitReviewInput {
	companyId: string;
	bookingId: string;
	rating: number;
	content?: string | null;
}

interface TrpcQuery<TInput, TOutput> {
	queryOptions: (input: TInput) => {
		queryKey: unknown[];
		queryFn: () => Promise<TOutput>;
	};
}

interface TrpcMutation<TInput, TOutput> {
	mutationOptions: () => {
		mutationFn: (input: TInput) => Promise<TOutput>;
	};
}

type PassengerRouter = {
	getUserReviews: TrpcQuery<void, UserReviewDTO[]>;
	submitReview: TrpcMutation<SubmitReviewInput, { id: string }>;
};

type TypedTRPC = {
	passenger: PassengerRouter;
};

export function useUserReviews(enabled?: boolean) {
	const trpc = useTRPC() as unknown as TypedTRPC;
	return useQuery({
		...trpc.passenger.getUserReviews.queryOptions(),
		enabled,
	});
}

export function useSubmitReview() {
	const trpc = useTRPC() as unknown as TypedTRPC;
	return useMutation(trpc.passenger.submitReview.mutationOptions());
}
