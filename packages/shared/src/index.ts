export function assertNever(
  value: never,
  message = "Unexpected object",
): never {
  throw new Error(`${message}: ${String(value)}`);
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function compact<T>(values: Array<T | null | undefined | false>): T[] {
  return values.filter(isDefined).filter(Boolean) as T[];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
