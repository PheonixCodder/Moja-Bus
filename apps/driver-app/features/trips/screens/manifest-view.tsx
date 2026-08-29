import React, { useState } from "react";
import {
	View,
	Text,
	ScrollView,
	TextInput,
	ActivityIndicator,
	Linking,
	Alert,
	StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	Search01Icon,
	User02Icon,
	Alert02Icon,
	RefreshIcon,
} from "@hugeicons/core-free-icons";
import { useTRPC } from "@/lib/trpc";
import { DriverFeedback } from "@/lib/haptics";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { colors } from "@/constants/theme";
import { ManifestPassengerRow } from "../components/manifest-passenger-row";

interface ManifestViewProps {
	tripId: string;
}

export function ManifestView({ tripId }: ManifestViewProps) {
	const { t } = useTranslation("manifest");
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const insets = useSafeAreaInsets();

	const [search, setSearch] = useState("");

	const {
		data: manifestData,
		isLoading,
		isRefetching,
		refetch,
		error,
	} = useQuery(
		trpc.drivers.getMyTripManifest.queryOptions({
			tripId,
			search: search || undefined,
		})
	);

	const manualCheckInMutation = useMutation(
		trpc.drivers.manualCheckInPassenger.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries();
			},
		})
	);

	const handleToggleManualBoarding = async (bookingId: string, currentBoarded: boolean) => {
		if (currentBoarded) {
			Alert.alert(t("boarded"), "Ce passager a déjà été scanné et validé à bord.");
			return;
		}

		DriverFeedback.tap();
		try {
			await manualCheckInMutation.mutateAsync({
				tripId,
				bookingId,
			});
			DriverFeedback.successScan();
		} catch (err: any) {
			DriverFeedback.invalidScan();
			Alert.alert("Erreur", err.message || "Impossible de marquer le passager comme embarqué.");
		}
	};

	const handleCallPassenger = (phone?: string | null) => {
		if (!phone) return;
		DriverFeedback.tap();
		Linking.openURL(`tel:${phone}`).catch(() => {
			Alert.alert("Erreur", "Impossible d'ouvrir l'application téléphone.");
		});
	};

	const manifest = manifestData?.manifest ?? [];
	const totalBooked = manifestData?.totalBooked ?? 0;
	const boardedCount = manifestData?.boardedCount ?? 0;
	const percentBoarded = totalBooked > 0 ? Math.round((boardedCount / totalBooked) * 100) : 0;

	return (
		<View style={styles.root}>
			<PageHeader
				title={t("title")}
				subtitle={t("subtitle")}
				showBack
			/>

			{/* Manifest Progress & Search Bar */}
			<View style={styles.topControlBox}>
				{/* Progress Counter & Bar */}
				<View style={styles.progressWrap}>
					<View style={styles.progressHeader}>
						<Text style={styles.progressLabel}>
							{t("progressTitle")}
						</Text>
						<Text style={styles.progressStats}>
							{boardedCount} / {totalBooked} {t("boarded")} ({percentBoarded}%)
						</Text>
					</View>

					<View style={styles.progressTrack}>
						<View
							style={[styles.progressBar, { width: `${percentBoarded}%` }]}
						/>
					</View>
				</View>

				{/* Search Field */}
				<View style={styles.searchBar}>
					<HugeiconsIcon icon={Search01Icon} size={18} color="#71717a" />
					<TextInput
						style={styles.searchInput}
						placeholder={t("searchPlaceholder")}
						placeholderTextColor="#71717a"
						value={search}
						onChangeText={setSearch}
					/>
					{isRefetching && <ActivityIndicator size="small" color={colors.primary.rose} />}
				</View>
			</View>

			{/* Passenger List */}
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={[
					styles.scrollContent,
					{ paddingBottom: Math.max(insets.bottom, 24) + 40 },
				]}
				showsVerticalScrollIndicator={false}
			>
				{isLoading ? (
					<View style={styles.loadingBox}>
						<ActivityIndicator size="large" color={colors.primary.rose} />
						<Text style={styles.loadingText}>{t("loading")}</Text>
					</View>
				) : error ? (
					<Card className="py-16 items-center justify-center px-6 text-center gap-3 my-4">
						<HugeiconsIcon icon={Alert02Icon} size={40} color="#ef4444" />
						<Text className="text-base font-bold text-[#fafafa] text-center">
							Impossible de charger le manifeste
						</Text>
						<Text className="text-xs text-[#a1a1aa] text-center leading-relaxed">
							{error.message || "Échec de récupération des passagers de cette course."}
						</Text>
						<Button
							title="Réessayer"
							variant="secondary"
							size="sm"
							onPress={() => refetch()}
							icon={<HugeiconsIcon icon={RefreshIcon} size={16} color="#fafafa" />}
							className="mt-2"
						/>
					</Card>
				) : manifest.length === 0 ? (
					<Card className="py-20 items-center justify-center px-6 text-center gap-3">
						<HugeiconsIcon icon={User02Icon} size={44} color="#71717a" />
						<Text className="text-base font-bold text-[#fafafa]">{t("emptyTitle")}</Text>
						<Text className="text-xs text-[#a1a1aa] max-w-xs text-center leading-relaxed">
							{search ? t("emptySearch") : t("emptyNone")}
						</Text>
					</Card>
				) : (
					manifest.map((p) => (
						<ManifestPassengerRow
							key={p.bookingId}
							passenger={p}
							onToggleBoarding={handleToggleManualBoarding}
							onCallPassenger={handleCallPassenger}
							isUpdating={manualCheckInMutation.isPending}
						/>
					))
				)}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: "#09090b",
	},
	topControlBox: {
		padding: 16,
		backgroundColor: "#09090b",
		borderBottomWidth: 1,
		borderBottomColor: "#27272a",
		gap: 12,
	},
	progressWrap: {
		gap: 6,
	},
	progressHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	progressLabel: {
		fontSize: 11,
		fontWeight: "700",
		color: "#a1a1aa",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	progressStats: {
		fontSize: 12,
		fontWeight: "700",
		color: "#ee237c",
		fontFamily: "monospace",
	},
	progressTrack: {
		height: 6,
		backgroundColor: "#18181b",
		borderRadius: 999,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "#27272a",
	},
	progressBar: {
		height: "100%",
		backgroundColor: "#ee237c",
		borderRadius: 999,
	},
	searchBar: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#18181b",
		borderWidth: 1,
		borderColor: "#27272a",
		borderRadius: 16,
		paddingHorizontal: 14,
		height: 48,
	},
	searchInput: {
		flex: 1,
		marginLeft: 10,
		color: "#fafafa",
		fontSize: 13,
		fontWeight: "500",
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
		gap: 12,
	},
	loadingBox: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 80,
		gap: 12,
	},
	loadingText: {
		fontSize: 12,
		color: "#a1a1aa",
	},
});
