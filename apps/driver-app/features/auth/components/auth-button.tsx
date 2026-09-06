import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

type AuthButtonProps = {
	title: string;
	onPress: () => void;
	variant?: "primary" | "secondary" | "outline" | "ghost";
	disabled?: boolean;
	loading?: boolean;
	icon?: ReactNode;
	iconPosition?: "left" | "right";
};

export function AuthButton({
	title,
	onPress,
	variant = "primary",
	disabled = false,
	loading = false,
	icon,
	iconPosition = "left",
}: AuthButtonProps) {
	return (
		<Button
			title={title}
			onPress={onPress}
			variant={variant}
			size="lg"
			disabled={disabled}
			loading={loading}
			icon={icon}
			iconPosition={iconPosition}
			className="w-full"
		/>
	);
}
