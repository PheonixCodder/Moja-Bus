import { createServer } from "node:http";

import { getNumberEnv } from "@moja/config";

import { createApiApp } from "./app.js";
import { startTripGenerationCron } from "./lib/trip-cron.js";

const app = createApiApp();
const server = createServer(app);
const port = Math.max(1, getNumberEnv("PORT", process.env, 4000));

server.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  startTripGenerationCron();
});
