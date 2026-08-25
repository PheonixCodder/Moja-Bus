import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	Image,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
	ArrowLeft,
	Camera,
	FileText,
	ShieldCheck,
	HeartPulse,
	ArrowRight,
} from "lucide-react-native";
import { useDriverRegistrationStore } from "@/stores/driver-registration";
import { DriverFeedback } from "@/lib/haptics";
import { useTRPC } from "@/lib/trpc";
import { uploadCapturedDocument } from "@/lib/driver-doc-upload";

export default function RegisterStep3DocumentsScreen() {
	const router = useRouter();
	const {
		nationalIdNumber,
		medicalDocUri,
		updateData,
	} = useDriverRegistrationStore();
	const trpc = useTRPC();
	const presign = useMutation(trpc.storage.presignUpload.mutationOptions());

	const [idInput, setIdInput] = useState(nationalIdNumber);
	const [medicalUri, setMedicalUri] = useState<string | null>(medicalDocUri);
	// Phase 15 — uploaded object key (distinct from the local preview URI).
	const [medicalKey, setMedicalKey] = useState<string | null>(
		medicalDocUri?.startsWith("documents/") ? medicalDocUri : null,
	);

	const handleCaptureMedical = async () => {
		DriverFeedback.tap();
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") {
			Alert.alert("Permission Required", "Camera permission is required to capture medical clearance documents.");
			return;
		}

		const result = await ImagePicker.launchCameraAsync({
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.7,
		});

		if (!result.canceled && result.assets?.[0]?.uri) {
			const localUri = result.assets[0].uri;
			setMedicalUri(localUri);

			const storedKey = await uploadCapturedDocument({
				presign: presign.mutateAsync as never,
				localUri,
				fileName: "medical-certificate.jpg",
				purpose: "driver-medical-doc",
			});
			if (!storedKey) {
				Alert.alert(
					"Upload Failed",
					"Check your connection and retake the photo — it must upload before you continue.",
				);
				return;
			}
			setMedicalKey(storedKey);
			updateData({ medicalDocUri: storedKey });
		}
	};

	const handleNext = () => {
		if (!idInput.trim()) {
			Alert.alert("Required Field", "Please enter your National Identity Number (CNI).");
			return;
		}
		if (medicalUri && !medicalKey) {
			Alert.alert(
				"Document Not Uploaded",
				"Your medical certificate failed to upload. Retake it or remove it before continuing.",
			);
			return;
		}

		DriverFeedback.tap();
		updateData({
			nationalIdNumber: idInput.trim(),
		});

		router.push("/(auth)/register/carrier");
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
						Step 3 of 4: Compliance Docs
					</Text>
				</View>
				<View className="size-10" />
			</View>

			{/* Progress Indicator */}
			<View className="h-1 bg-zinc-900 w-full">
				<View className="h-full bg-rose-600 w-3/4" />
			</View>

			<ScrollView className="flex-1 px-5 py-6 space-y-6">
				{/* Header Intro — Phase 15: raw <div> crashed Android (Gate-A UI fix) */}
				<View>
					<Text className="text-2xl font-black text-white tracking-tight">
						Compliance Documents
					</Text>
					<Text className="text-xs text-zinc-400 mt-1 leading-relaxed">
						National identification and medical fitness records ensure intercity traveler safety.
					</Text>
				</View>

				{/* Inputs */}
				<View className="space-y-4">
					{/* National ID Number */}
					<View className="space-y-1.5">
						<Text className="text-xs font-semibold text-zinc-300">
							National ID Number (CNI)
						</Text>
						<View className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 h-12">
							<FileText size={18} color="#71717a" />
							<TextInput
								className="flex-1 ml-3 text-white text-sm font-mono"
								placeholder="CI-001928374"
								placeholderTextColor="#52525b"
								autoCapitalize="characters"
								value={idInput}
								onChangeText={setIdInput}
							/>
						</View>
					</View>

					{/* Medical Clearance Upload Card */}
					<View className="space-y-1.5 pt-2">
						<Text className="text-xs font-semibold text-zinc-300">
							Medical Fitness Clearance Certificate (Optional)
						</Text>
						<TouchableOpacity
							onPress={handleCaptureMedical}
							className="h-36 rounded-2xl bg-zinc-900 border-2 border-dashed border-zinc-800 items-center justify-center overflow-hidden"
						>
							{medicalUri ? (
								<Image source={{ uri: medicalUri }} className="size-full" resizeMode="cover" />
							) : (
								<View className="items-center justify-center space-y-1.5">
									<HeartPulse size={26} color="#10b981" />
									<Text className="text-xs font-bold text-white">Upload Medical Certificate</Text>
									<Text className="text-[10px] text-zinc-500">
										Annual vision & physical fitness assessment
									</Text>
								</View>
							)}
						</TouchableOpacity>
					</View>
				</View>

				{/* Security Notice */}
				<View className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80 flex-row items-start gap-3 mt-4">
					<ShieldCheck size={20} color="#10b981" className="mt-0.5" />
					<View className="flex-1">
						<Text className="text-xs font-bold text-white">
							End-to-End Encrypted Verification
						</Text>
						<Text className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
							Documents are encrypted and reviewed exclusively by authorized carrier safety officers and transport regulators.
						</Text>
					</View>
				</View>

				{/* Next Button */}
				<TouchableOpacity
					onPress={handleNext}
					className="bg-rose-600 active:bg-rose-700 h-13 rounded-2xl items-center justify-center flex-row gap-2 mt-4 shadow-lg shadow-rose-600/30"
				>
					<Text className="text-white font-bold text-sm">Continue to Carrier</Text>
					<ArrowRight size={18} color="#ffffff" />
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
}
