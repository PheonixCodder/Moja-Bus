import {
  ArrowRight,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { TripStatus } from "@moja/schemas";

export const TRIP_STATUS_CONFIG: Record<
  TripStatus,
  { label: string; icon: React.ElementType; color: string; dot: string }
> = {
  SCHEDULED: {
    label: "Scheduled",
    icon: Clock,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
  },
  BOARDING: {
    label: "Boarding",
    icon: CheckCircle2,
    color: "text-green-600 bg-green-50 border-green-200",
    dot: "bg-green-500",
  },
  DEPARTED: {
    label: "Departed",
    icon: ArrowRight,
    color: "text-slate-600 bg-slate-50 border-slate-200",
    dot: "bg-slate-400",
  },
  DELAYED: {
    label: "Delayed",
    icon: AlertTriangle,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-red-600 bg-red-50 border-red-200",
    dot: "bg-red-500",
  },
  ARRIVED: {
    label: "Arrived",
    icon: CheckCircle2,
    color: "text-slate-500 bg-slate-50 border-slate-200",
    dot: "bg-slate-300",
  },
};
