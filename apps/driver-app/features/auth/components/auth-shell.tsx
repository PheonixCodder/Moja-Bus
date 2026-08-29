import type { ReactNode } from "react";
import {
	Image,
	type ImageSourcePropType,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Globe02Icon } from "@hugeicons/core-free-icons";
import { DriverFeedback } from "@/lib/haptics";

type AuthShellProps = {
	badge?: string;
	title: string;
	description: string;
	children: ReactNode;
	footer?: ReactNode;
	logoSource?: ImageSourcePropType;
	showLanguageSwitch?: boolean;
};

export function AuthShell({
	badge,
	title,
	description,
	children,
	footer,
	logoSource,
	showLanguageSwitch = true,
}: AuthShellProps) {
	const insets = useSafeAreaInsets();
	const router = useRouter();

	const handleLanguagePress = () => {
		DriverFeedback.tap();
		router.push("/language");
	};

	return (
		<KeyboardAvoidingView
			style={styles.root}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
		>
			{showLanguageSwitch ? (
				<TouchableOpacity
					onPress={handleLanguagePress}
					activeOpacity={0.8}
					style={[styles.languageBtn, { top: insets.top + 16 }]}
				>
					<HugeiconsIcon icon={Globe02Icon} size={20} color="#a1a1aa" />
				</TouchableOpacity>
			) : null}

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={[
					styles.scrollContent,
					{
						paddingTop: insets.top + 40,
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
							<Text style={styles.brandText}>Moja Driver</Text>
						</View>
					)}

					{badge ? (
						<View style={styles.badge}>
							<Text style={styles.badgeText}>{badge}</Text>
						</View>
					) : null}

					<View style={styles.heading}>
						<Text style={styles.title}>{title}</Text>
						<Text style={styles.description}>{description}</Text>
					</View>

					<View style={styles.body}>{children}</View>
				</View>

				{footer ? <View style={styles.footer}>{footer}</View> : null}
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: "#09090b",
	},
	languageBtn: {
		position: "absolute",
		right: 20,
		zIndex: 20,
		width: 42,
		height: 42,
		borderRadius: 14,
		backgroundColor: "#18181b",
		borderWidth: 1,
		borderColor: "#27272a",
		alignItems: "center",
		justifyContent: "center",
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		justifyContent: "space-between",
		paddingHorizontal: 24,
	},
	content: {
		width: "100%",
		maxWidth: 440,
		alignSelf: "center",
		gap: 24,
	},
	logoWrap: {
		width: 64,
		height: 64,
		borderRadius: 18,
		backgroundColor: "#ffffff",
		padding: 8,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.35,
		shadowRadius: 16,
		elevation: 8,
	},
	logo: {
		width: "100%",
		height: "100%",
	},
	brandRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	brandDot: {
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: "#ee237c",
	},
	brandText: {
		fontSize: 16,
		fontWeight: "800",
		color: "#fafafa",
		letterSpacing: -0.3,
	},
	badge: {
		alignSelf: "flex-start",
		backgroundColor: "rgba(238, 35, 124, 0.12)",
		borderColor: "rgba(238, 35, 124, 0.3)",
		borderWidth: 1,
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 5,
	},
	badgeText: {
		fontSize: 11,
		fontWeight: "800",
		color: "#ee237c",
		letterSpacing: 0.6,
		textTransform: "uppercase",
	},
	heading: {
		gap: 8,
	},
	title: {
		fontSize: 32,
		fontWeight: "800",
		color: "#fafafa",
		letterSpacing: -0.8,
		lineHeight: 38,
	},
	description: {
		fontSize: 14,
		color: "#a1a1aa",
		lineHeight: 22,
	},
	body: {
		gap: 20,
	},
	footer: {
		width: "100%",
		maxWidth: 440,
		alignSelf: "center",
		paddingTop: 32,
	},
});
