import { afterEach, describe, expect, it, vi } from "vitest";
import {
  THUMBNAIL_CACHE_LIMIT, THUMBNAIL_CACHE_NAME, appearanceHash, clearThumbnailCache,
  readThumbnail, thumbnailRequestKey, writeThumbnail,
} from "./thumbnailCache";
import type { CreatureSnapshot } from "@/lib/expressions/snapshot";

class FakeCache {
  entries = new Map<string, Response>();
  async match(url: string) { return this.entries.get(url)?.clone(); }
  async put(url: string, response: Response) { this.entries.delete(url); this.entries.set(url, response); }
  async keys() { return [...this.entries.keys()].map(url => new Request(url)); }
  async delete(request: Request | string) { return this.entries.delete(typeof request === "string" ? request : request.url); }
}

function fakeStorage(names: string[] = []) {
  const stores = new Map<string, FakeCache>(names.map(name => [name, new FakeCache()]));
  return {
    stores,
    api: {
      open: async (name: string) => { if (!stores.has(name)) stores.set(name, new FakeCache()); return stores.get(name)!; },
      delete: async (name: string) => stores.delete(name),
      keys: async () => [...stores.keys()],
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("expression thumbnail cache", () => {
  it("keys thumbnails by a one-way appearance hash, form and expression", () => {
    const pet = { petIdHint: "pet-secret-123", name: "Private alias", strands: { red60: "0123" } } as unknown as CreatureSnapshot;
    const hash = appearanceHash(pet);
    const key = thumbnailRequestKey(hash, "evolved", "win");
    expect(key).toBe(`/__expression-thumbnails/${hash}/evolved/win`);
    expect(key).not.toContain("pet-secret");
    expect(key).not.toContain("Private");
    expect(key).not.toContain("0123");
    expect(appearanceHash({ ...pet, name: "Other" } as never)).not.toBe(hash);
    expect(thumbnailRequestKey(hash, "auralia", "win")).not.toBe(key);
  });

  it("stores PNG thumbnails, bounds the cache and clears only its own storage", async () => {
    const { api, stores } = fakeStorage(["meta-pet-shell-v1", "meta-pet-field-pack-meta"]);
    vi.stubGlobal("caches", api);
    const png = new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" });
    await writeThumbnail("/__expression-thumbnails/a/auralia/win", png);
    const hit = await readThumbnail("/__expression-thumbnails/a/auralia/win");
    expect(hit?.size).toBe(4);
    expect(await readThumbnail("/__expression-thumbnails/a/evolved/win")).toBeNull();
    for (let i = 0; i < THUMBNAIL_CACHE_LIMIT + 5; i += 1) await writeThumbnail(`/__expression-thumbnails/a/geometry/${i}`, png);
    expect(stores.get(THUMBNAIL_CACHE_NAME)!.entries.size).toBe(THUMBNAIL_CACHE_LIMIT);
    expect(await clearThumbnailCache()).toBe(true);
    expect([...stores.keys()]).toEqual(["meta-pet-shell-v1", "meta-pet-field-pack-meta"]);
    expect(THUMBNAIL_CACHE_NAME.startsWith("meta-pet-")).toBe(false);
  });

  it("degrades to no persistence when Cache Storage is unavailable", async () => {
    vi.stubGlobal("caches", undefined);
    await writeThumbnail("/__expression-thumbnails/a/auralia/win", new Blob([]));
    expect(await readThumbnail("/__expression-thumbnails/a/auralia/win")).toBeNull();
    expect(await clearThumbnailCache()).toBe(true);
  });
});
