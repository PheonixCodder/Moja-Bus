const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateBookingReference(): string {
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return `MR-${suffix}`;
}
