"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { Suspense, useEffect } from "react";
import { PostHogPageView } from "./posthog-pageview";
import { PostHogIdentitySync } from "./posthog-identity-sync";
import {
  POSTHOG_EU_HOST,
  POSTHOG_EU_UI_HOST,
  POSTHOG_INGEST_PROXY_PATH,
  POSTHOG_SDK_DEFAULTS,
} from "@moja/analytics";

const POSTHOG_KEY = process.env["NEXT_PUBLIC_POSTHOG_KEY"];
const POSTHOG_HOST = process.env["NEXT_PUBLIC_POSTHOG_HOST"] || POSTHOG_EU_HOST;

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY) {
      return;
    }

    // In the browser, use the /ingest rewrite proxy to avoid ad-blockers,
    // pointing ui_host to PostHog EU cloud dashboard.
    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_INGEST_PROXY_PATH,
      ui_host: POSTHOG_EU_UI_HOST,
      defaults: POSTHOG_SDK_DEFAULTS,
      person_profiles: "identified_only",
      capture_pageview: false, // Captured manually by PostHogPageView for App Router SPA transitions
      capture_pageleave: true,
      opt_out_useragent_filter: isLocalhost,
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
