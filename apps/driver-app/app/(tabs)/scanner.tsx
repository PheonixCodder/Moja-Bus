import { useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	Modal,
	StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
	QrCode,
	CheckCircle,
	XCircle,
	User,
	Ticket,
	Armchair,
	Flashlight,
} from "lucide-react-native";
import { DriverFeedback } from "@/lib/haptics";

export default function DriverScannerScreen() {
	const [permission, requestPermission] = useCameraPermissions();
	const [torch, setTorch] = useState(false);
	const [scannedResult, setScannedResult] = useState<{
		ticketToken: string;
		passengerName: string;
		seatNumber: string;
		isValid: boolean;
	} | null>(null);

	if (!permission) {
		return <View className="flex-1 bg-zinc-950" />;
	}

	if (!permission.granted) {
		return (
			<SafeAreaView className="flex-1 bg-zinc-950 items-center justify-center p-6 text-center">
				<QrCode size={48} color="#e11d48" />
				<Text className="text-lg font-bold text-white mt-4 text-center">
					Camera Access Required
				</Text>
				<Text className="text-xs text-zinc-400 mt-2 text-center max-w-xs leading-relaxed">
					Moja Driver uses the camera to scan and authenticate passenger QR ticket codes at terminal gates.
				</Text>
				<TouchableOpacity
					onPress={requestPermission}
					className="bg-rose-600 px-6 py-3 rounded-xl mt-6"
				>
					<Text className="text-white font-bold text-sm">Enable Camera</Text>
				</TouchableOpacity>
			</SafeAreaView>
		);
	}

	const handleBarcodeScanned = ({ data }: { data: string }) => {
		if (scannedResult) return; // Prevent double trigger

		// Parse QR payload or simulated token
		DriverFeedback.successScan();
		setScannedResult({
			ticketToken: data,
			passengerName: "Mamadou Koné",
			seatNumber: "14A",
			isValid: true,
		});
	};

	return (
		<SafeAreaView className="flex-1 bg-black">
			{/* Scanner Header */}
			<View className="px-5 py-3 flex-row items-center justify-between bg-zinc-950 border-b border-zinc-800">
				<Text className="text-base font-bold text-white">
					QR Boarding Ticket Scanner
				</Text>
				<TouchableOpacity
					onPress={() => setTorch(!torch)}
					className={`p-2 rounded-xl border ${torch ? "bg-amber-500 border-amber-400" : "bg-zinc-900 border-zinc-800"}`}
				>
					<Flashlight size={18} color={torch ? "#000000" : "#fafafa"} />
				</TouchableOpacity>
			</View>

			{/* Camera Feed with Viewfinder Frame */}
			<View className="flex-1 relative items-center justify-center">
				<CameraView
					style={StyleSheet.absoluteFill}
					facing="back"
					enableTorch={torch}
					barcodeScannerSettings={{
						barcodeTypes: ["qr"],
					}}
					onBarcodeScanned={scannedResult ? undefined : handleBarcodeScanned}
				/>

				{/* High-Contrast Target Viewfinder */}
				<View className="size-64 border-2 border-rose-500 rounded-3xl relative items-center justify-center bg-black/10">
					<View className="w-48 h-0.5 bg-rose-500 shadow-lg shadow-rose-500 animate-pulse" />
				</View>
				<Text className="text-xs font-semibold text-white/80 mt-4 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur">
					Align passenger QR ticket code within frame
				</Text>
			</View>

			{/* Validation Result Modal */}
			<Modal
				visible={!!scannedResult}
				transparent
				animationType="fade"
				onRequestClose={() => setScannedResult(null)}
			>
				<View className="flex-1 bg-black/80 justify-end p-4">
					<View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl">
						<View className="flex-row items-center gap-3">
							<View className="size-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 items-center justify-center">
								<CheckCircle size={28} color="#10b981" />
							</View>
							<div>
								<Text className="text-lg font-black text-white">
									Boarding Cleared
								</Text>
								<Text className="text-xs text-emerald-400 font-semibold">
									Verified & Validated
								</Text>
							</div>
						</View>

						<View className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2.5">
							<View className="flex-row items-center justify-between">
								<View className="flex-row items-center gap-2">
									<User size={16} color="#71717a" />
									<Text className="text-xs text-zinc-400">Passenger</Text>
								</View>
								<Text className="text-sm font-bold text-white">
									{scannedResult?.passengerName}
								</Text>
							</View>

							<View className="flex-row items-center justify-between">
								<View className="flex-row items-center gap-2">
									<Armchair size={16} color="#71717a" />
									<Text className="text-xs text-zinc-400">Seat Number</Text>
								</View>
								<Text className="text-sm font-bold text-rose-400 font-mono">
									{scannedResult?.seatNumber}
								</Text>
							</View>

							<View className="flex-row items-center justify-between">
								<View className="flex-row items-center gap-2">
									<Ticket size={16} color="#71717a" />
									<Text className="text-xs text-zinc-400">Token Ref</Text>
								</View>
								<Text className="text-xs font-mono text-zinc-400" numberOfLines={1}>
									{scannedResult?.ticketToken.slice(0, 16)}...
								</Text>
							</View>
						</View>

						<TouchableOpacity
							onPress={() => {
								DriverFeedback.tap();
								setScannedResult(null);
							}}
							className="bg-emerald-600 active:bg-emerald-700 h-12 rounded-xl items-center justify-center"
						>
							<Text className="text-sm font-bold text-white">
								Confirm & Scan Next Passenger
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}
