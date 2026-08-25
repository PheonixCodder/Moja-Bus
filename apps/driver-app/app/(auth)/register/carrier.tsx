import { useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	ActivityIndicator,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import {
	ArrowLeft,
	Building2,
	CheckCircle,
	ShieldCheck,
	Send,
	Lock,
} from "lucide-react-native";
import {
	useDriverRegistrationStore,
	type EmploymentType,
} from "@/stores/driver-registration";
import { useTRPC } from "@/lib/trpc";
import { DriverFeedback } from "@/lib/haptics";

export default function RegisterStep4CarrierScreen() {
	const router = useRouter();
	const trpc = useTRPC();
	const store = useDriverRegistrationStore();

	const [code, setCode] = useState(store.carrierCode);
	const [employmentType, setEmploymentType] = useState<EmploymentType>(
		store.employmentType || "EXCLUSIVE_INTERCITY"
	);


	// Register mutation
	const registerMutation = useMutation(
		trpc.drivers.registerDriver.mutationOptions()
	);

	const handleSubmitRegistration = async () => {
		DriverFeedback.tap();

		try {
			const result = await registerMutation.mutateAsync({
				fullName: store.fullName,
				phone: store.phone,
				licenseNumber: store.licenseNumber,
				licenseCategory: store.licenseCategory,
				licenseExpiryDate: new Date(store.licenseExpiryDate),
				licenseFrontUrl: store.licenseFrontUri || undefined,
				licenseBackUrl: store.licenseBackUri || undefined,
				yearsOfExperience: store.yearsOfExperience,
				selfieUrl: store.profileSelfieUri || undefined,
				medicalDocUrl: store.medicalDocUri || undefined,
				nationalIdNumber: store.nationalIdNumber || undefined,
				employmentType,
				carrierInviteCode: code.trim() || undefined,
			});

			DriverFeedback.successScan();
			// Phase 15 (F-DV-05) — honest affiliation outcome instead of silence.
			if (!result.affiliated) {
				Alert.alert(
					"No Carrier Linked",
					code.trim()
						? "Your invite code didn't match an active carrier. Your application was submitted — once verified, operators can find and hire you on the marketplace."
						: "You submitted without a carrier code. Once verified, operators can find and hire you on the marketplace.",
				);
			}
			router.replace("/(auth)/register/status");
		} catch (err: any) {
			DriverFeedback.invalidScan();
			// Phase 14/16 (F-DV-10) — structured phone-mismatch error parses into
			// an honest message instead of surfacing the raw code.
			if (err?.message?.startsWith("PHONE_REVERIFICATION_REQUIRED")) {
				const parts = err.message.split("::");
				Alert.alert(
					"Phone Number Mismatch",
					`Your account uses ${parts[1] ?? "a different number"}, but you entered ${
						parts[2] ?? "another number"
					}. Sign-in codes go to your account number — update it via OTP verification first, or register with the account number.`,
				);
			} else {
				Alert.alert(
					"Registration Error",
					err.message || "Failed to submit driver application.",
				);
			}
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-zinc-950">
			{/* Top Nav Header */}
			<View className="px-5 py-3 border-b border-zinc-800 bg-zinc-900/60 flex-row items-center justify-between">
				<TouchableOpacity
					onPress={() => router.back()}
					className="size-10 rounded-full bg-zinc-800 items-center justify-center"
				>
					<ArrowLeft size={20} color="#fafafa" />
				</TouchableOpacity>
				<View className="items-center">
					<Text className="text-xs font-black text-white uppercase tracking-wider">
						Driver Onboarding
					</Text>
					<Text className="text-[10px] text-zinc-400 font-mono">
						Step 4 of 4: Carrier Affiliation
					</Text>
				</View>
				<View className="size-10" />
			</View>

			{/* Progress Indicator */}
			<View className="h-1 bg-zinc-900 w-full">
				<View className="h-full bg-rose-600 w-full" />
			</View>

			<ScrollView className="flex-1 px-5 py-6 space-y-6">
				{/* Header Intro */}
				<div>
					<Text className="text-2xl font-black text-white tracking-tight">
						Carrier Affiliation
					</Text>
					<Text className="text-xs text-zinc-400 mt-1 leading-relaxed">
						Connect your driver passport to your commercial bus carrier or transport company.
					</Text>
				</div>

				{/* Employment Type Choice */}
				<View className="space-y-2.5">
					<Text className="text-xs font-semibold text-zinc-300">
						Employment Model
					</Text>

					{/* Exclusive Intercity */}
					<TouchableOpacity
						onPress={() => {
							DriverFeedback.tap();
							setEmploymentType("EXCLUSIVE_INTERCITY");
						}}
						className={`p-4 rounded-2xl border flex-row items-start justify-between ${
							employmentType === "EXCLUSIVE_INTERCITY"
								? "bg-rose-600/10 border-rose-500"
								: "bg-zinc-900 border-zinc-800"
						}`}
					>
						<View className="flex-1 pr-3">
							<Text
								className={`text-sm font-bold ${
									employmentType === "EXCLUSIVE_INTERCITY"
										? "text-rose-400"
										: "text-white"
								}`}
							>
								Exclusive Intercity Carrier
							</Text>
							<Text className="text-xs text-zinc-400 mt-1 leading-relaxed">
								Assigned to scheduled long-distance coach routes with guaranteed shifts and carrier benefits.
							</Text>
						</View>
						{employmentType === "EXCLUSIVE_INTERCITY" && (
							<CheckCircle size={20} color="#e11d48" className="mt-0.5" />
						)}
					</TouchableOpacity>

					{/* Urban Contractor */}
					<TouchableOpacity
						onPress={() => {
							DriverFeedback.tap();
							setEmploymentType("CONTRACTOR_URBAN");
						}}
						className={`p-4 rounded-2xl border flex-row items-start justify-between ${
							employmentType === "CONTRACTOR_URBAN"
								? "bg-rose-600/10 border-rose-500"
								: "bg-zinc-900 border-zinc-800"
						}`}
					>
						<View className="flex-1 pr-3">
							<Text
								className={`text-sm font-bold ${
									employmentType === "CONTRACTOR_URBAN"
										? "text-rose-400"
										: "text-white"
								}`}
							>
								Urban Contractor
							</Text>
							<Text className="text-xs text-zinc-400 mt-1 leading-relaxed">
								Flexible urban loop driver available for high-frequency city shuttles and relief dispatches.
							</Text>
						</View>
						{employmentType === "CONTRACTOR_URBAN" && (
							<CheckCircle size={20} color="#e11d48" className="mt-0.5" />
						)}
					</TouchableOpacity>

					{/* Hybrid */}
					<TouchableOpacity
						onPress={() => {
							DriverFeedback.tap();
							setEmploymentType("HYBRID");
						}}
						className={`p-4 rounded-2xl border flex-row items-start justify-between ${
							employmentType === "HYBRID"
								? "bg-rose-600/10 border-rose-500"
								: "bg-zinc-900 border-zinc-800"
						}`}
					>
						<View className="flex-1 pr-3">
							<Text
								className={`text-sm font-bold ${
									employmentType === "HYBRID"
										? "text-rose-400"
										: "text-white"
								}`}
							>
								Hybrid (Intercity & Urban)
							</Text>
							<Text className="text-xs text-zinc-400 mt-1 leading-relaxed">
								Available for both long-distance intercity routes and urban shuttle operations.
							</Text>
						</View>
						{employmentType === "HYBRID" && (
							<CheckCircle size={20} color="#e11d48" className="mt-0.5" />
						)}
					</TouchableOpacity>
				</View>

				{/* Carrier Company Invite Code */}
				<View className="space-y-1.5 pt-2">
					<Text className="text-xs font-semibold text-zinc-300">
						Carrier Company Code / Invite Token (Optional)
					</Text>
					<View className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 h-12">
						<Building2 size={18} color="#71717a" />
						<TextInput
							className="flex-1 ml-3 text-white text-sm font-mono"
							placeholder="e.g. UTB-CI-01"
							placeholderTextColor="#52525b"
							autoCapitalize="characters"
							value={code}
							onChangeText={setCode}
						/>
					</View>
					<Text className="text-[11px] text-zinc-500 leading-relaxed">
						If provided by your bus operator (e.g. UTB, SBTA, SOTRA), enter it to auto-link your contract.
					</Text>
				</View>

				{/* Submit Button */}
				<TouchableOpacity
					onPress={handleSubmitRegistration}
					disabled={registerMutation.isPending}
					className="bg-rose-600 active:bg-rose-700 h-13 rounded-2xl items-center justify-center flex-row gap-2 mt-6 shadow-xl shadow-rose-600/30"
				>
					{registerMutation.isPending ? (
						<ActivityIndicator size="small" color="#ffffff" />
					) : (
						<>
							<Send size={18} color="#ffffff" />
							<Text className="text-white font-bold text-sm">
								Submit Application for Review
							</Text>
						</>
					)}
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
}
