import { Colors } from "@moja/theme/tokens";
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
	{ color: string; bgColor: string; label: string }
> = {
	CONFIRMED: {
		color: "#10b981",
		bgColor: "rgba(16, 185, 129, 0.1)",
		label: "Confirmed",
	},
	PENDING_PAYMENT: {
		color: "#f59e0b",
		bgColor: "rgba(245, 158, 11, 0.1)",
		label: "Pending Payment",
	},
	COMPLETED: {
		color: "#3b82f6",
		bgColor: "rgba(59, 130, 246, 0.1)",
		label: "Completed",
	},
	CANCELLED: {
		color: "#ef4444",
		bgColor: "rgba(239, 68, 68, 0.1)",
		label: "Cancelled",
	},
	EXPIRED: {
		color: "#9ca3af",
		bgColor: "rgba(156, 163, 175, 0.1)",
		label: "Expired",
	},
};

type BookingStatusBadgeProps = {
	status: BookingStatus;
};

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
	const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.EXPIRED;

	return (
		<Badge
			variant="outline"
			style={{
				backgroundColor: config.bgColor,
				borderColor: config.color,
				paddingHorizontal: 8,
				paddingVertical: 4,
				borderRadius: 8,
			}}
		>
			<Text
				style={{
					fontSize: 11,
					fontWeight: "700",
					color: config.color,
					letterSpacing: 0.5,
				}}
			>
				{config.label}
			</Text>
		</Badge>
	);
}
