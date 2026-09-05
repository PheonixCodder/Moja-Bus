import React from "react";
import { View, Text, Image } from "react-native";
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
import { colors } from "@/constants/theme";

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

function timeLeft(expiresAt: string | Date | null | undefined, t: (key: string, opts?: any) => string): string | null {
	if (!expiresAt) return null;
	const parsed = new Date(expiresAt).getTime();
	if (isNaN(parsed)) return null;
	const ms = parsed - Date.now();
	if (ms <= 0) return null;
	const hours = Math.floor(ms / 3600000);
	if (hours < 48) return t("countdown.hoursOnly", { hours });
	const days = Math.floor(hours / 24);
	return t("countdown.daysHours", { days, hours: hours % 24 });
}

function fmtSalary(n: number | null | undefined, locale: string): string {
	if (n === null || n === undefined || typeof n !== "number" || isNaN(n)) {
		return "—";
	}
	return n.toLocaleString(locale);
}

function fmtDate(d: string | Date | null | undefined, locale: string): string {
	if (!d) return "—";
	const parsed = new Date(d);
	if (isNaN(parsed.getTime())) return "—";
	return parsed.toLocaleDateString(locale, {
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
	const { t, i18n } = useTranslation("offers");
	const locale = i18n.language;

	const meta = STATUS_META[item.status as string] ?? {
		variant: "default",
		labelKey: "status.EXPIRED",
	};
	const isLive = item.status === "PENDING" || item.status === "COUNTERED";
	const countdown = isLive ? timeLeft(item.expiresAt, t) : null;
	const countered =
		item.status === "COUNTERED" && item.counterSalaryCFA;

	return (
		<Card className="p-5 gap-4">
			{/* Carrier identity header */}
			<View className="flex-row items-center justify-between border-b border-border pb-3">
				<View className="flex-row items-center gap-3 flex-1">
					{item.carrierLogo ? (
						<Image
							source={{ uri: item.carrierLogo }}
							className="size-10 rounded-xl border border-border"
						/>
					) : (
						<View className="size-10 rounded-xl bg-primary/15 border border-primary/25 items-center justify-center">
							<HugeiconsIcon icon={Briefcase01Icon} size={18} color={colors.primary.rose} />
						</View>
					)}
					<View className="flex-1 gap-0.5">
						<Text className="text-sm font-extrabold text-foreground" numberOfLines={1}>
							{item.carrierName}
						</Text>
						<Text className="text-[11px] text-muted-foreground">
							{t(`employment.${item.employmentType}` as any) ?? item.employmentType}
						</Text>
					</View>
				</View>
				<Badge variant={meta.variant} label={t(meta.labelKey)} />
			</View>

			{/* Salary and terms box */}
			<View className="bg-background rounded-2xl border border-border p-3.5 gap-2.5">
				<View className="flex-row items-center justify-between">
					<View>
						<Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("card.salary")}</Text>
						<Text className="text-xl font-extrabold font-mono text-foreground tracking-tight">
							{fmtSalary(item.offeredSalaryCFA, locale)}{" "}
							<Text className="text-[11px] text-primary font-bold">{t("card.cfaMonthly")}</Text>
						</Text>
					</View>
					{countdown ? (
						<View className="flex-row items-center gap-1 bg-warning/15 rounded-full px-2 py-1 border border-warning/30">
							<HugeiconsIcon icon={Time02Icon} size={12} color={colors.semantic.warning} />
							<Text className="text-[11px] font-bold text-warning">{countdown}</Text>
						</View>
					) : null}
				</View>

				{countered ? (
					<View className="bg-info/10 rounded-xl border border-info/25 px-2.5 py-1.5 flex-row items-center justify-between">
						<Text className="text-[11px] font-semibold text-info">
							{t("card.counterLabel")}
						</Text>
						<Text className="text-xs font-mono font-bold text-info">
							{fmtSalary(item.counterSalaryCFA, locale)}{" "}
							<Text className="text-[10px] text-info">{t("card.cfaMonthly")}</Text>
						</Text>
					</View>
				) : null}

				{/* Contract dates & route preference */}
				<View className="border-t border-border pt-2 gap-1.5">
					<View className="flex-row items-center gap-1.5">
						<HugeiconsIcon icon={Calendar01Icon} size={13} color={colors.neutral.textMuted} />
						<Text className="text-[11px] text-muted-foreground">
							{t("card.startDate", { date: fmtDate(item.contractStartDate, locale) })}
						</Text>
					</View>
					{item.message ? (
						<Text className="text-[11px] italic text-muted-foreground leading-4" numberOfLines={2}>
							{t("messageQuote", { message: item.message })}
						</Text>
					) : null}
				</View>
			</View>

			{/* Action buttons for active pending offers */}
			{isLive ? (
				<View className="flex-row items-center gap-2 pt-1">
					<Button
						title={t("actions.decline")}
						variant="outline"
						size="sm"
						icon={<HugeiconsIcon icon={CancelCircleIcon} size={16} color={colors.semantic.error} />}
						textClassName="text-destructive"
						disabled={submitting}
						onPress={() => onDecline(item.id)}
						className="flex-1"
					/>
					{item.status === "PENDING" ? (
						<Button
							title={t("actions.counter")}
							variant="secondary"
							size="sm"
							disabled={submitting}
							onPress={() => onCounter(item.id)}
							className="flex-1"
						/>
					) : null}
					<Button
						title={t("actions.accept")}
						variant="primary"
						size="sm"
						icon={<HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} color={colors.neutral.textPrimary} />}
						disabled={submitting}
						onPress={() => onAccept(item.id)}
						className="flex-1"
					/>
				</View>
			) : null}
		</Card>
	);
}
