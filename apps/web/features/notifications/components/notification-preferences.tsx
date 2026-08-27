"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Inbox, Preferences } from "@novu/react";
import { useTranslations } from "next-intl";

export function NotificationPreferences() {
  const t = useTranslations("notifications");
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.public.getNotificationToken.queryOptions(undefined, {
      staleTime: Infinity,
    }),
  );

  if (isLoading || !data?.appId || !data?.subscriberHash) {
    return (
      <div className="animate-pulse bg-slate-100 rounded-xl h-48 w-full" />
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 mb-2">
        {t("preferencesTitle")}
      </h3>
      <p className="text-sm text-slate-500 mb-6">
        {t("preferencesDescription")}
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
