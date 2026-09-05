import { View } from "react-native";
import LoginView from "@/features/auth/screens/login";

export default function LoginScreen() {
	return (
		<View className="flex-1 bg-background">
			<LoginView />
		</View>
	);
}
