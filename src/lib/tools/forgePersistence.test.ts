import { afterEach, describe, expect, it, vi } from "vitest";
import { deleteForgeMemory, loadForgeMemory, saveForgeMemory } from "./forgePersistence";
import { emptyForgeMemory } from "./learningMemory";

afterEach(() => vi.unstubAllGlobals());

describe("Forge persistence fail-closed baseline", () => {
  it("does not use cloud storage and reports lack of IndexedDB", async () => {
    vi.stubGlobal("indexedDB", undefined);
    await expect(loadForgeMemory("pet")).rejects.toThrow(/IndexedDB/);
    await expect(saveForgeMemory(emptyForgeMemory("pet"))).rejects.toThrow(/IndexedDB/);
    await expect(deleteForgeMemory("pet")).rejects.toThrow(/IndexedDB/);
  });

  it("does not open storage for empty pet ID", async () => {
    vi.stubGlobal("indexedDB", undefined);
    expect((await loadForgeMemory("")).discoveries).toEqual([]);
    await expect(deleteForgeMemory("")).resolves.toBeUndefined();
  });
});
