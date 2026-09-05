import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	CheckmarkCircle02Icon,
	Globe02Icon,
} from "@hugeicons/core-free-icons";
import { DriverFeedback } from "@/lib/haptics";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";
import {
	switchLanguage,
	getCurrentLanguage,
	type SupportedLocale,
} from "@/lib/i18n";

const LANGUAGES: Array<{
	code: SupportedLocale;
	nativeLabel: string;
	regionKey: string;
	badge: string;
}> = [
	{
		code: "fr",
		nativeLabel: "Français",
		regionKey: "regionCI",
		badge: "Standard",
	},
	{
		code: "en",
		nativeLabel: "English",
		regionKey: "regionIntl",
		badge: "Global",
	},
];

export default function LanguageScreen() {
	const { t } = useTranslation("language");
	const insets = useSafeAreaInsets();
	const [currentLocale, setCurrentLocale] = useState<SupportedLocale>(getCurrentLanguage());

	const handleSelectLanguage = async (code: SupportedLocale) => {
		DriverFeedback.tap();
		setCurrentLocale(code);
		await switchLanguage(code);
		DriverFeedback.successScan();
	};

	return (
		<View className="flex-1 bg-background">
			<PageHeader
				title={t("title")}
				subtitle={t("subtitle")}
				showBack
			/>

			<ScrollView
				className="flex-1"
				contentContainerStyle={{
					paddingHorizontal: 20,
					paddingTop: 16,
					gap: 20,
					paddingBottom: Math.max(insets.bottom, 24) + 32,
				}}
				showsVerticalScrollIndicator={false}
			>
				<View className="flex-row gap-3 bg-primary/10 border border-primary/20 rounded-2xl p-4">
					<HugeiconsIcon icon={Globe02Icon} size={22} color={colors.primary.rose} />
					<View className="flex-1 gap-1">
						<Text className="text-sm font-bold text-primary">{t("infoTitle")}</Text>
						<Text className="text-xs text-muted-foreground leading-4">
							{t("infoDesc")}
						</Text>
					</View>
				</View>

				<View className="gap-3">
					{LANGUAGES.map((lang) => {
						const isSelected = currentLocale === lang.code;
						return (
							<Button
								key={lang.code}
								onPress={() => handleSelectLanguage(lang.code)}
								variant={isSelected ? "primary" : "outline"}
								size="lg"
								className={`flex-row items-center justify-between p-4 h-auto rounded-3xl border-1.5 ${
									isSelected
										? "border-primary bg-primary/10"
										: "border-border bg-card"
								}`}
							>
								<View className="flex-row items-center gap-3.5 flex-1">
									<View
										className={`w-11 h-11 rounded-2xl border items-center justify-center ${
											isSelected
												? "bg-primary/20 border-primary/40"
												: "bg-background border-border"
										}`}
									>
										<Text className="text-sm font-extrabold font-mono text-foreground">
											{lang.code.toUpperCase()}
										</Text>
									</View>
									<View className="flex-1 gap-1">
										<View className="flex-row items-center gap-2">
											<Text className="text-base font-extrabold text-foreground">{lang.nativeLabel}</Text>
											<View className="bg-border px-2 py-0.5 rounded-md">
												<Text className="text-[10px] font-bold text-muted-foreground">{lang.badge}</Text>
											</View>
										</View>
										<Text className="text-xs text-muted-foreground">{t(lang.regionKey)}</Text>
									</View>
								</View>

								{isSelected ? (
									<HugeiconsIcon
										icon={CheckmarkCircle02Icon}
										size={22}
										color={colors.primary.rose}
									/>
								) : null}
							</Button>
						);
					})}
				</View>
			</ScrollView>
		</View>
	);
}
