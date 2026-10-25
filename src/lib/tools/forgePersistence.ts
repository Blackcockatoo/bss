/** Canonical MetaPetDB owns learning. Separate v1 Forge data is copied lazily,
 * only after a committed write. Empty canonical records prevent resurrection. */
import { initDB } from "../persistence/indexeddb";
import {
  emptyForgeMemory,
  normaliseForgeMemory,
  type ForgeMemory,
} from "./learningMemory";
const STORE = "learningMemory";
export const MAX_FORGE_BACKUP_BYTES = 4_000_000;
export function assertBackupSize(
  json: string,
  maximum: number,
  label = "Backup",
): void {
  if (
    json.length > maximum ||
    new TextEncoder().encode(json).byteLength > maximum
  )
    throw new Error(`${label} too large.`);
}
function readCanonical(raw: unknown, petId: string): ForgeMemory {
  if (raw === undefined) return emptyForgeMemory(petId);
  const value = raw as Partial<ForgeMemory>;
  if (
    !value ||
    value.version !== 1 ||
    value.petId !== petId ||
    !Array.isArray(value.discoveries)
  )
    throw new Error(
      "Unsupported or damaged Forge data. Existing records were preserved.",
    );
  const safe = normaliseForgeMemory(raw, petId);
  if (
    safe.discoveries.length !== value.discoveries.length ||
    (value.projects !== undefined &&
      (!Array.isArray(value.projects) ||
        safe.projects?.length !== value.projects.length))
  )
    throw new Error(
      "Damaged Forge records were preserved; restore a valid backup before editing.",
    );
  if (
    new Set(safe.projects?.map((p) => p.id)).size !== safe.projects?.length ||
    new Set(safe.discoveries.map((d) => d.id)).size !== safe.discoveries.length
  )
    throw new Error(
      "Duplicate Forge record IDs; existing records were preserved.",
    );
  return safe;
}
export async function loadForgeMemory(petId: string): Promise<ForgeMemory> {
  const db = await initDB();
  try {
    const raw = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(petId);
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = tx.onabort = () =>
        reject(tx.error ?? new Error("Read failed"));
    });
    if (raw !== undefined) return readCanonical(raw, petId);
  } finally {
    db.close();
  }
  const legacy = await readLegacy(petId);
  if (legacy) {
    const migrated = await mutateForgeMemory(petId, () => legacy, true);
    await purgeLegacyForgeMemory(petId, legacy);
    return migrated;
  }
  return emptyForgeMemory(petId);
}
async function readLegacy(petId: string): Promise<ForgeMemory | null> {
  // Opening an absent legacy DB creates no stores and is harmless. Never upgrade it.
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("MetaPetProjectForge");
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("Legacy storage blocked"));
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.close();
        resolve(null);
        return;
      }
      const tx = db.transaction(STORE, "readonly");
      const get = tx.objectStore(STORE).get(petId);
      tx.oncomplete = () => {
        db.close();
        try {
          resolve(get.result ? readCanonical(get.result, petId) : null);
        } catch (error) {
          reject(error);
        }
      };
      tx.onerror = tx.onabort = () => {
        db.close();
        reject(tx.error);
      };
    };
  });
}
/** Read-modify-write in ONE IDB transaction, serialised across tabs. */
export async function mutateForgeMemory(
  petId: string,
  update: (m: ForgeMemory) => ForgeMemory,
  onlyIfAbsent = false,
  replace = false,
): Promise<ForgeMemory> {
  if (!petId || petId === "registration-pending")
    throw new Error("Open a registered pet first.");
  const db = await initDB();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const req = store.get(petId);
      let next: ForgeMemory;
      req.onsuccess = () => {
        try {
          next =
            onlyIfAbsent && req.result !== undefined
              ? readCanonical(req.result, petId)
              : readCanonical(
                  update(
                    replace
                      ? emptyForgeMemory(petId)
                      : readCanonical(req.result, petId),
                  ),
                  petId,
                );
          store.put(next);
        } catch (e) {
          tx.abort();
          reject(e);
        }
      };
      tx.oncomplete = () => {
        if (typeof window !== "undefined")
          window.dispatchEvent(
            new CustomEvent("metapet:forge-changed", { detail: petId }),
          );
        resolve(next);
      };
      tx.onerror = tx.onabort = () =>
        reject(tx.error ?? new Error("Local write did not commit."));
    });
  } finally {
    db.close();
  }
}
export async function saveForgeMemory(memory: ForgeMemory): Promise<void> {
  await mutateForgeMemory(memory.petId, () => memory, false, true);
}
export async function deleteForgeMemory(petId: string): Promise<void> {
  await mutateForgeMemory(petId, () => emptyForgeMemory(petId), false, true);
  await purgeLegacyForgeMemory(petId);
}
export function exportForge(memory: ForgeMemory): string {
  const json = JSON.stringify(
    {
      protocol: "MetaPetForge",
      version: 1,
      memory: readCanonical(memory, memory.petId),
    },
    null,
    2,
  );
  assertBackupSize(json, MAX_FORGE_BACKUP_BYTES);
  return json;
}
export function parseForge(json: string, petId: string): ForgeMemory {
  assertBackupSize(json, MAX_FORGE_BACKUP_BYTES);
  const packet = JSON.parse(json);
  if (
    packet?.protocol !== "MetaPetForge" ||
    packet.version !== 1 ||
    packet.memory?.petId !== petId ||
    packet.memory.version !== 1
  )
    throw new Error("Backup version or pet identity does not match.");
  const safe = normaliseForgeMemory(packet.memory, petId);
  if (
    !Array.isArray(packet.memory.discoveries) ||
    safe.discoveries.length !== packet.memory.discoveries.length ||
    !Array.isArray(packet.memory.projects) ||
    safe.projects?.length !== packet.memory.projects.length
  )
    throw new Error("Backup contains invalid or excessive records.");
  if (
    new Set(safe.projects?.map((p) => p.id)).size !== safe.projects?.length ||
    new Set(safe.discoveries.map((d) => d.id)).size !== safe.discoveries.length
  )
    throw new Error("Duplicate project IDs.");
  return safe;
}

/** Erase the retired copy only after the canonical write commits. */
export async function purgeLegacyForgeMemory(
  petId: string,
  expected?: ForgeMemory,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.open("MetaPetProjectForge");
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.close();
        resolve();
        return;
      }
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      if (!expected) store.delete(petId);
      else {
        const read = store.get(petId);
        read.onsuccess = () => {
          try {
            // A retired tab may have saved again since the copy was read.
            // Never erase a newer value as migration cleanup.
            if (
              read.result !== undefined &&
              JSON.stringify(readCanonical(read.result, petId)) ===
                JSON.stringify(expected)
            )
              store.delete(petId);
          } catch (error) {
            tx.abort();
            reject(error);
          }
        };
      }
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = tx.onabort = () => {
        db.close();
        reject(tx.error);
      };
    };
  });
}
