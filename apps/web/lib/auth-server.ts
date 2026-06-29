import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "./auth-client";
import type { CustomUser, CustomSession } from "./auth-client";

export async function getServerSession() {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  return session ?? null;
}

export async function requireServerSession(redirectTo = "/login") {
  const { data } = await getServerSession();
  if (!data?.session) {
    redirect(redirectTo);
  }
  return data.session as unknown as CustomSession;
}

/**
 * Redirects authenticated users to their role-appropriate dashboard.
 * Call this on public auth pages (login, signup) so already-signed-in
 * users don't see the auth screens again.
 */
export async function redirectIfAuthenticated() {
  const { data } = await getServerSession();
  if (!data?.session) return;

  const user = (data as unknown as { user: CustomUser }).user;
  const role = user?.role ?? "TRAVELER";

  if (role === "OPERATOR" || role === "ADMIN") {
    redirect("/dashboard/operator");
  }

  redirect("/dashboard");
}

export async function getUser(): Promise<CustomUser | null> {
  const { data } = await getServerSession();
  return (data as unknown as { user: CustomUser | null })?.user ?? null;
}

/**
 * Redirects already-authenticated users away from operator auth pages.
 * Operators go to the operator dashboard; passengers go to their dashboard.
 */
export async function redirectIfOperatorAuthenticated() {
  const { data } = await getServerSession();
  if (!data?.session) return;

  const user = (data as unknown as { user: CustomUser }).user;
  const role = user?.role ?? "TRAVELER";

  if (role === "OPERATOR" || role === "ADMIN") {
    redirect("/dashboard/operator");
  }

  // A passenger who somehow landed on an operator auth page goes home.
  redirect("/dashboard");
}

/**
 * Redirects already-authenticated users away from passenger auth pages.
 * Passengers go to their dashboard; operators go to the operator dashboard.
 */
export async function redirectIfPassengerAuthenticated() {
  const { data } = await getServerSession();
  if (!data?.session) return;

  const user = (data as unknown as { user: CustomUser }).user;
  const role = user?.role ?? "TRAVELER";

  if (role === "OPERATOR" || role === "ADMIN") {
    redirect("/dashboard/operator");
  }

  redirect("/dashboard");
}