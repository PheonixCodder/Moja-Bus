import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";
import { AuthHeader } from "@/features/auth/components/auth-header";

type LoginViewProps = {
  errorCode?: string | undefined;
};

export function LoginView({ errorCode }: LoginViewProps) {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <AuthHeader
        type="passenger"
        description="Welcome back! Sign in to search routes, book trips, and manage your travel."
      />
      <LoginForm errorCode={errorCode} />
      <p className="text-xs text-muted-foreground">
        Are you a transport operator?{" "}
        {
          <Link
            href="/operator/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in to Business Portal
          </Link>
        }
      </p>
    </div>
  );
}
