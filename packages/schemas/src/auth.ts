import { z } from "zod";

export const userRoleValues = ["TRAVELER", "OPERATOR", "ADMIN"] as const;

export const userRoleSchema = z.enum(userRoleValues);
export type UserRole = z.infer<typeof userRoleSchema>;

export const registerRoleValues = ["TRAVELER", "OPERATOR"] as const;

export const registerRoleSchema = z.enum(registerRoleValues);
export type RegisterRole = z.infer<typeof registerRoleSchema>;

export const loginInputSchema = z.object({
  phone: z.string().min(6).max(32),
  password: z.string().min(8).max(128),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const registerInputSchema = loginInputSchema.extend({
  fullName: z.string().min(1).max(100),
  role: registerRoleSchema,
});
export type RegisterInput = z.infer<typeof registerInputSchema>;

export const refreshInputSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof refreshInputSchema>;

export const authUserSchema = z.object({
  id: z.string().min(1),
  phone: z.string().min(1),
  fullName: z.string().min(1),
  role: userRoleSchema,
  createdAt: z.string().min(1),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const authSessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  userId: z.string().min(1),
  role: userRoleSchema,
  expiresInSeconds: z.number().int().positive(),
});
export type AuthSession = z.infer<typeof authSessionSchema>;

export const authResponseSchema = z.object({
  user: authUserSchema,
  session: authSessionSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;
