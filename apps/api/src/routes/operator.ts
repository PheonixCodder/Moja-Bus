import { type Router as ExpressRouter, Router } from "express";
import { auth } from "../auth/auth.js";
import { getPrismaClient, Prisma } from "@moja/db";
import {
  saveOnboardingStepSchema,
  companyStepSchema,
  bankStepSchema,
  documentSchema,
} from "@moja/schemas";
import { AppError } from "../lib/errors.js";

const prisma = getPrismaClient();

// Middleware to protect routes using Better Auth and require OPERATOR/ADMIN role
async function requireOperatorSession(req: any, _res: any, next: any) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session || !session.session) {
      return next(new AppError(401, "Authentication is required."));
    }
    const role = session.user.role;
    if (role !== "OPERATOR" && role !== "ADMIN") {
      return next(
        new AppError(
          403,
          "You do not have permission to access this resource.",
        ),
      );
    }
    req.user = session.user;
    req.session = session.session;
    next();
  } catch (error) {
    next(error);
  }
}

export function createOperatorRouter(): ExpressRouter {
  const router = Router();

  // Get current onboarding snapshot
  router.get(
    "/operator/onboarding",
    requireOperatorSession,
    async (req: any, res, next) => {
      try {
        const operator = await prisma.operator.findFirst({
          where: { userId: req.user.id, deletedAt: null },
          orderBy: { joinedAt: "desc" },
          include: {
            company: {
              include: {
                locations: true,
                documents: true,
                bankAccount: true,
              },
            },
          },
        });

        if (!operator) {
          return res.json({
            onboardingStatus: "NOT_STARTED",
            onboardingCurrentStep: "company",
            operator: null,
          });
        }

        res.json({
          onboardingStatus: operator.onboardingStatus,
          onboardingCurrentStep: operator.onboardingCurrentStep,
          operator,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // Save specific onboarding step
  router.patch(
    "/operator/onboarding/step",
    requireOperatorSession,
    async (req: any, res, next) => {
      try {
        const bodyValidation = saveOnboardingStepSchema.safeParse(req.body);
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
          step,
          companyData,
          locationsData,
          documentsData,
          bankData,
          profileData,
          termsData,
        } = bodyValidation.data;

        // Find if operator profile already exists
        const existingOperator = await prisma.operator.findFirst({
          where: { userId: req.user.id, deletedAt: null },
          orderBy: { joinedAt: "desc" },
          include: { company: true },
        });

        let resultOperator: any = null;

        if (step === "company") {
          if (!companyData) {
            return next(
              new AppError(
                400,
                "Company data is required for the company step",
              ),
            );
          }

          if (existingOperator) {
            // Update existing company
            await prisma.company.update({
              where: { id: existingOperator.companyId },
              data: {
                name: companyData.name,
                slug: companyData.slug,
                email: companyData.email,
                phone: companyData.phone,
                website: companyData.website ?? null,
                description: companyData.description ?? null,
                businessType: companyData.businessType,
                registrationNumber: companyData.registrationNumber,
                taxId: companyData.taxId,
                yearEstablished: companyData.yearEstablished ?? null,
                estimatedStaffSize: companyData.estimatedStaffSize,
                logoUrl: companyData.logoUrl ?? null,
              },
            });

            // Update operator tracking status
            resultOperator = await prisma.operator.update({
              where: { id: existingOperator.id },
              data: {
                onboardingStatus: "IN_PROGRESS",
                onboardingCurrentStep: "locations",
                onboardingLastStepAt: new Date(),
              },
              include: { company: true },
            });
          } else {
            // Create company
            const company = await prisma.company.create({
              data: {
                name: companyData.name,
                slug: companyData.slug,
                email: companyData.email,
                phone: companyData.phone,
                website: companyData.website ?? null,
                description: companyData.description ?? null,
                businessType: companyData.businessType,
                registrationNumber: companyData.registrationNumber,
                taxId: companyData.taxId,
                yearEstablished: companyData.yearEstablished ?? null,
                estimatedStaffSize: companyData.estimatedStaffSize,
                logoUrl: companyData.logoUrl ?? null,
                status: "DRAFT",
              },
            });

            // Create operator profile
            resultOperator = await prisma.operator.create({
              data: {
                userId: req.user.id,
                companyId: company.id,
                onboardingStatus: "IN_PROGRESS",
                onboardingCurrentStep: "locations",
                onboardingStartedAt: new Date(),
                onboardingLastStepAt: new Date(),
              },
              include: { company: true },
            });

            // Update user work fields if necessary
            await prisma.user.update({
              where: { id: req.user.id },
              data: {
                workEmail: companyData.email,
                workPhone: companyData.phone,
              },
            });
          }
        } else {
          // All other steps require the operator and companyId to exist
          if (!existingOperator) {
            return next(
              new AppError(
                400,
                "Please complete the company profile step first",
              ),
            );
          }

          const companyId = existingOperator.companyId;
          const operatorId = existingOperator.id;

          if (step === "locations") {
            if (!locationsData) {
              return next(
                new AppError(
                  400,
                  "Locations data is required for the locations step",
                ),
              );
            }

            // Replace company locations
            await prisma.$transaction([
              prisma.companyLocation.deleteMany({
                where: { companyId },
              }),
              prisma.companyLocation.createMany({
                data: locationsData.locations.map((loc: any) => ({
                  companyId,
                  name: loc.name,
                  addressLine1: loc.addressLine1,
                  addressLine2: loc.addressLine2 ?? null,
                  city: loc.city,
                  cityId: loc.cityId ?? null,
                  state: loc.state ?? null,
                  postalCode: loc.postalCode ?? null,
                  country: loc.country,
                  latitude: loc.latitude ?? null,
                  longitude: loc.longitude ?? null,
                  phone: loc.phone,
                  managerName: loc.managerName ?? null,
                  managerPhone: loc.managerPhone ?? null,
                  managerEmail: loc.managerEmail ?? null,
                  isPrimary: loc.isPrimary,
                  isActive: loc.isActive,
                  operatingHours: loc.operatingHours
                    ? { hours: loc.operatingHours }
                    : Prisma.DbNull,
                })),
              }),
            ]);

            resultOperator = await prisma.operator.update({
              where: { id: operatorId },
              data: {
                onboardingCurrentStep: "documents",
                onboardingLastStepAt: new Date(),
              },
              include: { company: true },
            });
          } else if (step === "documents") {
            if (!documentsData) {
              return next(
                new AppError(
                  400,
                  "Documents data is required for the documents step",
                ),
              );
            }

            // Replace company documents
            await prisma.$transaction([
              prisma.companyDocument.deleteMany({
                where: { companyId },
              }),
              prisma.companyDocument.createMany({
                data: documentsData.documents.map((doc: any) => ({
                  companyId,
                  type: doc.type,
                  fileName: doc.fileName,
                  fileUrl: doc.fileUrl,
                  fileSize: doc.fileSize,
                  mimeType: doc.mimeType,
                  status: "PENDING",
                })),
              }),
            ]);

            resultOperator = await prisma.operator.update({
              where: { id: operatorId },
              data: {
                onboardingCurrentStep: "bank",
                onboardingLastStepAt: new Date(),
              },
              include: { company: true },
            });
          } else if (step === "bank") {
            if (!bankData) {
              return next(
                new AppError(400, "Bank data is required for the bank step"),
              );
            }

            // Upsert bank account details
            await prisma.bankAccount.upsert({
              where: { companyId },
              create: {
                companyId,
                bankName: bankData.bankName,
                accountNumber: bankData.accountNumber,
                accountName: bankData.accountName,
                branch: bankData.branch ?? null,
                swiftCode: bankData.swiftCode ?? null,
                iban: bankData.iban ?? null,
                isActive: true,
              },
              update: {
                bankName: bankData.bankName,
                accountNumber: bankData.accountNumber,
                accountName: bankData.accountName,
                branch: bankData.branch ?? null,
                swiftCode: bankData.swiftCode ?? null,
                iban: bankData.iban ?? null,
              },
            });

            resultOperator = await prisma.operator.update({
              where: { id: operatorId },
              data: {
                onboardingCurrentStep: "profile",
                onboardingLastStepAt: new Date(),
              },
              include: { company: true },
            });
          } else if (step === "profile") {
            if (!profileData) {
              return next(
                new AppError(
                  400,
                  "Profile data is required for the profile step",
                ),
              );
            }

            // Update user details
            await prisma.user.update({
              where: { id: req.user.id },
              data: {
                fullName: profileData.fullName,
              },
            });

            // Update operator profile details
            resultOperator = await prisma.operator.update({
              where: { id: operatorId },
              data: {
                personalPhone: profileData.personalPhone ?? null,
                role: profileData.role,
                dateOfBirth: profileData.dateOfBirth
                  ? new Date(profileData.dateOfBirth)
                  : null,
                nationalIdNumber: profileData.nationalIdNumber ?? null,
                nationalIdType: profileData.nationalIdType ?? null,
                jobTitle: profileData.jobTitle ?? null,
                profilePhotoUrl: profileData.profilePhotoUrl ?? null,
                emergencyContactName: profileData.emergencyContactName ?? null,
                emergencyContactPhone:
                  profileData.emergencyContactPhone ?? null,
                onboardingCurrentStep: "terms",
                onboardingLastStepAt: new Date(),
              },
              include: { company: true },
            });
          } else if (step === "terms") {
            if (!termsData) {
              return next(
                new AppError(400, "Terms acceptance data is required"),
              );
            }

            resultOperator = await prisma.operator.update({
              where: { id: operatorId },
              data: {
                onboardingLastStepAt: new Date(),
              },
              include: { company: true },
            });
          }
        }

        if (!resultOperator) {
          return next(
            new AppError(
              500,
              "Onboarding step save failed to produce a result",
            ),
          );
        }

        res.json({
          onboardingStatus: resultOperator.onboardingStatus,
          onboardingCurrentStep: resultOperator.onboardingCurrentStep,
          operator: resultOperator,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // Finalize onboarding
  router.post(
    "/operator/onboarding/complete",
    requireOperatorSession,
    async (req: any, res, next) => {
      try {
        const operator = await prisma.operator.findFirst({
          where: { userId: req.user.id, deletedAt: null },
          orderBy: { joinedAt: "desc" },
        });

        if (!operator) {
          return next(
            new AppError(
              400,
              "Operator profile not found. Complete onboarding steps first.",
            ),
          );
        }

        const companyId = operator.companyId;
        const operatorId = operator.id;

        // Finalize operator status and company status
        const updatedOperator = await prisma.operator.update({
          where: { id: operatorId },
          data: {
            onboardingStatus: "COMPLETED",
            onboardingCompletedAt: new Date(),
          },
          include: { company: true },
        });

        await prisma.company.update({
          where: { id: companyId },
          data: {
            status: "PENDING_VERIFICATION",
          },
        });

        res.json({
          onboardingStatus: updatedOperator.onboardingStatus,
          onboardingCurrentStep: updatedOperator.onboardingCurrentStep,
          operator: updatedOperator,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // Get operator settings
  router.get(
    "/operator/settings",
    requireOperatorSession,
    async (req: any, res, next) => {
      try {
        const operator = await prisma.operator.findFirst({
          where: { userId: req.user.id, deletedAt: null },
          orderBy: { joinedAt: "desc" },
          include: {
            company: {
              include: {
                bankAccount: true,
                documents: true,
              },
            },
          },
        });

        if (!operator) {
          return next(new AppError(404, "Operator profile not found."));
        }

        res.json({
          company: operator.company,
          operator,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // Update company profile
  router.patch(
    "/operator/settings/company",
    requireOperatorSession,
    async (req: any, res, next) => {
      try {
        const bodyValidation = companyStepSchema.safeParse(req.body);
        if (!bodyValidation.success) {
          return next(
            new AppError(
              400,
              "Validation failed",
              bodyValidation.error.flatten(),
            ),
          );
        }

        const operator = await prisma.operator.findFirst({
          where: { userId: req.user.id, deletedAt: null },
          orderBy: { joinedAt: "desc" },
        });

        if (!operator || !operator.companyId) {
          return next(new AppError(404, "Operator company not found."));
        }

        const updatedCompany = await prisma.company.update({
          where: { id: operator.companyId },
          data: bodyValidation.data,
        });

        res.json(updatedCompany);
      } catch (error) {
        next(error);
      }
    },
  );

  // Update bank details
  router.patch(
    "/operator/settings/bank",
    requireOperatorSession,
    async (req: any, res, next) => {
      try {
        const bodyValidation = bankStepSchema.safeParse(req.body);
        if (!bodyValidation.success) {
          return next(
            new AppError(
              400,
              "Validation failed",
              bodyValidation.error.flatten(),
            ),
          );
        }

        const operator = await prisma.operator.findFirst({
          where: { userId: req.user.id, deletedAt: null },
          orderBy: { joinedAt: "desc" },
        });

        if (!operator || !operator.companyId) {
          return next(new AppError(404, "Operator company not found."));
        }

        const updatedBank = await prisma.bankAccount.upsert({
          where: { companyId: operator.companyId },
          create: {
            ...bodyValidation.data,
            companyId: operator.companyId,
          },
          update: bodyValidation.data,
        });

        res.json(updatedBank);
      } catch (error) {
        next(error);
      }
    },
  );

  // Add document
  router.post(
    "/operator/settings/documents",
    requireOperatorSession,
    async (req: any, res, next) => {
      try {
        const bodyValidation = documentSchema.safeParse(req.body);
        if (!bodyValidation.success) {
          return next(
            new AppError(
              400,
              "Validation failed",
              bodyValidation.error.flatten(),
            ),
          );
        }

        const operator = await prisma.operator.findFirst({
          where: { userId: req.user.id, deletedAt: null },
          orderBy: { joinedAt: "desc" },
        });

        if (!operator || !operator.companyId) {
          return next(new AppError(404, "Operator company not found."));
        }

        const doc = await prisma.companyDocument.create({
          data: {
            ...bodyValidation.data,
            companyId: operator.companyId,
          },
        });

        res.json(doc);
      } catch (error) {
        next(error);
      }
    },
  );

  // Delete document
  router.delete(
    "/operator/settings/documents/:id",
    requireOperatorSession,
    async (req: any, res, next) => {
      try {
        const operator = await prisma.operator.findFirst({
          where: { userId: req.user.id, deletedAt: null },
          orderBy: { joinedAt: "desc" },
        });

        if (!operator || !operator.companyId) {
          return next(new AppError(404, "Operator company not found."));
        }

        const document = await prisma.companyDocument.findFirst({
          where: {
            id: req.params.id,
            companyId: operator.companyId,
          },
        });

        if (!document) {
          return next(new AppError(404, "Document not found."));
        }

        await prisma.companyDocument.delete({
          where: { id: document.id },
        });

        res.json({ success: true });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
