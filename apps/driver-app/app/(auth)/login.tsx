import { useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Phone, Lock, Bus, ShieldCheck } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { authClient } from "@/lib/auth-client";
import { DriverFeedback } from "@/lib/haptics";

export default function DriverLoginScreen() {
	const router = useRouter();
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleLogin = async () => {
		if (!phone.trim()) {
			Toast.show({
				type: "error",
				text1: "Required Field",
				text2: "Please enter your registered driver phone number.",
			});
			return;
		}
		if (!password.trim()) {
			Toast.show({
				type: "error",
				text1: "Required Field",
				text2: "Please enter your account password.",
			});
			return;
		}

		try {
			setIsLoading(true);
			DriverFeedback.tap();

			const res = await authClient.signIn.phoneNumber({
				phoneNumber: phone.trim(),
				password: password.trim(),
			});

			if (res.error) {
				Toast.show({
					type: "error",
					text1: "Login Failed",
					text2: res.error.message || "Invalid phone number or password.",
				});
				DriverFeedback.invalidScan();
			} else {
				DriverFeedback.successScan();
				Toast.show({
					type: "success",
					text1: "Welcome Back",
					text2: "Connected to driver dispatch terminal.",
				});
				router.replace("/(tabs)/trips");
			}
		} catch (err: any) {
			Toast.show({
				type: "error",
				text1: "Connection Error",
				text2: err.message || "Failed to reach authentication server.",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-zinc-950">
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				className="flex-1"
			>
				<ScrollView
					contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
					className="px-6 py-8"
				>
					{/* Brand Header */}
					<View className="items-center mb-8">
						<View className="size-16 rounded-2xl bg-rose-600/10 border border-rose-500/20 items-center justify-center mb-4">
							<Bus size={32} color="#e11d48" />
						</View>
						<Text className="text-2xl font-black text-white tracking-tight">
							Moja Driver
						</Text>
						<Text className="text-xs text-zinc-400 mt-1 text-center">
							Enterprise Commercial Fleet & Telemetry Terminal
						</Text>
					</View>

					{/* Form Card */}
					<View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
						{/* Phone input */}
						<View className="space-y-1.5">
							<Text className="text-xs font-semibold text-zinc-300">
								Phone Number
							</Text>
							<View className="flex-row items-center bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 h-12">
								<Phone size={18} color="#71717a" />
								<TextInput
									className="flex-1 ml-3 text-white text-sm"
									placeholder="+225 07 12 34 56 78"
									placeholderTextColor="#52525b"
									keyboardType="phone-pad"
									autoCapitalize="none"
									value={phone}
									onChangeText={setPhone}
								/>
							</View>
						</View>

						{/* Password input */}
						<View className="space-y-1.5">
							<Text className="text-xs font-semibold text-zinc-300">
								Password / PIN
							</Text>
							<View className="flex-row items-center bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 h-12">
								<Lock size={18} color="#71717a" />
								<TextInput
									className="flex-1 ml-3 text-white text-sm"
									placeholder="••••••••"
									placeholderTextColor="#52525b"
									secureTextEntry
									value={password}
									onChangeText={setPassword}
								/>
							</View>
						</View>

						{/* Submit button */}
						<TouchableOpacity
							onPress={handleLogin}
							disabled={isLoading}
							className="bg-rose-600 active:bg-rose-700 rounded-xl h-12 items-center justify-center mt-2 shadow-lg"
						>
							{isLoading ? (
								<ActivityIndicator color="#ffffff" />
							) : (
								<Text className="text-white font-bold text-sm">
									Sign In to Dispatch
								</Text>
							)}
						</TouchableOpacity>
					</View>

					{/* Compliance Footer */}
					<View className="flex-row items-center justify-center gap-2 mt-8">
						<ShieldCheck size={16} color="#10b981" />
						<Text className="text-xs text-zinc-500">
							Verified Drivers & Carrier Protection
						</Text>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
