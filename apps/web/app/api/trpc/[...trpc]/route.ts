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
  });

export { handler as GET, handler as POST };
