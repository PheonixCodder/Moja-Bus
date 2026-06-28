import type { PrismaClient } from "@moja/db";
import { randomUUID } from "node:crypto";

import type {
  AuthRepository,
  CreateRefreshTokenInput,
  CreateUserInput,
  StoredRefreshToken,
  StoredUser,
} from "./auth.types.js";

function toStoredUser(user: {
  id: string;
  fullName: string;
  phone: string | null;
  role: string;
  passwordHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}): StoredUser {
  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone ?? "",
    role: user.role as StoredUser["role"],
    passwordHash: user.passwordHash ?? "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toStoredRefreshToken(token: {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}): StoredRefreshToken {
  return {
    id: token.id,
    userId: token.userId,
    tokenHash: token.tokenHash,
    expiresAt: token.expiresAt,
    revokedAt: token.revokedAt,
    createdAt: token.createdAt,
  };
}

export function createPrismaAuthRepository(
  prisma: PrismaClient,
): AuthRepository {
  return {
    async findUserByPhone(phone) {
      const user = await prisma.user.findUnique({ where: { phone } });
      return user ? toStoredUser(user) : null;
    },
    async findUserById(userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      return user ? toStoredUser(user) : null;
    },
    async createUser(input: CreateUserInput) {
      const user = await prisma.user.create({
        data: {
          id: randomUUID(),
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          role: input.role,
          passwordHash: input.passwordHash,
        },
      });
      return toStoredUser(user);
    },
    async createRefreshToken(input: CreateRefreshTokenInput) {
      const token = await prisma.refreshToken.create({
        data: {
          userId: input.userId,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
        },
      });
      return toStoredRefreshToken(token);
    },
    async findRefreshTokenByHash(tokenHash) {
      const token = await prisma.refreshToken.findUnique({
        where: { tokenHash },
      });
      return token ? toStoredRefreshToken(token) : null;
    },
    async revokeRefreshTokenByHash(tokenHash) {
      await prisma.refreshToken.updateMany({
        where: {
          tokenHash,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    },
    async revokeRefreshTokensForUser(userId) {
      await prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    },
  };
}
