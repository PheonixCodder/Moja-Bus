"use client";

import { useEffect } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

interface BlogTelemetryProps {
  postId: string;
}

export function BlogTelemetry({ postId }: BlogTelemetryProps) {
  const trpc = useTRPC();
  const trackEvent = useMutation(trpc.blog.trackEvent.mutationOptions());

  useEffect(() => {
    trackEvent.mutate({
      postId,
      eventType: "VIEW",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  return null;
}
