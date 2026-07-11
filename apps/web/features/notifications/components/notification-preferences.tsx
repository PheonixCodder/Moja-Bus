"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Inbox, Preferences } from "@novu/react";

export function NotificationPreferences() {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.public.getNotificationToken.queryOptions(undefined, {
      staleTime: Infinity,
    })
  );

  if (isLoading || !data?.appId || !data?.subscriberHash) {
    return <div className="animate-pulse bg-slate-100 rounded-xl h-48 w-full" />;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 mb-2">Notification Channels</h3>
      <p className="text-sm text-slate-500 mb-6">
        Configure delivery preferences for your operator team. Toggle off SMS alerts to save on platform carrier fees.
      </p>
      <Inbox
        applicationIdentifier={data.appId}
        subscriberId={data.subscriberId}
        subscriberHash={data.subscriberHash}
      >
        <Preferences />
      </Inbox>
    </div>
  );
}
