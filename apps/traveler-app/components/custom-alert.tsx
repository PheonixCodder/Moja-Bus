import { ActivityIndicator, Modal, Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { Colors, Spacing } from "@moja/theme/tokens";

type CustomAlertProps = {
	visible: boolean;
	title: string;
	description: string;
	icon?: React.ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	onConfirm?: () => void;
	onCancel?: () => void;
	isPending?: boolean;
	variant?: "default" | "destructive";
};

export function CustomAlert({
	visible,
	title,
	description,
	icon,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	onConfirm,
	onCancel,
	isPending = false,
	variant = "default",
}: CustomAlertProps) {
	const confirmBg =
		variant === "destructive" ? "#e11d48" : Colors.light.primary;

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onCancel}
		>
			<Pressable
				style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 32 }}
				onPress={onCancel}
			>
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
						shadowColor: "#000",
						shadowOffset: { width: 0, height: 8 },
						shadowOpacity: 0.15,
						shadowRadius: 24,
						elevation: 16,
					}}
				>
					{icon ? (
						<View style={{ marginBottom: Spacing.three }}>{icon}</View>
					) : null}

					<Text
						style={{
							fontSize: 17,
							fontWeight: "800",
							color: Colors.light.text,
							textAlign: "center",
							marginBottom: Spacing.one,
						}}
					>
						{title}
					</Text>

					<Text
						style={{
							fontSize: 13,
							fontWeight: "400",
							color: Colors.light.textSecondary,
							textAlign: "center",
							lineHeight: 18,
							marginBottom: Spacing.four,
						}}
					>
						{description}
					</Text>

					<View
						style={{
							flexDirection: "row",
							gap: Spacing.two,
							width: "100%",
						}}
					>
						<Pressable
							onPress={onCancel}
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
								{cancelLabel}
							</Text>
						</Pressable>

						<Pressable
							onPress={onConfirm}
							disabled={isPending}
							style={{
								flex: 1,
								paddingVertical: Spacing.two,
								borderRadius: 12,
								backgroundColor: confirmBg,
								alignItems: "center",
								opacity: isPending ? 0.6 : 1,
							}}
						>
							{isPending ? (
								<ActivityIndicator
									size="small"
									color={Colors.light.primaryForeground}
								/>
							) : (
								<Text
									style={{
										fontSize: 13,
										fontWeight: "700",
										color: Colors.light.primaryForeground,
									}}
								>
									{confirmLabel}
								</Text>
							)}
						</Pressable>
					</View>
				</Pressable>
			</Pressable>
		</Modal>
	);
}
