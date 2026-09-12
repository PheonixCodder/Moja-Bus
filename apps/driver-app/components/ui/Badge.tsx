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
		default: "bg-secondary border-transparent",
		brand: "bg-primary/15 border border-primary/30",
		success: "bg-success/15 border border-success/30",
		warning: "bg-warning/15 border border-warning/30",
		error: "bg-destructive/15 border border-destructive/30",
		info: "bg-info/15 border border-info/30",
		outline: "bg-transparent border border-border",
	}[variant];

	const textVariantStyles = {
		default: "text-foreground",
		brand: "text-primary",
		success: "text-success",
		warning: "text-warning",
		error: "text-destructive",
		info: "text-info",
		outline: "text-muted-foreground",
	}[variant];

	const sizeStyles = {
		sm: "px-2 py-0.5 rounded-md",
		md: "px-2.5 py-1 rounded-lg",
	}[size];

	const textSizeStyles = {
		sm: "text-xs",
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
