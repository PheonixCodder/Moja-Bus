import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { authClient } from "@/lib/auth-client";

/**
 * Call at the top of any screen that requires authentication.
 * Returns `true` when the user is confirmed authenticated,
 * `false` (and triggers a redirect to login) when they are not.
 * Returns `null` while the session is still loading.
 */
export function useRequireAuth(returnTo?: string): boolean | null {
  const router = useRouter();
  const segments = useSegments();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      const target = returnTo ?? `/${segments.join("/")}`;
      router.replace(`/(auth)/login?returnTo=${encodeURIComponent(target)}` as any);
    }
  }, [isPending, session?.user, returnTo, segments, router]);

  if (isPending) return null;
  return !!session?.user;
}
