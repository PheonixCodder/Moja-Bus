import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	Briefcase01Icon,
	Time02Icon,
	Calendar01Icon,
	CheckmarkCircle02Icon,
	CancelCircleIcon,
} from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const STATUS_META: Record<
	string,
	{ variant: "warning" | "info" | "success" | "error" | "default" | "outline"; labelKey: string }
> = {
	PENDING: { variant: "warning", labelKey: "status.PENDING" },
	COUNTERED: { variant: "info", labelKey: "status.COUNTERED" },
	ACCEPTED: { variant: "success", labelKey: "status.ACCEPTED" },
	DECLINED: { variant: "error", labelKey: "status.DECLINED" },
	EXPIRED: { variant: "default", labelKey: "status.EXPIRED" },
	WITHDRAWN: { variant: "outline", labelKey: "status.WITHDRAWN" },
};

const EMPLOYMENT_LABELS: Record<string, string> = {
	EXCLUSIVE_INTERCITY: "Intercity exclusif",
	CONTRACTOR_URBAN: "Contractuel urbain",
	HYBRID: "Hybride",
};

function timeLeft(expiresAt: string | Date): string | null {
	const ms = new Date(expiresAt).getTime() - Date.now();
	if (ms <= 0) return null;
	const hours = Math.floor(ms / 3600000);
	if (hours < 48) return `${hours}h`;
	return `${Math.floor(hours / 24)}j ${hours % 24}h`;
}

function fmtSalary(n: number): string {
	return n.toLocaleString("fr-FR");
}

function fmtDate(d: string | Date | null | undefined): string {
	if (!d) return "—";
	return new Date(d).toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

interface OfferCardProps {
	item: any;
	onAccept: (offerId: string) => void;
	onDecline: (offerId: string) => void;
	onCounter: (offerId: string) => void;
	submitting?: boolean;
}

export function OfferCard({
	item,
	onAccept,
	onDecline,
	onCounter,
	submitting,
}: OfferCardProps) {
	const { t } = useTranslation("offers");

	const meta = STATUS_META[item.status as string] ?? {
		variant: "default",
		labelKey: "status.EXPIRED",
	};
	const isLive = item.status === "PENDING" || item.status === "COUNTERED";
	const countdown = isLive ? timeLeft(item.expiresAt) : null;
	const countered =
		item.status === "COUNTERED" && item.counterSalaryCFA;

	return (
		<Card className="p-5 gap-4">
			{/* Carrier identity header */}
			<View style={styles.cardHeader}>
				<View style={styles.carrierInfoRow}>
					{item.carrierLogo ? (
						<Image
							source={{ uri: item.carrierLogo }}
							style={styles.carrierLogo}
						/>
					) : (
						<View style={styles.carrierAvatar}>
							<HugeiconsIcon icon={Briefcase01Icon} size={18} color="#ee237c" />
						</View>
					)}
					<View style={styles.carrierNameWrap}>
						<Text style={styles.carrierName} numberOfLines={1}>
							{item.carrierName}
						</Text>
						<Text style={styles.carrierType}>
							{EMPLOYMENT_LABELS[item.employmentType] ?? item.employmentType}
						</Text>
					</View>
				</View>
				<Badge variant={meta.variant} label={t(meta.labelKey)} />
			</View>

			{/* Salary and terms box */}
			<View style={styles.salaryBox}>
				<View style={styles.salaryRow}>
					<View>
						<Text style={styles.salaryLabel}>{t("card.salary")}</Text>
						<Text style={styles.salaryAmount}>
							{fmtSalary(item.offeredSalaryCFA)}{" "}
							<Text style={styles.salaryUnit}>{t("card.cfaMonthly")}</Text>
						</Text>
					</View>
					{countdown ? (
						<View style={styles.countdownTag}>
							<HugeiconsIcon icon={Time02Icon} size={12} color="#fbbf24" />
							<Text style={styles.countdownText}>{countdown}</Text>
						</View>
					) : null}
				</View>

				{countered ? (
					<View style={styles.counteredAlert}>
						<Text style={styles.counteredLabel}>
							{t("card.counterLabel")}
						</Text>
						<Text style={styles.counteredAmount}>
							{fmtSalary(item.counterSalaryCFA)}{" "}
							<Text style={styles.counteredUnit}>FCFA / mois</Text>
						</Text>
					</View>
				) : null}

				{/* Contract dates & route preference */}
				<View style={styles.metaDivider}>
					<View style={styles.metaItem}>
						<HugeiconsIcon icon={Calendar01Icon} size={13} color="#71717a" />
						<Text style={styles.metaText}>
							{t("card.startDate", { date: fmtDate(item.contractStartDate) })}
						</Text>
					</View>
					{item.message ? (
						<Text style={styles.messageText} numberOfLines={2}>
							« {item.message} »
						</Text>
					) : null}
				</View>
			</View>

			{/* Action buttons for active pending offers */}
			{isLive ? (
				<View style={styles.actionsRow}>
					<Button
						title={t("action.decline")}
						variant="outline"
						size="sm"
						icon={<HugeiconsIcon icon={CancelCircleIcon} size={16} color="#ef4444" />}
						textClassName="text-[#ef4444]"
						disabled={submitting}
						onPress={() => onDecline(item.id)}
						className="flex-1"
					/>
					{item.status === "PENDING" ? (
						<Button
							title={t("action.counter")}
							variant="secondary"
							size="sm"
							disabled={submitting}
							onPress={() => onCounter(item.id)}
							className="flex-1"
						/>
					) : null}
					<Button
						title={t("action.accept")}
						variant="primary"
						size="sm"
						icon={<HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} color="#ffffff" />}
						disabled={submitting}
						onPress={() => onAccept(item.id)}
						className="flex-1"
					/>
				</View>
			) : null}
		</Card>
	);
}

