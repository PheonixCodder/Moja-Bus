import type { RegisterRole, UserRole } from "@moja/schemas/auth";

export interface StoredUser {
  id: string;
  phone: string;
  fullName: string;
  role: UserRole;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredRefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  phone: string;
  role: RegisterRole;
  passwordHash: string;
}

export interface CreateRefreshTokenInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface AuthRepository {
  findUserByPhone(phone: string): Promise<StoredUser | null>;
  findUserById(userId: string): Promise<StoredUser | null>;
  createUser(input: CreateUserInput): Promise<StoredUser>;
  createRefreshToken(
    input: CreateRefreshTokenInput,
  ): Promise<StoredRefreshToken>;
  findRefreshTokenByHash(tokenHash: string): Promise<StoredRefreshToken | null>;
  revokeRefreshTokenByHash(tokenHash: string): Promise<void>;
  revokeRefreshTokensForUser(userId: string): Promise<void>;
}

export interface AuthPrincipal {
  userId: string;
  role: UserRole;
}
