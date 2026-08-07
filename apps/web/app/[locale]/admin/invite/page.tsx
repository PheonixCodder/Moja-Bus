import { Loader2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AdminInvitationView } from "@/features/admin/views/admin-invitation-view";

import { HydrateClient, prefetch, trpc } from "@/trpc/server";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminInvite" });
  return {
    title: t("metaTitle"),
    description: t("subtitle"),
  };
}

export default async function AdminInvitePage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams?.["token"];
  const tokenStr = Array.isArray(token) ? token[0] : token;

  if (tokenStr) {
    await prefetch(
      trpc.adminStaff.validateToken.queryOptions({ token: tokenStr }),
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
        <AdminInvitationView />
      </Suspense>
    </HydrateClient>
  );
}
