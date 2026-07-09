"use client";

import { useEffect } from "react";
import { Button } from "@moja/ui/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function OperatorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="mb-4 size-12 text-destructive" />
      <h2 className="mb-2 text-xl font-semibold">Something went wrong!</h2>
      <p className="mb-6 max-w-md text-text-muted">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()}>Try again</Button>
      </div>
    </div>
  );
}
