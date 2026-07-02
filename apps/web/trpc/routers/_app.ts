import { createTRPCRouter } from "../init";
import { operatorRouter } from "./operator";
import { terminalsRouter } from "./terminals";
import { staffRouter } from "./staff";
import { fleetRouter } from "./fleet";
import { routesRouter } from "./routes";
import { schedulesRouter } from "./schedules";
import { tripsRouter } from "./trips";
import { invitationRouter } from "./invitation";

export const appRouter = createTRPCRouter({
  operator: operatorRouter,
  terminals: terminalsRouter,
  staff: staffRouter,
  fleet: fleetRouter,
  routes: routesRouter,
  schedules: schedulesRouter,
  trips: tripsRouter,
  invitation: invitationRouter,
});

export type AppRouter = typeof appRouter;
