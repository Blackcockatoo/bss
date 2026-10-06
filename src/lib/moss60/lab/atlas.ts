import { MOSS_STRANDS } from "../strandSequences";
import atlas from "./canonical-atlas.json";

export const ATLAS_VERSION = "moss60-atlas/experimental-v1";
export const LUKUS = "213471897639";
export const ATLAS_STRANDS = { ...MOSS_STRANDS, lukus: LUKUS };
export type AtlasStrand = keyof typeof ATLAS_STRANDS;
export type Direction = 1 | -1;
export type PrimeStatus = "prime" | "probable prime" | "not prime" | "not classified";

export function circularWindow(digits: string, start: number, width: number, direction: Direction = 1): string {
  if (!/^[0-9]{1,60}$/.test(digits) || !Number.isInteger(start) || start < 0 || start >= digits.length ||
      !Number.isInteger(width) || width < 1 || width > digits.length || (direction !== 1 && direction !== -1)) {
    throw new RangeError("Invalid circular window address");
  }
  return Array.from({ length: width }, (_, i) => digits[(start + direction * i + digits.length) % digits.length]).join("");
}

/** Exact trial division for the lab's small (at most seven-digit) gates. */
export function isSmallPrime(value: number): boolean {
  if (!Number.isInteger(value) || value < 0 || value > 9_999_999) throw new RangeError("Expected an integer of at most seven digits");
  if (value < 2) return false;
  if (value % 2 === 0) return value === 2;
  for (let divisor = 3; divisor * divisor <= value; divisor += 2) if (value % divisor === 0) return false;
  return true;
}

export function inspectWindow(digits: string, start: number, width: number, direction: Direction = 1) {
  const window = circularWindow(digits, start, width, direction);
  const canonical = (Object.keys(ATLAS_STRANDS) as AtlasStrand[]).find(key => ATLAS_STRANDS[key] === digits);
  let primeStatus: PrimeStatus = "not classified";
  if (canonical) {
    const index = (width - 1) * 2 * digits.length + (direction === -1 ? digits.length : 0) + start;
    const flag = Number(atlas.flags[canonical][index]);
    primeStatus = (flag & 3) === 2 ? "probable prime" : (flag & 3) === 1 ? "prime" : "not prime";
  } else if (width <= 7) {
    primeStatus = isSmallPrime(Number(window)) ? "prime" : "not prime";
  }
  return {
    digits: window,
    primeStatus,
    palindrome: window === Array.from(window).reverse().join(""),
    symbolicGate: width === 1 && [1, 2, 3, 5, 7].includes(Number(window)),
    hex: `#${Number(circularWindow(digits, start, 7, direction)).toString(16).padStart(6, "0")}`,
    quadrant: Math.floor(start * 4 / digits.length),
    chamber: digits.length === 60 ? Math.floor(start / 5) : null,
  };
}

export function expressionGates(digits: string): boolean[] {
  return Array.from({ length: 60 }, (_, start) => {
    const three = circularWindow(digits, start, 3);
    const five = circularWindow(digits, start, 5);
    return isSmallPrime(Number(circularWindow(digits, start, 7))) ||
      three === Array.from(three).reverse().join("") || five === Array.from(five).reverse().join("");
  });
}
