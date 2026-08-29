import { View } from "react-native";
import LoginView from "@/features/auth/screens/login";

export default function LoginScreen() {
	return (
		<View style={{ flex: 1, backgroundColor: "#09090b" }}>
			<LoginView />
		</View>
	);
}
