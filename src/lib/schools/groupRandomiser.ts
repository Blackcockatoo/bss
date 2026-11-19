/**
 * Local-only grouping helpers. Callers must pass aliases or placeholder
 * labels; this module does not read storage or send data anywhere.
 */

export function shuffleCopy<T>(
  items: readonly T[],
  random: () => number = Math.random,
): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    const current = next[index]!;
    next[index] = next[swapWith]!;
    next[swapWith] = current;
  }
  return next;
}

export function groupCountFor(size: number, groupSize: number): number {
  const count = Math.max(1, Math.floor(size));
  const preferred = Math.max(1, Math.floor(groupSize));
  let groups = Math.max(1, Math.ceil(count / preferred));
  while (groups > 1 && Math.floor(count / groups) <= 1) {
    groups -= 1;
  }
  return groups;
}

export function makeEvenGroups<T>(
  items: readonly T[],
  groupSize: number,
): T[][] {
  if (items.length === 0) return [];
  const groups = Array.from(
    { length: groupCountFor(items.length, groupSize) },
    () => [] as T[],
  );
  items.forEach((item, index) => {
    groups[index % groups.length]!.push(item);
  });
  return groups;
}

export function randomiseGroups<T>(
  items: readonly T[],
  groupSize: number,
  random: () => number = Math.random,
): T[][] {
  return makeEvenGroups(shuffleCopy(items, random), groupSize);
}
