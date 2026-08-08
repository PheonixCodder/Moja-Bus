import { BusFront, Gauge, type LucideIcon, ShieldCheck } from "lucide-react";

export interface DashboardLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Returns the list of dashboards the user has access to based on their role.
 *
 * - TRAVELER  → Passenger dashboard only
 * - OPERATOR  → Passenger + Operator dashboards
 * - ADMIN     → All three dashboards
 */
export function getAvailableDashboards(role: string): DashboardLink[] {
  const dashboards: DashboardLink[] = [
    { label: "Passenger", href: "/dashboard", icon: BusFront },
  ];

  if (role === "OPERATOR" || role === "ADMIN") {
    dashboards.push({
      label: "Operator",
      href: "/dashboard/operator",
      icon: Gauge,
    });
  }

  if (role === "ADMIN") {
    dashboards.push({
      label: "Admin",
      href: "/dashboard/admin",
      icon: ShieldCheck,
    });
  }

  return dashboards;
}
