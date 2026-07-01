import Link from "next/link";
import { OperatorSignupForm } from "@/features/auth/components/operator-signup-form";

export function OperatorSignupView() {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Moja Ride</h1>
          <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-0.5 text-xs font-medium text-muted-foreground uppercase tracking-widest">
            for Business
          </span>
        </div>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          Register your transport business to manage fleet, routes, and bookings
          — and join the Moja Ride operator network.
        </p>
      </div>

      <OperatorSignupForm />

      <div className="flex flex-col items-center gap-1.5">
        <p className="text-xs text-muted-foreground">
          Already have a business account?{" "}
          <Link
            href="/operator/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
        <p className="text-xs text-muted-foreground">
          Are you a passenger?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary hover:underline"
          >
            Create Passenger Account
          </Link>
        </p>
      </div>
    </div>
  );
}
