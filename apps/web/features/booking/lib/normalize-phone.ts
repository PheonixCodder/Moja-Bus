/** Strip to digits for loose phone matching (CI numbers vary by formatting). */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function phonesMatch(a: string, b: string): boolean {
  const da = normalizePhone(a);
  const db = normalizePhone(b);
  if (!da || !db) return false;
  if (da === db) return true;
  // Match last 10 digits when country codes differ
  const minLen = 10;
  if (da.length >= minLen && db.length >= minLen) {
    return da.slice(-minLen) === db.slice(-minLen);
  }
  return false;
}
