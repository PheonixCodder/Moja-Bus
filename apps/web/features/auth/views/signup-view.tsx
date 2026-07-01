import Link from "next/link";
import { SignupForm } from "@/features/auth/components/signup-form";

export function SignupView() {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Moja Ride
          <span className="block text-sm font-normal text-muted-foreground">
            Passenger Portal
          </span>
        </h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Join thousands of travelers. Create your passenger account to search
          routes, book trips, and manage your bookings in one place.
        </p>
      </div>
      <SignupForm role="TRAVELER" />
      <p className="text-xs text-muted-foreground">
        Are you a transport operator?{" "}
        {
          <Link
            href="/operator/signup"
            className="font-medium text-primary hover:underline"
          >
            Register as Business
          </Link>
        }
      </p>
    </div>
  );
}
