"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { authClient } from "@/lib/auth-client";

export function PostHogIdentitySync(): null {
  useEffect(() => {
    let isMounted = true;

    async function syncIdentity() {
      try {
        const { data: session } = await authClient.getSession();
        if (!isMounted || !session?.user) return;

        const user = session.user as Record<string, unknown>;
        if (typeof user["id"] === "string") {
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
      } catch {
        // Silently ignore session retrieval errors for analytics sync
      }
    }

    syncIdentity();

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
}
