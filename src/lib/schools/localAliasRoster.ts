import { useSyncExternalStore } from "react";

import {
  SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY,
} from "@/lib/schools/storage";

const LEGACY_ROSTER_STORAGE_KEY = "metapet-classroom-roster";

export interface LocalAlias {
  id: string;
  alias: string;
}

function readAliasesFromValue(value: unknown): LocalAlias[] {
  if (!Array.isArray(value)) return [];
  const aliases: LocalAlias[] = [];
  const seen = new Set<string>();
  for (const entry of value.slice(0, 200)) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const id = typeof record.id === "string" ? record.id.trim().slice(0, 128) : "";
    const alias =
      typeof record.alias === "string" ? record.alias.trim().slice(0, 32) : "";
    if (!id || !alias) continue;
    const key = alias.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    aliases.push({ id, alias });
  }
  return aliases;
}

export function parseLocalAliasRoster(raw: string | null): LocalAlias[] {
  if (!raw) return [];
  try {
    return readAliasesFromValue(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

/** Reads the existing on-device alias roster. Never writes or transmits it. */
export function readLocalAliasRoster(
  storage: Pick<Storage, "getItem">,
): LocalAlias[] {
  for (const key of [
    SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY,
    LEGACY_ROSTER_STORAGE_KEY,
  ]) {
    const aliases = parseLocalAliasRoster(storage.getItem(key));
    if (aliases.length > 0) return aliases;
  }
  return [];
}

export function placeholderStudentLabels(count: number): string[] {
  const safe = Math.max(0, Math.min(60, Math.floor(count)));
  return Array.from({ length: safe }, (_, index) => `Student ${index + 1}`);
}

const EMPTY_ROSTER: LocalAlias[] = [];
let rosterSnapshotKey = "ssr";
let rosterSnapshot: LocalAlias[] = EMPTY_ROSTER;

function rosterStorageKey(storage: Pick<Storage, "getItem">): string {
  return `${storage.getItem(SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY) ?? ""}||${storage.getItem(LEGACY_ROSTER_STORAGE_KEY) ?? ""}`;
}

function getClientRosterSnapshot(): LocalAlias[] {
  const key = rosterStorageKey(window.localStorage);
  if (key === rosterSnapshotKey) return rosterSnapshot;
  rosterSnapshotKey = key;
  rosterSnapshot = readLocalAliasRoster(window.localStorage);
  return rosterSnapshot;
}

function subscribeToRoster(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/** Live view of the on-device alias roster. Server snapshot is empty. */
export function useLocalAliasRoster(): LocalAlias[] {
  return useSyncExternalStore(
    subscribeToRoster,
    getClientRosterSnapshot,
    () => EMPTY_ROSTER,
  );
}

export function useHasClientStorage(): boolean {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}
