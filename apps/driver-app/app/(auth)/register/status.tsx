import { useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	ScrollView,
	ActivityIndicator,
	RefreshControl,
	Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
	Clock,
	CheckCircle,
	XCircle,
	ShieldCheck,
	ShieldAlert,
	Phone,
	ArrowRight,
	RotateCw,
	LogOut,
} from "lucide-react-native";
import { useTRPC } from "@/lib/trpc";
import { authClient } from "@/lib/auth-client";
import { DriverFeedback } from "@/lib/haptics";

export default function RegisterStatusScreen() {
	const router = useRouter();
	const trpc = useTRPC();

	// Real tRPC query for verification status
	const {
		data: statusData,
		isLoading,
		isRefetching,
		refetch,
	} = useQuery(
		trpc.drivers.getMyVerificationStatus.queryOptions(undefined, {
			refetchInterval: 10000, // Poll every 10 seconds while on this screen
		})
	);

	const verificationStatus = statusData?.driver?.verificationStatus ?? "PENDING";
	const rejectionReason = statusData?.driver?.rejectionReason;

	const handleEnterDashboard = () => {
		DriverFeedback.successScan();
		router.replace("/(tabs)/trips");
	};

	const handleContactSupport = () => {
		DriverFeedback.tap();
		Linking.openURL("tel:+2250700000000").catch(() => {});
	};

	const handleSignOut = async () => {
		DriverFeedback.tap();
		try {
			await authClient.signOut();
		} catch {}
		router.replace("/(auth)/login");
	};

	return (
		<SafeAreaView className="flex-1 bg-zinc-950">
			<ScrollView
				contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
				className="px-6 py-8"
				refreshControl={
					<RefreshControl
						refreshing={isRefetching}
						onRefresh={() => refetch()}
						tintColor="#e11d48"
					/>
				}
			>
				{isLoading ? (
					<View className="items-center justify-center space-y-3">
						<ActivityIndicator size="large" color="#e11d48" />
						<Text className="text-xs text-zinc-400 font-medium">
							Checking verification status...
						</Text>
					</View>
				) : verificationStatus === "VERIFIED" ? (
					/* VERIFIED STATE */
					<View className="items-center text-center space-y-5">
						<View className="size-20 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 items-center justify-center shadow-xl shadow-emerald-500/20">
							<CheckCircle size={40} color="#10b981" />
						</View>

						<View>
							<Text className="text-2xl font-black text-white text-center">
								Compliance Cleared!
							</Text>
							<Text className="text-xs text-emerald-400 font-semibold text-center mt-1">
								Driver Career Passport Activated
							</Text>
							<Text className="text-xs text-zinc-400 text-center mt-2 max-w-xs leading-relaxed">
								Your commercial license and background checks have been verified. You can now access your dispatches.
							</Text>
						</View>

						<TouchableOpacity
							onPress={handleEnterDashboard}
							className="w-full bg-emerald-600 active:bg-emerald-700 h-13 rounded-2xl items-center justify-center flex-row gap-2 mt-4 shadow-xl shadow-emerald-600/30"
						>
							<Text className="text-white font-black text-sm">
								Enter Driver Dispatch Terminal
							</Text>
							<ArrowRight size={18} color="#ffffff" />
						</TouchableOpacity>
					</View>
				) : verificationStatus === "SUSPENDED" ? (
				/* SUSPENDED STATE — Phase 06 (F-DV-04): honest surface instead of
				   falling into the "under review" copy. Read-only access. */
				<View className="items-center text-center space-y-5">
					<View className="size-20 rounded-3xl bg-zinc-500/10 border-2 border-zinc-500/30 items-center justify-center">
						<ShieldAlert size={40} color="#a1a1aa" />
					</View>

					<View>
						<Text className="text-2xl font-black text-white text-center">
							Account Suspended
						</Text>
						<Text className="text-xs text-zinc-400 font-semibold text-center mt-1">
							Driving Privileges Paused
						</Text>
						<Text className="text-xs text-zinc-400 text-center mt-2 max-w-xs leading-relaxed">
							Safety controllers have suspended your account. You can review your trips and career passport, but cannot start runs, check in passengers, or go on duty.
						</Text>
					</View>

					<TouchableOpacity
						onPress={handleContactSupport}
						className="w-full bg-zinc-800 active:bg-zinc-700 h-13 rounded-2xl items-center justify-center flex-row gap-2"
					>
						<Phone size={18} color="#ffffff" />
						<Text className="text-white font-bold text-sm">
							Contact Support
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						onPress={handleSignOut}
						className="w-full border border-zinc-700 h-13 rounded-2xl items-center justify-center flex-row gap-2"
					>
						<LogOut size={18} color="#a1a1aa" />
						<Text className="text-zinc-300 font-bold text-sm">Sign Out</Text>
					</TouchableOpacity>
				</View>
			) : verificationStatus === "REJECTED" ? (
					/* REJECTED STATE */
					<View className="items-center text-center space-y-5">
						<View className="size-20 rounded-3xl bg-rose-500/10 border-2 border-rose-500/30 items-center justify-center shadow-xl shadow-rose-500/20">
							<XCircle size={40} color="#f43f5e" />
						</View>

						<View>
							<Text className="text-2xl font-black text-white text-center">
								Application Needs Attention
							</Text>
							<Text className="text-xs text-rose-400 font-semibold text-center mt-1">
								Verification Incomplete
							</Text>
						</View>

						{rejectionReason && (
							<View className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl w-full">
								<Text className="text-xs font-bold text-zinc-300">
									Carrier Review Feedback:
								</Text>
								<Text className="text-xs text-rose-300 mt-1 leading-relaxed">
									{rejectionReason}
								</Text>
							</View>
						)}

						<TouchableOpacity
							onPress={() => router.replace("/(auth)/register")}
							className="w-full bg-rose-600 active:bg-rose-700 h-13 rounded-2xl items-center justify-center flex-row gap-2 shadow-lg shadow-rose-600/30"
						>
							<Text className="text-white font-bold text-sm">
								Update Application & Re-submit
							</Text>
						</TouchableOpacity>
					</View>
				) : verificationStatus === "EXPIRED" ? (
					/* EXPIRED STATE — licence document has expired; driver must
					   re-upload and contact operator for re-verification. */
					<View className="items-center text-center space-y-5">
						<View className="size-20 rounded-3xl bg-orange-500/10 border-2 border-orange-500/30 items-center justify-center shadow-xl shadow-orange-500/20">
							<ShieldAlert size={40} color="#f97316" />
						</View>

						<View>
							<Text className="text-2xl font-black text-white text-center">
								Licence Expiree
							</Text>
							<Text className="text-xs text-orange-400 font-semibold text-center mt-1">
								Documents de conduite expires
							</Text>
							<Text className="text-xs text-zinc-400 text-center mt-2 max-w-xs leading-relaxed">
								Votre permis de conduire a expire. Mettez a jour vos documents et contactez votre operateur pour la re-verification.
							</Text>
						</View>

						<TouchableOpacity
							onPress={() => router.replace("/(auth)/register")}
							className="w-full bg-orange-600 active:bg-orange-700 h-13 rounded-2xl items-center justify-center flex-row gap-2 shadow-lg shadow-orange-600/30"
						>
							<RotateCw size={18} color="#ffffff" />
							<Text className="text-white font-bold text-sm">
								Re-upload Documents
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							onPress={handleContactSupport}
							className="w-full bg-zinc-900 border border-zinc-800 h-13 rounded-2xl items-center justify-center flex-row gap-2"
						>
							<Phone size={18} color="#ffffff" />
							<Text className="text-white font-bold text-sm">
								Contact Carrier Dispatch Desk
							</Text>
						</TouchableOpacity>
					</View>
				) : (
					/* PENDING STATE */
					<View className="items-center text-center space-y-5">
						<View className="size-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 items-center justify-center shadow-xl shadow-amber-500/20">
							<Clock size={40} color="#f59e0b" />
						</View>

						<View>
							<Text className="text-2xl font-black text-white text-center">
								Application Under Review
							</Text>
							<Text className="text-xs text-amber-400 font-semibold text-center mt-1">
								Carrier Compliance & Safety Check
							</Text>
							<Text className="text-xs text-zinc-400 text-center mt-2.5 max-w-xs leading-relaxed">
								Your driving license, national ID, and carrier invite credentials are being reviewed by safety controllers. Verification typically takes 2–24 hours.
							</Text>
						</View>

						<View className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl w-full space-y-2.5">
							<View className="flex-row items-center justify-between">
								<Text className="text-xs text-zinc-400">Application Reference</Text>
								<Text className="text-xs font-mono font-bold text-zinc-200">
									{statusData?.driver?.id?.slice(0, 12) ?? "SUBMITTED"}
								</Text>
							</View>
							<View className="flex-row items-center justify-between">
								<Text className="text-xs text-zinc-400">License Category</Text>
								<Text className="text-xs font-bold text-rose-400">
									Class {statusData?.driver?.licenseCategory ?? "D"} Heavy Commercial
								</Text>
							</View>
						</View>

						{/* Action Buttons */}
						<View className="w-full space-y-2.5 pt-2">
							<TouchableOpacity
								onPress={() => refetch()}
								className="w-full bg-zinc-900 border border-zinc-800 h-12 rounded-xl items-center justify-center flex-row gap-2 active:bg-zinc-800"
							>
								<RotateCw size={16} color="#fafafa" />
								<Text className="text-xs font-bold text-white">
									Check Verification Status
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								onPress={handleContactSupport}
								className="w-full bg-zinc-900 border border-zinc-800 h-12 rounded-xl items-center justify-center flex-row gap-2 active:bg-zinc-800"
							>
								<Phone size={16} color="#38bdf8" />
								<Text className="text-xs font-bold text-sky-400">
									Contact Carrier Dispatch Desk
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				)}

				{/* Sign Out Link */}
				<TouchableOpacity
					onPress={handleSignOut}
					className="flex-row items-center justify-center gap-1.5 mt-8"
				>
					<LogOut size={14} color="#71717a" />
					<Text className="text-xs text-zinc-500 font-semibold">
						Switch Account / Sign Out
					</Text>
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
}
