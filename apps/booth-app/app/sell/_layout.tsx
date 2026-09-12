import { Stack } from "expo-router";
import { Colors } from "@/constants/theme";

export default function SellLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false,
				contentStyle: { flex: 1, backgroundColor: Colors.light.background },
			}}
		/>
	);
}
