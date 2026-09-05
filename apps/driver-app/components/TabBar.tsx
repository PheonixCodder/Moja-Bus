import React, { useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	Easing,
} from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	Bus01Icon,
	Briefcase01Icon,
	Navigation01Icon,
	QrCode01Icon,
	User02Icon,
} from "@hugeicons/core-free-icons";
import { colors, fontFamily } from "@/constants/theme";
import { DriverFeedback } from "@/lib/haptics";
import { useTranslation } from "react-i18next";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CIRCLE_SIZE = 48;
const TAB_HEIGHT = 64;

interface TabConfig {
	name: string;
	labelKey: string;
	icon: typeof Bus01Icon;
	badge?: number;
}

const TABS: TabConfig[] = [
	{ name: "trips", labelKey: "trips", icon: Bus01Icon },
	{ name: "offers", labelKey: "offers", icon: Briefcase01Icon },
	{ name: "live", labelKey: "live", icon: Navigation01Icon },
	{ name: "scanner", labelKey: "scanner", icon: QrCode01Icon },
	{ name: "profile", labelKey: "profile", icon: User02Icon },
];

export function TabBar({ state, navigation, pendingOffers = 0, isConductor = false }: any) {
	const insets = useSafeAreaInsets();
	const { t } = useTranslation(["common", "trips", "offers"]);
	const activeTabs = isConductor
		? TABS.filter((tab) => tab.name !== "offers" && tab.name !== "live")
		: TABS;
	const tabWidth = SCREEN_WIDTH / activeTabs.length;

	const indicatorX = useSharedValue(
		state.index * tabWidth + (tabWidth - CIRCLE_SIZE) / 2
	);

	useEffect(() => {
		indicatorX.value = withTiming(
			state.index * tabWidth + (tabWidth - CIRCLE_SIZE) / 2,
			{
				duration: 220,
				easing: Easing.bezier(0.25, 0.1, 0.25, 1),
			}
		);
	}, [state.index, tabWidth]);

	const indicatorStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: indicatorX.value }],
	}));

	return (
		<View
			className="flex-row bg-background border-t border-border"
			style={{ height: TAB_HEIGHT + 8, paddingBottom: insets.bottom || 8 }}
		>
			<Animated.View
				className="absolute rounded-full bg-primary"
				style={[
					{
						top: (TAB_HEIGHT - CIRCLE_SIZE) / 2,
						left: 0,
						width: CIRCLE_SIZE,
						height: CIRCLE_SIZE,
					},
					indicatorStyle,
				]}
			/>

			{state.routes
				.filter((route: any) => TABS.some((t) => t.name === route.name))
				.map((route: any, index: number) => {
					const tab = TABS.find((t) => t.name === route.name) ?? TABS[index] ?? TABS[0]!;
					const isFocused = state.index === index;
					const showBadge = tab.name === "offers" && pendingOffers > 0;

					const onPress = () => {
						DriverFeedback.tap();
						const event = navigation.emit({
							type: "tabPress",
							target: route.key,
							canPreventDefault: true,
						});
						if (!isFocused && !event.defaultPrevented) {
							navigation.navigate(route.name);
						}
					};

				return (
					<TouchableOpacity
						key={route.key}
						onPress={onPress}
						activeOpacity={0.8}
						accessibilityRole="tab"
						accessibilityState={{ selected: isFocused }}
						accessibilityLabel={
							tab.name === "trips"
								? "Trajets"
								: tab.name === "offers"
									? "Offres"
									: tab.name === "live"
										? "En direct"
										: tab.name === "scanner"
											? "Scanner"
											: "Profil"
						}
						className="flex-1 items-center justify-center"
						style={{ height: TAB_HEIGHT }}
					>
						<View className="items-center justify-center">
							<HugeiconsIcon
								icon={tab.icon}
								size={22}
								color={isFocused ? colors.neutral.textPrimary : colors.neutral.textSecondary}
							/>

							{showBadge ? (
								<View className="absolute -top-1 -right-2.5 bg-warning rounded-full min-w-4 h-4 items-center justify-center px-1">
									<Text className="text-[9px] font-extrabold text-warning-foreground">
										{pendingOffers > 99 ? "99+" : pendingOffers}
									</Text>
								</View>
							) : null}
						</View>

						{!isFocused ? (
							<Text className="text-[10px] font-semibold text-muted-foreground mt-0.5">
								{tab.name === "trips"
									? "Trajets"
									: tab.name === "offers"
										? "Offres"
										: tab.name === "live"
											? "En direct"
											: tab.name === "scanner"
												? "Scanner"
												: "Profil"}
							</Text>
						) : null}
					</TouchableOpacity>
				);
			})}
		</View>
	);
}
