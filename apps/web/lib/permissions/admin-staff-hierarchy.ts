/**
 * Admin Staff role hierarchy for assignable roles / who can modify whom.
 * Permission grants are separate — see @moja/schemas admin-permissions catalog.
 */

export {
  ADMIN_ASSIGNABLE_ROLES,
  ADMIN_ROLE_LEVELS,
  canAssignAdminRole,
  canModifyAdminMember,
  getAdminRoleLevel,
  type AdminStaffRole,
} from "@moja/schemas";
