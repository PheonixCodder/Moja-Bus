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
import { storageRouter } from "./storage";
import { walletRouter } from "./wallet";
import { blogRouter } from "./blog";

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
  storage: storageRouter,
  wallet: walletRouter,
  blog: blogRouter,
});

export type AppRouter = typeof appRouter;
