/** Privacy helpers for promo / referral UIs. */

export function maskEmail(email: string | null | undefined): string {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!local || !domain) return "—";
  const head = local.slice(0, 1);
  return `${head}***@${domain}`;
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  return `••••${digits.slice(-4)}`;
}

export function displayName(
  fullName: string | null | undefined,
  opts?: { privacy?: boolean },
): string {
  const name = (fullName ?? "").trim();
  if (!name) return "Traveler";
  if (!opts?.privacy) return name;
  const parts = name.split(/\s+/);
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]} ${parts[parts.length - 1]!.slice(0, 1)}.`;
}
