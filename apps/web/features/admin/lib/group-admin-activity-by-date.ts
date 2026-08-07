import { format } from "date-fns";
import type { AdminActivityLogEntry } from "@/features/admin/lib/admin-staff";

export function groupAdminActivityByDate(
  logs: AdminActivityLogEntry[],
): Record<string, AdminActivityLogEntry[]> {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const groups: Record<string, AdminActivityLogEntry[]> = {};

  for (const log of logs) {
    const d = new Date(log.createdAt).toDateString();
    const label =
      d === today
        ? "Today"
        : d === yesterday
          ? "Yesterday"
          : format(new Date(log.createdAt), "MMM d");
    if (!groups[label]) groups[label] = [];
    groups[label].push(log);
  }
  return groups;
}
