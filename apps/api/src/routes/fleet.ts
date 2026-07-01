import { type Router as ExpressRouter, Router } from "express";
import { getPrismaClient } from "@moja/db";
import { createBusSchema, updateBusSchema } from "@moja/schemas";
import { AppError } from "../lib/errors.js";
import {
  requireOperatorSession,
  requireOperatorCompany,
} from "../middleware/operator-auth.js";

const prisma = getPrismaClient();

export function createFleetRouter(): ExpressRouter {
  const router = Router();

  // Get all standard bus types (seeded platform data)
  router.get(
    "/fleet/bus-types",
    requireOperatorSession,
    async (req, res, next) => {
      try {
        const busTypes = await prisma.busType.findMany({
          where: { isActive: true },
          orderBy: { name: "asc" },
        });
        res.json(busTypes);
      } catch (error) {
        next(error);
      }
    },
  );

  // Get layout templates (platform defaults + operator custom layouts)
  router.get(
    "/fleet/layouts",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const layouts = await prisma.seatLayoutTemplate.findMany({
          where: {
            OR: [{ companyId: null }, { companyId: req.companyId }],
          },
          include: {
            busType: true,
            seatTemplates: true,
          },
          orderBy: { name: "asc" },
        });
        res.json(layouts);
      } catch (error) {
        next(error);
      }
    },
  );

  // Get operator's buses
  router.get(
    "/fleet/buses",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const buses = await prisma.bus.findMany({
          where: { companyId: req.companyId },
          include: {
            busType: true,
            layoutTemplate: true,
            _count: {
              select: { seats: true },
            },
          },
          orderBy: { registrationPlate: "asc" },
        });
        res.json(buses);
      } catch (error) {
        next(error);
      }
    },
  );

  // Get details of a single bus including seat layout mapping
  router.get(
    "/fleet/buses/:id",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const bus = await prisma.bus.findUnique({
          where: {
            id: req.params.id,
            companyId: req.companyId,
          },
          include: {
            busType: true,
            layoutTemplate: true,
            seats: {
              orderBy: [{ deck: "asc" }, { row: "asc" }, { col: "asc" }],
            },
          },
        });

        if (!bus) {
          return next(new AppError(404, "Bus not found"));
        }

        res.json(bus);
      } catch (error) {
        next(error);
      }
    },
  );

  // Create a new bus and auto-generate seat layout from the layout template
  router.post(
    "/fleet/buses",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const bodyValidation = createBusSchema.safeParse(req.body);
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
          registrationPlate,
          internalName,
          manufactureYear,
          status,
          notes,
          layoutTemplateId,
          busTypeId,
        } = bodyValidation.data;

        // Ensure template exists and is accessible
        const template = await prisma.seatLayoutTemplate.findUnique({
          where: { id: layoutTemplateId },
          include: { seatTemplates: true },
        });

        if (
          !template ||
          (template.companyId !== null && template.companyId !== req.companyId)
        ) {
          return next(
            new AppError(400, "Seat layout template not found or inaccessible"),
          );
        }

        // Ensure bus plate is unique
        const existingBus = await prisma.bus.findUnique({
          where: { registrationPlate },
        });
        if (existingBus) {
          return next(
            new AppError(
              400,
              "A vehicle with this registration plate already exists",
            ),
          );
        }

        // Create bus and map seats in a transaction
        const newBus = await prisma.$transaction(async (tx) => {
          const bus = await tx.bus.create({
            data: {
              companyId: req.companyId,
              busTypeId,
              layoutTemplateId,
              registrationPlate,
              internalName: internalName ?? null,
              manufactureYear: manufactureYear ?? null,
              status: status as any,
              notes: notes ?? null,
            },
          });

          // Insert seats mapping copied from template
          const seatsData = template.seatTemplates.map((st) => ({
            busId: bus.id,
            row: st.row,
            col: st.col,
            deck: st.deck,
            label: st.label,
            seatType: st.seatType,
            isActive: st.isBookable,
          }));

          await tx.seat.createMany({
            data: seatsData,
          });

          return tx.bus.findUnique({
            where: { id: bus.id },
            include: {
              seats: true,
            },
          });
        });

        res.status(201).json(newBus);
      } catch (error) {
        next(error);
      }
    },
  );

  // Update a bus details (plate, year, status, notes)
  router.patch(
    "/fleet/buses/:id",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const bodyValidation = updateBusSchema.safeParse(req.body);
        if (!bodyValidation.success) {
          return next(
            new AppError(
              400,
              "Validation failed",
              bodyValidation.error.flatten(),
            ),
          );
        }

        const existingBus = await prisma.bus.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId,
          },
        });

        if (!existingBus) {
          return next(new AppError(404, "Bus not found"));
        }

        // If plate is updating, verify uniqueness
        if (
          bodyValidation.data.registrationPlate &&
          bodyValidation.data.registrationPlate !==
            existingBus.registrationPlate
        ) {
          const plateConflict = await prisma.bus.findUnique({
            where: { registrationPlate: bodyValidation.data.registrationPlate },
          });
          if (plateConflict) {
            return next(
              new AppError(
                400,
                "A vehicle with this registration plate already exists",
              ),
            );
          }
        }

        const updateData: any = {};
        if (bodyValidation.data.registrationPlate !== undefined)
          updateData.registrationPlate = bodyValidation.data.registrationPlate;
        if (bodyValidation.data.internalName !== undefined)
          updateData.internalName = bodyValidation.data.internalName;
        if (bodyValidation.data.manufactureYear !== undefined)
          updateData.manufactureYear = bodyValidation.data.manufactureYear;
        if (bodyValidation.data.status !== undefined)
          updateData.status = bodyValidation.data.status as any;
        if (bodyValidation.data.notes !== undefined)
          updateData.notes = bodyValidation.data.notes;

        const updatedBus = await prisma.bus.update({
          where: { id: req.params.id },
          data: updateData,
          include: {
            busType: true,
            layoutTemplate: true,
          },
        });

        res.json(updatedBus);
      } catch (error) {
        next(error);
      }
    },
  );

  // Delete a bus
  router.delete(
    "/fleet/buses/:id",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const bus = await prisma.bus.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId,
          },
        });

        if (!bus) {
          return next(new AppError(404, "Bus not found"));
        }

        // Check if bus is assigned to any active Trips
        const activeTripsCount = await prisma.trip.count({
          where: {
            busId: bus.id,
            status: { in: ["SCHEDULED", "BOARDING", "DEPARTED"] },
          },
        });

        if (activeTripsCount > 0) {
          return next(
            new AppError(
              400,
              "Cannot delete bus. It is currently assigned to active upcoming trips.",
            ),
          );
        }

        // Delete bus (Cascade handles Seats)
        await prisma.bus.delete({
          where: { id: bus.id },
        });

        res.json({ success: true, message: "Bus deleted successfully" });
      } catch (error) {
        next(error);
      }
    },
  );

  // Toggle seat active/inactive status (e.g. if a seat is damaged or driver block)
  router.patch(
    "/fleet/buses/:busId/seats/:seatId",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const { isActive } = req.body;
        if (typeof isActive !== "boolean") {
          return next(new AppError(400, "isActive must be a boolean"));
        }

        // Ensure bus belongs to operator
        const bus = await prisma.bus.findFirst({
          where: {
            id: req.params.busId,
            companyId: req.companyId,
          },
        });

        if (!bus) {
          return next(new AppError(404, "Bus not found"));
        }

        // Update seat
        const seat = await prisma.seat.update({
          where: {
            id: req.params.seatId,
            busId: bus.id,
          },
          data: { isActive },
        });

        res.json(seat);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
