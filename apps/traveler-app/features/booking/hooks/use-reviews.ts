import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

export function useGetUserReviews(enabled?: boolean) {
	const trpc = useTRPC();
	return useQuery({
		...trpc.passenger.getUserReviews.queryOptions(),
		enabled,
	});
}

export function useSubmitReview() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	return useMutation({
		...trpc.passenger.submitReview.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.passenger.getUserReviews.queryFilter());
		},
	});
}
