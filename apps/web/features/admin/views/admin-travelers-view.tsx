"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Travelers } from "../components/travelers";
import type { TravelerRow } from "../components/travelers-columns";

export function AdminTravelersView() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.admin.listUsers.queryOptions({
      limit: 100,
      offset: 0,
      role: "TRAVELER",
    })
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
