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
    color: "text-primary bg-primary/10 border-primary/20",
    dot: "bg-primary",
  },
  BOARDING: {
    label: "Boarding",
    icon: CheckCircle2,
    color: "text-success bg-success/10 border-success/20",
    dot: "bg-success",
  },
  DEPARTED: {
    label: "Departed",
    icon: ArrowRight,
    color: "text-muted-foreground bg-muted border-border",
    dot: "bg-muted-foreground",
  },
  DELAYED: {
    label: "Delayed",
    icon: AlertTriangle,
    color: "text-warning bg-warning/10 border-warning/20",
    dot: "bg-warning",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-destructive bg-destructive/10 border-destructive/20",
    dot: "bg-destructive",
  },
  ARRIVED: {
    label: "Arrived",
    icon: CheckCircle2,
    color: "text-muted-foreground bg-muted border-border",
    dot: "bg-muted-foreground/60",
  },
};
