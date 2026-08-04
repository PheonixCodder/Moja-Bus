import { Colors, Spacing } from "@moja/theme/tokens";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	Modal,
	Pressable,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CancelDialogProps = {
	isOpen: boolean;
	farePaidXOF?: number;
	isPending: boolean;
	onClose: () => void;
	onConfirm: (channel: "WALLET" | "VOUCHER") => void;
};

export function CancelDialog({
	isOpen,
	farePaidXOF,
	isPending,
	onClose,
	onConfirm,
}: CancelDialogProps) {
	const insets = useSafeAreaInsets();
	const { t } = useTranslation("booking");
	const [channel, setChannel] = useState<"WALLET" | "VOUCHER">("WALLET");

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
								<Text style={{ fontSize: 28 }}>⚠️</Text>
							</View>

							<View style={{ alignItems: "center", gap: Spacing.one }}>
								<Text
									style={{
										fontSize: 17,
										fontWeight: "800",
										color: Colors.light.text,
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
										maxWidth: 280,
										lineHeight: 18,
									}}
								>
									{t("cancelRefund")}
								</Text>
							</View>
						</View>

						{farePaidXOF ? (
							<View
								style={{
									paddingVertical: Spacing.three,
									marginTop: Spacing.three,
								}}
							>
								<Text
									style={{
										fontSize: 11,
										fontWeight: "700",
										color: Colors.light.textSecondary,
										letterSpacing: 0.5,
										textTransform: "uppercase",
										marginBottom: Spacing.two,
									}}
								>
									{t("refundSummary")}
								</Text>
								<View
									style={{
										flexDirection: "row",
										justifyContent: "space-between",
										paddingBottom: Spacing.two,
										borderBottomWidth: 1,
										borderBottomColor: Colors.light.backgroundSelected,
									}}
								>
									<Text style={{ fontSize: 13, color: Colors.light.textSecondary }}>
										{t("farePaid")}
									</Text>
									<Text style={{ fontSize: 13, fontWeight: "600", color: Colors.light.text }}>
										{farePaidXOF?.toLocaleString()} XOF
									</Text>
								</View>
								<View
									style={{
										flexDirection: "row",
										justifyContent: "space-between",
										paddingTop: Spacing.two,
									}}
								>
									<Text style={{ fontSize: 13, fontWeight: "600", color: Colors.light.text }}>
										{t("refundAmount")}
									</Text>
									<Text style={{ fontSize: 13, fontWeight: "700", color: Colors.light.primary }}>
										{farePaidXOF?.toLocaleString()} XOF
									</Text>
								</View>
							</View>
						) : null}

						<View
							style={{
								flexDirection: "row",
								gap: Spacing.two,
								paddingTop: Spacing.three,
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
									{t("keepTicket")}
								</Text>
							</Pressable>
							<Pressable
								onPress={() => onConfirm(channel)}
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
										{t("confirmCancel")}
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