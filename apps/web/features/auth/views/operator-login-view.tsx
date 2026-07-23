"use client";

import Link from "next/link";
import { PassengerAuthFlow } from "@/features/auth/components/passenger-auth-flow";
import { Globe } from "lucide-react";

type OperatorLoginViewProps = {
  errorCode?: string | undefined;
};

export function OperatorLoginView({ errorCode }: OperatorLoginViewProps) {
  return (
    <div className="relative mx-auto flex w-full flex-col justify-center space-y-8 px-4 sm:px-6">
      {/* Switch to Passenger Link (Absolute top right) */}
      <div className="absolute top-5 flex w-full justify-end px-10 left-0">
        <div className="text-muted-foreground text-sm">
          Are you a passenger?{" "}
          <Link href="/login" className="text-foreground font-semibold hover:underline">
            Passenger Portal
          </Link>
        </div>
      </div>

      {/* Dynamic OTP auth flow */}
      <div className="space-y-4 pt-2">
        <PassengerAuthFlow userType="operator" />
      </div>

      {/* Footer copyright info (Absolute bottom) */}
      <div className="absolute bottom-5 flex w-full justify-between px-10 left-0 right-0 text-sm text-muted-foreground">
        <span>© 2026 Moja Ride. All rights reserved.</span>
        <div className="flex items-center gap-1 text-sm font-bold">
          <Globe className="size-4 text-muted-foreground" />
          ENG
        </div>
      </div>
    </div>
  );
}
