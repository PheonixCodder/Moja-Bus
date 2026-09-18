import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

export function useDashboardStats(enabled?: boolean) {
	const trpc = useTRPC();
	return useQuery({
		...trpc.passenger.getDashboardStats.queryOptions(undefined, {
			staleTime: 30 * 1000,
		}),
		enabled,
	});
}
