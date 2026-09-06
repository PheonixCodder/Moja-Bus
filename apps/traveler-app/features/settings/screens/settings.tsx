import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { authClient } from "@/lib/auth-client";
import { ProfileHero } from "../components/profile-hero";
import { SettingsDetails } from "../components/settings-details";
import { AccountSettingsList } from "../components/account-settings-list";
import { DangerZoneRow } from "../components/danger-zone-row";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { BottomTabInset, Palette } from "@/constants/theme";

export function SettingsView() {
	const insets = useSafeAreaInsets();
	const { t } = useTranslation("settings");
	const { data: session, isPending } = authClient.useSession();
	const isAuthenticated = !!session?.user;

	if (isPending) {
		return (
			<View className="flex-1 items-center justify-center bg-background">
				<ActivityIndicator size="large" color={Palette.rose[500]} />
			</View>
		);
	}

	const user = session?.user;

	return (
		<ScrollView
			className="flex-1 bg-background"
			contentContainerStyle={{ paddingBottom: BottomTabInset }}
		>
			<View
				className="px-5 pb-10"
				style={{ paddingTop: insets.top + 35 }}
			>
				{user ? (
					<View className="flex-row items-start">
						<ProfileHero
							name={user.name ?? "Traveler"}
							image={user.image}
							onPress={() => router.push("/personal-info" as any)}
						/>
					</View>
				) : (
					<View className="items-center py-6 gap-4">
						<Text className="text-muted-foreground text-base text-center">
							{t("signInToManage")}
						</Text>
						<Pressable
							onPress={() => router.push("/(auth)/login" as any)}
							accessibilityRole="button"
							className="px-8 py-3 bg-primary rounded-2xl active:opacity-85 min-h-12 justify-center items-center"
						>
							<Text className="text-primary-foreground font-bold text-sm">
								{t("signIn")}
							</Text>
						</Pressable>
					</View>
				)}
			</View>

			<View
				className="bg-card rounded-3xl mx-3 px-5 pt-6 shadow-xl border border-border"
				style={{ paddingBottom: BottomTabInset }}
			>
				<SettingsDetails isAuthenticated={isAuthenticated} />

				<AccountSettingsList isAuthenticated={isAuthenticated} />

				<View className="h-[0.5px] bg-border mx-5 mt-2" />

				<DangerZoneRow />
			</View>
		</ScrollView>
	);
}
