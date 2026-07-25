import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Loader2 } from "lucide-react";

import { InvitationView } from "@/features/invitation/views/invitation-view";

import { trpc, prefetch, HydrateClient } from "@/trpc/server";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "invite" });
  return {
    title: t("metaTitle"),
    description: t("subtitle"),
  };
}

export default async function InvitePage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams?.["token"];
  const tokenStr = Array.isArray(token) ? token[0] : token;

  if (tokenStr) {
    await prefetch(
      trpc.invitation.validateToken.queryOptions({ token: tokenStr }),
    );
  }

  return (
    <HydrateClient>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#ee237c]" />
          </div>
        }
      >
        <InvitationView />
      </Suspense>
    </HydrateClient>
  );
}
