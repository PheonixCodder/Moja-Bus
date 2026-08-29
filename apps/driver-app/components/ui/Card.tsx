import React from "react";
import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export interface CardProps extends ViewProps {
	variant?: "default" | "elevated" | "outline" | "highlight";
	children?: React.ReactNode;
}

export function Card({
	variant = "default",
	className,
	children,
	...props
}: CardProps) {
	const variantStyles = {
		default: "bg-[#18181b] border border-[#27272a]",
		elevated: "bg-[#27272a] border border-[#3f3f46]",
		outline: "bg-transparent border border-[#27272a]",
		highlight: "bg-[#18181b] border border-[#ee237c]/30",
	}[variant];

	return (
		<View
			className={cn("rounded-2xl p-4", variantStyles, className)}
			{...props}
		>
			{children}
		</View>
	);
}
