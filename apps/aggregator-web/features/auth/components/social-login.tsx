"use client";

import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@moja/ui/components/ui/button";
import { Separator } from "@moja/ui/components/ui/separator";

export function SocialLogin() {
  const [pendingProvider, setPendingProvider] = useState<"google" | null>(null);

  async function handleOAuth(provider: "google") {
    setPendingProvider(provider);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/dashboard",
      });
    } catch {
      toast.error(`Failed to sign in with ${provider}. Please try again.`);
      setPendingProvider(null);
    }
  }

  const isLoading = pendingProvider !== null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or continue with</span>
        <Separator className="flex-1" />
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isLoading}
          onClick={() => handleOAuth("google")}
        >
          {pendingProvider === "google" ? "Redirecting..." : "Continue with Google"}
        </Button>
      </div>
    </div>
  );
}
