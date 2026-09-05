import React, { useState, useEffect, useRef } from "react";
import {
	View,
	Text,
	ScrollView,
	TextInput,
	ActivityIndicator,
	Linking,
	Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	Search01Icon,
	User02Icon,
	Alert02Icon,
	RefreshIcon,
	QrCode01Icon,
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
	const router = useRouter();
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const insets = useSafeAreaInsets();

	const [search, setSearch] = useState("");

	// DRV-P2-15 — 300 ms debounce: TextInput stays instantly reactive while
	// the manifest query only fires after the driver pauses typing.
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			setDebouncedSearch(search);
		}, 300);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [search]);

	const {
		data: manifestData,
		isLoading,
		isRefetching,
		refetch,
		error,
	} = useQuery(
		trpc.drivers.getMyTripManifest.queryOptions({
			tripId,
			search: debouncedSearch || undefined,
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
			Alert.alert(t("boarded"), t("alreadyBoardedMsg"));
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
			Alert.alert(t("error"), err.message || t("checkInErrorMsg"));
		}
	};

	const handleCallPassenger = (phone?: string | null) => {
		if (!phone) return;
		DriverFeedback.tap();
		Linking.openURL(`tel:${phone}`);
	};

	const manifest = manifestData?.manifest ?? [];
	const totalCount = manifestData?.totalBooked ?? manifest.length;
	const boardedCount = manifestData?.boardedCount ?? manifest.filter((p) => !!p.boardedAt).length;
	const percentBoarded = totalCount > 0 ? Math.round((boardedCount / totalCount) * 100) : 0;

	return (
		<View className="flex-1 bg-background">
			<PageHeader
				title={t("title")}
				subtitle={t("subtitle", { count: totalCount })}
				showBack
			/>

			{/* Control Bar: Realtime Boarding Progress + Search Field */}
			<View className="p-4 bg-background border-b border-border gap-3">
				{/* Progress Section */}
				<View className="gap-1.5">
					<View className="flex-row items-center justify-between">
						<Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t("boardingProgress")}</Text>
						<Text className="text-xs font-bold text-primary font-mono">
							{boardedCount} / {totalCount} ({percentBoarded}%)
						</Text>
					</View>

					<View className="h-1.5 bg-card rounded-full overflow-hidden border border-border">
						<View
							className="h-full bg-primary rounded-full"
							style={{ width: `${percentBoarded}%` }}
						/>
					</View>
				</View>

				{/* Primary QR Scanner Launcher */}
				<Button
					title={t("fabScanQr")}
					variant="primary"
					size="md"
					onPress={() => {
						DriverFeedback.tap();
						router.push({
							pathname: "/(tabs)/scanner",
							params: { tripId },
						});
					}}
					icon={<HugeiconsIcon icon={QrCode01Icon} size={18} color={colors.neutral.textPrimary} />}
				/>

				{/* Search Field */}
				<View className="flex-row items-center bg-card border border-border rounded-2xl px-3.5 h-12">
					<HugeiconsIcon icon={Search01Icon} size={18} color={colors.neutral.textMuted} />
					<TextInput
						className="flex-1 ml-2.5 text-foreground text-[13px] font-medium"
						placeholder={t("searchPlaceholder")}
						placeholderTextColor={colors.neutral.textMuted}
						value={search}
						onChangeText={setSearch}
					/>
					{isRefetching && <ActivityIndicator size="small" color={colors.primary.rose} />}
				</View>
			</View>

			{/* Passenger List */}
			<ScrollView
				className="flex-1"
				contentContainerClassName="p-4 gap-3"
				contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 40 }}
				showsVerticalScrollIndicator={false}
			>
				{isLoading ? (
					<View className="items-center justify-center py-20 gap-3">
						<ActivityIndicator size="large" color={colors.primary.rose} />
						<Text className="text-xs text-muted-foreground">{t("loading")}</Text>
					</View>
				) : error ? (
					<Card className="py-16 items-center justify-center px-6 text-center gap-3 my-4">
						<HugeiconsIcon icon={Alert02Icon} size={40} color={colors.semantic.error} />
						<Text className="text-base font-bold text-foreground text-center">
							{t("errorLoadingTitle")}
						</Text>
						<Text className="text-xs text-muted-foreground text-center leading-relaxed">
							{error.message || t("errorLoadingMsg")}
						</Text>
						<Button
							title={t("btnRetry")}
							variant="secondary"
							size="sm"
							onPress={() => refetch()}
							icon={<HugeiconsIcon icon={RefreshIcon} size={16} color={colors.neutral.textPrimary} />}
							className="mt-2"
						/>
					</Card>
				) : manifest.length === 0 ? (
					<Card className="py-20 items-center justify-center px-6 text-center gap-3">
						<HugeiconsIcon icon={User02Icon} size={44} color={colors.neutral.textMuted} />
						<Text className="text-base font-bold text-foreground">{t("emptyTitle")}</Text>
						<Text className="text-xs text-muted-foreground max-w-xs text-center leading-relaxed">
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
