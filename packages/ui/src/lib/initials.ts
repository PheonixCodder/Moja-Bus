/**
 * Extracts the 2-letter uppercase initials for a carrier / bus company.
 * Strictly takes the first letter of the first 2 words (e.g. "Moja Ride" -> "MR").
 * If single-word, takes the first 2 characters (e.g. "UTB" -> "UT").
 */
export function getCompanyInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "MR";
  const words = name.trim().split(/\s+/).filter(Boolean);
  const firstWord = words[0];
  if (!firstWord) return "MR";
  if (words.length === 1) {
    return firstWord.slice(0, 2).toUpperCase();
  }
  const secondWord = words[1];
  const firstChar = firstWord[0] ?? "";
  const secondChar = secondWord?.[0] ?? "";
  const res = (firstChar + secondChar).toUpperCase();
  return res || "MR";
}

/**
 * Extracts the 2-letter uppercase initials for a human user / staff / driver / passenger.
 */
export function getUserInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "U";
  const words = name.trim().split(/\s+/).filter(Boolean);
  const firstWord = words[0];
  if (!firstWord) return "U";
  if (words.length === 1) {
    return firstWord.slice(0, 2).toUpperCase();
  }
  const lastWord = words[words.length - 1];
  const firstChar = firstWord[0] ?? "";
  const lastChar = lastWord?.[0] ?? "";
  const res = (firstChar + lastChar).toUpperCase();
  return res || "U";
}

/**
 * Generates the deterministic DiceBear Glass PNG endpoint URL for a user seed.
 */
export function getDicebearGlassUrl(
  seed: string | null | undefined,
  size = 128,
): string {
  const normalizedSeed = seed?.trim() || "moja-user";
  return `https://api.dicebear.com/10.x/glass/png?seed=${encodeURIComponent(normalizedSeed)}&size=${size}`;
}
