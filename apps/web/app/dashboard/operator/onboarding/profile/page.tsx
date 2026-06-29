import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { OperatorProfileForm } from "@/features/dashboard/components/onboarding/operator-profile-form";

export const metadata = {
  title: "Your Profile - Moja Ride Onboarding",
  description: "Complete your operator profile",
};

export default async function ProfilePage() {
  const { data: session } = await getServerSession();
  
  if (!session?.session) {
    redirect("/operator/login");
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Complete Your Profile
        </h2>
        <p className="text-slate-600 mt-1">
          Add your personal and professional details
        </p>
      </div>
      <OperatorProfileForm />
    </div>
  );
}
