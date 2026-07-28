import {
	ActivityIndicator,
	Pressable,
	Text,
	type ViewStyle,
} from "react-native";

import { cn } from "@/lib/utils";

type AuthButtonProps = {
	label: string;
	pendingLabel?: string;
	isPending?: boolean;
	onPress: () => void | Promise<void>;
	variant?: "primary" | "secondary";
	style?: ViewStyle;
};

export function AuthButton({
	label,
	pendingLabel,
	isPending = false,
	onPress,
	variant = "primary",
	style,
}: AuthButtonProps) {
	const isSecondary = variant === "secondary";

	return (
		<Pressable
			onPress={onPress}
			disabled={isPending}
			style={style}
			className={cn(
				"min-h-[52px] flex-row items-center justify-center gap-2 rounded-[18px] px-5 active:scale-[0.99] active:opacity-92",
				isSecondary ? "border border-border bg-secondary" : "bg-primary",
				isPending && "opacity-60",
			)}
		>
			{isPending ? (
				<>
					<ActivityIndicator color={isSecondary ? "#171717" : "#ffffff"} />
					<Text
						className={cn(
							"text-[15px] font-bold",
							isSecondary ? "text-foreground" : "text-primary-foreground",
						)}
					>
						{pendingLabel ?? label}
					</Text>
				</>
			) : (
				<Text
					className={cn(
						"text-[15px] font-bold",
						isSecondary ? "text-foreground" : "text-primary-foreground",
					)}
				>
					{label}
				</Text>
			)}
		</Pressable>
	);
}
