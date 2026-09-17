import { useEffect } from "react";
import { usePathname } from "expo-router";
import { trackScreenView, posthog } from "@/lib/posthog";
import { authClient } from "@/lib/auth-client";

export function PostHogNavigationTracker(): null {
	const pathname = usePathname();
	const { data: session } = authClient.useSession();

	// Screen tracking
	useEffect(() => {
		if (pathname) {
			trackScreenView(pathname);
		}
	}, [pathname]);

	// Identity tracking
	useEffect(() => {
		if (!posthog) return;
		const user = session?.user as Record<string, unknown> | undefined;
		if (user && typeof user["id"] === "string") {
			try {
				const userProps: Record<string, any> = {
					platform: "booth-app",
					role: typeof user["role"] === "string" ? user["role"] : "booth_agent",
				};
				if (typeof user["email"] === "string") {
					userProps["email"] = user["email"];
				}
				if (typeof user["name"] === "string") {
					userProps["name"] = user["name"];
				}
				posthog.identify(user["id"], userProps);
			} catch {}
		}
	}, [session?.user]);

	return null;
}
