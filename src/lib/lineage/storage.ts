import { generateFounderCoatOfArms, type CoatOfArms } from "@/lib/lineage";

export const HERALDRY_EVENT = "metapet:heraldry-updated";
export const heraldryKey = (petId: string) => `auralia_coat_of_arms_${petId}`;
type HeraldryStorage = Pick<Storage, "getItem" | "setItem">;
const divisions = [
  "plain",
  "per-pale",
  "per-fess",
  "per-bend",
  "per-saltire",
  "quarterly",
  "chevron",
  "canton",
];
const tinctures = [
  "or",
  "argent",
  "azure",
  "gules",
  "sable",
  "vert",
  "purpure",
  "tenne",
];
const charges = [
  "star",
  "moon",
  "sun",
  "cross",
  "chevron",
  "lion",
  "eagle",
  "tree",
  "flower",
  "crown",
  "key",
  "sword",
  "book",
  "orb",
];

export function isCoatOfArms(value: unknown): value is CoatOfArms {
  if (!value || typeof value !== "object") return false;
  const coat = value as CoatOfArms;
  return (
    typeof coat.id === "string" &&
    divisions.includes(coat.division) &&
    tinctures.includes(coat.field) &&
    (coat.fieldSecondary === undefined ||
      tinctures.includes(coat.fieldSecondary)) &&
    Number.isInteger(coat.generation) &&
    coat.generation >= 0 &&
    Number.isFinite(coat.createdAt) &&
    Array.isArray(coat.charges) &&
    coat.charges.every(
      (charge) =>
        charge &&
        charges.includes(charge.charge) &&
        tinctures.includes(charge.tincture) &&
        charge.position &&
        ["x", "y", "scale", "rotation"].every((key) =>
          Number.isFinite(charge.position[key as keyof typeof charge.position]),
        ),
    ) &&
    Array.isArray(coat.lineageMarkers) &&
    coat.lineageMarkers.every(
      (marker) =>
        marker &&
        charges.includes(marker.charge) &&
        tinctures.includes(marker.tincture) &&
        Number.isInteger(marker.generation) &&
        marker.generation >= 0 &&
        ["left", "right", "center"].includes(marker.side) &&
        [
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
          "border",
          "chief",
        ].includes(marker.position),
    ) &&
    (coat.motto === undefined || typeof coat.motto === "string")
  );
}

/** Same deterministic seed as the existing certificate/profile implementation. */
export function heraldrySeed(petId: string): number {
  let hash = 0;
  for (let index = 0; index < petId.length; index++)
    hash = ((hash << 5) - hash + petId.charCodeAt(index)) | 0;
  return Math.abs(hash);
}

export function loadPetHeraldry(
  petId: string,
  generation = 0,
  storage?: HeraldryStorage,
): { coat: CoatOfArms; notice: string | null } {
  const fallback = {
    ...generateFounderCoatOfArms(petId, heraldrySeed(petId)),
    generation,
  };
  try {
    const target = storage ?? window.localStorage;
    const saved = target.getItem(heraldryKey(petId));
    if (saved !== null) {
      const value: unknown = JSON.parse(saved);
      if (!isCoatOfArms(value)) throw new Error("Invalid saved heraldry");
      return { coat: value, notice: null };
    }
    target.setItem(heraldryKey(petId), JSON.stringify(fallback));
    return { coat: fallback, notice: null };
  } catch {
    // A damaged or unavailable save is never overwritten by a read.
    return {
      coat: fallback,
      notice:
        "Saved heraldry could not be read. Showing a temporary shield; the saved data has been kept.",
    };
  }
}

export function savePetHeraldry(petId: string, coat: CoatOfArms): void {
  if (!isCoatOfArms(coat)) throw new Error("The shield could not be saved.");
  window.localStorage.setItem(heraldryKey(petId), JSON.stringify(coat));
  window.dispatchEvent(new CustomEvent(HERALDRY_EVENT, { detail: petId }));
}
