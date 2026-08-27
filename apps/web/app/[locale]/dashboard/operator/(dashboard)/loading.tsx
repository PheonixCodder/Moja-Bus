"use client";

import { Spinner } from "@moja/ui/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full">
      <Spinner className="size-6" />
    </div>
  );
}
