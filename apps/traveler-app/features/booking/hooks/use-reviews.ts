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
	getUserReviews: TrpcQuery<
		void,
		{
			id: string;
			bookingId: string | null;
			rating: number;
			content: string | null;
			response: string | null;
			respondedAt: Date | null;
			createdAt: Date;
			company: { id: string; name: string };
		}[]
	>;
	submitReview: TrpcMutation<
		{
			companyId: string;
			bookingId: string;
			rating: number;
			driverRating?: number | null;
			busRating?: number | null;
			punctualityRating?: number | null;
			content?: string | null;
		},
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
