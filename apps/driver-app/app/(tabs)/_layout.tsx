import { Tabs } from "expo-router";
import { Route, Radio, QrCode, UserCheck } from "lucide-react-native";

export default function TabLayout() {
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
