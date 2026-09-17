"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { authClient } from "@/lib/auth-client";

export function PostHogIdentitySync(): null {
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (!posthog.__loaded) return;

    const user = session?.user as Record<string, unknown> | undefined;
    if (user && typeof user["id"] === "string") {
      const traits: Record<string, unknown> = {
        platform: "web",
      };
      if (typeof user["email"] === "string") traits["email"] = user["email"];
      if (typeof user["name"] === "string") traits["name"] = user["name"];
      if (typeof user["role"] === "string") traits["role"] = user["role"];
      if (typeof user["phoneNumber"] === "string") traits["phone"] = user["phoneNumber"];

      posthog.identify(user["id"], traits);

      if (typeof user["activeCompanyId"] === "string") {
        posthog.group("company", user["activeCompanyId"]);
      }
    }
  }, [session?.user]);

  return null;
}
