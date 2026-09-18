import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

export interface UserReviewDTO {
	id: string;
	bookingId: string | null;
	rating: number;
	content: string | null;
	response: string | null;
	respondedAt: Date | string | null;
	createdAt: Date | string;
	company: { id: string; name: string };
}

export interface SubmitReviewInput {
	companyId: string;
	bookingId: string;
	rating: number;
	content?: string | null;
}

export function useUserReviews(enabled?: boolean) {
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
