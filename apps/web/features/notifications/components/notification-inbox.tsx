"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Inbox, InboxContent } from "@novu/react";
import { useRouter } from "@/i18n/navigation";
import { resolveWebNotificationRoute } from "./notification-routes";

/**
 * Phase 34 (F-NF-15) — the prebuilt <Inbox> previously rendered mark-read-only
 * rows. Switched to the children form so onNotificationClick can route the
 * user: identifier map first (notification-routes.ts), stored redirect as
 * fallback. Tap navigation is best-effort — a resolution miss just marks read.
 *
 * `appearance` stays on <Inbox> even in the children form: InboxChild feeds it
 * into the shared NovuUI options; InboxContent only takes handlers/layout.
 */
type NotificationClickHandler = NonNullable<
  React.ComponentProps<typeof InboxContent>["onNotificationClick"]
>;

export function NotificationInbox() {
  const trpc = useTRPC();
  const router = useRouter();
  const { data, isLoading, error } = useQuery(
    trpc.public.getNotificationToken.queryOptions(undefined, {
      staleTime: Infinity,
    })
  );

  if (isLoading || error || !data?.appId || !data?.subscriberHash) {
    return null; // Don't block header rendering if loading/failed
  }

  const onNotificationClick: NotificationClickHandler = (notification) => {
    const identifier = notification.workflow?.identifier;
    const redirectUrl = notification.redirect?.url;
    const payloadData = notification.data as Record<string, unknown> | undefined;
    const route = resolveWebNotificationRoute({
      ...(identifier !== undefined ? { identifier } : {}),
      ...(payloadData !== undefined ? { data: payloadData } : {}),
      ...(redirectUrl !== undefined ? { redirectUrl } : {}),
    });
    if (route) router.push(route);
  };

  return (
    <div className="relative flex items-center justify-center">
      <Inbox
        applicationIdentifier={data.appId}
        subscriberId={data.subscriberId}
        subscriberHash={data.subscriberHash}
        appearance={{
          elements: {
            bellIcon:
              "text-slate-600 hover:text-slate-900 transition-colors size-5",
            bellContainer:
              "relative p-2 rounded-full hover:bg-slate-100 transition-all",
            inbox__popoverContent: "z-[9999]!",
          },
        }}
      >
        <InboxContent onNotificationClick={onNotificationClick} />
      </Inbox>
    </div>
  );
}
