"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useTRPC } from "@/trpc/client";
import { Travelers } from "../components/travelers";
import type { TravelerRow } from "../components/travelers-columns";

export function AdminTravelersView() {
  const t = useTranslations("adminDashboard.adminTravelersView");
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.admin.listUsers.queryOptions({
      limit: 100,
      offset: 0,
      role: "TRAVELER",
    }),
  );

  const travelers: TravelerRow[] = useMemo(() => {
    return data.items.map((user: any) => ({
      id: user.id,
      name: user.fullName || "Unknown",
      image: user.image ?? null,
      email: user.email,
      phone: user.phoneNumber || "N/A",
      status: user.emailVerified ? "Verified" : "Unverified",
      joinedDate: format(new Date(user.createdAt), "dd MMM yyyy, h:mm a"),
      rawDate: new Date(user.createdAt).getTime(),
    }));
  }, [data.items]);

  return <Travelers travelers={travelers} />;
}
