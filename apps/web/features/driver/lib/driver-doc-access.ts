import { z } from "zod";

/**
 * Phase-2 audit (driver-system-complete-audit/20) — PURE driver compliance
 * document contracts. No server-only imports here so the namespace guard is
 * unit-testable under tsx --test; the minting side-effect lives in
 * ./driver-doc-mint (imports @/lib/storage, which is server-only).
 *
 * Authorization model — authorize the DRIVER, not the key: callers scope to a
 * driverProfileId (operators via ACTIVE affiliation, admins unconditionally),
 * then this guard proves the requested objectKey belongs to that exact driver
 * under the segment matching the requested type — so the presign endpoints
 * can never become generic presigners for arbitrary objects.
 */

export const DRIVER_DOC_TYPES = [
  "driver-license-front",
  "driver-license-back",
  "driver-medical-doc",
  "driver-selfie",
] as const;

export type DriverDocType = (typeof DRIVER_DOC_TYPES)[number];

/** Storage-key segment per purpose, exactly as minted by lib/storage/purposes.ts. */
export const DRIVER_DOC_SEGMENTS: Record<DriverDocType, string> = {
  "driver-license-front": "license-front",
  "driver-license-back": "license-back",
  "driver-medical-doc": "medical",
  "driver-selfie": "selfie",
};

export const driverPresignDocSchema = z.object({
  driverProfileId: z.string().cuid(),
  docType: z.enum(DRIVER_DOC_TYPES),
  objectKey: z.string().min(1),
});

export type DriverPresignDocInput = z.infer<typeof driverPresignDocSchema>;

export function expectedDriverDocPrefix(
  driverUserId: string,
  docType: DriverDocType,
): string {
  return `documents/drivers/${driverUserId}/${DRIVER_DOC_SEGMENTS[docType]}/`;
}

/**
 * Pure namespace guard — proves `objectKey` was minted for THIS driver under
 * the segment matching the requested doc type.
 */
export function driverDocKeyMatches(
  driverUserId: string,
  docType: DriverDocType,
  objectKey: string,
): boolean {
  return objectKey.startsWith(expectedDriverDocPrefix(driverUserId, docType));
}
