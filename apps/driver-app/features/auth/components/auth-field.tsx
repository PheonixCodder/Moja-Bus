import type { ReactNode } from "react";
import {
	StyleSheet,
	Text,
	TextInput,
	type TextInputProps,
	View,
} from "react-native";

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
	style,
	...rest
}: AuthFieldProps) {
	return (
		<View style={styles.container}>
			<Text style={styles.label}>{label}</Text>
			<View style={[styles.inputWrapper, error ? styles.inputError : null]}>
				<TextInput
					style={[styles.input, style]}
					placeholderTextColor="#71717a"
					selectionColor="#ee237c"
					autoCapitalize="none"
					autoCorrect={false}
					{...rest}
				/>
				{rightElement ? (
					<View style={styles.rightElement}>{rightElement}</View>
				) : null}
			</View>
			{error ? <Text style={styles.errorText}>{error}</Text> : null}
			{hint && !error ? <Text style={styles.hintText}>{hint}</Text> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		gap: 6,
	},
	label: {
		fontSize: 13,
		fontWeight: "600",
		color: "#d4d4d8",
	},
	inputWrapper: {
		flexDirection: "row",
		alignItems: "center",
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "#27272a",
		backgroundColor: "#18181b",
		paddingHorizontal: 16,
		minHeight: 52,
	},
	inputError: {
		borderColor: "#ef4444",
	},
	input: {
		flex: 1,
		fontSize: 15,
		color: "#fafafa",
		paddingVertical: 12,
	},
	rightElement: {
		marginLeft: 8,
	},
	errorText: {
		fontSize: 12,
		color: "#ef4444",
	},
	hintText: {
		fontSize: 11,
		color: "#71717a",
	},
});
