export function getRequiredEnv(
  name: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const value = env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

export function getOptionalEnv<T extends string = string>(
  name: string,
  env: NodeJS.ProcessEnv = process.env,
  fallback?: T,
): T | undefined {
  const value = env[name];
  return value && value.length > 0 ? (value as T) : fallback;
}

export function getBooleanEnv(
  name: string,
  env: NodeJS.ProcessEnv = process.env,
  fallback = false,
): boolean {
  const value = getOptionalEnv(name, env);

  if (value == null) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export function getCsvEnv(
  name: string,
  env: NodeJS.ProcessEnv = process.env,
  fallback: string[] = [],
): string[] {
  const value = getOptionalEnv(name, env);
  if (value == null) {
    return fallback;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function getNumberEnv(
  name: string,
  env: NodeJS.ProcessEnv = process.env,
  fallback: number,
): number {
  const value = getOptionalEnv(name, env);
  if (value == null) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
