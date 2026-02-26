import type { Genome, ElementResidue, ElementWebSummary } from './types';

const ELEMENT_ATOMIC_NUMBERS = Array.from({ length: 118 }, (_, index) => index + 1);

export function getResidue(z: number): number {
  const residue = z % 60;
  return residue < 0 ? residue + 60 : residue;
}

export const ELEMENT_RESIDUES: ElementResidue[] = buildElementResidues();

export function getResidueMeta(residue: number): ElementResidue {
  const normalized = getResidue(residue);
  const entry = ELEMENT_RESIDUES[normalized];

  if (!entry) {
    throw new Error(`Invalid residue: ${residue}`);
  }

  return entry;
}

export function summarizeElementWeb(genome: Genome): ElementWebSummary {
  const usedResidues = new Set<number>();
  const voidSlotsHit = new Set<number>();

  const sequences = [genome.red60, genome.black60, genome.blue60];
  sequences.forEach(sequence => {
    sequence.forEach(value => {
      const residue = getResidue(value);
      usedResidues.add(residue);
      const meta = getResidueMeta(residue);
      if (meta.isVoid) {
        voidSlotsHit.add(residue);
      }
    });
  });

  const pairSlots: number[] = [];
  const frontierSlots: number[] = [];

  usedResidues.forEach(residue => {
    const meta = getResidueMeta(residue);
    if (meta.hasPair60) {
      pairSlots.push(residue);
    }
    if (meta.isFrontierResidue) {
      frontierSlots.push(residue);
    }
  });

  const usedResidueList = Array.from(usedResidues).sort((a, b) => a - b);
  const voidSlotsList = Array.from(voidSlotsHit).sort((a, b) => a - b);
  pairSlots.sort((a, b) => a - b);
  frontierSlots.sort((a, b) => a - b);

  return {
    usedResidues: usedResidueList,
    pairSlots,
    frontierSlots,
    voidSlotsHit: voidSlotsList,
    coverage: usedResidues.size / 60,
    frontierAffinity: frontierSlots.length,
    bridgeCount: pairSlots.length,
    voidDrift: voidSlotsHit.size,
  };
}

function buildElementResidues(): ElementResidue[] {
  const table: ElementResidue[] = Array.from({ length: 60 }, (_, residue) => ({
    residue,
    elements2d: [],
    elements3d: [],
    hasPair60: false,
    isFrontierResidue: false,
    isVoid: false,
  }));

  ELEMENT_ATOMIC_NUMBERS.forEach(atomicNumber => {
    const residue = getResidue(atomicNumber);
    const entry = table[residue];

    if (atomicNumber >= 100) {
      entry.elements3d.push(atomicNumber);
    } else {
      entry.elements2d.push(atomicNumber);
    }
  });

  return table.map(entry => {
    const elementSet = new Set(entry.elements2d);
    const hasPair60 = entry.elements2d.some(value => elementSet.has(value + 60) || elementSet.has(value - 60));
    const isFrontierResidue = entry.elements3d.length > 0;
    const isVoid = entry.elements2d.length === 0 && entry.elements3d.length === 0;

    return {
      ...entry,
      elements2d: [...entry.elements2d],
      elements3d: [...entry.elements3d],
      hasPair60,
      isFrontierResidue,
      isVoid,
    };
  });
}
