import { createTRPCRouter } from "../init";
import { operatorRouter } from "./operator";
import { terminalsRouter } from "./terminals";
import { staffRouter } from "./staff";
import { fleetRouter } from "./fleet";
import { routesRouter } from "./routes";
import { schedulesRouter } from "./schedules";
import { tripsRouter } from "./trips";
import { invitationRouter } from "./invitation";
import { locationsRouter } from "./locations";
import { searchRouter } from "./search";
import { bookingRouter } from "./booking";
import { passengerRouter } from "./passenger";
import { paymentsRouter } from "./payments";
import { publicRouter } from "./public";
import { adminRouter } from "./admin";
import { walletRouter } from "./wallet";

export const appRouter = createTRPCRouter({
  operator: operatorRouter,
  terminals: terminalsRouter,
  staff: staffRouter,
  fleet: fleetRouter,
  routes: routesRouter,
  schedules: schedulesRouter,
  trips: tripsRouter,
  invitation: invitationRouter,
  locations: locationsRouter,
  search: searchRouter,
  booking: bookingRouter,
  passenger: passengerRouter,
  payments: paymentsRouter,
  public: publicRouter,
  admin: adminRouter,
  wallet: walletRouter,
});

export type AppRouter = typeof appRouter;
