export type GreetingSide = -1 | 0 | 1;

const storageKey = (petId: string) => `metapet:alive:greeting:v1:${petId}`;

export function readGreetingHabit(petId: string): number | null {
  try {
    const value = localStorage.getItem(storageKey(petId));
    const score = Number(value);
    return value !== null && /^-?[0-5]$/.test(value) ? score : null;
  } catch {
    return null;
  }
}

export function writeGreetingHabit(petId: string, score: number | null): boolean {
  try {
    if (score === null) localStorage.removeItem(storageKey(petId));
    else localStorage.setItem(storageKey(petId), String(score));
    return true;
  } catch {
    return false;
  }
}

export function updateGreetingHabit(score: number, side: GreetingSide) {
  return Math.min(5, Math.max(-5, score + side));
}

export function rememberedGreetingSide(score: number | null): GreetingSide {
  if (score === null || Math.abs(score) < 3) return 0;
  return score < 0 ? -1 : 1;
}
