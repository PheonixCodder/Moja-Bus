import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { TRPCReactProvider } from "@/lib/trpc";

export default function RootLayout() {
	return (
		<SafeAreaProvider>
			<TRPCReactProvider>
				<StatusBar style="auto" />
				<Stack screenOptions={{ headerShown: false }}>
					<Stack.Screen name="index" />
					<Stack.Screen name="(auth)/login" />
					<Stack.Screen name="(tabs)" />
					<Stack.Screen
						name="trip/[id]/manifest"
						options={{
							presentation: "modal",
							headerShown: true,
							title: "Passenger Manifest",
							headerStyle: { backgroundColor: "#09090b" },
							headerTintColor: "#fafafa",
						}}
					/>
				</Stack>
				<Toast />
			</TRPCReactProvider>
		</SafeAreaProvider>
	);
}
