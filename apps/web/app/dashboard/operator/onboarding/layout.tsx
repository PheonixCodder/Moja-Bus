import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import type { CustomUser } from "@/lib/auth-client";
import { OnboardingProgress } from "@/features/dashboard/components/onboarding/onboarding-progress";
import Link from "next/link";
import { Button } from "@moja/ui/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = await getServerSession();
  console.log(session);
  
  // If not authenticated as operator, redirect to log in
  if (!session?.session) {
    redirect("/operator/login");
  }
  
  const user = (session as unknown as { user: CustomUser }).user;
  const userRole = user?.role || "TRAVELER";
  
  // If not operator or admin, redirect to appropriate dashboard
  if (userRole !== "OPERATOR" && userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/operator">
              <Button variant="ghost" size="icon" className="hover:bg-slate-100">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Moja Ride</h1>
              <p className="text-sm text-slate-500">Business Onboarding</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/operator">
              <Button variant="outline" size="sm">
                Skip for now
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress tracker */}
        <div className="mb-10">
          <OnboardingProgress />
        </div>
        
        {/* Step content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
