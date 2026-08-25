import { getOptionalEnv } from "@moja/config";

export function getAppOrigin(requestOrigin?: string): string {
  const canonical =
    getOptionalEnv("APP_URL") ?? getOptionalEnv("NEXT_PUBLIC_APP_URL");
  if (canonical) {
    return canonical.replace(/\/+$/, "");
  }
  return requestOrigin ?? "http://localhost:3000";
}
