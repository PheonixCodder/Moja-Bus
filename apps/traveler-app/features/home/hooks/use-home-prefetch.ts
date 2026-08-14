import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { usePrefetchGuard } from "@/lib/prefetch-guard";
import { bookingsListInput, HOME_UPCOMING_LIMIT } from "@/features/booking/constants/query-keys";

export function useHomePrefetch() {
	const queryClient = useQueryClient();
	const trpc = useTRPC() as any;
	const { prefetchIfAuthed } = usePrefetchGuard();

	const prefetchHomeFeed = () => {
		prefetchIfAuthed(() => {
			queryClient.prefetchQuery(trpc.passenger.getWalletBalance.queryOptions());
			queryClient.prefetchQuery(
				trpc.booking.listMyBookings.queryOptions(
					bookingsListInput("upcoming", HOME_UPCOMING_LIMIT),
				),
			);
		});
		queryClient.prefetchQuery(trpc.blog.listActiveBanners.queryOptions());
		queryClient.prefetchQuery(
			trpc.blog.getPublishedPosts.queryOptions({ limit: 5 }),
		);
		queryClient.prefetchQuery(trpc.public.listOperators.queryOptions());
	};

	const prefetchArticle = (slug: string) => {
		if (!slug) return;
		queryClient.prefetchQuery(
			trpc.blog.getPostBySlug.queryOptions({ slug }),
		);
	};

	return { prefetchHomeFeed, prefetchArticle };
}
