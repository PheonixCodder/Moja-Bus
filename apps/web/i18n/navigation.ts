// Re-export locale-aware navigation primitives from next-intl.
// Import Link, useRouter, usePathname, redirect from here — NOT from next/navigation —
// so locale is automatically handled in hrefs and redirects.
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, useRouter, usePathname, redirect, permanentRedirect } =
  createNavigation(routing);
