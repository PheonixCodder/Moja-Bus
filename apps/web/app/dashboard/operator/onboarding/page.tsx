import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { OperatorOnboardingView } from "@/features/operator/views/operator-onboarding-view";

const API_BASE_URL =
  process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

async function getOnboardingStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/operator/onboarding`, {
      headers: {
        cookie: (await headers()).get("cookie") || "",
      },
      next: { revalidate: 0 },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export default async function OperatorOnboardingPage() {
  const data = await getOnboardingStatus();

  if (data && data.onboardingStatus === "COMPLETED") {
    redirect("/dashboard/operator");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-display">
              Moja Ride Partner
            </h1>
            <p className="text-xs text-slate-500">Business Onboarding Setup</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-md border border-border p-8 shadow-sm">
          <OperatorOnboardingView />
        </div>
      </main>
    </div>
  );
}
