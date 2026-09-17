"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { Suspense, useEffect } from "react";
import { PostHogPageView } from "./posthog-pageview";
import { PostHogIdentitySync } from "./posthog-identity-sync";
import {
  POSTHOG_EU_HOST,
  POSTHOG_EU_UI_HOST,
  POSTHOG_SDK_DEFAULTS,
} from "@moja/analytics";

const POSTHOG_KEY = process.env["NEXT_PUBLIC_POSTHOG_KEY"];
const POSTHOG_HOST = process.env["NEXT_PUBLIC_POSTHOG_HOST"] || POSTHOG_EU_HOST;

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[PostHog] NEXT_PUBLIC_POSTHOG_KEY is not set. Analytics disabled.");
      }
      return;
    }

    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    // In production, route through /ingest reverse proxy to bypass ad-blockers.
    // In local development, route directly to POSTHOG_HOST unless explicitly specified.
    const resolvedApiHost =
      process.env["NEXT_PUBLIC_POSTHOG_HOST"] ||
      (isLocalhost ? POSTHOG_HOST : "/ingest");

    posthog.init(POSTHOG_KEY, {
      api_host: resolvedApiHost,
      ui_host: POSTHOG_EU_UI_HOST,
      defaults: POSTHOG_SDK_DEFAULTS,
      person_profiles: "identified_only",
      capture_pageview: true, // Capture pageviews immediately
      capture_pageleave: true,
      opt_out_useragent_filter: isLocalhost,
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") {
          ph.debug();
          console.log("[PostHog] Initialized successfully with EU Cloud.");
        }
      },
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <PostHogIdentitySync />
      {children}
    </PHProvider>
  );
}
