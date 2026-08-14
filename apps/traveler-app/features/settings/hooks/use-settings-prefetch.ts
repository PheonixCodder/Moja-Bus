import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { usePrefetchGuard } from "@/lib/prefetch-guard";

const WALLET_LEDGER_PAGE_SIZE = 10;

export function useSettingsPrefetch() {
	const queryClient = useQueryClient();
	const trpc = useTRPC() as any;
	const { prefetchIfAuthed } = usePrefetchGuard();

	const prefetchWallet = () => {
		prefetchIfAuthed(() => {
			queryClient.prefetchQuery(trpc.passenger.getWalletBalance.queryOptions());
			queryClient.prefetchQuery(
				trpc.passenger.getWalletLedger.queryOptions({
					limit: WALLET_LEDGER_PAGE_SIZE,
					offset: 0,
				}),
			);
		});
	};

	const prefetchPassengers = () => {
		prefetchIfAuthed(() => {
			queryClient.prefetchQuery(trpc.passenger.listSaved.queryOptions());
		});
	};

	const prefetchPreferences = () => {
		prefetchIfAuthed(() => {
			queryClient.prefetchQuery(trpc.passenger.getPreferences.queryOptions());
		});
	};

	const prefetchReviews = () => {
		prefetchIfAuthed(() => {
			queryClient.prefetchQuery(trpc.passenger.getUserReviews.queryOptions());
		});
	};

	const prefetchForRoute = (route: string) => {
		switch (route) {
			case "/wallet":
				prefetchWallet();
				break;
			case "/passengers":
				prefetchPassengers();
				break;
			case "/personal-info":
				prefetchPreferences();
				break;
			case "/reviews":
				prefetchReviews();
				break;
		}
	};

	return {
		prefetchWallet,
		prefetchPassengers,
		prefetchPreferences,
		prefetchReviews,
		prefetchForRoute,
	};
}
