import { Suspense } from "react";
import type { Metadata } from "next";
import { Loader2 } from "lucide-react";

import { InvitationView } from "@/features/invitation/views/invitation-view";

import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Accept Invitation - Moja Ride",
  description: "Accept your invitation to join a company on Moja Ride.",
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

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
