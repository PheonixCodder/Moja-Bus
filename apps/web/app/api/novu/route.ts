import { serve } from "@novu/framework/next";
import { Client } from "@novu/framework";
import { workflows } from "@/features/notifications/workflows";

export const dynamic = "force-dynamic";

export const { GET, POST, OPTIONS } = serve({
  workflows,
  client: new Client({
    secretKey: process.env["NOVU_SECRET_KEY"] || "dummy-secret-key-for-builds",
  }),
});

if (!process.env["NOVU_SECRET_KEY"] && process.env.NODE_ENV === "production") {
  console.error("NOVU_SECRET_KEY is not set — notifications will not be delivered.");
}
