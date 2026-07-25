"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { PassengerAuthFlow } from "@/features/auth/components/passenger-auth-flow";
import { Button } from "@moja/ui/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Globe } from "lucide-react";

type LoginViewProps = {
  errorCode?: string | undefined;
  initialStep?: "input" | "otp" | "profile";
  initialUser?: { email?: string; phone?: string } | undefined;
  callbackUrl?: string | undefined;
};

export function LoginView({
  errorCode,
  initialStep,
  initialUser,
  callbackUrl,
}: LoginViewProps) {
  const t = useTranslations("auth.passenger");
  const ta = useTranslations("auth");
  const isBookingReturn =
    typeof callbackUrl === "string" && callbackUrl.startsWith("/search");

  return (
    <div className="relative h-full mx-auto flex w-full flex-col justify-center space-y-8 px-4 sm:px-6">
      {/* Switch to Operator Link (Absolute top right) */}
      <div className="absolute top-5 flex w-full justify-end px-10 right-0">
        <div className="text-muted-foreground text-sm">
          {t("loginOperatorLink")}{" "}
          <Link href="/operator/login" className="text-foreground font-semibold hover:underline">
            {t("loginOperatorPortal")}
          </Link>
        </div>
      </div>

      {isBookingReturn ? (
        <p className="text-center text-sm text-muted-foreground -mb-4">
          {t("bookingBanner")}
        </p>
      ) : null}

      {/* Dynamic OTP auth flow */}
      <PassengerAuthFlow
        initialStep={initialStep}
        initialUser={initialUser}
        callbackUrl={callbackUrl}
      />

      {/* Footer copyright info (Absolute bottom) */}
      <div className="absolute bottom-5 flex w-full justify-between px-10 left-0 right-0 text-sm text-muted-foreground">
        <span>{ta("copyright")}</span>
        <div className="flex items-center gap-1 text-sm font-bold">
          <Globe className="size-4 text-muted-foreground" />
          {ta("eng")}
        </div>
      </div>
    </div>
  );
}
