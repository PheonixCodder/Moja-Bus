/**
 * Generic IAM evaluation helpers shared across Operator Staff and Admin Staff RBAC engines.
 */

export function checkCanAssignRole<TRole extends string>(
  assignableMap: Record<TRole, TRole[]>,
  assignerRole: string,
  targetRole: string,
): boolean {
  const allowed = assignableMap[assignerRole as TRole];
  return Array.isArray(allowed) && allowed.includes(targetRole as TRole);
}

export function checkCanModifyMember<TRole extends string>(
  roleLevels: Record<TRole, number>,
  modifierRole: string,
  targetRole: string,
): boolean {
  const modifierLevel = roleLevels[modifierRole as TRole] ?? 0;
  const targetLevel = roleLevels[targetRole as TRole] ?? 0;
  return modifierLevel > targetLevel;
}

export function evaluateEffectivePermissions<
  TPermission extends string,
  TRole extends string = string,
>(
  superRole: string,
  allKeys: readonly TPermission[],
  role: string,
  stored: string[],
  roleTemplates?: Record<TRole, readonly TPermission[]>,
): TPermission[] {
  if (role === superRole) return [...allKeys];
  const valid = new Set<string>(allKeys);
  const filtered = stored.filter((p): p is TPermission => valid.has(p));
  // Defense-in-depth: if stored permissions are empty, fallback to role default template
  if (filtered.length === 0 && roleTemplates && role in roleTemplates) {
    return [...(roleTemplates[role as TRole] ?? [])];
  }
  return filtered;
}

export function checkHasPermission<
  TPermission extends string,
  TRole extends string = string,
>(
  superRole: string,
  role: string,
  stored: string[],
  key: TPermission,
  roleTemplates?: Record<TRole, readonly TPermission[]>,
): boolean {
  if (role === superRole) return true;
  if (stored.includes(key)) return true;
  // Defense-in-depth: if stored permissions are empty, fallback to role default template
  if (stored.length === 0 && roleTemplates && role in roleTemplates) {
    return (roleTemplates[role as TRole] as readonly string[])?.includes(key) ?? false;
  }
  return false;
}

export function evaluateAssertCanGrant<TPermission extends string>(
  superRole: string,
  getEffective: (role: string, stored: string[]) => TPermission[],
  actorRole: string,
  actorStored: string[],
  proposed: string[],
): { ok: true } | { ok: false; missing: string[] } {
  if (actorRole === superRole) return { ok: true };
  const effective = new Set<string>(getEffective(actorRole, actorStored));
  const missing = proposed.filter((p) => !effective.has(p));
  if (missing.length > 0) return { ok: false, missing };
  return { ok: true };
}
