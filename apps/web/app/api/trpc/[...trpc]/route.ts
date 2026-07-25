import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter } from "@/trpc/routers/_app";
import { createContextFromHeaders } from "@/trpc/init";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      return createContextFromHeaders(req.headers);
    },
  });

export { handler as GET, handler as POST };
