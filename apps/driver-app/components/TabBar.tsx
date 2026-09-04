import React, { useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
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
		<View style={[styles.container, { paddingBottom: insets.bottom || 8 }]}>
			<Animated.View style={[styles.indicator, indicatorStyle]} />

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
						style={styles.tab}
						activeOpacity={0.8}
					>
						<View className="items-center justify-center">
							<HugeiconsIcon
								icon={tab.icon}
								size={22}
								color={isFocused ? "#ffffff" : colors.neutral.textSecondary}
							/>

							{showBadge ? (
								<View style={styles.badge}>
									<Text style={styles.badgeText}>
										{pendingOffers > 99 ? "99+" : pendingOffers}
									</Text>
								</View>
							) : null}
						</View>

						{!isFocused ? (
							<Text style={styles.label}>
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

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		backgroundColor: "#09090b",
		borderTopWidth: 1,
		borderTopColor: "#27272a",
		height: TAB_HEIGHT + 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -3 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 10,
	},
	indicator: {
		position: "absolute",
		top: (TAB_HEIGHT - CIRCLE_SIZE) / 2,
		left: 0,
		width: CIRCLE_SIZE,
		height: CIRCLE_SIZE,
		borderRadius: CIRCLE_SIZE / 2,
		backgroundColor: colors.primary.rose,
	},
	tab: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		height: TAB_HEIGHT,
	},
	label: {
		fontFamily: fontFamily.medium,
		fontSize: 10,
		color: colors.neutral.textSecondary,
		marginTop: 3,
		fontWeight: "600",
	},
	badge: {
		position: "absolute",
		top: -4,
		right: -10,
		backgroundColor: "#f59e0b",
		borderRadius: 10,
		minWidth: 16,
		height: 16,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 4,
	},
	badgeText: {
		color: "#000000",
		fontSize: 9,
		fontWeight: "800",
	},
});
