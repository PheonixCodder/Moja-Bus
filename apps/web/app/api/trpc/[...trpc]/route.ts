import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter } from "@/trpc/routers/_app";
import { createContextFromHeaders } from "@/trpc/init";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async (opts) => {
      return createContextFromHeaders(req.headers, opts.resHeaders);
    },
    responseMeta() {
      const origin = req.headers.get("origin");
      if (!origin) return {};
      return {
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
        },
      };
    },
    onError({ error, path }) {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error(
          `[tRPC 500 Error] Uncaught error on procedure '${path}':`,
          error,
        );
      }
    },
  });

export function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, x-trpc-source, expo-origin, cookie",
    "Access-Control-Max-Age": "86400",
  };

  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  } else {
    headers["Access-Control-Allow-Origin"] = "*";
  }

  return new Response(null, {
    status: 204,
    headers,
  });
}

export { handler as GET, handler as POST };
