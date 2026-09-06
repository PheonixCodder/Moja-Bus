import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";

type BookingStatus =
	| "CONFIRMED"
	| "PENDING_PAYMENT"
	| "COMPLETED"
	| "CANCELLED"
	| "EXPIRED"
	| "REFUND_PENDING";

const STATUS_CONFIG: Record<
	BookingStatus,
	{ badgeClass: string; textClass: string; labelKey: string }
> = {
	CONFIRMED: {
		badgeClass: "bg-success/15 border-success/30",
		textClass: "text-success",
		labelKey: "confirmed",
	},
	PENDING_PAYMENT: {
		badgeClass: "bg-warning/15 border-warning/30",
		textClass: "text-warning",
		labelKey: "pendingPayment",
	},
	COMPLETED: {
		badgeClass: "bg-info/15 border-info/30",
		textClass: "text-info",
		labelKey: "completed",
	},
	CANCELLED: {
		badgeClass: "bg-destructive/15 border-destructive/30",
		textClass: "text-destructive",
		labelKey: "cancelled",
	},
	EXPIRED: {
		badgeClass: "bg-muted border-border",
		textClass: "text-muted-foreground",
		labelKey: "expired",
	},
	REFUND_PENDING: {
		badgeClass: "bg-warning/15 border-warning/30",
		textClass: "text-warning",
		labelKey: "refundPending",
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
