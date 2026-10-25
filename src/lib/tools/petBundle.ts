/** Explicit user-owned backup. Never invoked by navigation, analytics or sharing. */
import { exportPetPacket, parsePetPacket } from "../registry/protocol";
import type { PetRecordV2 } from "../registry/record";
import type { PetRepository } from "../registry/repository";
import {
  exportForge,
  loadForgeMemory,
  parseForge,
  saveForgeMemory,
} from "./forgePersistence";
export async function exportForgePetBundle(
  record: PetRecordV2,
): Promise<string> {
  const memory = await loadForgeMemory(record.petId);
  return JSON.stringify(
    {
      protocol: "MetaPetForgeBundle",
      version: 1,
      pet: await exportPetPacket(record),
      forge: exportForge({ ...memory, projects: memory.projects ?? [] }),
    },
    null,
    2,
  );
}
export async function importForgePetBundle(
  json: string,
  repository: PetRepository,
): Promise<PetRecordV2> {
  if (json.length > 1000000) throw new Error("Pet bundle too large.");
  const bundle = JSON.parse(json);
  if (
    bundle?.protocol !== "MetaPetForgeBundle" ||
    bundle.version !== 1 ||
    typeof bundle.pet !== "string" ||
    typeof bundle.forge !== "string"
  )
    throw new Error("Invalid pet bundle.");
  // Validate ALL contents before either write. Pet and learning DBs have distinct owners.
  const pet = await parsePetPacket(bundle.pet);
  const memory = parseForge(bundle.forge, pet.petId);
  await repository.saveRecord(pet, { activate: false });
  try {
    await saveForgeMemory(memory);
  } catch {
    throw new Error(
      "Pet identity restored, but Forge write failed. Keep this backup and retry; do not delete the source.",
    );
  }
  return pet;
}
