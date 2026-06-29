"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import type { User } from "better-auth";

interface DashboardViewProps {
  user: User | null;
}

export function DashboardHeader({ user }: DashboardViewProps) {

  const firstName = user?.name?.split(" ")[0] ?? null;

  return (
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-sm text-text-muted">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary lg:text-3xl">
          {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        </h1>
      </div>

      <Link
        href="/dashboard/search"
        className="inline-flex items-center gap-1.5 rounded-md bg-neon px-3 py-1.5 text-sm font-semibold text-black shadow-[0_0_12px_rgba(57,255,20,0.15),0_0_2px_rgba(57,255,20,1)] transition-shadow duration-150 hover:bg-neon/90"
      >
        <Plus className="size-4" />
        Search trips
      </Link>
    </div>
  );
}
