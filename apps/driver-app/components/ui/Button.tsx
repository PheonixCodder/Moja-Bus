import React from "react";
import {
	TouchableOpacity,
	Text,
	ActivityIndicator,
	View,
	type TouchableOpacityProps,
} from "react-native";
import { DriverFeedback } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export interface ButtonProps extends TouchableOpacityProps {
	variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "success" | "warning";
	size?: "sm" | "md" | "lg";
	title?: string;
	loading?: boolean;
	icon?: React.ReactNode;
	iconPosition?: "left" | "right";
	children?: React.ReactNode;
	textClassName?: string;
}

export function Button({
	variant = "primary",
	size = "md",
	title,
	loading = false,
	icon,
	iconPosition = "left",
	disabled,
	onPress,
	children,
	className,
	textClassName,
	...props
}: ButtonProps) {
	const handlePress = (e: any) => {
		if (disabled || loading) return;
		DriverFeedback.tap();
		onPress?.(e);
	};

	const variantStyles = {
		primary: "bg-[#ee237c] active:bg-[#be123c] border-transparent",
		secondary: "bg-[#27272a] active:bg-[#3f3f46] border-transparent",
		outline: "bg-transparent active:bg-[#18181b] border-[#27272a]",
		ghost: "bg-transparent active:bg-[#18181b] border-transparent",
		destructive: "bg-[#ef4444] active:bg-[#dc2626] border-transparent",
		success: "bg-[#10b981] active:bg-[#059669] border-transparent",
		warning: "bg-[#f59e0b] active:bg-[#d97706] border-transparent",
	}[variant];

	const sizeStyles = {
		sm: "h-10 px-3.5 rounded-xl",
		md: "h-13 px-5 rounded-2xl",
		lg: "h-15 px-6 rounded-2xl",
	}[size];

	const textVariantStyles = {
		primary: "text-white font-bold",
		secondary: "text-[#fafafa] font-semibold",
		outline: "text-[#fafafa] font-semibold",
		ghost: "text-[#a1a1aa] font-medium",
		destructive: "text-white font-bold",
		success: "text-white font-bold",
		warning: "text-black font-bold",
	}[variant];

	const textSizeStyles = {
		sm: "text-xs",
		md: "text-sm",
		lg: "text-base",
	}[size];

	return (
		<TouchableOpacity
			onPress={handlePress}
			disabled={disabled || loading}
			activeOpacity={0.8}
			className={cn(
				"flex-row items-center justify-center border",
				variantStyles,
				sizeStyles,
				disabled && "opacity-45",
				className
			)}
			{...props}
		>
			{loading ? (
				<ActivityIndicator
					color={variant === "outline" || variant === "ghost" ? "#fafafa" : variant === "warning" ? "#000000" : "#ffffff"}
					size="small"
				/>
			) : (
				<View className="flex-row items-center justify-center gap-2">
					{icon && iconPosition === "left" ? icon : null}
					{title ? (
						<Text className={cn(textVariantStyles, textSizeStyles, textClassName)}>
							{title}
						</Text>
					) : null}
					{children}
					{icon && iconPosition === "right" ? icon : null}
				</View>
			)}
		</TouchableOpacity>
	);
}
