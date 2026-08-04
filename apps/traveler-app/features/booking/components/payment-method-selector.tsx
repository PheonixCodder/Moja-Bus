import { Colors, Spacing } from "@moja/theme/tokens";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";

type PaymentMethod = "PAYSTACK" | "WALLET";

type PaymentMethodSelectorProps = {
	selectedMethod: PaymentMethod;
	onSelect: (method: PaymentMethod) => void;
	walletBalance?: number;
};

export function PaymentMethodSelector({
	selectedMethod,
	onSelect,
	walletBalance,
}: PaymentMethodSelectorProps) {
	return (
		<View style={{ gap: Spacing.two }}>
			<Pressable
				onPress={() => onSelect("PAYSTACK")}
				style={({ pressed }) => ({
					flexDirection: "row",
					alignItems: "center",
					padding: Spacing.four,
					borderRadius: 12,
					borderWidth: 1,
					borderColor:
						selectedMethod === "PAYSTACK"
							? Colors.light.primary
							: Colors.light.backgroundSelected,
					backgroundColor:
						selectedMethod === "PAYSTACK"
							? "rgba(238, 35, 124, 0.05)"
							: Colors.light.background,
					opacity: pressed ? 0.7 : 1,
					gap: Spacing.three,
				})}
			>
				<View
					style={{
						width: 36,
						height: 36,
						borderRadius: 10,
						backgroundColor:
							selectedMethod === "PAYSTACK"
								? Colors.light.primary
								: Colors.light.backgroundElement,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Text
						style={{
							fontSize: 14,
							fontWeight: "800",
							color:
								selectedMethod === "PAYSTACK"
									? Colors.light.primaryForeground
									: Colors.light.textSecondary,
						}}
					>
						P
					</Text>
				</View>
				<View style={{ flex: 1 }}>
					<Text
						style={{
							fontSize: 14,
							fontWeight: "700",
							color: Colors.light.text,
						}}
					>
						Paystack
					</Text>
					<Text
						style={{
							fontSize: 11,
							color: Colors.light.textSecondary,
							marginTop: 2,
						}}
					>
						Card or Mobile Money
					</Text>
				</View>
				{selectedMethod === "PAYSTACK" ? (
					<View
						style={{
							width: 20,
							height: 20,
							borderRadius: 10,
							backgroundColor: Colors.light.primary,
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>
							✓
						</Text>
					</View>
				) : null}
			</Pressable>

			<Pressable
				onPress={() => onSelect("WALLET")}
				style={({ pressed }) => ({
					flexDirection: "row",
					alignItems: "center",
					padding: Spacing.four,
					borderRadius: 12,
					borderWidth: 1,
					borderColor:
						selectedMethod === "WALLET"
							? Colors.light.primary
							: Colors.light.backgroundSelected,
					backgroundColor:
						selectedMethod === "WALLET"
							? "rgba(238, 35, 124, 0.05)"
							: Colors.light.background,
					opacity: pressed ? 0.7 : 1,
					gap: Spacing.three,
				})}
			>
				<View
					style={{
						width: 36,
						height: 36,
						borderRadius: 10,
						backgroundColor:
							selectedMethod === "WALLET"
								? Colors.light.primary
								: Colors.light.backgroundElement,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Text
						style={{
							fontSize: 14,
							fontWeight: "800",
							color:
								selectedMethod === "WALLET"
									? Colors.light.primaryForeground
									: Colors.light.textSecondary,
						}}
					>
						W
					</Text>
				</View>
				<View style={{ flex: 1 }}>
					<Text
						style={{
							fontSize: 14,
							fontWeight: "700",
							color: Colors.light.text,
						}}
					>
						Wallet
					</Text>
					<Text
						style={{
							fontSize: 11,
							color: Colors.light.textSecondary,
							marginTop: 2,
						}}
					>
						{walletBalance !== undefined
							? `${walletBalance.toLocaleString()} XOF available`
							: "Balance from wallet"}
					</Text>
				</View>
				{selectedMethod === "WALLET" ? (
					<View
						style={{
							width: 20,
							height: 20,
							borderRadius: 10,
							backgroundColor: Colors.light.primary,
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>
							✓
						</Text>
					</View>
				) : null}
			</Pressable>
		</View>
	);
}
