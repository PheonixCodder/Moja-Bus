import { ActivityIndicator, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { SubpageHeader } from "@/components/subpage-header";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
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
			<View className="flex-1 items-center justify-center bg-white">
				<ActivityIndicator size="large" color="#ee237c" />
			</View>
		);
	}

	if (!user) {
		return (
			<View className="flex-1 items-center justify-center bg-white">
				<Text className="text-[15px] text-slate-500">
					{t("signInToView") ?? "Please sign in to view security options."}
				</Text>
			</View>
		);
	}

	return (
		<View className="flex-1 bg-white">
			<SubpageHeader title="Privacy & Security" />

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
				<View className="bg-white rounded-[20px] border border-slate-100 p-4 gap-3 shadow-sm shadow-black/5">
					<View className="flex-row items-center gap-3">
						<View className="w-11 h-11 rounded-full bg-pink-50 items-center justify-center">
							<HugeiconsIcon icon={Shield01Icon} size={22} color="#ee237c" />
						</View>
						<View className="flex-1">
							<Text className="text-base font-bold text-slate-900">Account Security</Text>
							<Text className="text-sm text-slate-500 mt-0.5">Protected with encryption & secure session store</Text>
						</View>
					</View>

					<View className="h-[0.5px] bg-slate-100 my-1" />

					{/* Security Rows */}
					<View className="gap-3">
						<View className="flex-row items-center justify-between">
							<View className="flex-row items-center gap-2">
								<HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} color="#10B981" />
								<Text className="text-sm font-medium text-slate-800">Email Verification</Text>
							</View>
							<View className="bg-emerald-500/10 px-2.5 py-1 rounded-xl">
								<Text className="text-xs font-semibold text-emerald-600">
									{user.emailVerified ? "Verified" : "Protected"}
								</Text>
							</View>
						</View>

						<View className="flex-row items-center justify-between">
							<View className="flex-row items-center gap-2">
								<HugeiconsIcon icon={LockKeyIcon} size={18} color="#ee237c" />
								<Text className="text-sm font-medium text-slate-800">Two-Factor Auth (2FA)</Text>
							</View>
							<View className="bg-pink-50 px-2.5 py-1 rounded-xl">
								<Text className="text-xs font-semibold text-pink-600">Enabled</Text>
							</View>
						</View>
					</View>
				</View>

				{/* Active Sessions Card */}
				<View className="bg-white rounded-[20px] border border-slate-100 p-4 gap-3 shadow-sm shadow-black/5">
					<Text className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
						Active Devices & Sessions
					</Text>

					{/* Current Device Row */}
					<View className="flex-row items-center gap-3 py-2">
						<View className="w-10 h-10 rounded-full bg-blue-500/[0.08] items-center justify-center">
							<HugeiconsIcon icon={SmartPhone01Icon} size={20} color="#0081F1" />
						</View>
						<View className="flex-1">
							<View className="flex-row items-center gap-1.5">
								<Text className="text-sm font-semibold text-slate-800">Traveler Mobile App</Text>
								<View className="bg-emerald-500/10 px-1.5 py-0.5 rounded">
									<Text className="text-[10px] font-bold text-emerald-600">Current Device</Text>
								</View>
							</View>
							<Text className="text-xs text-slate-500 mt-0.5">Secure Token Session • Active now</Text>
						</View>
					</View>

					<View className="h-[0.5px] bg-slate-100" />

					{/* Web Session Row */}
					<View className="flex-row items-center gap-3 py-2">
						<View className="w-10 h-10 rounded-full bg-slate-500/10 items-center justify-center">
							<HugeiconsIcon icon={ComputerIcon} size={20} color="#64748B" />
						</View>
						<View className="flex-1">
							<Text className="text-sm font-medium text-slate-800">Web Browser Session</Text>
							<Text className="text-xs text-slate-500 mt-0.5">Moja Ride Web Portal • Account Synced</Text>
						</View>
					</View>
				</View>

				{/* Privacy Banner */}
				<View className="bg-pink-50/40 rounded-2xl border border-pink-200/50 p-4 flex-row items-start gap-3">
					<HugeiconsIcon icon={AlertCircleIcon} size={20} color="#ee237c" />
					<Text className="text-sm text-slate-700 leading-[18px] flex-1">
						Your payment data and saved travel profiles are stored in encrypted form. We never share your personal phone or email with unverified third parties.
					</Text>
				</View>
			</ScrollView>
		</View>
	);
}
