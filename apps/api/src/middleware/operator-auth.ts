import { auth } from "../auth/auth.js";
import { getPrismaClient } from "@moja/db";
import { AppError } from "../lib/errors.js";

const prisma = getPrismaClient();

export async function requireOperatorSession(req: any, _res: any, next: any) {
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

export async function requireOperatorCompany(req: any, _res: any, next: any) {
  try {
    const operator = await prisma.operator.findFirst({
      where: { userId: req.user.id },
    });
    if (!operator) {
      return next(
        new AppError(
          400,
          "Operator profile not found. Please complete company onboarding first.",
        ),
      );
    }
    req.companyId = operator.companyId;
    req.operatorId = operator.id;
    next();
  } catch (error) {
    next(error);
  }
}
