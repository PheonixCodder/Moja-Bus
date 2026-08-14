import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";

type BookingStatus =
	| "CONFIRMED"
	| "PENDING_PAYMENT"
	| "COMPLETED"
	| "CANCELLED"
	| "EXPIRED";

const STATUS_CONFIG: Record<
	BookingStatus,
	{ badgeClass: string; textClass: string; labelKey: string }
> = {
	CONFIRMED: {
		badgeClass: "bg-emerald-50 border-emerald-300",
		textClass: "text-emerald-700",
		labelKey: "confirmed",
	},
	PENDING_PAYMENT: {
		badgeClass: "bg-amber-50 border-amber-300",
		textClass: "text-amber-700",
		labelKey: "pendingPayment",
	},
	COMPLETED: {
		badgeClass: "bg-blue-50 border-blue-300",
		textClass: "text-blue-700",
		labelKey: "completed",
	},
	CANCELLED: {
		badgeClass: "bg-red-50 border-red-300",
		textClass: "text-red-700",
		labelKey: "cancelled",
	},
	EXPIRED: {
		badgeClass: "bg-slate-100 border-slate-300",
		textClass: "text-slate-500",
		labelKey: "expired",
	},
};

type BookingStatusBadgeProps = {
	status: BookingStatus;
};

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
	const { t } = useTranslation("booking");
	const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.EXPIRED;

	return (
		<Badge
			variant="outline"
			className={`px-2 py-1 rounded-lg border ${config.badgeClass}`}
		>
			<Text className={`text-sm font-bold tracking-wide ${config.textClass}`}>
				{t(config.labelKey as any)}
			</Text>
		</Badge>
	);
}
