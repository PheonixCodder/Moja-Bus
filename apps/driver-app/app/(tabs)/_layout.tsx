import { Tabs } from "expo-router";
import {
	Route,
	Radio,
	QrCode,
	UserCheck,
	Coins,
	Briefcase,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { authClient } from "@/lib/auth-client";

/** Live badge: number of PENDING/COUNTERED offers awaiting the driver. */
function usePendingOffersCount(): number {
	const { data: session } = authClient.useSession();
	const trpc = useTRPC();
	const { data } = useQuery({
		...trpc.drivers.getMyOffers.queryOptions({
			status: "ACTIVE",
			page: 1,
			limit: 1,
		}),
		refetchInterval: 30_000,
		enabled: !!session?.user,
	});
	return data?.total ?? 0;
}

export default function TabLayout() {
	const pendingOffers = usePendingOffersCount();

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					backgroundColor: "#09090b",
					borderTopColor: "#27272a",
					height: 60,
					paddingBottom: 8,
					paddingTop: 6,
				},
				tabBarActiveTintColor: "#e11d48",
				tabBarInactiveTintColor: "#71717a",
				tabBarLabelStyle: {
					fontSize: 10,
					fontWeight: "600",
				},
			}}
		>
			<Tabs.Screen
				name="trips"
				options={{
					title: "My Trips",
					tabBarIcon: ({ color, size }) => <Route size={size} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="offers"
				options={{
					title: "Offers",
					tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
				tabBarBadge:
					pendingOffers > 0
						? pendingOffers > 99
							? "99+"
							: pendingOffers
						: undefined,
				}}
			/>
			<Tabs.Screen
				name="live"
				options={{
					title: "Live Trip",
					tabBarIcon: ({ color, size }) => <Radio size={size} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="scanner"
				options={{
					title: "QR Scanner",
					tabBarIcon: ({ color, size }) => <QrCode size={size} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="earnings"
				options={{
					title: "Earnings",
					tabBarIcon: ({ color, size }) => <Coins size={size} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: "Passport",
					tabBarIcon: ({ color, size }) => (
						<UserCheck size={size} color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
