import { format } from "date-fns";
import type { ActivityLogEntry } from "@/features/operator/lib/staff";

export function groupActivityByDate(
  logs: ActivityLogEntry[],
): Record<string, ActivityLogEntry[]> {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const groups: Record<string, ActivityLogEntry[]> = {};

  for (const log of logs) {
    const d = new Date(log.createdAt).toDateString();
    const label =
      d === today
        ? "Today"
        : d === yesterday
          ? "Yesterday"
          : format(new Date(log.createdAt), "MMM d");
    if (!groups[label]) groups[label] = [];
    groups[label]!.push(log);
  }
  return groups;
}
