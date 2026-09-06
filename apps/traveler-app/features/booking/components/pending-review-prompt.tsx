import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Star, ChevronRight, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { ReviewSheet } from "@/features/booking/components/review-sheet";
import { Palette, Colors } from "@/constants/theme";

type PendingReviewBooking = {
	id: string;
	bookingReference: string;
	company?: { id: string; name: string } | null;
	originTripStop?: { terminal?: { name?: string | null } | null } | null;
	destinationTripStop?: { terminal?: { name?: string | null } | null } | null;
	trip?: {
		departureDate?: string | Date;
		schedule?: {
			route?: {
				originTerminal?: { cityRelation?: { name?: string | null } | null } | null;
				destTerminal?: { cityRelation?: { name?: string | null } | null } | null;
			} | null;
		} | null;
	};
};

const DISMISS_PREFIX = "review_prompt_dismissed_";

/**
 * P2-5 — launch-time review prompt. Queries completed-but-unreviewed trips
 * once per launch and surfaces a dismissible sheet for the most recent one.
 * Dismissals are remembered per booking for this install.
 */
export function PendingReviewPrompt() {
	const { t } = useTranslation("booking");
	const trpc = useTRPC();
	const [dismissed, setDismissed] = useState(true);
	const [activeRef, setActiveRef] = useState<string | null>(null);

	const pendingQuery = useQuery({
		...trpc.passenger.getPendingReviews.queryOptions(undefined),
		retry: false,
		staleTime: 60_000,
	});

	const pending = (pendingQuery.data ?? []) as unknown as PendingReviewBooking[];
	const target = pending[0] ?? null;

	useEffect(() => {
		if (!target?.bookingReference) return;
		let cancelled = false;
		AsyncStorage.getItem(`${DISMISS_PREFIX}${target.bookingReference}`)
			.then((value) => {
				if (!cancelled) setDismissed(value === "true");
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [target?.bookingReference]);

	const handleDismiss = () => {
		setActiveRef(null);
		if (!target?.bookingReference) return;
		AsyncStorage.setItem(
			`${DISMISS_PREFIX}${target.bookingReference}`,
			"true",
		).catch(() => {});
		setDismissed(true);
	};

	if (!target || dismissed) return null;

	const routeLabel =
		target.trip?.schedule?.route?.originTerminal?.cityRelation?.name &&
		target.trip?.schedule?.route?.destTerminal?.cityRelation?.name
			? `${target.trip.schedule.route.originTerminal.cityRelation.name} → ${target.trip.schedule.route.destTerminal.cityRelation.name}`
			: target.company?.name ?? "Votre dernier voyage";

	return (
		<>
			<Modal transparent animationType="slide" visible onRequestClose={handleDismiss}>
				<Pressable className="flex-1 bg-black/70 justify-end" onPress={handleDismiss}>
					<Pressable
						className="bg-card border-t border-border rounded-t-3xl p-6 gap-4"
						onPress={(e) => e.stopPropagation()}
					>
						<View className="flex-row items-center justify-between">
							<View className="flex-row items-center gap-2">
								<Star size={18} color={Palette.amber[500]} />
								<Text className="text-lg font-extrabold text-foreground">
									{t("promptTitle")}
								</Text>
							</View>
							<Pressable onPress={handleDismiss} className="p-1.5 rounded-full bg-muted">
								<X size={16} color={Colors.light.textMuted} />
							</Pressable>
						</View>

						<Text className="text-sm text-muted-foreground leading-relaxed">
							{t("promptBody", { route: routeLabel })}
						</Text>

						<View className="flex-row gap-3 pt-1">
							<Pressable
								onPress={handleDismiss}
								className="flex-1 h-12 rounded-xl bg-secondary border border-border items-center justify-center"
							>
								<Text className="text-sm font-bold text-secondary-foreground">{t("later")}</Text>
							</Pressable>
							<Pressable
								onPress={() => setActiveRef(target.bookingReference)}
								className="flex-1 h-12 rounded-xl bg-primary items-center justify-center flex-row gap-1.5"
							>
								<Text className="text-sm font-bold text-primary-foreground">{t("rateNow")}</Text>
								<ChevronRight size={16} color={Colors.light.card} />
							</Pressable>
						</View>
					</Pressable>
				</Pressable>
			</Modal>

			{activeRef ? (
				<ReviewSheet
					visible
					onClose={() => {
						handleDismiss();
						void pendingQuery.refetch();
					}}
					bookingId={target.id}
					companyId={target.company?.id ?? ""}
				/>
			) : null}
		</>
	);
}
