import type { ReactNode } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	View,
	type StyleProp,
	type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScreenShellProps = {
	children: ReactNode;
	header?: ReactNode;
	footer?: ReactNode;
	contentStyle?: StyleProp<ViewStyle>;
	scrollable?: boolean;
};

export function ScreenShell({
	children,
	header,
	footer,
	contentStyle,
	scrollable = true,
}: ScreenShellProps) {
	const insets = useSafeAreaInsets();

	return (
		<View style={styles.root}>
			{header}

			{scrollable ? (
				<KeyboardAvoidingView
					style={styles.keyboardView}
					behavior={Platform.OS === "ios" ? "padding" : "height"}
				>
					<ScrollView
						style={styles.scroll}
						contentContainerStyle={[
							styles.scrollContent,
							{
								paddingBottom: Math.max(insets.bottom, 24) + 32,
							},
							contentStyle,
						]}
						showsVerticalScrollIndicator={false}
						keyboardShouldPersistTaps="handled"
					>
						<View style={styles.contentWrap}>{children}</View>
					</ScrollView>
				</KeyboardAvoidingView>
			) : (
				<View
					style={[
						styles.fixedContent,
						{
							paddingBottom: Math.max(insets.bottom, 16) + 16,
						},
						contentStyle,
					]}
				>
					{children}
				</View>
			)}

			{footer ? <View style={styles.footerWrap}>{footer}</View> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: "#09090b",
	},
	keyboardView: {
		flex: 1,
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		paddingHorizontal: 20,
		paddingTop: 16,
	},
	contentWrap: {
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
		gap: 20,
	},
	fixedContent: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 16,
	},
	footerWrap: {
		borderTopWidth: 1,
		borderTopColor: "#27272a",
		backgroundColor: "#09090b",
		paddingHorizontal: 20,
		paddingVertical: 14,
	},
});
