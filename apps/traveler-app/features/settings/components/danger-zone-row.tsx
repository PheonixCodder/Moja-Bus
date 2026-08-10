import { Logout01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";

export function DangerZoneRow() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [isSigningOut, setIsSigningOut] = useState(false);

	function handleLogout() {
		Alert.alert("Log Out", "Are you sure you want to log out?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Log Out",
				style: "destructive",
				onPress: async () => {
					setIsSigningOut(true);
					const { error } = await authClient.signOut();
					if (error) {
						setIsSigningOut(false);
						Alert.alert(
							"Log Out Failed",
							error.message ?? "An unexpected error occurred",
						);
						return;
					}
					queryClient.clear();
					router.replace("/(auth)/login");
				},
			},
		]);
	}

	return (
		<View>
			<Pressable
				onPress={handleLogout}
				disabled={isSigningOut}
				className="flex-row items-center py-4 px-5 active:opacity-60 disabled:opacity-50"
			>
				<View className="w-6 items-center mr-5">
					<HugeiconsIcon icon={Logout01Icon} size={20} color="#e11d48" />
				</View>
				<Text className="text-base font-semibold text-rose-600">
					Log Out
				</Text>
			</Pressable>
		</View>
	);
}
