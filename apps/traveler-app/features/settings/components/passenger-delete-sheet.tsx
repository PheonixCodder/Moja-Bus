import { Delete01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ActivityIndicator, Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";

type PassengerDeleteSheetProps = {
	isOpen: boolean;
	passengerName: string;
	isPending: boolean;
	onClose: () => void;
	onConfirm: () => void;
};

export function PassengerDeleteSheet({
	isOpen,
	passengerName,
	isPending,
	onClose,
	onConfirm,
}: PassengerDeleteSheetProps) {
	const insets = useSafeAreaInsets();

	return (
		<Modal
			visible={isOpen}
			transparent
			animationType="slide"
			onRequestClose={onClose}
		>
			<Pressable className="flex-1 bg-black/40" onPress={onClose}>
				<Pressable className="flex-1 justify-end" onPress={() => {}}>
					<View
						className="bg-white rounded-t-[28px] pt-5 px-4"
						style={{ paddingBottom: insets.bottom + 24 }}
					>
						{/* Drag handle */}
						<View className="w-10 h-1 rounded-full bg-slate-200 self-center mb-5" />

						{/* Icon + text */}
						<View className="items-center gap-3">
							<View className="w-14 h-14 rounded-full bg-rose-500/10 items-center justify-center">
								<HugeiconsIcon icon={Delete01Icon} size={28} color="#e11d48" />
							</View>

							<View className="items-center gap-1">
								<Text className="text-[17px] font-extrabold text-slate-900">Delete Passenger</Text>
								<Text className="text-sm text-slate-500 text-center max-w-[280px] leading-[18px]">
									Are you sure you want to remove{" "}
									<Text className="font-bold text-slate-900">{passengerName}</Text>{" "}
									from your saved passengers? This action cannot be undone.
								</Text>
							</View>
						</View>

						{/* Buttons */}
						<View className="flex-row gap-2 pt-5 mt-3 border-t border-slate-100">
							<Pressable
								onPress={onClose}
								disabled={isPending}
								className="flex-1 py-2 rounded-xl border border-slate-200 items-center"
							>
								<Text className="text-sm font-semibold text-slate-500">Cancel</Text>
							</Pressable>
							<Pressable
								onPress={onConfirm}
								disabled={isPending}
								className={`flex-1 py-2 rounded-xl bg-rose-600 items-center ${isPending ? "opacity-60" : ""}`}
							>
								{isPending ? (
									<ActivityIndicator size="small" color="#fff" />
								) : (
									<Text className="text-sm font-bold text-white">Delete</Text>
								)}
							</Pressable>
						</View>
					</View>
				</Pressable>
			</Pressable>
		</Modal>
	);
}