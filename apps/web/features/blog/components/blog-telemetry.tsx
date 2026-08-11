"use client";

import { useEffect, useRef } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

interface BlogTelemetryProps {
  postId: string;
}

const READ_THRESHOLDS = [
  { pct: 25, event: "READ_25" },
  { pct: 50, event: "READ_50" },
  { pct: 75, event: "READ_75" },
  { pct: 100, event: "READ_100" },
] as const;

export function BlogTelemetry({ postId }: BlogTelemetryProps) {
  const trpc = useTRPC();
  const trackEvent = useMutation(trpc.blog.trackEvent.mutationOptions());
  // Track which depth milestones have fired this page load (in-memory, per mount)
  const firedRef = useRef(new Set<string>());

  useEffect(() => {
    if (typeof window === "undefined") return;

    // VIEW — fire once per browser session per post
    const viewKey = `blog-viewed-${postId}`;
    if (!sessionStorage.getItem(viewKey)) {
      sessionStorage.setItem(viewKey, "true");
      trackEvent.mutate({ postId, eventType: "VIEW" });
    }

    // SCROLL DEPTH — fire READ_25/50/75/100 as user scrolls down
    const handleScroll = () => {
      const scrolledToBottom = window.scrollY + window.innerHeight;
      const totalHeight = document.documentElement.scrollHeight;
      const scrollPct = (scrolledToBottom / totalHeight) * 100;

      for (const { pct, event } of READ_THRESHOLDS) {
        const key = `${postId}-${pct}`;
        if (scrollPct >= pct && !firedRef.current.has(key)) {
          firedRef.current.add(key);
          trackEvent.mutate({ postId, eventType: event });
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Run once immediately in case the post is shorter than the viewport
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  return null;
}
