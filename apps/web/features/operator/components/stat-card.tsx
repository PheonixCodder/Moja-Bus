import React from "react";
import { KpiCard, type KpiCardProps } from "./kpi/kpi-card";

export type StatCardProps = KpiCardProps;

/**
 * Backwards compatibility wrapper for StatCard.
 * Internally renders the canonical KpiCard.
 */
export function StatCard(props: StatCardProps) {
  return <KpiCard {...props} />;
}
