function toEnabled(value: string | undefined, defaultValue = false): boolean {
  if (typeof value !== "string") {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export const ENABLE_AUTH = toEnabled(process.env.NEXT_PUBLIC_ENABLE_AUTH, false);
export const ENABLE_MAPS = toEnabled(process.env.NEXT_PUBLIC_ENABLE_MAPS, false);

