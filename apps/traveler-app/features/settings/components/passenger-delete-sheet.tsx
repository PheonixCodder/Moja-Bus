import { Delete01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Colors, Spacing } from "@moja/theme/tokens";
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
			<Pressable
				style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
				onPress={onClose}
			>
				<Pressable
					style={{ flex: 1, justifyContent: "flex-end" }}
					onPress={() => {}}
				>
					<View
						style={{
							backgroundColor: Colors.light.background,
							borderTopLeftRadius: 28,
							borderTopRightRadius: 28,
							paddingTop: Spacing.five,
							paddingHorizontal: Spacing.four,
							paddingBottom: insets.bottom + 24,
						}}
					>
						<View
							style={{
								width: 40,
								height: 4,
								borderRadius: 2,
								backgroundColor: Colors.light.backgroundSelected,
								alignSelf: "center",
								marginBottom: Spacing.five,
							}}
						/>

						<View style={{ alignItems: "center", gap: Spacing.three }}>
							<View
								style={{
									width: 56,
									height: 56,
									borderRadius: 28,
									backgroundColor: "rgba(244, 63, 94, 0.1)",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<HugeiconsIcon
									icon={Delete01Icon}
									size={28}
									color="#e11d48"
								/>
							</View>

							<View style={{ alignItems: "center", gap: Spacing.one }}>
								<Text
									style={{
										fontSize: 17,
										fontWeight: "800",
										color: Colors.light.text,
									}}
								>
									Delete Passenger
								</Text>
								<Text
									style={{
										fontSize: 13,
										fontWeight: "400",
										color: Colors.light.textSecondary,
										textAlign: "center",
										maxWidth: 280,
										lineHeight: 18,
									}}
								>
									Are you sure you want to remove{" "}
									<Text style={{ fontWeight: "700", color: Colors.light.text }}>
										{passengerName}
									</Text>{" "}
									from your saved passengers? This action cannot be undone.
								</Text>
							</View>
						</View>

						<View
							style={{
								flexDirection: "row",
								gap: Spacing.two,
								paddingTop: Spacing.five,
								marginTop: Spacing.three,
								borderTopWidth: 1,
								borderTopColor: Colors.light.backgroundSelected,
							}}
						>
							<Pressable
								onPress={onClose}
								disabled={isPending}
								style={{
									flex: 1,
									paddingVertical: Spacing.two,
									borderRadius: 12,
									borderWidth: 1,
									borderColor: Colors.light.backgroundSelected,
									alignItems: "center",
								}}
							>
								<Text
									style={{
										fontSize: 13,
										fontWeight: "600",
										color: Colors.light.textSecondary,
									}}
								>
									Cancel
								</Text>
							</Pressable>
							<Pressable
								onPress={onConfirm}
								disabled={isPending}
								style={{
									flex: 1,
									paddingVertical: Spacing.two,
									borderRadius: 12,
									backgroundColor: "#e11d48",
									alignItems: "center",
									opacity: isPending ? 0.6 : 1,
								}}
							>
								{isPending ? (
									<ActivityIndicator size="small" color="#fff" />
								) : (
									<Text
										style={{
											fontSize: 13,
											fontWeight: "700",
											color: "#fff",
										}}
									>
										Delete
									</Text>
								)}
							</Pressable>
						</View>
					</View>
				</Pressable>
			</Pressable>
		</Modal>
	);
}