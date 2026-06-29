import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";

type OperatorLoginViewProps = {
  errorCode?: string | undefined;
};

export function OperatorLoginView({ errorCode }: OperatorLoginViewProps) {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Moja Ride
          <span className="block text-sm font-normal text-muted-foreground">
            for Business
          </span>
        </h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Sign in to manage your transport business, fleet, and bookings.
        </p>
      </div>
      <LoginForm errorCode={errorCode} userType="operator" />
      <p className="text-xs text-muted-foreground">
        Are you a passenger? {
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in to Passenger Portal
          </Link>
        }
      </p>
    </div>
  );
}
