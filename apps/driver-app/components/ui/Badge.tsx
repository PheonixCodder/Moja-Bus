import React from "react";
import { View, Text, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export interface BadgeProps extends ViewProps {
	variant?: "default" | "success" | "warning" | "error" | "info" | "outline" | "brand";
	size?: "sm" | "md";
	label?: string;
	children?: React.ReactNode;
	textClassName?: string;
}

export function Badge({
	variant = "default",
	size = "md",
	label,
	children,
	className,
	textClassName,
	...props
}: BadgeProps) {
	const variantStyles = {
		default: "bg-[#27272a] border-transparent",
		brand: "bg-[#ee237c]/15 border border-[#ee237c]/30",
		success: "bg-[#10b981]/15 border border-[#10b981]/30",
		warning: "bg-[#f59e0b]/15 border border-[#f59e0b]/30",
		error: "bg-[#ef4444]/15 border border-[#ef4444]/30",
		info: "bg-[#3b82f6]/15 border border-[#3b82f6]/30",
		outline: "bg-transparent border border-[#3f3f46]",
	}[variant];

	const textVariantStyles = {
		default: "text-[#fafafa]",
		brand: "text-[#ee237c]",
		success: "text-[#34d399]",
		warning: "text-[#fbbf24]",
		error: "text-[#f87171]",
		info: "text-[#60a5fa]",
		outline: "text-[#a1a1aa]",
	}[variant];

	const sizeStyles = {
		sm: "px-2 py-0.5 rounded-md",
		md: "px-2.5 py-1 rounded-lg",
	}[size];

	const textSizeStyles = {
		sm: "text-[10px]",
		md: "text-xs",
	}[size];

	return (
		<View
			className={cn(
				"flex-row items-center self-start justify-center",
				variantStyles,
				sizeStyles,
				className
			)}
			{...props}
		>
			{label ? (
				<Text
					className={cn(
						"font-bold uppercase tracking-wider",
						textVariantStyles,
						textSizeStyles,
						textClassName
					)}
				>
					{label}
				</Text>
			) : null}
			{children}
		</View>
	);
}
