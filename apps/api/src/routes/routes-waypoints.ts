import { type Router as ExpressRouter, Router } from "express";
import { getPrismaClient } from "@moja/db";
import {
  createRouteSchema,
  updateRouteSchema,
  createTerminalSchema,
  updateTerminalSchema,
} from "@moja/schemas";
import { AppError } from "../lib/errors.js";
import {
  requireOperatorSession,
  requireOperatorCompany,
} from "../middleware/operator-auth.js";

const prisma = getPrismaClient();

export function createRoutesRouter(): ExpressRouter {
  const router = Router();

  // Get canonical cities list
  router.get(
    "/routes/cities",
    requireOperatorSession,
    async (req, res, next) => {
      try {
        const cities = await prisma.city.findMany({
          where: { isActive: true },
          orderBy: { name: "asc" },
        });
        res.json(cities);
      } catch (error) {
        next(error);
      }
    },
  );

  // Get operator's passenger terminals
  router.get(
    "/routes/terminals",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const terminals = await prisma.companyLocation.findMany({
          where: {
            companyId: req.companyId,
            isTerminal: true,
            isActive: true,
          },
          include: {
            cityRelation: true,
          },
          orderBy: { name: "asc" },
        });
        res.json(terminals);
      } catch (error) {
        next(error);
      }
    },
  );

  // Get operator's routes list
  router.get(
    "/routes",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const routes = await prisma.route.findMany({
          where: { companyId: req.companyId },
          include: {
            originTerminal: {
              include: { cityRelation: true },
            },
            destTerminal: {
              include: { cityRelation: true },
            },
            _count: {
              select: { waypoints: true },
            },
          },
          orderBy: { name: "asc" },
        });
        res.json(routes);
      } catch (error) {
        next(error);
      }
    },
  );

  // Get details of a single route including intermediate waypoints
  router.get(
    "/routes/:id",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const route = await prisma.route.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId,
          },
          include: {
            originTerminal: { include: { cityRelation: true } },
            destTerminal: { include: { cityRelation: true } },
            waypoints: {
              include: {
                terminal: { include: { cityRelation: true } },
              },
              orderBy: { stopOrder: "asc" },
            },
          },
        });

        if (!route) {
          return next(new AppError(404, "Route not found"));
        }

        res.json(route);
      } catch (error) {
        next(error);
      }
    },
  );

  // Create a new route with ordered waypoints (stops)
  router.post(
    "/routes",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const bodyValidation = createRouteSchema.safeParse(req.body);
        if (!bodyValidation.success) {
          return next(
            new AppError(
              400,
              "Validation failed",
              bodyValidation.error.flatten(),
            ),
          );
        }

        const {
          name,
          originTerminalId,
          destTerminalId,
          distanceKm,
          estimatedDurationMin,
          status,
          waypoints,
        } = bodyValidation.data;

        // Validate terminal ownership
        const terminals = await prisma.companyLocation.findMany({
          where: {
            id: {
              in: [
                originTerminalId,
                destTerminalId,
                ...waypoints.map((w: any) => w.terminalId),
              ],
            },
            companyId: req.companyId,
            isTerminal: true,
          },
        });

        const requiredTerminalsCount = new Set([
          originTerminalId,
          destTerminalId,
          ...waypoints.map((w: any) => w.terminalId),
        ]).size;
        if (terminals.length !== requiredTerminalsCount) {
          return next(
            new AppError(
              400,
              "One or more selected terminals are invalid or do not belong to your company.",
            ),
          );
        }

        // Estimate total duration from last waypoint if not explicitly provided
        const lastWaypointOffset =
          waypoints.length > 0
            ? Math.max(...waypoints.map((w: any) => w.offsetMinutes))
            : 0;
        const totalDuration =
          estimatedDurationMin ??
          (lastWaypointOffset > 0 ? lastWaypointOffset + 60 : null);

        // Create Route and Waypoints in a transaction
        const newRoute = await prisma.$transaction(async (tx) => {
          const route = await tx.route.create({
            data: {
              companyId: req.companyId,
              name,
              originTerminalId,
              destTerminalId,
              distanceKm: distanceKm ?? null,
              estimatedMinutes: totalDuration,
              status: status as any,
            },
          });

          // Build waypoints: origin (stopOrder=0) + intermediates + destination (stopOrder=N)
          const waypointsData = [
            {
              routeId: route.id,
              terminalId: originTerminalId,
              stopOrder: 0,
              arrivalOffsetMinutes: 0,
              departureOffsetMinutes: 0,
              distanceFromOriginKm: 0,
              isPickup: true,
              isDropoff: false,
            },
            ...waypoints.map((w: any) => ({
              routeId: route.id,
              terminalId: w.terminalId,
              stopOrder: w.stopOrder,
              arrivalOffsetMinutes: w.offsetMinutes,
              departureOffsetMinutes: w.offsetMinutes,
              distanceFromOriginKm: w.distanceFromOriginKm ?? null,
              isPickup: w.allowPickup,
              isDropoff: w.allowDropoff,
            })),
            // Destination stop is last
            {
              routeId: route.id,
              terminalId: destTerminalId,
              stopOrder: waypoints.length + 1,
              arrivalOffsetMinutes: totalDuration ?? 0,
              departureOffsetMinutes: totalDuration ?? 0,
              distanceFromOriginKm: distanceKm ?? null,
              isPickup: false,
              isDropoff: true,
            },
          ];

          await tx.routeWaypoint.createMany({
            data: waypointsData,
          });

          return tx.route.findUnique({
            where: { id: route.id },
            include: {
              originTerminal: { include: { cityRelation: true } },
              destTerminal: { include: { cityRelation: true } },
              waypoints: {
                orderBy: { stopOrder: "asc" },
              },
            },
          });
        });

        res.status(201).json(newRoute);
      } catch (error) {
        next(error);
      }
    },
  );

  // Update a route and replace waypoints
  router.patch(
    "/routes/:id",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const bodyValidation = updateRouteSchema.safeParse(req.body);
        if (!bodyValidation.success) {
          return next(
            new AppError(
              400,
              "Validation failed",
              bodyValidation.error.flatten(),
            ),
          );
        }

        const existingRoute = await prisma.route.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId,
          },
        });

        if (!existingRoute) {
          return next(new AppError(404, "Route not found"));
        }

        // If updating status/name only
        const {
          name,
          originTerminalId,
          destTerminalId,
          distanceKm,
          estimatedDurationMin,
          status,
          waypoints,
        } = bodyValidation.data;

        const updatedRoute = await prisma.$transaction(async (tx) => {
          const route = await tx.route.update({
            where: { id: req.params.id },
            data: {
              name: name ?? existingRoute.name,
              originTerminalId:
                originTerminalId ?? existingRoute.originTerminalId,
              destTerminalId: destTerminalId ?? existingRoute.destTerminalId,
              distanceKm:
                distanceKm !== undefined
                  ? distanceKm
                  : existingRoute.distanceKm,
              estimatedMinutes:
                estimatedDurationMin !== undefined
                  ? (estimatedDurationMin ?? null)
                  : existingRoute.estimatedMinutes,
              status: (status as any) ?? existingRoute.status,
            },
          });

          // If waypoints are provided, replace them
          if (waypoints) {
            await tx.routeWaypoint.deleteMany({
              where: { routeId: route.id },
            });

            // Insert new waypoints
            const waypointsData = [
              {
                routeId: route.id,
                terminalId: route.originTerminalId,
                stopOrder: 0,
                arrivalOffsetMinutes: 0,
                departureOffsetMinutes: 0,
                distanceFromOriginKm: 0,
                isPickup: true,
                isDropoff: false,
              },
              ...waypoints.map((w: any) => ({
                routeId: route.id,
                terminalId: w.terminalId,
                stopOrder: w.stopOrder,
                arrivalOffsetMinutes: w.offsetMinutes,
                departureOffsetMinutes: w.offsetMinutes,
                distanceFromOriginKm: w.distanceFromOriginKm ?? null,
                isPickup: w.allowPickup,
                isDropoff: w.allowDropoff,
              })),
              {
                routeId: route.id,
                terminalId: route.destTerminalId,
                stopOrder: waypoints.length + 1,
                arrivalOffsetMinutes: route.estimatedMinutes ?? 0,
                departureOffsetMinutes: route.estimatedMinutes ?? 0,
                distanceFromOriginKm: route.distanceKm ?? null,
                isPickup: false,
                isDropoff: true,
              },
            ];

            await tx.routeWaypoint.createMany({
              data: waypointsData,
            });
          }

          return tx.route.findUnique({
            where: { id: route.id },
            include: {
              waypoints: {
                orderBy: { stopOrder: "asc" },
              },
            },
          });
        });

        res.json(updatedRoute);
      } catch (error) {
        next(error);
      }
    },
  );

  // Delete a route
  router.delete(
    "/routes/:id",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const route = await prisma.route.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId,
          },
        });

        if (!route) {
          return next(new AppError(404, "Route not found"));
        }

        // Check if route is linked to active Schedules
        const activeSchedulesCount = await prisma.schedule.count({
          where: {
            routeId: route.id,
            isActive: true,
          },
        });

        if (activeSchedulesCount > 0) {
          return next(
            new AppError(
              400,
              "Cannot delete route. It is currently linked to active operating schedules.",
            ),
          );
        }

        await prisma.route.delete({
          where: { id: route.id },
        });

        res.json({ success: true, message: "Route deleted successfully" });
      } catch (error) {
        next(error);
      }
    },
  );

  // Get all operator's depots and terminals
  router.get(
    "/terminals",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const locations = await prisma.companyLocation.findMany({
          where: {
            companyId: req.companyId,
          },
          include: {
            cityRelation: true,
          },
          orderBy: { name: "asc" },
        });
        res.json(locations);
      } catch (error) {
        next(error);
      }
    },
  );

  // Create a new location/terminal
  router.post(
    "/terminals",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const bodyValidation = createTerminalSchema.safeParse(req.body);
        if (!bodyValidation.success) {
          return next(
            new AppError(
              400,
              "Validation failed",
              bodyValidation.error.flatten(),
            ),
          );
        }

        const data = bodyValidation.data;

        // Handle isPrimary constraint: if setting as primary, demote other locations
        if (data.isPrimary === true) {
          await prisma.companyLocation.updateMany({
            where: { companyId: req.companyId, isPrimary: true },
            data: { isPrimary: false },
          });
        }

        const newLocation = await prisma.companyLocation.create({
          data: {
            companyId: req.companyId,
            name: data.name,
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2 ?? null,
            city: data.city ?? null,
            state: data.state ?? null,
            postalCode: data.postalCode ?? null,
            country: data.country,
            cityId: data.cityId ?? null,
            latitude: data.latitude ?? null,
            longitude: data.longitude ?? null,
            phone: data.phone,
            managerName: data.managerName ?? null,
            managerPhone: data.managerPhone ?? null,
            managerEmail: data.managerEmail ?? null,
            isPrimary: data.isPrimary,
            isTerminal: data.isTerminal,
            isActive: data.isActive,
          },
          include: {
            cityRelation: true,
          },
        });

        res.status(201).json(newLocation);
      } catch (error) {
        next(error);
      }
    },
  );

  // Update a location/terminal
  router.patch(
    "/terminals/:id",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const bodyValidation = updateTerminalSchema.safeParse(req.body);
        if (!bodyValidation.success) {
          return next(
            new AppError(
              400,
              "Validation failed",
              bodyValidation.error.flatten(),
            ),
          );
        }

        const existingLocation = await prisma.companyLocation.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId,
          },
        });

        if (!existingLocation) {
          return next(new AppError(404, "Location not found"));
        }

        const data = bodyValidation.data;

        // Handle toggling isPrimary
        if (data.isPrimary === true && !existingLocation.isPrimary) {
          // Remove primary from other locations of this company
          await prisma.companyLocation.updateMany({
            where: { companyId: req.companyId, isPrimary: true },
            data: { isPrimary: false },
          });
        }

        const updatedLocation = await prisma.companyLocation.update({
          where: { id: req.params.id },
          data: {
            ...(data.name !== undefined ? { name: data.name } : {}),
            ...(data.addressLine1 !== undefined
              ? { addressLine1: data.addressLine1 }
              : {}),
            ...(data.addressLine2 !== undefined
              ? { addressLine2: data.addressLine2 }
              : {}),
            ...(data.city !== undefined ? { city: data.city } : {}),
            ...(data.state !== undefined ? { state: data.state } : {}),
            ...(data.postalCode !== undefined
              ? { postalCode: data.postalCode }
              : {}),
            ...(data.country !== undefined ? { country: data.country } : {}),
            ...(data.cityId !== undefined ? { cityId: data.cityId } : {}),
            ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
            ...(data.longitude !== undefined
              ? { longitude: data.longitude }
              : {}),
            ...(data.phone !== undefined ? { phone: data.phone } : {}),
            ...(data.managerName !== undefined
              ? { managerName: data.managerName }
              : {}),
            ...(data.managerPhone !== undefined
              ? { managerPhone: data.managerPhone }
              : {}),
            ...(data.managerEmail !== undefined
              ? { managerEmail: data.managerEmail }
              : {}),
            ...(data.isPrimary !== undefined
              ? { isPrimary: data.isPrimary }
              : {}),
            ...(data.isTerminal !== undefined
              ? { isTerminal: data.isTerminal }
              : {}),
            ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
          },
          include: {
            cityRelation: true,
          },
        });

        res.json(updatedLocation);
      } catch (error) {
        next(error);
      }
    },
  );

  // Delete a location/terminal
  router.delete(
    "/terminals/:id",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const existingLocation = await prisma.companyLocation.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId,
          },
        });

        if (!existingLocation) {
          return next(new AppError(404, "Location not found"));
        }

        // Check if linked to any Route as origin, destination or waypoint
        const linkedRoutesCount = await prisma.route.count({
          where: {
            OR: [
              { originTerminalId: req.params.id },
              { destTerminalId: req.params.id },
              { waypoints: { some: { terminalId: req.params.id } } },
            ],
          },
        });

        if (linkedRoutesCount > 0) {
          return next(
            new AppError(
              400,
              "Cannot delete location. It is currently linked to one or more routes.",
            ),
          );
        }

        // Check if linked to any TripStop
        const linkedTripsCount = await prisma.tripStop.count({
          where: {
            terminalId: req.params.id,
          },
        });

        if (linkedTripsCount > 0) {
          return next(
            new AppError(
              400,
              "Cannot delete location. It is currently linked to one or more active trips.",
            ),
          );
        }

        await prisma.companyLocation.delete({
          where: { id: req.params.id },
        });

        res.json({ success: true, message: "Location deleted successfully" });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
