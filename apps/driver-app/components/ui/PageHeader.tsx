import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { DriverFeedback } from "@/lib/haptics";
import { colors } from "@/constants/theme";

export interface PageHeaderProps {
	title: string;
	subtitle?: string;
	showBack?: boolean;
	onBack?: () => void;
	rightAccessory?: React.ReactNode;
}

export function PageHeader({
	title,
	subtitle,
	showBack = false,
	onBack,
	rightAccessory,
}: PageHeaderProps) {
	const router = useRouter();
	const insets = useSafeAreaInsets();

	const handleBack = () => {
		DriverFeedback.tap();
		if (onBack) {
			onBack();
		} else if (router.canGoBack()) {
			router.back();
		}
	};

	return (
		<View
			style={[
				styles.container,
				{
					paddingTop: insets.top + 12,
				},
			]}
		>
			<View style={styles.contentRow}>
				{showBack ? (
					<TouchableOpacity
						onPress={handleBack}
						activeOpacity={0.8}
						style={styles.backButton}
						accessibilityRole="button"
						accessibilityLabel="Go back"
					>
						<HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={colors.neutral.textPrimary} />
					</TouchableOpacity>
				) : null}

				<View style={styles.titleWrap}>
					<Text style={styles.title} numberOfLines={1}>
						{title}
					</Text>
					{subtitle ? (
						<Text style={styles.subtitle} numberOfLines={1}>
							{subtitle}
						</Text>
					) : null}
				</View>

				{rightAccessory ? (
					<View style={styles.rightWrap}>{rightAccessory}</View>
				) : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: colors.neutral.background,
		borderBottomWidth: 1,
		borderBottomColor: colors.neutral.border,
		paddingBottom: 14,
		paddingHorizontal: 20,
	},
	contentRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	backButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: colors.neutral.surface,
		borderWidth: 1,
		borderColor: colors.neutral.border,
		alignItems: "center",
		justifyContent: "center",
	},
	titleWrap: {
		flex: 1,
		gap: 2,
	},
	title: {
		fontSize: 20,
		fontWeight: "800",
		color: colors.neutral.textPrimary,
		letterSpacing: -0.3,
	},
	subtitle: {
		fontSize: 12,
		color: colors.neutral.textSecondary,
		fontWeight: "500",
	},
	rightWrap: {
		marginLeft: 8,
	},
});
