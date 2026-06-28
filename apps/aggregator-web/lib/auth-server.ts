import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "./auth-client";

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
  return data.session;
}

export async function redirectIfAuthenticated(destination = "/dashboard") {
  const { data } = await getServerSession();

  if (data?.session) {
    redirect(destination);
  }
}

export async function getUser() {
  const { data } = await getServerSession();
  return data?.user ?? null
}
