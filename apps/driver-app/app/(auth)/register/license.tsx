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
	CreditCard,
	Calendar,
	CheckCircle,
	ArrowRight,
} from "lucide-react-native";
import {
	useDriverRegistrationStore,
	type LicenseCategoryType,
} from "@/stores/driver-registration";
import { DriverFeedback } from "@/lib/haptics";
import { useTRPC } from "@/lib/trpc";
import { uploadCapturedDocument } from "@/lib/driver-doc-upload";

const LICENSE_CATEGORIES: Array<{
	category: LicenseCategoryType;
	title: string;
	desc: string;
}> = [
	{ category: "D", title: "Class D", desc: "Commercial Passenger Bus & Long-Haul Coach" },
	{ category: "E", title: "Class E", desc: "Articulated Commercial Bus & Multi-Trailer Coach" },
	{ category: "C", title: "Class C", desc: "Heavy Commercial Truck & High-Capacity Transport" },
	{ category: "B", title: "Class B", desc: "Light Commercial Minibus & Inter-Urban Shuttle" },
];

export default function RegisterStep2LicenseScreen() {
	const router = useRouter();
	const {
		licenseNumber,
		licenseCategory,
		licenseExpiryDate,
		licenseFrontUri,
		licenseBackUri,
		updateData,
	} = useDriverRegistrationStore();

	const [numberInput, setNumberInput] = useState(licenseNumber);
	const [categorySelect, setCategorySelect] = useState<LicenseCategoryType>(licenseCategory || "D");
	const [expiryInput, setExpiryInput] = useState(licenseExpiryDate);
	const [frontUri, setFrontUri] = useState<string | null>(licenseFrontUri);
	const [backUri, setBackUri] = useState<string | null>(licenseBackUri);
	// Phase 15 — server-side object keys (uploaded), distinct from local preview URIs.
	const [frontKey, setFrontKey] = useState<string | null>(
		licenseFrontUri?.startsWith("documents/") ? licenseFrontUri : null,
	);
	const [backKey, setBackKey] = useState<string | null>(
		licenseBackUri?.startsWith("documents/") ? licenseBackUri : null,
	);
	const trpc = useTRPC();
	const presign = useMutation(trpc.storage.presignUpload.mutationOptions());

	const handleCaptureDocument = async (type: "front" | "back") => {
		DriverFeedback.tap();
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") {
			Alert.alert("Permission Required", "Camera permission is required to capture your license photo.");
			return;
		}

		const result = await ImagePicker.launchCameraAsync({
			allowsEditing: true,
			aspect: [16, 10],
			quality: 0.7,
		});

		if (!result.canceled && result.assets?.[0]?.uri) {
			const localUri = result.assets[0].uri;
			if (type === "front") setFrontUri(localUri);
			else setBackUri(localUri);

			// Phase 15 (F-DV-05) — real upload to private storage; the stored
			// value becomes the server-side object key, not a device URI.
			const storedKey = await uploadCapturedDocument({
				presign: presign.mutateAsync as never,
				localUri,
				fileName: `license-${type}.jpg`,
				purpose: type === "front" ? "driver-license-front" : "driver-license-back",
			});
			if (!storedKey) {
				Alert.alert(
					"Upload Failed",
					"Check your connection and retake the photo — it must upload before you continue.",
				);
				return;
			}
			if (type === "front") setFrontKey(storedKey);
			else setBackKey(storedKey);
			updateData(type === "front" ? { licenseFrontUri: storedKey } : { licenseBackUri: storedKey });
		}
	};

	const handleNext = () => {
		if (!numberInput.trim()) {
			Alert.alert("Required Field", "Please enter your commercial driver license number.");
			return;
		}

		DriverFeedback.tap();
		// Phase 15 — a captured photo must have uploaded successfully.
		if ((frontUri && !frontKey) || (backUri && !backKey)) {
			Alert.alert(
				"Document Not Uploaded",
				"One of your licence photos failed to upload. Retake it before continuing.",
			);
			return;
		}
		updateData({
			licenseNumber: numberInput.trim(),
			licenseCategory: categorySelect,
			licenseExpiryDate: expiryInput,
			licenseFrontUri: frontUri,
			licenseBackUri: backUri,
		});

		router.push("/(auth)/register/documents");
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
						Step 2 of 4: Driving License
					</Text>
				</View>
				<View className="size-10" />
			</View>

			{/* Progress Indicator */}
			<View className="h-1 bg-zinc-900 w-full">
				<View className="h-full bg-rose-600 w-2/4" />
			</View>

			<ScrollView className="flex-1 px-5 py-6 space-y-6">
				{/* Header Intro */}
				<div>
					<Text className="text-2xl font-black text-white tracking-tight">
						Driving License
					</Text>
					<Text className="text-xs text-zinc-400 mt-1 leading-relaxed">
						Provide your valid Ministry of Transport commercial driver credentials.
					</Text>
				</div>

				{/* Category Selector */}
				<View className="space-y-2">
					<Text className="text-xs font-semibold text-zinc-300">
						License Category
					</Text>
					<View className="space-y-2">
						{LICENSE_CATEGORIES.map((item) => (
							<TouchableOpacity
								key={item.category}
								onPress={() => {
									DriverFeedback.tap();
									setCategorySelect(item.category);
								}}
								className={`p-3.5 rounded-2xl border flex-row items-center justify-between ${
									categorySelect === item.category
										? "bg-rose-600/10 border-rose-500"
										: "bg-zinc-900 border-zinc-800"
								}`}
							>
								<View className="flex-1 pr-2">
									<Text
										className={`text-sm font-bold ${
											categorySelect === item.category ? "text-rose-400" : "text-white"
										}`}
									>
										{item.title}
									</Text>
									<Text className="text-[11px] text-zinc-400 mt-0.5">{item.desc}</Text>
								</View>
								{categorySelect === item.category && (
									<CheckCircle size={18} color="#e11d48" />
								)}
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* Inputs */}
				<View className="space-y-4">
					{/* License Number */}
					<View className="space-y-1.5">
						<Text className="text-xs font-semibold text-zinc-300">
							License Number
						</Text>
						<View className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 h-12">
							<CreditCard size={18} color="#71717a" />
							<TextInput
								className="flex-1 ml-3 text-white text-sm font-mono"
								placeholder="CI-2024-884920"
								placeholderTextColor="#52525b"
								autoCapitalize="characters"
								value={numberInput}
								onChangeText={setNumberInput}
							/>
						</View>
					</View>

					{/* License Expiry Date */}
					<View className="space-y-1.5">
						<Text className="text-xs font-semibold text-zinc-300">
							Expiration Date (YYYY-MM-DD)
						</Text>
						<View className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 h-12">
							<Calendar size={18} color="#71717a" />
							<TextInput
								className="flex-1 ml-3 text-white text-sm font-mono"
								placeholder="2028-12-31"
								placeholderTextColor="#52525b"
								value={expiryInput}
								onChangeText={setExpiryInput}
							/>
						</View>
					</View>
				</View>

				{/* Document Capture Cards (Front & Back) */}
				<View className="space-y-3">
					<Text className="text-xs font-semibold text-zinc-300">
						License Photos (Front & Back)
					</Text>

					<View className="flex-row gap-3">
						{/* Front */}
						<TouchableOpacity
							onPress={() => handleCaptureDocument("front")}
							className="flex-1 h-32 rounded-2xl bg-zinc-900 border-2 border-dashed border-zinc-800 items-center justify-center overflow-hidden"
						>
							{frontUri ? (
								<Image source={{ uri: frontUri }} className="size-full" resizeMode="cover" />
							) : (
								<View className="items-center justify-center space-y-1">
									<Camera size={22} color="#e11d48" />
									<Text className="text-[10px] font-bold text-zinc-400">Front Side</Text>
								</View>
							)}
						</TouchableOpacity>

						{/* Back */}
						<TouchableOpacity
							onPress={() => handleCaptureDocument("back")}
							className="flex-1 h-32 rounded-2xl bg-zinc-900 border-2 border-dashed border-zinc-800 items-center justify-center overflow-hidden"
						>
							{backUri ? (
								<Image source={{ uri: backUri }} className="size-full" resizeMode="cover" />
							) : (
								<View className="items-center justify-center space-y-1">
									<Camera size={22} color="#e11d48" />
									<Text className="text-[10px] font-bold text-zinc-400">Back Side</Text>
								</View>
							)}
						</TouchableOpacity>
					</View>
				</View>

				{/* Next Button */}
				<TouchableOpacity
					onPress={handleNext}
					className="bg-rose-600 active:bg-rose-700 h-13 rounded-2xl items-center justify-center flex-row gap-2 mt-4 shadow-lg shadow-rose-600/30"
				>
					<Text className="text-white font-bold text-sm">Continue to Documents</Text>
					<ArrowRight size={18} color="#ffffff" />
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
}
