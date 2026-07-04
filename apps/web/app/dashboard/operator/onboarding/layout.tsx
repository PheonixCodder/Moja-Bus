import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getServerSession } from "@/lib/auth-server";

export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession();

  if (!session?.session) {
    redirect("/operator/login");
  }

  const role = session.user?.role || "TRAVELER";

  if (role !== "OPERATOR" && role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
