import { Alert01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { formatPriceXOF } from "../lib/format-time";

type CancelDialogProps = {
	isOpen: boolean;
	farePaidXOF?: number;
	/** Phase 18 (F-PS-04) — the server's quote for THIS booking; null while loading. */
	refundAmountXOF?: number | null;
	/** Server says this booking is no longer cancellable. */
	notCancellable?: boolean;
	isPending: boolean;
	onClose: () => void;
	onConfirm: (channel: "WALLET") => void;
};

export function CancelDialog({
	isOpen,
	farePaidXOF,
	refundAmountXOF,
	notCancellable,
	isPending,
	onClose,
	onConfirm,
}: CancelDialogProps) {
	const insets = useSafeAreaInsets();
	const { t } = useTranslation("booking");

	if (!isOpen) return null;

	return (
		<Modal
			visible={isOpen}
			transparent
			animationType="fade"
			onRequestClose={onClose}
		>
			<View className="flex-1 justify-end bg-black/60">
				<Pressable className="absolute inset-0" onPress={onClose} />

				<View
					className="bg-background rounded-t-3xl border-t border-border p-5 space-y-4"
					style={{ paddingBottom: insets.bottom + 20 }}
				>
					{/* Header Handle */}
					<View className="w-10 h-1.5 rounded-full bg-muted-foreground/30 align-self-center self-center mb-1" />

					{/* Warning Icon & Title */}
					<View className="items-center text-center space-y-2">
						<View className="w-14 h-14 rounded-full bg-destructive/10 border border-destructive/20 items-center justify-center mb-1">
							<HugeiconsIcon icon={Alert01Icon} size={28} color="#ef4444" />
						</View>
						<Text className="text-foreground text-xl font-black tracking-tight">
							{t("cancelDialogTitle")}
						</Text>
						<Text className="text-muted-foreground text-xs text-center max-w-[280px] leading-relaxed">
							{t("cancelDialogDesc")}
						</Text>
					</View>

					{/* Refund Breakdown — Phase 18 (F-PS-04): server quote, not fare */}
					{notCancellable ? (
						<View className="bg-card border-border rounded-xl border p-3.5 my-2">
							<Text className="text-muted-foreground text-xs leading-relaxed">
								{t("notCancellable")}
							</Text>
						</View>
					) : (
						farePaidXOF &&
						refundAmountXOF != null && (
							<View className="bg-card border-border rounded-xl border p-3.5 space-y-2 my-2">
								<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
									{t("refundSummary")}
								</Text>
								<View className="flex-row justify-between border-b border-border/40 pb-2">
									<Text className="text-muted-foreground text-xs font-medium">
										{t("farePaid")}
									</Text>
									<Text className="text-foreground font-bold text-xs">
										{formatPriceXOF(farePaidXOF)}
									</Text>
								</View>
								<View className="flex-row justify-between pt-1">
									<Text className="text-muted-foreground text-xs font-medium">
										{t("refundAmount")}
									</Text>
									<Text className="text-primary font-black text-xs">
										{formatPriceXOF(refundAmountXOF)}
									</Text>
								</View>
							</View>
						)
					)}

					{/* Action Buttons */}
					{!notCancellable && (
						<View className="flex-row gap-3 pt-2">
							<Pressable
								onPress={onClose}
								disabled={isPending}
								className="flex-1 bg-secondary border border-border py-3.5 rounded-xl items-center"
							>
								<Text className="text-foreground font-bold text-xs">
									{t("keepTicket")}
								</Text>
							</Pressable>

							<Pressable
								onPress={() => onConfirm("WALLET")}
								disabled={isPending}
								className="flex-1 bg-destructive py-3.5 rounded-xl items-center justify-center flex-row gap-2 shadow-xs opacity-100 disabled:opacity-60"
							>
								{isPending ? (
									<ActivityIndicator size="small" color="#ffffff" />
								) : (
									<Text className="text-white font-black text-xs">
										{t("confirmCancel")}
									</Text>
								)}
							</Pressable>
						</View>
					)}
				</View>
			</View>
		</Modal>
	);
}
