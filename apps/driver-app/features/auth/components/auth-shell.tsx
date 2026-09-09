import type { ReactNode } from "react";
import {
	Image,
	type ImageSourcePropType,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Globe02Icon } from "@hugeicons/core-free-icons";
import { DriverFeedback } from "@/lib/haptics";
import { colors } from "@/constants/theme";

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
			className="flex-1 bg-background"
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
		>
			{showLanguageSwitch ? (
				<TouchableOpacity
					onPress={handleLanguagePress}
					activeOpacity={0.8}
					className="absolute right-5 z-20 w-11 h-11 rounded-2xl bg-card border border-border items-center justify-center"
					style={{ top: insets.top + 16 }}
				>
					<HugeiconsIcon icon={Globe02Icon} size={20} color={colors.neutral.textMuted} />
				</TouchableOpacity>
			) : null}

			<ScrollView
				className="flex-1"
				contentContainerStyle={{
					flexGrow: 1,
					justifyContent: "space-between",
					paddingHorizontal: 24,
					paddingTop: insets.top + 40,
					paddingBottom: Math.max(insets.bottom, 24) + 24,
				}}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
			>
				<View className="w-full max-w-[440px] self-center gap-6">
					{logoSource ? (
						<View
							style={{
								width: 64,
								height: 64,
								borderRadius: 16,
								backgroundColor: "#ffffff",
								padding: 8,
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Image
								source={logoSource}
								style={{ width: 48, height: 48 }}
								resizeMode="contain"
							/>
						</View>
					) : (
						<View className="flex-row items-center gap-2.5">
							<View className="w-3 h-3 rounded-full bg-primary" />
							<Text className="text-base font-extrabold text-foreground tracking-tight">Moja Driver</Text>
						</View>
					)}

					{badge ? (
						<View className="self-start bg-primary/10 border border-primary/30 rounded-full px-3 py-1">
							<Text className="text-[11px] font-extrabold text-primary tracking-wider uppercase">{badge}</Text>
						</View>
					) : null}

					<View className="gap-2">
						<Text className="text-3xl font-extrabold text-foreground tracking-tight leading-9">{title}</Text>
						<Text className="text-sm text-muted-foreground leading-5">{description}</Text>
					</View>

					<View className="gap-5">{children}</View>
				</View>

				{footer ? <View className="w-full max-w-[440px] self-center pt-8">{footer}</View> : null}
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
