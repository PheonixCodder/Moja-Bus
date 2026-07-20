/**
 * Shared cron auth: fail closed whenever CRON_SECRET is set.
 * In production without CRON_SECRET, also reject (misconfiguration).
 */
export function assertCronAuthorized(request: Request): Response | null {
  const secret = process.env["CRON_SECRET"];
  const authHeader = request.headers.get("authorization");

  if (secret) {
    if (authHeader !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return null;
  }

  if (process.env["NODE_ENV"] === "production") {
    return Response.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }

  // Local/dev without secret: allow
  return null;
}
