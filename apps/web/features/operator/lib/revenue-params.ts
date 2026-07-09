import { parseAsString } from "nuqs/server";
import { subDays } from "date-fns";

export const revenueParamsSchema = {
  from: parseAsString.withDefault(subDays(new Date(), 6).toISOString()),
  to: parseAsString.withDefault(new Date().toISOString()),
};
