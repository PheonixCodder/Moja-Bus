import { Colors, Spacing } from "@moja/theme/tokens";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { PaymentMethodSelector } from "@/features/booking/components/payment-method-selector";
import {
	useInitiatePayment,
	useVerifyPayment,
} from "@/features/booking/hooks/use-booking-actions";
import { useHoldCountdown } from "@/features/booking/hooks/use-hold-countdown";

type PaymentSheetProps = {
	visible: boolean;
	onClose: () => void;
	holdId: string;
	totalAmountXOF: number;
	holdExpiresAt?: string;
};

export function PaymentSheet({
	visible,
	onClose,
	holdId,
	totalAmountXOF,
	holdExpiresAt,
}: PaymentSheetProps) {
	const { t } = useTranslation("booking");
	const [method, setMethod] = useState<"PAYSTACK" | "WALLET">("PAYSTACK");
	const initiatePayment = useInitiatePayment();
	const verifyPayment = useVerifyPayment();
	const countdown = useHoldCountdown(holdExpiresAt ?? "");
	const isExpired = countdown === "Expired";

	if (!visible) return null;

	const handlePay = () => {
		if (method === "PAYSTACK") {
			initiatePayment.mutate(
				{ holdId },
				{
					onSuccess: (result: any) => {
						const data = result as {
							authorizationUrl?: string;
							reference?: string;
						};
						if (data.authorizationUrl) {
							// In a real implementation, this would open the Paystack WebView
							console.log("Paystack URL:", data.authorizationUrl);
						}
					},
					onError: () => {},
				},
			);
		} else {
			// Wallet checkout
			initiatePayment.mutate(
				{ holdId },
				{
					onSuccess: () => {
						onClose();
					},
					onError: () => {},
				},
			);
		}
	};

	return (
		<View
			style={{
				position: "absolute",
				bottom: 0,
				left: 0,
				right: 0,
				backgroundColor: Colors.light.background,
				borderTopLeftRadius: 24,
				borderTopRightRadius: 24,
				paddingHorizontal: Spacing.four,
				paddingTop: Spacing.five,
				paddingBottom: Spacing.five,
				gap: Spacing.four,
				shadowColor: "#000",
				shadowOffset: { width: 0, height: -4 },
				shadowOpacity: 0.1,
				shadowRadius: 20,
				elevation: 20,
			}}
		>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<Text
					style={{
						fontSize: 18,
						fontWeight: "800",
						color: Colors.light.text,
					}}
				>
					{t("payNow")}
				</Text>
				<Pressable onPress={onClose}>
					<Text style={{ fontSize: 18, color: Colors.light.textSecondary }}>
						✕
					</Text>
				</Pressable>
			</View>

			<View
				style={{
					backgroundColor: Colors.light.backgroundElement,
					borderRadius: 12,
					padding: Spacing.four,
					alignItems: "center",
				}}
			>
				<Text
					style={{
						fontSize: 10,
						fontWeight: "700",
						color: Colors.light.textSecondary,
						letterSpacing: 0.5,
						textTransform: "uppercase",
					}}
				>
					{t("totalAmount")}
				</Text>
				<Text
					style={{
						fontSize: 32,
						fontWeight: "900",
						color: Colors.light.primary,
						marginTop: Spacing.one,
					}}
				>
					{totalAmountXOF.toLocaleString()} XOF
				</Text>
			</View>

			{holdExpiresAt && !isExpired ? (
				<Text
					style={{
						fontSize: 11,
						fontWeight: "600",
						color: "#f59e0b",
						textAlign: "center",
					}}
				>
					{t("holdExpires")}: {countdown}
				</Text>
			) : null}

			{isExpired ? (
				<Text
					style={{
						fontSize: 11,
						fontWeight: "600",
						color: "#ef4444",
						textAlign: "center",
					}}
				>
					{t("holdExpired")}
				</Text>
			) : null}

			<PaymentMethodSelector selectedMethod={method} onSelect={setMethod} />

			<Pressable
				onPress={handlePay}
				disabled={initiatePayment.isPending || isExpired}
				style={({ pressed }) => ({
					paddingVertical: Spacing.four,
					borderRadius: 14,
					backgroundColor: Colors.light.primary,
					alignItems: "center",
					opacity: pressed ? 0.85 : 1,
				})}
			>
				{initiatePayment.isPending ? (
					<ActivityIndicator
						size="small"
						color={Colors.light.primaryForeground}
					/>
				) : (
					<Text
						style={{
							fontSize: 15,
							fontWeight: "700",
							color: Colors.light.primaryForeground,
						}}
					>
						{t("confirm")}
					</Text>
				)}
			</Pressable>
		</View>
	);
}
