import type { ReactNode } from "react";
import {
	ActivityIndicator,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { DriverFeedback } from "@/lib/haptics";

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
	const handlePress = () => {
		if (disabled || loading) return;
		DriverFeedback.tap();
		onPress();
	};

	const isPrimary = variant === "primary";
	const isSecondary = variant === "secondary";
	const isOutline = variant === "outline";
	const isGhost = variant === "ghost";

	return (
		<TouchableOpacity
			onPress={handlePress}
			activeOpacity={0.8}
			disabled={disabled || loading}
			style={[
				styles.base,
				isPrimary && styles.primary,
				isSecondary && styles.secondary,
				isOutline && styles.outline,
				isGhost && styles.ghost,
				(disabled || loading) && styles.disabled,
			]}
		>
			{loading ? (
				<ActivityIndicator
					size="small"
					color={isPrimary ? "#ffffff" : "#ee237c"}
				/>
			) : (
				<View style={styles.contentRow}>
					{icon && iconPosition === "left" ? (
						<View style={styles.iconLeft}>{icon}</View>
					) : null}
					<Text
						style={[
							styles.text,
							isPrimary && styles.primaryText,
							isSecondary && styles.secondaryText,
							isOutline && styles.outlineText,
							isGhost && styles.ghostText,
						]}
					>
						{title}
					</Text>
					{icon && iconPosition === "right" ? (
						<View style={styles.iconRight}>{icon}</View>
					) : null}
				</View>
			)}
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	base: {
		minHeight: 52,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 20,
		paddingVertical: 14,
	},
	primary: {
		backgroundColor: "#ee237c",
		shadowColor: "#ee237c",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 8,
		elevation: 4,
	},
	secondary: {
		backgroundColor: "#18181b",
		borderWidth: 1,
		borderColor: "#27272a",
	},
	outline: {
		backgroundColor: "transparent",
		borderWidth: 1.5,
		borderColor: "#27272a",
	},
	ghost: {
		backgroundColor: "transparent",
	},
	disabled: {
		opacity: 0.5,
	},
	contentRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
	},
	iconLeft: {
		marginRight: 8,
	},
	iconRight: {
		marginLeft: 8,
	},
	text: {
		fontSize: 15,
		fontWeight: "700",
		textAlign: "center",
	},
	primaryText: {
		color: "#ffffff",
	},
	secondaryText: {
		color: "#fafafa",
	},
	outlineText: {
		color: "#d4d4d8",
	},
	ghostText: {
		color: "#ee237c",
	},
});
