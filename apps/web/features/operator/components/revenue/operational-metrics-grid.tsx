"use client";

import { formatXOF } from "../../lib/currency";
import { Ticket, Bus, ArrowLeftRight, CreditCard } from "lucide-react";

export function OperationalMetricsGrid({ kpis }: { kpis: any }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 h-full">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Operational Metrics</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center text-slate-500 mb-1">
            <Ticket className="h-4 w-4 mr-1.5" />
            <span className="text-xs font-medium">Ticket Sales</span>
          </div>
          <div className="text-lg font-semibold text-slate-900">
            {formatXOF(kpis.grossRevenueXOF)}
          </div>
        </div>

        <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center text-slate-500 mb-1">
            <Bus className="h-4 w-4 mr-1.5" />
            <span className="text-xs font-medium">Trips Run</span>
          </div>
          <div className="text-lg font-semibold text-slate-900">
            {kpis.totalTripsRun}
          </div>
        </div>

        <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center text-slate-500 mb-1">
            <ArrowLeftRight className="h-4 w-4 mr-1.5" />
            <span className="text-xs font-medium">Refunds</span>
          </div>
          <div className="text-lg font-semibold text-slate-900">
            {formatXOF(kpis.refundsIssuedXOF)}
          </div>
          <div className="text-[10px] text-slate-400">
            {kpis.refundsCount} transactions
          </div>
        </div>

        <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center text-slate-500 mb-1">
            <CreditCard className="h-4 w-4 mr-1.5" />
            <span className="text-xs font-medium">Bookings</span>
          </div>
          <div className="text-lg font-semibold text-slate-900">
            {kpis.totalConfirmedBookings}
          </div>
        </div>
      </div>
    </div>
  );
}
