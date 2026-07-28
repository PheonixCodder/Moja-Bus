import { Text, TextInput, type TextInputProps, View } from "react-native";

import { cn } from "@/lib/utils";

type AuthFieldProps = TextInputProps & {
	label: string;
	helperText?: string;
};

export function AuthField({
	label,
	helperText,
	className,
	...props
}: AuthFieldProps) {
	return (
		<View className="gap-2">
			<Text className="text-[14px] font-semibold text-foreground">{label}</Text>
			<TextInput
				placeholderTextColor="hsl(0 0% 45.1%)"
				className={cn(
					"min-h-[52px] rounded-[18px] border px-4 py-3 text-[16px] text-foreground",
					"border-[rgba(238,35,124,0.3)] bg-[rgba(238,35,124,0.05)]",
					className,
				)}
				{...props}
			/>
			{helperText ? (
				<Text className="text-[12px] leading-[18px] text-muted-foreground">
					{helperText}
				</Text>
			) : null}
		</View>
	);
}
