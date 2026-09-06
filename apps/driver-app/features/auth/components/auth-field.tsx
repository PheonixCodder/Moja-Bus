import type { ReactNode } from "react";
import type { TextInputProps } from "react-native";
import { Input } from "@/components/ui/Input";

type AuthFieldProps = TextInputProps & {
	label: string;
	error?: string;
	hint?: string;
	rightElement?: ReactNode;
};

export function AuthField({
	label,
	error,
	hint,
	rightElement,
	...rest
}: AuthFieldProps) {
	return (
		<Input
			label={label}
			error={error}
			hint={hint}
			rightIcon={rightElement}
			{...rest}
		/>
	);
}
