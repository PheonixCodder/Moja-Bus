import { useState } from "react";
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
	UserCheck,
	Star,
	ShieldCheck,
	Route,
	Award,
	Building2,
	LogOut,
	CreditCard,
	Phone,
	Calendar,
} from "lucide-react-native";
import { authClient } from "@/lib/auth-client";
import { DriverFeedback } from "@/lib/haptics";

export default function DriverProfileScreen() {
	const router = useRouter();
	const [onDuty, setOnDuty] = useState(true);

	const handleSignOut = async () => {
		DriverFeedback.tap();
		try {
			await authClient.signOut();
		} catch {}
		router.replace("/(auth)/login");
	};

	const toggleDuty = (val: boolean) => {
		DriverFeedback.tap();
		setOnDuty(val);
	};

	return (
		<SafeAreaView className="flex-1 bg-zinc-950">
			{/* Top Passport Header */}
			<View className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/60">
				<Text className="text-xl font-black text-white tracking-tight">
					Driver Career Passport
				</Text>
				<Text className="text-xs text-zinc-400 mt-0.5">
					Universal portable driver identity across Moja Ride operators
				</Text>
			</View>

			<ScrollView className="flex-1 px-5 py-4 space-y-4">
				{/* Driver ID Card */}
				<View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
					<View className="flex-row items-center justify-between">
						<View className="flex-row items-center gap-3.5">
							<View className="size-14 rounded-2xl bg-rose-600/10 border border-rose-500/20 items-center justify-center">
								<Text className="text-xl font-black text-rose-500">IT</Text>
							</View>
							<View>
								<Text className="text-lg font-black text-white">
									Ibrahim Touré
								</Text>
								<View className="flex-row items-center gap-1.5 mt-0.5">
									<ShieldCheck size={14} color="#10b981" />
									<Text className="text-xs text-emerald-400 font-semibold">
										Verified Class D Commercial
									</Text>
								</View>
							</View>
						</View>
					</View>

					{/* Shift On-Duty Toggle */}
					<View className="flex-row items-center justify-between bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800">
						<View>
							<Text className="text-sm font-bold text-white">On-Duty Shift Status</Text>
							<Text className="text-xs text-zinc-400">
								{onDuty ? "Available for trip dispatch & GPS streaming" : "Off-duty / Resting"}
							</Text>
						</View>
						<Switch
							value={onDuty}
							onValueChange={toggleDuty}
							trackColor={{ false: "#3f3f46", true: "#e11d48" }}
							thumbColor="#ffffff"
						/>
					</View>
				</View>

				{/* Lifetime Career Achievements */}
				<View className="grid grid-cols-2 gap-3 flex-row flex-wrap">
					<View className="flex-1 min-w-[140px] bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
						<View className="flex-row items-center gap-2 mb-2">
							<Star size={18} color="#f59e0b" fill="#f59e0b" />
							<Text className="text-xs text-zinc-400 font-bold">Rating</Text>
						</View>
						<Text className="text-2xl font-black text-white font-mono">4.92</Text>
						<Text className="text-[10px] text-zinc-500 mt-0.5">384 verified reviews</Text>
					</View>

					<View className="flex-1 min-w-[140px] bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
						<View className="flex-row items-center gap-2 mb-2">
							<ShieldCheck size={18} color="#10b981" />
							<Text className="text-xs text-zinc-400 font-bold">Safety Index</Text>
						</View>
						<Text className="text-2xl font-black text-emerald-400 font-mono">98/100</Text>
						<Text className="text-[10px] text-zinc-500 mt-0.5">Zero collision record</Text>
					</View>

					<View className="flex-1 min-w-[140px] bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
						<View className="flex-row items-center gap-2 mb-2">
							<Route size={18} color="#38bdf8" />
							<Text className="text-xs text-zinc-400 font-bold">Journeys</Text>
						</View>
						<Text className="text-2xl font-black text-white font-mono">512</Text>
						<Text className="text-[10px] text-zinc-500 mt-0.5">Completed runs</Text>
					</View>

					<View className="flex-1 min-w-[140px] bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
						<View className="flex-row items-center gap-2 mb-2">
							<Award size={18} color="#a855f7" />
							<Text className="text-xs text-zinc-400 font-bold">Distance</Text>
						</View>
						<Text className="text-2xl font-black text-white font-mono">68,400</Text>
						<Text className="text-[10px] text-zinc-500 mt-0.5">km logged</Text>
					</View>
				</View>

				{/* Affiliated Carriers */}
				<View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
					<Text className="text-xs font-bold text-zinc-400 uppercase">
						Active Carrier Affiliations
					</Text>

					<View className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex-row items-center justify-between">
						<View className="flex-row items-center gap-3">
							<Building2 size={18} color="#e11d48" />
							<View>
								<Text className="text-sm font-bold text-white">
									UTB Intercity Express
								</Text>
								<Text className="text-xs text-zinc-400">
									Exclusive Contract • Badge: DRV-084
								</Text>
							</View>
						</View>
						<Text className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
							Active
						</Text>
					</View>
				</View>

				{/* Sign out button */}
				<TouchableOpacity
					onPress={handleSignOut}
					className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex-row items-center justify-center gap-2 mt-4"
				>
					<LogOut size={16} color="#ef4444" />
					<Text className="text-sm font-bold text-rose-500">Sign Out</Text>
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
}
