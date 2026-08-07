import {
  AdminPermissionListSchema,
  AdminStaffRoleSchema,
  AdminStaffStatusSchema,
} from "@moja/schemas";
import { z } from "zod";

export const ListAdminStaffSchema = z.object({
  search: z.string().max(100).optional(),
  role: AdminStaffRoleSchema.optional(),
  status: AdminStaffStatusSchema.optional(),
  page: z.number().int().min(1).max(1000).default(1),
  limit: z.number().int().min(1).max(100).default(50),
});

export type ListAdminStaffInput = z.infer<typeof ListAdminStaffSchema>;

export const GetAdminActivityLogSchema = z.object({
  limit: z.number().int().min(1).max(500).default(40),
  offset: z.number().int().min(0).default(0),
  action: z.string().optional(),
  userId: z.string().optional(),
});

export type GetAdminActivityLogInput = z.infer<
  typeof GetAdminActivityLogSchema
>;

export const UpdateAdminRoleSchema = z.object({
  memberId: z.string().min(1),
  role: AdminStaffRoleSchema.refine((role) => role !== "SUPER_ADMIN", {
    message: "Use transfer-ownership to assign SUPER_ADMIN",
  }),
  /** When true, replace member permissions with ADMIN_ROLE_TEMPLATES[role] */
  resetPermissions: z.boolean().default(true),
  reason: z.string().max(500).optional(),
});

export type UpdateAdminRoleInput = z.infer<typeof UpdateAdminRoleSchema>;

export const UpdateAdminPermissionsSchema = z.object({
  memberId: z.string().min(1),
  permissions: AdminPermissionListSchema,
  reason: z.string().max(500).optional(),
});

export type UpdateAdminPermissionsInput = z.infer<
  typeof UpdateAdminPermissionsSchema
>;

export const UpdateAdminStatusSchema = z.object({
  memberId: z.string().min(1),
  status: AdminStaffStatusSchema,
  reason: z.string().max(500).optional(),
});

export type UpdateAdminStatusInput = z.infer<typeof UpdateAdminStatusSchema>;

export const TransferAdminOwnershipSchema = z.object({
  memberId: z.string().min(1),
  otp: z.string().length(6, "Code must be exactly 6 digits"),
  confirmationText: z.string().min(1),
});

export type TransferAdminOwnershipInput = z.infer<
  typeof TransferAdminOwnershipSchema
>;

export const CreateAdminInvitationSchema = z.object({
  email: z.string().email("Please enter a valid email address").toLowerCase(),
  role: AdminStaffRoleSchema.refine((role) => role !== "SUPER_ADMIN", {
    message: "Cannot invite a new SUPER_ADMIN via invitation",
  }),
  permissions: AdminPermissionListSchema.min(
    1,
    "Select at least one permission",
  ),
  jobTitle: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  message: z.string().max(500).optional(),
  expiryDays: z.number().int().min(1).max(30).default(7),
});

export type CreateAdminInvitationInput = z.infer<
  typeof CreateAdminInvitationSchema
>;

export const AdminInvitationIdSchema = z.object({
  invitationId: z.string().min(1),
  reason: z.string().max(200).optional(),
});

export type AdminInvitationIdInput = z.infer<typeof AdminInvitationIdSchema>;

export const ResendAdminInvitationSchema = AdminInvitationIdSchema.extend({
  extendExpiry: z.boolean().default(true),
});

export type ResendAdminInvitationInput = z.infer<
  typeof ResendAdminInvitationSchema
>;

export const RemoveAdminStaffSchema = z.object({
  memberId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

export type RemoveAdminStaffInput = z.infer<typeof RemoveAdminStaffSchema>;

export { AdminStaffRoleSchema };
