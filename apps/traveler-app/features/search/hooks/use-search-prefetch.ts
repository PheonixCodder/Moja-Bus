import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

export function useSearchPrefetch() {
	const queryClient = useQueryClient();
	const trpc = useTRPC();

	const prefetchSeatAvailability = (offerId: string) => {
		if (!offerId) return;
		queryClient.prefetchQuery(
			trpc.booking.getSeatAvailability.queryOptions({ offerId }),
		);
	};

	return { prefetchSeatAvailability };
}
