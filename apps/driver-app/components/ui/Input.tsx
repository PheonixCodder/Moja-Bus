import React, { useState } from "react";
import {
	View,
	Text,
	TextInput,
	type TextInputProps,
} from "react-native";
import { cn } from "@/lib/utils";

export interface InputProps extends TextInputProps {
	label?: string;
	error?: string;
	hint?: string;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
	containerClassName?: string;
}

export function Input({
	label,
	error,
	hint,
	leftIcon,
	rightIcon,
	className,
	containerClassName,
	onFocus,
	onBlur,
	...props
}: InputProps) {
	const [isFocused, setIsFocused] = useState(false);

	return (
		<View className={cn("w-full gap-1.5", containerClassName)}>
			{label ? (
				<Text className="text-xs font-bold text-[#d4d4d8] uppercase tracking-wider">
					{label}
				</Text>
			) : null}

			<View
				className={cn(
					"flex-row items-center bg-[#18181b] border rounded-2xl px-4 h-14",
					isFocused
						? "border-[#ee237c] bg-[#18181b]"
						: error
							? "border-[#ef4444]"
							: "border-[#27272a]",
					className
				)}
			>
				{leftIcon ? <View className="mr-2.5">{leftIcon}</View> : null}

				<TextInput
					placeholderTextColor="#71717a"
					className="flex-1 text-[#fafafa] font-medium text-sm h-full"
					onFocus={(e) => {
						setIsFocused(true);
						onFocus?.(e);
					}}
					onBlur={(e) => {
						setIsFocused(false);
						onBlur?.(e);
					}}
					{...props}
				/>

				{rightIcon ? <View className="ml-2.5">{rightIcon}</View> : null}
			</View>

			{error ? (
				<Text className="text-[11px] font-medium text-[#ef4444] mt-0.5">
					{error}
				</Text>
			) : hint ? (
				<Text className="text-[11px] text-[#71717a] mt-0.5">{hint}</Text>
			) : null}
		</View>
	);
}
