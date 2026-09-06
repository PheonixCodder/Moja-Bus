import { ActivityIndicator, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { SubpageHeader } from "@/components/subpage-header";
import { Text } from "@/components/ui/text";
import { BottomTabInset, Palette } from "@/constants/theme";
import { authClient } from "@/lib/auth-client";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	Shield01Icon,
	CheckmarkCircle01Icon,
	ComputerIcon,
	SmartPhone01Icon,
	LockKeyIcon,
	AlertCircleIcon,
} from "@hugeicons/core-free-icons";

export function PrivacySecurityView() {
	const insets = useSafeAreaInsets();
	const { t } = useTranslation("settings");
	const { data: session, isPending } = authClient.useSession();
	const user = session?.user;

	if (isPending) {
		return (
			<View className="flex-1 items-center justify-center bg-background">
				<ActivityIndicator size="large" color={Palette.rose[500]} />
			</View>
		);
	}

	if (!user) {
		return (
			<View className="flex-1 items-center justify-center bg-background">
				<Text className="text-base text-muted-foreground">
					{t("signInToView") ?? "Please sign in to view security options."}
				</Text>
			</View>
		);
	}

	return (
		<View className="flex-1 bg-background">
			<SubpageHeader title={t("privacySecurityTitle")} />

			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={{
					paddingHorizontal: 16,
					paddingTop: 8,
					paddingBottom: BottomTabInset + insets.bottom + 24,
					gap: 16,
				}}
			>
				{/* Security Overview Card */}
				<View className="bg-card rounded-[20px] border border-border p-4 gap-3 shadow-sm shadow-black/5">
					<View className="flex-row items-center gap-3">
						<View className="w-11 h-11 rounded-full bg-primary/10 items-center justify-center">
							<HugeiconsIcon icon={Shield01Icon} size={22} color={Palette.rose[500]} />
						</View>
						<View className="flex-1">
							<Text className="text-base font-bold text-foreground">{t("accountSecurity")}</Text>
							<Text className="text-sm text-muted-foreground mt-0.5">{t("encryptionDesc")}</Text>
						</View>
					</View>

					<View className="h-[0.5px] bg-border my-1" />

					{/* Security Rows */}
					<View className="gap-3">
						<View className="flex-row items-center justify-between">
							<View className="flex-row items-center gap-2">
								<HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} color={Palette.emerald[500]} />
								<Text className="text-sm font-medium text-foreground">{t("emailVerification")}</Text>
							</View>
							<View className="bg-success/10 px-2.5 py-1 rounded-xl">
								<Text className="text-xs font-semibold text-success">
									{user.emailVerified ? t("emailVerified") : t("active")}
								</Text>
							</View>
						</View>

						<View className="flex-row items-center justify-between">
							<View className="flex-row items-center gap-2">
								<HugeiconsIcon icon={LockKeyIcon} size={18} color={Palette.rose[500]} />
								<Text className="text-sm font-medium text-foreground">{t("twoFactorAuth")}</Text>
							</View>
							<View className="bg-primary/10 px-2.5 py-1 rounded-xl">
								<Text className="text-xs font-semibold text-primary">{t("emailVerified")}</Text>
							</View>
						</View>
					</View>
				</View>

				{/* Active Sessions Card */}
				<View className="bg-card rounded-[20px] border border-border p-4 gap-3 shadow-sm shadow-black/5">
					<Text className="text-sm font-bold text-muted-foreground tracking-wider uppercase">
						{t("activeDevices")}
					</Text>

					{/* Current Device Row */}
					<View className="flex-row items-center gap-3 py-2">
						<View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
							<HugeiconsIcon icon={SmartPhone01Icon} size={20} color={Palette.blue[500]} />
						</View>
						<View className="flex-1">
							<View className="flex-row items-center gap-1.5">
								<Text className="text-sm font-semibold text-foreground">{t("travelerMobileApp")}</Text>
								<View className="bg-success/10 px-1.5 py-0.5 rounded">
									<Text className="text-xs font-bold text-success">{t("currentDevice")}</Text>
								</View>
							</View>
							<Text className="text-xs text-muted-foreground mt-0.5">{t("activeSession")}</Text>
						</View>
					</View>

					<View className="h-[0.5px] bg-border" />

					{/* Web Session Row */}
					<View className="flex-row items-center gap-3 py-2">
						<View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
							<HugeiconsIcon icon={ComputerIcon} size={20} color={Palette.zinc[500]} />
						</View>
						<View className="flex-1">
							<Text className="text-sm font-medium text-foreground">{t("webBrowserSession")}</Text>
							<Text className="text-xs text-muted-foreground mt-0.5">{t("mojaWebPortal")}</Text>
						</View>
					</View>
				</View>

				{/* Privacy Banner */}
				<View className="bg-primary/10 rounded-2xl border border-primary/20 p-4 flex-row items-start gap-3">
					<HugeiconsIcon icon={AlertCircleIcon} size={20} color={Palette.rose[500]} />
					<Text className="text-sm text-foreground leading-[18px] flex-1">
						{t("privacyNote")}
					</Text>
				</View>
			</ScrollView>
		</View>
	);
}
