import { authClient } from "@/lib/auth-client";

export function usePrefetchGuard() {
	const { data: session } = authClient.useSession();
	const isAuthenticated = !!session?.user;

	const prefetchIfAuthed = (fn: () => void) => {
		if (isAuthenticated) fn();
	};

	return { isAuthenticated, prefetchIfAuthed };
}
