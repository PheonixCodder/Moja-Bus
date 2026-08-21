import { createTRPCRouter } from "../init";
import { adminRouter } from "./admin";
import { adminStaffRouter } from "./admin-staff";
import { blogRouter } from "./blog";
import { bookingRouter } from "./booking";
import { capturesRouter } from "./captures";
import { contactRouter } from "./contact";
import { discountsRouter } from "./discounts";
import { discountsAdminRouter } from "./discounts-admin";
import { discountsOperatorRouter } from "./discounts-operator";
import { driversRouter } from "./drivers";
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
  drivers: driversRouter,
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
  adminStaff: adminStaffRouter,
  storage: storageRouter,
  wallet: walletRouter,
  blog: blogRouter,
  contact: contactRouter,
  discounts: discountsRouter,
  discountsAdmin: discountsAdminRouter,
  discountsOperator: discountsOperatorRouter,
});

export type AppRouter = typeof appRouter;
