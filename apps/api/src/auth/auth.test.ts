import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";

process.env["DATABASE_URL"] ??=
  "postgresql://postgres:postgres@127.0.0.1:5432/postgres";
process.env["BETTER_AUTH_URL"] ??= "http://localhost:4000";
process.env["BETTER_AUTH_SECRET"] ??=
  "test-test-test-test-test-test-test-test-test-test-test-test";

async function startServer() {
  const { createApiApp } = await import("../app.js");
  const app = createApiApp();
  const server = createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, resolve);
  });

  const address = server.address();
  if (typeof address !== "object" || address === null) {
    throw new Error("Failed to start test server.");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
  };
}

test("exposes health and Better Auth routes", async () => {
  const server = await startServer();

  try {
    const healthResponse = await fetch(`${server.baseUrl}/api/v1/health`);
    assert.equal(healthResponse.status, 200);
    assert.deepEqual(await healthResponse.json(), { status: "ok" });

    const authResponse = await fetch(`${server.baseUrl}/api/auth/ok`);
    assert.equal(authResponse.status, 200);
    assert.deepEqual(await authResponse.json(), { status: "ok" });
  } finally {
    await server.close();
  }
});
