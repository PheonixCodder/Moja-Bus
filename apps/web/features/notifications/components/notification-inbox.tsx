"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Inbox } from "@novu/react";

export function NotificationInbox() {
  const trpc = useTRPC();
  const { data, isLoading, error } = useQuery(
    trpc.public.getNotificationToken.queryOptions(undefined, {
      staleTime: Infinity,
    })
  );

  if (isLoading || error || !data?.appId || !data?.subscriberHash) {
    return null; // Don't block header rendering if loading/failed
  }

  return (
    <div className="relative flex items-center justify-center">
      <Inbox
        applicationIdentifier={data.appId}
        subscriberId={data.subscriberId}
        subscriberHash={data.subscriberHash}
        appearance={{
          elements: {
            bellIcon: "text-slate-600 hover:text-slate-900 transition-colors size-5",
            bellContainer: "relative p-2 rounded-full hover:bg-slate-100 transition-all",
          }
        }}
      />
    </div>
  );
}
