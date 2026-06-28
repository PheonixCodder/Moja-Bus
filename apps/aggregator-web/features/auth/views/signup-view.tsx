import { SignupForm } from "@/features/auth/components/signup-form";

export function SignupView() {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Moja Bus</h1>
        <p className="text-sm text-muted-foreground">
          Create a passenger account to search routes and book your next trip
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
