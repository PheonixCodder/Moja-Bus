import { View, Text, Pressable } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Wallet01Icon, Add01Icon } from "@hugeicons/core-free-icons";
import { NotificationBell } from "@/components/notification-bell";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { authClient } from "@/lib/auth-client";
import { useSettingsPrefetch } from "@/features/settings/hooks/use-settings-prefetch";

interface HomeHeaderProps {
	walletBalance: number;
	isAuthenticated: boolean;
}

export function HomeHeader({ walletBalance, isAuthenticated }: HomeHeaderProps) {
	const { t } = useTranslation("home");
	const { data: session } = authClient.useSession();
	const { prefetchWallet } = useSettingsPrefetch();
	const userName = isAuthenticated
		? (session?.user?.name?.split(" ")[0] ?? "Traveler")
		: "Traveler";

	return (
		<View className="flex-row items-center justify-between py-1">
			<View className="flex-1 pr-3 gap-0.5">
				<Text className="will-change-variable text-sm font-semibold text-slate-400 uppercase tracking-widest">
					{t("greeting", "Hello")}
				</Text>
				<Text
					className="will-change-variable text-2xl font-black text-slate-900 tracking-tight"
					numberOfLines={1}
				>
					{userName}
				</Text>
			</View>

			<View className="flex-row items-center gap-2">
				<Pressable
					onPressIn={() => {
						if (isAuthenticated) prefetchWallet();
					}}
					onPress={() => router.push("/wallet")}
					className="will-change-pressable flex-row items-center gap-1.5 bg-rose-50 border border-rose-100 px-3 py-2 rounded-full active:bg-rose-100"
				>
					<HugeiconsIcon icon={Wallet01Icon} size={15} color="#ee237c" />
					<Text className="will-change-variable text-xs font-extrabold text-rose-700">
						{walletBalance.toLocaleString()} F
					</Text>
					<View className="bg-rose-500 rounded-full p-0.5 ml-0.5">
						<HugeiconsIcon icon={Add01Icon} size={9} color="#ffffff" />
					</View>
				</Pressable>

				<NotificationBell />
			</View>
		</View>
	);
}
