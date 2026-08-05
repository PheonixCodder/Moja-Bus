import { createTRPCRouter } from "../init";
import { adminRouter } from "./admin";
import { blogRouter } from "./blog";
import { bookingRouter } from "./booking";
import { capturesRouter } from "./captures";
import { contactRouter } from "./contact";
import { fleetRouter } from "./fleet";
import { invitationRouter } from "./invitation";
import { locationsRouter } from "./locations";
import { operatorRouter } from "./operator";
import { passengerRouter } from "./passenger";
import { paymentsRouter } from "./payments";
import { publicRouter } from "./public";
import { routesRouter } from "./routes";
import { schedulesRouter } from "./schedules";
import { searchRouter } from "./search";
import { staffRouter } from "./staff";
import { storageRouter } from "./storage";
import { terminalsRouter } from "./terminals";
import { tripsRouter } from "./trips";
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
  captures: capturesRouter,
  passenger: passengerRouter,
  payments: paymentsRouter,
  public: publicRouter,
  admin: adminRouter,
  storage: storageRouter,
  wallet: walletRouter,
  blog: blogRouter,
  contact: contactRouter,
});

export type AppRouter = typeof appRouter;
