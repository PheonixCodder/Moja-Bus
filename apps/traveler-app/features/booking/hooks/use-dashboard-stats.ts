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

type PassengerRouter = {
	getDashboardStats: TrpcQuery<
		undefined,
		{
			upcomingTripsCount: number;
			pendingPaymentsCount: number;
			digitalTicketsCount: number;
			savedContactsCount: number;
		}
	>;
};

type TypedTRPC = {
	passenger: PassengerRouter;
};

export function useDashboardStats(enabled?: boolean) {
	const trpc = useTRPC() as unknown as TypedTRPC;
	return useQuery({
		...trpc.passenger.getDashboardStats.queryOptions(undefined, {
			staleTime: 30 * 1000,
		}),
		enabled,
	});
}
