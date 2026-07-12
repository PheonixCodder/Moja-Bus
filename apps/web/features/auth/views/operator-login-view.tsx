import Link from "next/link";
import { PassengerAuthFlow } from "@/features/auth/components/passenger-auth-flow";
import { AuthHeader } from "@/features/auth/components/auth-header";

type OperatorLoginViewProps = {
  errorCode?: string | undefined;
};

export function OperatorLoginView({ errorCode }: OperatorLoginViewProps) {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <AuthHeader
        type="operator"
        description="Sign in to manage your transport business, fleet, and bookings."
      />
      <PassengerAuthFlow userType="operator" />
      <p className="text-xs text-muted-foreground">
        Are you a passenger?{" "}
        {
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in to Passenger Portal
          </Link>
        }
      </p>
    </div>
  );
}
