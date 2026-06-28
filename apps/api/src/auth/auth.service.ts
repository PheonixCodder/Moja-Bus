import type {
  AuthResponse,
  AuthSession,
  AuthUser,
  LoginInput,
  RefreshInput,
  RegisterInput,
} from "@moja/schemas/auth";
import { compare, hash } from "bcryptjs";

import { AppError } from "../lib/errors.js";
import {
  hashToken,
  issueAccessToken,
  issueRefreshToken,
  type TokenDurations,
  type TokenSecrets,
  verifyAccessToken as verifyJwtAccessToken,
  verifyRefreshToken,
} from "../lib/tokens.js";
import type {
  AuthPrincipal,
  AuthRepository,
  StoredUser,
} from "./auth.types.js";

export interface AuthServiceDependencies {
  repository: AuthRepository;
  secrets: TokenSecrets;
  durations: TokenDurations;
  passwordSaltRounds?: number;
}

export interface AuthService {
  register(input: RegisterInput): Promise<AuthResponse>;
  login(input: LoginInput): Promise<AuthResponse>;
  refresh(input: RefreshInput): Promise<AuthResponse>;
  verifyAccessToken(token: string): AuthPrincipal;
}

function toAuthUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    phone: user.phone,
    fullName: user.fullName,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

function buildSession(
  user: StoredUser,
  secrets: TokenSecrets,
  durations: TokenDurations,
): AuthSession {
  const accessToken = issueAccessToken(
    { userId: user.id, role: user.role },
    secrets,
    durations,
  );
  const refreshToken = issueRefreshToken(
    { userId: user.id, role: user.role },
    secrets,
    durations,
  );

  return {
    accessToken,
    refreshToken,
    userId: user.id,
    role: user.role,
    expiresInSeconds: durations.accessTokenTtlSeconds,
  };
}

async function persistRefreshToken(
  repository: AuthRepository,
  userId: string,
  refreshToken: string,
  durations: TokenDurations,
) {
  const expiresAt = new Date(
    Date.now() + durations.refreshTokenTtlSeconds * 1000,
  );
  await repository.createRefreshToken({
    userId,
    tokenHash: hashToken(refreshToken),
    expiresAt,
  });
}

export function createAuthService(
  dependencies: AuthServiceDependencies,
): AuthService {
  const saltRounds = dependencies.passwordSaltRounds ?? 12;

  return {
    async register(input) {
      const fullName = input.fullName.trim();
      const email = `${input.phone}@traveler.local`;
      const existingUser = await dependencies.repository.findUserByPhone(
        input.phone,
      );

      if (existingUser) {
        throw new AppError(
          409,
          "A user with that phone number already exists.",
        );
      }

      const passwordHash = await hash(input.password, saltRounds);
      const user = await dependencies.repository.createUser({
        fullName,
        email,
        phone: input.phone,
        role: input.role,
        passwordHash,
      });

      const session = buildSession(
        user,
        dependencies.secrets,
        dependencies.durations,
      );
      await persistRefreshToken(
        dependencies.repository,
        user.id,
        session.refreshToken,
        dependencies.durations,
      );

      return {
        user: toAuthUser(user),
        session,
      };
    },
    async login(input) {
      const user = await dependencies.repository.findUserByPhone(input.phone);

      if (!user) {
        throw new AppError(401, "Invalid phone number or password.");
      }

      if (!user.passwordHash) {
        throw new AppError(401, "Invalid phone number or password.");
      }

      const passwordMatches = await compare(input.password, user.passwordHash);
      if (!passwordMatches) {
        throw new AppError(401, "Invalid phone number or password.");
      }

      const session = buildSession(
        user,
        dependencies.secrets,
        dependencies.durations,
      );
      await persistRefreshToken(
        dependencies.repository,
        user.id,
        session.refreshToken,
        dependencies.durations,
      );

      return {
        user: toAuthUser(user),
        session,
      };
    },
    async refresh(input) {
      let claims: ReturnType<typeof verifyRefreshToken>;
      try {
        claims = verifyRefreshToken(
          input.refreshToken,
          dependencies.secrets.refreshTokenSecret,
        );
      } catch {
        throw new AppError(401, "Invalid refresh token.");
      }

      const tokenHash = hashToken(input.refreshToken);
      const tokenRecord =
        await dependencies.repository.findRefreshTokenByHash(tokenHash);

      if (
        !tokenRecord ||
        tokenRecord.revokedAt !== null ||
        tokenRecord.expiresAt.getTime() <= Date.now()
      ) {
        throw new AppError(401, "Refresh token has expired or was revoked.");
      }

      const user = await dependencies.repository.findUserById(claims.userId);
      if (!user) {
        throw new AppError(401, "Refresh token is not bound to a valid user.");
      }

      await dependencies.repository.revokeRefreshTokenByHash(tokenHash);

      const session = buildSession(
        user,
        dependencies.secrets,
        dependencies.durations,
      );
      await persistRefreshToken(
        dependencies.repository,
        user.id,
        session.refreshToken,
        dependencies.durations,
      );

      return {
        user: toAuthUser(user),
        session,
      };
    },
    verifyAccessToken(token: string) {
      return verifyJwtAccessToken(
        token,
        dependencies.secrets.accessTokenSecret,
      );
    },
  };
}
