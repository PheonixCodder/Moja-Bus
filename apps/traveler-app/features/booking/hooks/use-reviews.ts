import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

type PassengerRouter = {
	getUserReviews: TrpcQuery<void, { items: unknown[]; total: number }>;
	submitReview: TrpcMutation<
		{ bookingId: string; rating: number; content?: string },
		unknown
	>;
};

type TypedTRPC = {
	passenger: PassengerRouter;
};

export function useGetUserReviews(enabled?: boolean) {
	const trpc = useTRPC() as unknown as TypedTRPC;
	return useQuery({
		...trpc.passenger.getUserReviews.queryOptions(),
		enabled,
	});
}

export function useSubmitReview() {
	const trpc = useTRPC() as unknown as TypedTRPC;
	const queryClient = useQueryClient();
	return useMutation({
		...trpc.passenger.submitReview.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries();
		},
	});
}
