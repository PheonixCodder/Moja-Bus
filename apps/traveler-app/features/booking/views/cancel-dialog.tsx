import { Colors, Spacing } from "@moja/theme/tokens";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useCancelBooking } from "@/features/booking/hooks/use-booking-actions";

type CancelDialogProps = {
	visible: boolean;
	onClose: () => void;
	bookingReference: string;
	onConfirm: () => void;
};

export function CancelDialog({
	visible,
	onClose,
	bookingReference,
	onConfirm,
}: CancelDialogProps) {
	const { t } = useTranslation("booking");
	const [isConfirming, setIsConfirming] = useState(false);
	const cancelBooking = useCancelBooking();

	if (!visible) return null;

	const handleCancel = async () => {
		setIsConfirming(true);
		try {
			await cancelBooking.mutateAsync({ bookingReference });
			onConfirm();
		} catch {
			setIsConfirming(false);
		}
	};

	return (
		<View
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: "rgba(0,0,0,0.45)",
				justifyContent: "center",
				alignItems: "center",
				padding: 32,
			}}
		>
			<Pressable onPress={onClose} style={{ flex: 1 }}>
				<Pressable
					onPress={() => {}}
					style={{
						backgroundColor: Colors.light.background,
						borderRadius: 24,
						width: "100%",
						maxWidth: 320,
						paddingVertical: Spacing.five,
						paddingHorizontal: Spacing.five,
						alignItems: "center",
						gap: Spacing.three,
					}}
				>
					<Text
						style={{
							fontSize: 17,
							fontWeight: "800",
							color: Colors.light.text,
							textAlign: "center",
						}}
					>
						{t("cancelBooking")}
					</Text>

					<Text
						style={{
							fontSize: 13,
							fontWeight: "400",
							color: Colors.light.textSecondary,
							textAlign: "center",
							lineHeight: 18,
						}}
					>
						{t("cancelRefund")}
					</Text>

					<View
						style={{
							flexDirection: "row",
							gap: Spacing.two,
							width: "100%",
						}}
					>
						<Pressable
							onPress={onClose}
							disabled={isConfirming}
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
								{t("goBack")}
							</Text>
						</Pressable>
						<Pressable
							onPress={handleCancel}
							disabled={isConfirming}
							style={{
								flex: 1,
								paddingVertical: Spacing.two,
								borderRadius: 12,
								backgroundColor: "#ef4444",
								alignItems: "center",
								opacity: isConfirming ? 0.6 : 1,
							}}
						>
							{isConfirming ? (
								<ActivityIndicator size="small" color="#fff" />
							) : (
								<Text
									style={{
										fontSize: 13,
										fontWeight: "700",
										color: "#fff",
									}}
								>
									{t("cancel")}
								</Text>
							)}
						</Pressable>
					</View>
				</Pressable>
			</Pressable>
		</View>
	);
}
