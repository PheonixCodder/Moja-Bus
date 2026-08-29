import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	CheckmarkCircle02Icon,
	Globe02Icon,
} from "@hugeicons/core-free-icons";
import { DriverFeedback } from "@/lib/haptics";
import { PageHeader } from "@/components/ui/PageHeader";
import {
	switchLanguage,
	getCurrentLanguage,
	type SupportedLocale,
} from "@/lib/i18n";

const LANGUAGES: Array<{
	code: SupportedLocale;
	nativeLabel: string;
	regionLabel: string;
	badge: string;
}> = [
	{
		code: "fr",
		nativeLabel: "Français",
		regionLabel: "Côte d'Ivoire & Afrique de l'Ouest",
		badge: "Standard",
	},
	{
		code: "en",
		nativeLabel: "English",
		regionLabel: "International & West Africa English",
		badge: "Global",
	},
];

export default function LanguageScreen() {
	const { t } = useTranslation("auth");
	const insets = useSafeAreaInsets();
	const [currentLocale, setCurrentLocale] = useState<SupportedLocale>(getCurrentLanguage());

	const handleSelectLanguage = async (code: SupportedLocale) => {
		DriverFeedback.tap();
		setCurrentLocale(code);
		await switchLanguage(code);
		DriverFeedback.successScan();
	};

	return (
		<View style={styles.root}>
			<PageHeader
				title="Langue / Language"
				subtitle="Choisissez votre langue d'affichage"
				showBack
			/>

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={[
					styles.scrollContent,
					{ paddingBottom: Math.max(insets.bottom, 24) + 32 },
				]}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.infoBanner}>
					<HugeiconsIcon icon={Globe02Icon} size={22} color="#ee237c" />
					<View style={styles.infoTextWrap}>
						<Text style={styles.infoTitle}>Langue du Terminal Chauffeur</Text>
						<Text style={styles.infoDesc}>
							La modification de la langue s'applique immédiatement à l'ensemble des modules, dispatches, et alertes de navigation.
						</Text>
					</View>
				</View>

				<View style={styles.languagesList}>
					{LANGUAGES.map((lang) => {
						const isSelected = currentLocale === lang.code;
						return (
							<TouchableOpacity
								key={lang.code}
								onPress={() => handleSelectLanguage(lang.code)}
								activeOpacity={0.8}
								style={[
									styles.langCard,
									isSelected && styles.langCardSelected,
								]}
							>
								<View style={styles.langLeft}>
									<View
										style={[
											styles.flagBadge,
											isSelected && styles.flagBadgeSelected,
										]}
									>
										<Text style={styles.flagText}>
											{lang.code.toUpperCase()}
										</Text>
									</View>
									<View style={styles.langTextWrap}>
										<View style={styles.langTitleRow}>
											<Text style={styles.langNative}>{lang.nativeLabel}</Text>
											<View style={styles.langBadge}>
												<Text style={styles.langBadgeText}>{lang.badge}</Text>
											</View>
										</View>
										<Text style={styles.langRegion}>{lang.regionLabel}</Text>
									</View>
								</View>

								{isSelected ? (
									<HugeiconsIcon
										icon={CheckmarkCircle02Icon}
										size={22}
										color="#ee237c"
									/>
								) : null}
							</TouchableOpacity>
						);
					})}
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: "#09090b",
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 20,
		paddingTop: 16,
		gap: 20,
	},
	infoBanner: {
		flexDirection: "row",
		gap: 12,
		backgroundColor: "rgba(238, 35, 124, 0.08)",
		borderWidth: 1,
		borderColor: "rgba(238, 35, 124, 0.2)",
		borderRadius: 18,
		padding: 16,
	},
	infoTextWrap: {
		flex: 1,
		gap: 4,
	},
	infoTitle: {
		fontSize: 13,
		fontWeight: "700",
		color: "#ee237c",
	},
	infoDesc: {
		fontSize: 11,
		color: "#a1a1aa",
		lineHeight: 16,
	},
	languagesList: {
		gap: 12,
	},
	langCard: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: 16,
		borderRadius: 20,
		borderWidth: 1.5,
		borderColor: "#27272a",
		backgroundColor: "#18181b",
	},
	langCardSelected: {
		borderColor: "#ee237c",
		backgroundColor: "rgba(238, 35, 124, 0.06)",
	},
	langLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		flex: 1,
	},
	flagBadge: {
		width: 44,
		height: 44,
		borderRadius: 14,
		backgroundColor: "#09090b",
		borderWidth: 1,
		borderColor: "#27272a",
		alignItems: "center",
		justifyContent: "center",
	},
	flagBadgeSelected: {
		backgroundColor: "rgba(238, 35, 124, 0.15)",
		borderColor: "rgba(238, 35, 124, 0.3)",
	},
	flagText: {
		fontSize: 14,
		fontWeight: "800",
		fontFamily: "monospace",
		color: "#fafafa",
	},
	langTextWrap: {
		flex: 1,
		gap: 4,
	},
	langTitleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	langNative: {
		fontSize: 16,
		fontWeight: "800",
		color: "#fafafa",
	},
	langBadge: {
		backgroundColor: "#27272a",
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 6,
	},
	langBadgeText: {
		fontSize: 10,
		fontWeight: "700",
		color: "#a1a1aa",
	},
	langRegion: {
		fontSize: 11,
		color: "#71717a",
	},
});
