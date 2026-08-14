import type { ReactNode } from "react";
import {
	Image,
	type ImageSourcePropType,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AuthShellProps = {
	badge?: string;
	title: string;
	description: string;
	children: ReactNode;
	footer?: ReactNode;
	logoSource?: ImageSourcePropType;
};

export function AuthShell({
	badge,
	title,
	description,
	children,
	footer,
	logoSource,
}: AuthShellProps) {
	const insets = useSafeAreaInsets();

	return (
		<KeyboardAvoidingView
			style={styles.root}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
		>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={[
					styles.scrollContent,
					{
						paddingTop: insets.top + 56,
						paddingBottom: Math.max(insets.bottom, 24) + 24,
					},
				]}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
			>
				<View style={styles.content}>
					{logoSource ? (
						<View style={styles.logoWrap}>
							<Image
								source={logoSource}
								style={styles.logo}
								resizeMode="contain"
							/>
						</View>
					) : (
						<View style={styles.brandRow}>
							<View style={styles.brandDot} />
							<Text style={styles.brandText}>Moja Ride</Text>
						</View>
					)}

					{badge ? (
						<View style={styles.badge}>
							<Text style={styles.badgeText}>{badge}</Text>
						</View>
					) : null}

					<View style={styles.header}>
						<Text style={styles.title}>{title}</Text>
						<Text style={styles.description}>{description}</Text>
					</View>

					{children}

					{footer ? <View style={styles.footer}>{footer}</View> : null}
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: "#ffffff",
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		justifyContent: "flex-start",
		paddingHorizontal: 24,
	},
	content: {
		width: "100%",
		maxWidth: 420,
		alignSelf: "center",
		gap: 28,
	},
	logoWrap: {
		alignItems: "center",
		marginBottom: 4,
	},
	logo: {
		width: 170,
		height: 62,
	},
	brandRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 4,
	},
	brandDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: "#ee237c",
	},
	brandText: {
		fontSize: 18,
		fontWeight: "700",
		color: "#171717",
	},
	badge: {
		alignSelf: "flex-start",
		borderRadius: 999,
		borderWidth: 1,
		borderColor: "#e5e5e5",
		backgroundColor: "#f5f5f5",
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	badgeText: {
		fontSize: 12,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 2.5,
		color: "#ee237c",
	},
	header: {
		gap: 12,
	},
	title: {
		fontSize: 36,
		fontWeight: "700",
		lineHeight: 42,
		color: "#171717",
	},
	description: {
		fontSize: 16,
		lineHeight: 24,
		color: "#737373",
	},
	footer: {
		paddingTop: 4,
	},
});
