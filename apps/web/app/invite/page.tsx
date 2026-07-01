import { Suspense } from "react";
import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import { InvitePageContent } from "./invite-page-content";

export const metadata: Metadata = {
  title: "Accept Invitation - Moja Ride",
  description: "Accept your invitation to join a company on Moja Ride.",
};

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#ee237c]" />
        </div>
      }
    >
      <InvitePageContent />
    </Suspense>
  );
}
