import type { ElementInfo, ResidueMeta, SequenceColor } from './types';

/**
 * Safe mod-60 residue helper. Always returns 0–59.
 */
export function getResidue(z: number): number {
  const r = z % 60;
  return r < 0 ? r + 60 : r;
}

/**
 * The element universe we actually care about right now:
 *  - 56 two-digit elements from RED / BLACK / BLUE sequences
 *  - 2 three-digit "frontier" elements (Nh-113, Og-118)
 */
export const ELEMENTS: ElementInfo[] = [
  // --- 1–20-ish, life / light stuff ---
  { atomicNumber: 1, symbol: 'H', name: 'Hydrogen' },
  { atomicNumber: 9, symbol: 'F', name: 'Fluorine' },
  { atomicNumber: 10, symbol: 'Ne', name: 'Neon' },
  { atomicNumber: 11, symbol: 'Na', name: 'Sodium' },
  { atomicNumber: 12, symbol: 'Mg', name: 'Magnesium' },
  { atomicNumber: 13, symbol: 'Al', name: 'Aluminum' },
  { atomicNumber: 14, symbol: 'Si', name: 'Silicon' },
  { atomicNumber: 17, symbol: 'Cl', name: 'Chlorine' },
  { atomicNumber: 19, symbol: 'K', name: 'Potassium' },
  { atomicNumber: 21, symbol: 'Sc', name: 'Scandium' },

  // --- mid table, transition metals etc. ---
  { atomicNumber: 25, symbol: 'Mn', name: 'Manganese' },
  { atomicNumber: 27, symbol: 'Co', name: 'Cobalt' },
  { atomicNumber: 30, symbol: 'Zn', name: 'Zinc' },
  { atomicNumber: 31, symbol: 'Ga', name: 'Gallium' },
  { atomicNumber: 32, symbol: 'Ge', name: 'Germanium' },
  { atomicNumber: 33, symbol: 'As', name: 'Arsenic' },
  { atomicNumber: 34, symbol: 'Se', name: 'Selenium' },
  { atomicNumber: 35, symbol: 'Br', name: 'Bromine' },
  { atomicNumber: 36, symbol: 'Kr', name: 'Krypton' },
  { atomicNumber: 37, symbol: 'Rb', name: 'Rubidium' },
  { atomicNumber: 38, symbol: 'Sr', name: 'Strontium' },
  { atomicNumber: 41, symbol: 'Nb', name: 'Niobium' },
  { atomicNumber: 43, symbol: 'Tc', name: 'Technetium' },
  { atomicNumber: 45, symbol: 'Rh', name: 'Rhodium' },
  { atomicNumber: 49, symbol: 'In', name: 'Indium' },
  { atomicNumber: 51, symbol: 'Sb', name: 'Antimony' },
  { atomicNumber: 52, symbol: 'Te', name: 'Tellurium' },
  { atomicNumber: 53, symbol: 'I', name: 'Iodine' },
  { atomicNumber: 54, symbol: 'Xe', name: 'Xenon' },

  // --- lanthanides / heavier ---
  { atomicNumber: 56, symbol: 'Ba', name: 'Barium' },
  { atomicNumber: 57, symbol: 'La', name: 'Lanthanum' },
  { atomicNumber: 58, symbol: 'Ce', name: 'Cerium' },
  { atomicNumber: 59, symbol: 'Pr', name: 'Praseodymium' },
  { atomicNumber: 61, symbol: 'Pm', name: 'Promethium' },
  { atomicNumber: 65, symbol: 'Tb', name: 'Terbium' },
  { atomicNumber: 67, symbol: 'Ho', name: 'Holmium' },
  { atomicNumber: 69, symbol: 'Tm', name: 'Thulium' },
  { atomicNumber: 70, symbol: 'Yb', name: 'Ytterbium' },
  { atomicNumber: 72, symbol: 'Hf', name: 'Hafnium' },
  { atomicNumber: 73, symbol: 'Ta', name: 'Tantalum' },
  { atomicNumber: 74, symbol: 'W', name: 'Tungsten' },
  { atomicNumber: 75, symbol: 'Re', name: 'Rhenium' },
  { atomicNumber: 76, symbol: 'Os', name: 'Osmium' },
  { atomicNumber: 77, symbol: 'Ir', name: 'Iridium' },
  { atomicNumber: 78, symbol: 'Pt', name: 'Platinum' },
  { atomicNumber: 79, symbol: 'Au', name: 'Gold' },

  // --- really heavy / radioactive & friends ---
  { atomicNumber: 83, symbol: 'Bi', name: 'Bismuth' },
  { atomicNumber: 85, symbol: 'At', name: 'Astatine' },
  { atomicNumber: 89, symbol: 'Ac', name: 'Actinium' },
  { atomicNumber: 90, symbol: 'Th', name: 'Thorium' },
  { atomicNumber: 91, symbol: 'Pa', name: 'Protactinium' },
  { atomicNumber: 93, symbol: 'Np', name: 'Neptunium' },
  { atomicNumber: 96, symbol: 'Cm', name: 'Curium' },
  { atomicNumber: 97, symbol: 'Bk', name: 'Berkelium' },
  { atomicNumber: 98, symbol: 'Cf', name: 'Californium' },
  { atomicNumber: 99, symbol: 'Es', name: 'Einsteinium' },

  // --- 3-digit "frontier" elements from the other doc ---
  { atomicNumber: 113, symbol: 'Nh', name: 'Nihonium' },
  { atomicNumber: 118, symbol: 'Og', name: 'Oganesson' },
];

/**
 * Look up all elements that land on a given residue (0–59),
 * and basic flags about that residue.
 *
 * You can call this either with a residue (0–59) or a raw atomic number.
 */
export function getResidueMeta(input: number): ResidueMeta {
  const residue = getResidue(input);

  const elements = ELEMENTS.filter(element => getResidue(element.atomicNumber) === residue);

  const zs = elements.map(e => e.atomicNumber).sort((a, b) => a - b);
  const hasBridge60 = zs.length >= 2 && Math.abs(zs[0] - zs[zs.length - 1]) === 60;
  const hasFrontier = zs.some(z => z >= 100);
  const isVoid = elements.length === 0;

  return {
    residue,
    elements,
    hasBridge60,
    hasFrontier,
    isVoid,
  };
}

export type { ElementInfo, ResidueMeta, SequenceColor };
