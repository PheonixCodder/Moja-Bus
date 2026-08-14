import { ActivityIndicator, Modal, Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";

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
	const confirmBgClass =
		variant === "destructive" ? "bg-rose-600" : "bg-[#ee237c]";

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onCancel}
		>
			<Pressable
				className="flex-1 bg-black/45 justify-center items-center p-8"
				onPress={onCancel}
			>
				<Pressable
					onPress={() => {}}
					className="bg-white rounded-3xl w-full max-w-[320px] py-5 px-5 items-center shadow-lg shadow-black/15"
				>
					{icon ? (
						<View className="mb-3">{icon}</View>
					) : null}

					<Text className="text-[17px] font-extrabold text-slate-900 text-center mb-1">
						{title}
					</Text>

					<Text className="text-sm font-normal text-slate-500 text-center leading-[18px] mb-4">
						{description}
					</Text>

					<View className="flex-row gap-2 w-full">
						<Pressable
							onPress={onCancel}
							disabled={isPending}
							className="flex-1 py-2 rounded-xl border border-slate-200 items-center"
						>
							<Text className="text-sm font-semibold text-slate-500">
								{cancelLabel}
							</Text>
						</Pressable>

						<Pressable
							onPress={onConfirm}
							disabled={isPending}
							className={`flex-1 py-2 rounded-xl items-center ${confirmBgClass} ${isPending ? 'opacity-60' : 'opacity-100'}`}
						>
							{isPending ? (
								<ActivityIndicator size="small" color="#ffffff" />
							) : (
								<Text className="text-sm font-bold text-white">
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
