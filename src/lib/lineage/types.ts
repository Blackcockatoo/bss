/**
 * Lineage & Coat of Arms System
 *
 * Tracks breeding lineage through heraldic coat of arms that encode ancestry
 */

/**
 * Heraldic divisions (how the shield is divided)
 */
export type HeraldDivision =
  | 'plain' // No division
  | 'per-pale' // Vertical split
  | 'per-fess' // Horizontal split
  | 'per-bend' // Diagonal top-left to bottom-right
  | 'per-saltire' // X-shaped division
  | 'quarterly' // Four quarters
  | 'chevron' // V-shaped
  | 'canton'; // Small square in corner

/**
 * Heraldic tinctures (colors)
 */
export type HeraldTincture =
  | 'or' // Gold
  | 'argent' // Silver/white
  | 'azure' // Blue
  | 'gules' // Red
  | 'sable' // Black
  | 'vert' // Green
  | 'purpure' // Purple
  | 'tenne'; // Orange

/**
 * Heraldic charges (symbols on the shield)
 */
export type HeraldCharge =
  | 'star' // Estoile
  | 'moon' // Crescent
  | 'sun' // Sun in splendor
  | 'cross' // Cross
  | 'chevron' // Chevron
  | 'lion' // Lion rampant
  | 'eagle' // Eagle displayed
  | 'tree' // Tree
  | 'flower' // Rose
  | 'crown' // Crown
  | 'key' // Key
  | 'sword' // Sword
  | 'book' // Book
  | 'orb'; // Celestial orb

/**
 * Position on the shield
 */
export interface ChargePosition {
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  scale: number; // Relative size
  rotation: number; // Degrees
}

/**
 * A charge with its position
 */
export interface PositionedCharge {
  charge: HeraldCharge;
  position: ChargePosition;
  tincture: HeraldTincture;
}

/**
 * Coat of Arms definition
 */
export interface CoatOfArms {
  /** Unique identifier */
  id: string;

  /** Shield division pattern */
  division: HeraldDivision;

  /** Primary field tincture */
  field: HeraldTincture;

  /** Secondary field tincture (for divisions) */
  fieldSecondary?: HeraldTincture;

  /** Charges (symbols) on the shield */
  charges: PositionedCharge[];

  /** Generation number (how many ancestors) */
  generation: number;

  /** Lineage markers (one per ancestor generation) */
  lineageMarkers: LineageMarker[];

  /** Motto (optional) */
  motto?: string;

  /** When this coat of arms was created */
  createdAt: number;
}

/**
 * Lineage marker - encodes ancestry in the coat of arms
 */
export interface LineageMarker {
  /** Which generation (0 = parents, 1 = grandparents, etc.) */
  generation: number;

  /** Parent side (left = parent1, right = parent2) */
  side: 'left' | 'right' | 'center';

  /** Color marker inherited from ancestor */
  tincture: HeraldTincture;

  /** Symbol marker inherited from ancestor */
  charge: HeraldCharge;

  /** Position in the quarterings or border */
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'border' | 'chief';
}

/**
 * Lineage record - full ancestry tree
 */
export interface LineageRecord {
  /** Current pet ID */
  petId: string;

  /** Current pet's coat of arms */
  coatOfArms: CoatOfArms;

  /** Parent 1 lineage (if any) */
  parent1?: LineageRecord;

  /** Parent 2 lineage (if any) */
  parent2?: LineageRecord;

  /** Birth timestamp */
  birthTimestamp: number;

  /** Generation depth (0 = founder, 1+ = descended) */
  depth: number;

  /** Total number of ancestors */
  ancestorCount: number;
}

/**
 * Lineage analysis result
 */
export interface LineageAnalysis {
  /** Total generations back */
  generations: number;

  /** Number of unique ancestors */
  uniqueAncestors: number;

  /** Founding lines (ancestors with no parents) */
  founderCount: number;

  /** Most common tinctures in lineage */
  dominantTinctures: HeraldTincture[];

  /** Most common charges in lineage */
  dominantCharges: HeraldCharge[];

  /** Inbreeding coefficient (0-1, 0 = no inbreeding) */
  inbreedingCoefficient: number;

  /** Lineage purity (how many unique lines) */
  purity: number;
}

/**
 * Breeding combination result
 */
export interface BreedingCoatOfArms {
  /** New coat of arms for offspring */
  offspring: CoatOfArms;

  /** How parents influenced the result */
  inheritance: {
    fromParent1: {
      division?: boolean;
      field?: boolean;
      charges: number[]; // Indices of charges inherited
    };
    fromParent2: {
      division?: boolean;
      field?: boolean;
      charges: number[];
    };
    novel: {
      charges: number[]; // Indices of new charges (mutations)
    };
  };
}
