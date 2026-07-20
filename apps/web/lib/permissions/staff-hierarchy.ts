/**
 * Staff role hierarchy for assignable roles / who can modify whom.
 * Permission grants are separate — see @moja/schemas permissions catalog.
 */

export {
  ASSIGNABLE_ROLES,
  ROLE_LEVELS,
  canAssignRole,
  canModifyMember,
  getRoleLevel,
  type StaffRole,
} from "@moja/schemas";
