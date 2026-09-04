import { Tabs } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { authClient } from "@/lib/auth-client";
import { TabBar } from "@/components/TabBar";

import { useUserModeStore } from "@/stores/user-mode";

/** Live badge: number of PENDING/COUNTERED offers awaiting the driver. */
function usePendingOffersCount(): number {
	const { data: session } = authClient.useSession();
	const roleMode = useUserModeStore((s) => s.roleMode);
	const trpc = useTRPC();
	const { data } = useQuery({
		...trpc.drivers.getMyOffers.queryOptions({
			status: "ACTIVE",
			page: 1,
			limit: 1,
		}),
		refetchInterval: 30_000,
		enabled: !!session?.user && roleMode !== "CONDUCTOR",
	});
	return data?.total ?? 0;
}

export default function TabLayout() {
	const pendingOffers = usePendingOffersCount();
	const roleMode = useUserModeStore((s) => s.roleMode);
	const isConductor = roleMode === "CONDUCTOR";

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
			}}
			tabBar={(props) => <TabBar {...props} pendingOffers={pendingOffers} isConductor={isConductor} />}
		>
			<Tabs.Screen
				name="trips"
				options={{
					title: "Trajets",
				}}
			/>
			<Tabs.Screen
				name="offers"
				options={{
					title: "Offres",
					href: isConductor ? null : "/(tabs)/offers",
				}}
			/>
			<Tabs.Screen
				name="live"
				options={{
					title: "En direct",
					href: isConductor ? null : "/(tabs)/live",
				}}
			/>
			<Tabs.Screen
				name="scanner"
				options={{
					title: "Scanner",
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: "Passeport",
				}}
			/>
			<Tabs.Screen
				name="earnings"
				options={{
					href: null, // accessible via profile/trips
				}}
			/>
		</Tabs>
	);
}
