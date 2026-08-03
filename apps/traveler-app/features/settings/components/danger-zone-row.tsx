import { Logout01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Colors, Spacing } from "@moja/theme/tokens";
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
				style={({ pressed }) => ({
					flexDirection: "row",
					alignItems: "center",
					paddingVertical: Spacing.four,
					paddingHorizontal: 20,
					opacity: pressed ? 0.6 : isSigningOut ? 0.5 : 1,
				})}
			>
				<View
					style={{
						width: Spacing.three,
						alignItems: "center",
						marginRight: Spacing.five,
					}}
				>
					<HugeiconsIcon
						icon={Logout01Icon}
						size={20}
						color={Colors.light.textSecondary}
					/>
				</View>
				<Text
					style={{ fontSize: 15, fontWeight: "500", color: Colors.light.text }}
				>
					Log Out
				</Text>
			</Pressable>
		</View>
	);
}
