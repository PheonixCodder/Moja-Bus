import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { LocationsForm } from "@/features/dashboard/components/onboarding/locations-form";

export const metadata = {
  title: "Company Locations - Moja Ride Onboarding",
  description: "Add your depots, terminals, and office locations",
};

export default async function LocationsPage() {
  const { data: session } = await getServerSession();
  
  if (!session?.session) {
    redirect("/operator/login");
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Where are you located?
        </h2>
        <p className="text-slate-600 mt-1">
          Add your depots, terminals, and office locations so passengers can find you
        </p>
      </div>
      <LocationsForm />
    </div>
  );
}
