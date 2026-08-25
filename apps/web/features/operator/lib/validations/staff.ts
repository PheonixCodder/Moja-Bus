import {
  InvitableStaffRoleSchema,
  PermissionListSchema,
  StaffRoleSchema,
} from "@moja/schemas";
import { z } from "zod";

export const OperatorStatusEnum = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]);

export const ListStaffSchema = z.object({
  search: z.string().max(100).optional(),
  role: StaffRoleSchema.optional(),
  status: OperatorStatusEnum.optional(),
  page: z.number().int().min(1).max(1000).default(1),
  limit: z.number().int().min(1).max(100).default(50),
});

export type ListStaffInput = z.infer<typeof ListStaffSchema>;

export const GetActivityLogSchema = z.object({
  limit: z.number().int().min(1).max(500).default(40),
  offset: z.number().int().min(0).default(0),
  action: z.string().optional(),
  userId: z.string().optional(),
});

export type GetActivityLogInput = z.infer<typeof GetActivityLogSchema>;

export const UpdateRoleSchema = z.object({
  memberId: z.string().min(1),
  // Phase 14 (F-DV-08) — INVITABLE set excludes DRIVER *and* OWNER server-side:
  // role changes never mint ERP seats for drivers, and ownership moves through
  // the explicit transfer-ownership flow instead.
  role: InvitableStaffRoleSchema,
  /** When true, replace member permissions with ROLE_TEMPLATES[role] */
  resetPermissions: z.boolean().default(true),
  reason: z.string().max(500).optional(),
});

export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;

export const UpdatePermissionsSchema = z.object({
  memberId: z.string().min(1),
  permissions: PermissionListSchema,
  reason: z.string().max(500).optional(),
});

export type UpdatePermissionsInput = z.infer<typeof UpdatePermissionsSchema>;

export const UpdateStatusSchema = z.object({
  memberId: z.string().min(1),
  status: OperatorStatusEnum,
  reason: z.string().max(500).optional(),
});

export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;

export const TransferOwnershipSchema = z.object({
  memberId: z.string().min(1),
  otp: z.string().length(6, "Code must be exactly 6 digits"),
  confirmationText: z.string().min(1),
});

export type TransferOwnershipInput = z.infer<typeof TransferOwnershipSchema>;

export const CreateInvitationSchema = z.object({
  email: z.string().email("Please enter a valid email address").toLowerCase(),
  // Phase 14 (F-DV-08) — DRIVER cannot be invited as ERP staff; OWNER moves
  // only through transfer-ownership. The INVITABLE enum blocks both.
  role: InvitableStaffRoleSchema,
  permissions: PermissionListSchema.min(1, "Select at least one permission"),
  jobTitle: z.string().max(100).optional(),
  message: z.string().max(500).optional(),
  expiryDays: z.number().int().min(1).max(30).default(7),
});

export type CreateInvitationInput = z.infer<typeof CreateInvitationSchema>;

export const InvitationIdSchema = z.object({
  invitationId: z.string().min(1),
  reason: z.string().max(200).optional(),
});

export type InvitationIdInput = z.infer<typeof InvitationIdSchema>;

export const RemoveStaffSchema = z.object({
  memberId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

export type RemoveStaffInput = z.infer<typeof RemoveStaffSchema>;

export { StaffRoleSchema };
