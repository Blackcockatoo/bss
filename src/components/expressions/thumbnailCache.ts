import { EXPRESSION_CONTRACT_VERSION } from "@/lib/expressions/contract";
import { seedFor } from "@/lib/expressions/studio";
import type { CreatureSnapshot } from "@/lib/expressions/snapshot";
import type { PetForm } from "@/lib/petForms";

/**
 * Local, bounded cache of rendered 96px catalogue thumbnails.
 *
 * - Lives in Cache Storage under its own name, separate from canonical pet
 *   persistence, creative saves and the Field Mode / shell service-worker
 *   caches (which use the `meta-pet-` prefixes).
 * - Entries are only ever written with `Cache.put`; nothing here fetches from or
 *   sends anything to a network.
 * - Keys contain a one-way hash of the read-only creature snapshot, never the
 *   genome, name, pet id or registration data, so cached art is invalidated
 *   when the creature's appearance changes.
 */
export const THUMBNAIL_CACHE_NAME = "metapet-expression-thumbs-v" + EXPRESSION_CONTRACT_VERSION;
export const THUMBNAIL_CACHE_LIMIT = 420;
const PREFIX = "/__expression-thumbnails/";

export function appearanceHash(pet: CreatureSnapshot): string {
  return seedFor(JSON.stringify(pet)).toString(36);
}

export function thumbnailRequestKey(appearance: string, form: PetForm, id: string): string {
  return `${PREFIX}${appearance}/${form}/${encodeURIComponent(id)}`;
}

const available = () => typeof caches !== "undefined" && typeof caches.open === "function";

async function open(): Promise<Cache | null> {
  if (!available()) return null;
  try { return await caches.open(THUMBNAIL_CACHE_NAME); } catch { return null; }
}

const toUrl = (key: string) => new URL(key, typeof location === "undefined" ? "http://localhost" : location.origin).href;

export async function readThumbnail(key: string): Promise<Blob | null> {
  const cache = await open();
  if (!cache) return null;
  try {
    const hit = await cache.match(toUrl(key));
    if (!hit || hit.headers.get("content-type") !== "image/png") return null;
    return await hit.blob();
  } catch { return null; }
}

export async function writeThumbnail(key: string, blob: Blob): Promise<void> {
  const cache = await open();
  if (!cache) return;
  try {
    await cache.put(toUrl(key), new Response(blob, { headers: { "content-type": "image/png" } }));
    const keys = await cache.keys();
    // Cache Storage keeps insertion order, so the oldest entries go first.
    for (const stale of keys.slice(0, Math.max(0, keys.length - THUMBNAIL_CACHE_LIMIT))) await cache.delete(stale);
  } catch { /* Quota or private mode: thumbnails simply re-render next time. */ }
}

export async function clearThumbnailCache(): Promise<boolean> {
  if (!available()) return true;
  try { await caches.delete(THUMBNAIL_CACHE_NAME); return true; } catch { return false; }
}