const styles = StyleSheet.create({
	cardHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderBottomWidth: 1,
		borderBottomColor: "#27272a",
		paddingBottom: 12,
	},
	carrierInfoRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		flex: 1,
	},
	carrierLogo: {
		width: 40,
		height: 40,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#27272a",
	},
	carrierAvatar: {
		width: 40,
		height: 40,
		borderRadius: 12,
		backgroundColor: "rgba(238, 35, 124, 0.12)",
		borderWidth: 1,
		borderColor: "rgba(238, 35, 124, 0.25)",
		alignItems: "center",
		justifyContent: "center",
	},
	carrierNameWrap: {
		flex: 1,
		gap: 2,
	},
	carrierName: {
		fontSize: 14,
		fontWeight: "800",
		color: "#fafafa",
	},
	carrierType: {
		fontSize: 11,
		color: "#a1a1aa",
	},
	salaryBox: {
		backgroundColor: "#09090b",
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#27272a",
		padding: 14,
		gap: 10,
	},
	salaryRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	salaryLabel: {
		fontSize: 10,
		fontWeight: "700",
		color: "#71717a",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	salaryAmount: {
		fontSize: 20,
		fontWeight: "800",
		fontFamily: "monospace",
		color: "#fafafa",
		letterSpacing: -0.5,
	},
	salaryUnit: {
		fontSize: 11,
		color: "#ee237c",
		fontWeight: "700",
	},
	countdownTag: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		backgroundColor: "rgba(245, 158, 11, 0.15)",
		borderRadius: 999,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderWidth: 1,
		borderColor: "rgba(245, 158, 11, 0.3)",
	},
	countdownText: {
		fontSize: 11,
		fontWeight: "700",
		color: "#fbbf24",
	},
	counteredAlert: {
		backgroundColor: "rgba(59, 130, 246, 0.1)",
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "rgba(59, 130, 246, 0.25)",
		paddingHorizontal: 10,
		paddingVertical: 6,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	counteredLabel: {
		fontSize: 11,
		fontWeight: "600",
		color: "#60a5fa",
	},
	counteredAmount: {
		fontSize: 12,
		fontFamily: "monospace",
		fontWeight: "700",
		color: "#93c5fd",
	},
	counteredUnit: {
		fontSize: 10,
		color: "#60a5fa",
	},
	metaDivider: {
		borderTopWidth: 1,
		borderTopColor: "#27272a",
		paddingTop: 8,
		gap: 6,
	},
	metaItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	metaText: {
		fontSize: 11,
		color: "#a1a1aa",
	},
	messageText: {
		fontSize: 11,
		fontStyle: "italic",
		color: "#71717a",
		lineHeight: 16,
	},
	actionsRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingTop: 4,
	},
});
