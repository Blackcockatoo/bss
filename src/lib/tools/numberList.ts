/** Decimal-only editor input. Invalid drafts must never execute old values. */
export function parseNumberList(
  text: string,
  kind: "sequence" | "rhythm",
): number[] | null {
  const parts = text
    .trim()
    .split(/[,\s]+/)
    .filter(Boolean);
  if (
    parts.length < (kind === "sequence" ? 2 : 1) ||
    parts.length > 16 ||
    !parts.every((p) => /^\d+(?:\.\d+)?$/.test(p))
  )
    return null;
  const values = parts.map(Number);
  return values.every((n) =>
    kind === "sequence"
      ? Number.isInteger(n) && n >= 0 && n <= 24
      : [0.25, 0.5, 1, 2].includes(n),
  )
    ? values
    : null;
}
