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
