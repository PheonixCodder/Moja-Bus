import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

export function useOperatorsPrefetch() {
	const queryClient = useQueryClient();
	const trpc = useTRPC() as any;

	const prefetchOperatorsList = () => {
		queryClient.prefetchQuery(trpc.public.listOperators.queryOptions());
	};

	const prefetchOperator = (slug: string) => {
		if (!slug) return;
		queryClient.prefetchQuery(trpc.public.getOperator.queryOptions({ slug }));
	};

	return { prefetchOperatorsList, prefetchOperator };
}
