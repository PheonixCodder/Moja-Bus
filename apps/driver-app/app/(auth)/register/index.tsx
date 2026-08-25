import { useState } from "react";
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
	User,
	Phone,
	Calendar,
	Award,
	CheckCircle,
	ArrowRight,
} from "lucide-react-native";
import { useDriverRegistrationStore } from "@/stores/driver-registration";
import { DriverFeedback } from "@/lib/haptics";
import { authClient } from "@/lib/auth-client";

export default function RegisterStep1Screen() {
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const {
		fullName,
		phone,
		yearsOfExperience,
		profileSelfieUri,
		updateData,
	} = useDriverRegistrationStore();

	const [nameInput, setNameInput] = useState(
		fullName || (session?.user as any)?.fullName || (session?.user as any)?.name || ""
	);
	const [phoneInput, setPhoneInput] = useState(
		phone || (session?.user as any)?.phoneNumber || ""
	);
	const [expInput, setExpInput] = useState(String(yearsOfExperience || 3));
	const [selfieUri, setSelfieUri] = useState<string | null>(profileSelfieUri);

	const handleTakeSelfie = async () => {
		DriverFeedback.tap();
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") {
			Alert.alert("Permission Required", "Camera permission is needed to take your driver profile photo.");
			return;
		}

		const result = await ImagePicker.launchCameraAsync({
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.7,
		});

		if (!result.canceled && result.assets?.[0]?.uri) {
			setSelfieUri(result.assets[0].uri);
		}
	};

	const handleNext = () => {
		if (!nameInput.trim()) {
			Alert.alert("Required Field", "Please enter your full legal name.");
			return;
		}
		if (!phoneInput.trim()) {
			Alert.alert("Required Field", "Please enter your mobile phone number.");
			return;
		}

		DriverFeedback.tap();
		updateData({
			fullName: nameInput.trim(),
			phone: phoneInput.trim(),
			yearsOfExperience: parseInt(expInput, 10) || 1,
			profileSelfieUri: selfieUri,
		});

		router.push("/(auth)/register/license");
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
						Step 1 of 4: Personal Info
					</Text>
				</View>
				<View className="size-10" />
			</View>

			{/* Progress Indicator */}
			<View className="h-1 bg-zinc-900 w-full">
				<View className="h-full bg-rose-600 w-1/4" />
			</View>

			<ScrollView className="flex-1 px-5 py-6 space-y-6">
				{/* Header Intro */}
				<div>
					<Text className="text-2xl font-black text-white tracking-tight">
						Personal Identity
					</Text>
					<Text className="text-xs text-zinc-400 mt-1 leading-relaxed">
						Enter your official identification as listed on your commercial driver credentials.
					</Text>
				</div>

				{/* Selfie Photo Picker */}
				<View className="items-center py-2">
					<TouchableOpacity
						onPress={handleTakeSelfie}
						className="size-28 rounded-full bg-zinc-900 border-2 border-dashed border-zinc-700 items-center justify-center overflow-hidden relative shadow-lg"
					>
						{selfieUri ? (
							<Image source={{ uri: selfieUri }} className="size-full" resizeMode="cover" />
						) : (
							<View className="items-center justify-center space-y-1">
								<Camera size={28} color="#e11d48" />
								<Text className="text-[10px] font-bold text-zinc-400">Take Selfie</Text>
							</View>
						)}
					</TouchableOpacity>
					<Text className="text-[11px] text-zinc-500 mt-2 font-medium">
						Clear portrait photo for passenger safety passport
					</Text>
				</View>

				{/* Input Fields */}
				<View className="space-y-4">
					{/* Full Name */}
					<View className="space-y-1.5">
						<Text className="text-xs font-semibold text-zinc-300">
							Full Legal Name
						</Text>
						<View className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 h-12">
							<User size={18} color="#71717a" />
							<TextInput
								className="flex-1 ml-3 text-white text-sm"
								placeholder="e.g. Ibrahim Touré"
								placeholderTextColor="#52525b"
								value={nameInput}
								onChangeText={setNameInput}
							/>
						</View>
					</View>

					{/* Phone Number */}
					<View className="space-y-1.5">
						<Text className="text-xs font-semibold text-zinc-300">
							Mobile Phone Number
						</Text>
						<View className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 h-12">
							<Phone size={18} color="#71717a" />
							<TextInput
								className="flex-1 ml-3 text-white text-sm"
								placeholder="+225 07 12 34 56 78"
								placeholderTextColor="#52525b"
								keyboardType="phone-pad"
								value={phoneInput}
								onChangeText={setPhoneInput}
							/>
						</View>
					</View>

					{/* Commercial Driving Experience */}
					<View className="space-y-1.5">
						<Text className="text-xs font-semibold text-zinc-300">
							Commercial Driving Experience (Years)
						</Text>
						<View className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 h-12">
							<Award size={18} color="#71717a" />
							<TextInput
								className="flex-1 ml-3 text-white text-sm font-mono"
								placeholder="3"
								placeholderTextColor="#52525b"
								keyboardType="number-pad"
								value={expInput}
								onChangeText={setExpInput}
							/>
						</View>
					</View>
				</View>

				{/* Next Button */}
				<TouchableOpacity
					onPress={handleNext}
					className="bg-rose-600 active:bg-rose-700 h-13 rounded-2xl items-center justify-center flex-row gap-2 mt-4 shadow-lg shadow-rose-600/30"
				>
					<Text className="text-white font-bold text-sm">Continue to License</Text>
					<ArrowRight size={18} color="#ffffff" />
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
}
