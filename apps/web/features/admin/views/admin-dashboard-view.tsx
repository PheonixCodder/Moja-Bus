"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Coins,
  ShieldAlert,
  Users,
  Activity,
  ArrowRight,
  TrendingUp,
  Settings,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";

export function AdminDashboardView() {
  const trpc = useTRPC();
  const { data: kpis } = useSuspenseQuery(
    trpc.admin.getDashboardKPIs.queryOptions()
  );

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* GMV */}
        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Booking Volume (GMV)
            </CardTitle>
            <div className="rounded bg-emerald-50 p-2 text-emerald-600">
              <Coins className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900 font-display">
              {kpis.totalGMV.toLocaleString()} <span className="text-sm font-semibold text-slate-500">XOF</span>
            </div>
            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="size-3" />
              Cumulative checkout sales
            </p>
          </CardContent>
        </Card>

        {/* Commissions */}
        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Platform Commissions
            </CardTitle>
            <div className="rounded bg-indigo-50 p-2 text-indigo-600">
              <TrendingUp className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900 font-display">
              {kpis.totalCommission.toLocaleString()} <span className="text-sm font-semibold text-slate-500">XOF</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Commission + Convenience fees
            </p>
          </CardContent>
        </Card>

        {/* Travelers */}
        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Registered Travelers
            </CardTitle>
            <div className="rounded bg-blue-50 p-2 text-blue-600">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900 font-display">
              {kpis.travelersCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active traveler user profiles
            </p>
          </CardContent>
        </Card>

        {/* Active Operators */}
        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Registered Operators
            </CardTitle>
            <div className="rounded bg-sky-50 p-2 text-sky-600">
              <ShieldCheck className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900 font-display">
              {kpis.operatorsCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Intercity bus transport companies
            </p>
          </CardContent>
        </Card>

        {/* Pending Verifications */}
        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Verifications
            </CardTitle>
            <div className="rounded bg-amber-50 p-2 text-amber-600">
              <ShieldAlert className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900 font-display">
              {kpis.pendingOperatorsCount}
            </div>
            <Link
              href="/dashboard/admin/verification"
              className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1 mt-1 font-medium transition-colors"
            >
              View onboarding queue <ArrowRight className="size-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Active Operations */}
        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active / Boarding Trips
            </CardTitle>
            <div className="rounded bg-rose-50 p-2 text-rose-600">
              <Activity className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900 font-display">
              {kpis.activeTripsCount}
            </div>
            <Link
              href="/dashboard/admin/operations"
              className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 mt-1 font-medium transition-colors"
            >
              Monitor dispatch timeline <ArrowRight className="size-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Admin Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800">Quick Actions</CardTitle>
            <CardDescription>Common administrative operational shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="justify-start gap-2 h-10"
              nativeButton={false}
              render={
                <Link href="/dashboard/admin/verification">
                  <ShieldCheck className="size-4 text-primary" />
                  Review Onboarding Queue
                </Link>
              }
            />
            <Button
              variant="outline"
              className="justify-start gap-2 h-10"
              nativeButton={false}
              render={
                <Link href="/dashboard/admin/settlements">
                  <Coins className="size-4 text-emerald-600" />
                  Process Payouts
                </Link>
              }
            />
            <Button
              variant="outline"
              className="justify-start gap-2 h-10"
              nativeButton={false}
              render={
                <Link href="/dashboard/admin/users">
                  <Users className="size-4 text-blue-600" />
                  Manage User Directory
                </Link>
              }
            />
            <Button
              variant="outline"
              className="justify-start gap-2 h-10"
              nativeButton={false}
              render={
                <Link href="/dashboard/admin/settings">
                  <Settings className="size-4 text-slate-600" />
                  Configure Platforms & Tiers
                </Link>
              }
            />
          </CardContent>
        </Card>

        <Card className="bg-white border-border shadow-sm p-6 flex flex-col justify-center space-y-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">Moja Ride Operations Control</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              As a platform administrator, you hold authority over fee bands, distance limits, operator settlements, and security verification. Ensure operator documents are checked carefully against registration numbers before approving subaccounts.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
