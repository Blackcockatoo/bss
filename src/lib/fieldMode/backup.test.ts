import { describe, expect, it } from "vitest";

import {
  FIELD_BACKUP_KIND,
  FIELD_BACKUP_STORAGE_KEYS,
  applyFieldBackup,
  createFieldBackup,
  parseFieldBackup,
  serializeFieldBackup,
} from "@/lib/fieldMode/backup";
import {
  SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY,
  SCHOOLS_FIELD_CLASS_CONSEQUENCE_STORAGE_KEY,
  SCHOOLS_FIELD_MISSION_PROGRESS_STORAGE_KEY,
  SCHOOLS_LOCAL_STATE_META_STORAGE_KEY,
  SCHOOLS_TEACHER_LESSON_PROGRESS_STORAGE_KEY,
  SCHOOLS_TEACHER_PET_PROFILE_STORAGE_KEY,
} from "@/lib/schools/storage";

function storageMock(initial: Record<string, string> = {}) {
  const state = new Map(Object.entries(initial));
  return {
    state,
    getItem: (key: string) => state.get(key) ?? null,
    setItem: (key: string, value: string) => void state.set(key, value),
    removeItem: (key: string) => void state.delete(key),
  };
}

describe("Field Mode local backup", () => {
  it("exports only the explicit Field-safe storage allowlist", () => {
    const storage = storageMock({
      [SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY]: JSON.stringify([
        { id: "one", alias: "Bluebird 4", addedAt: 10 },
      ]),
      [SCHOOLS_TEACHER_PET_PROFILE_STORAGE_KEY]: JSON.stringify({
        displayName: "consumer profile",
      }),
    });
    const backup = createFieldBackup(
      storage,
      new Date("2026-07-22T00:00:00.000Z"),
    );

    expect(backup.kind).toBe(FIELD_BACKUP_KIND);
    expect(Object.keys(backup.entries)).toEqual([
      SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY,
    ]);
    expect(FIELD_BACKUP_STORAGE_KEYS).not.toContain(
      SCHOOLS_TEACHER_PET_PROFILE_STORAGE_KEY,
    );
    expect(serializeFieldBackup(backup)).not.toContain("consumer profile");
  });

  it("sanitises aliases and corrupted lesson progress during import", () => {
    const source = JSON.stringify({
      kind: FIELD_BACKUP_KIND,
      schemaVersion: 1,
      product: "MetaPet Field Mode — Australian Schools",
      createdAt: "2026-07-22T00:00:00.000Z",
      expiresAt: "2026-08-26T00:00:00.000Z",
      entries: {
        [SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY]: JSON.stringify([
          {
            id: "learner-1",
            alias: "  A classroom alias that is deliberately much too long  ",
            addedAt: 10,
          },
          { alias: "missing id" },
        ]),
        [SCHOOLS_TEACHER_LESSON_PROGRESS_STORAGE_KEY]: JSON.stringify({
          state: { currentLessonId: "not-a-lesson", records: "broken" },
          version: 999,
        }),
      },
    });

    const backup = parseFieldBackup(source);
    const roster = JSON.parse(
      backup.entries[SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY] ?? "[]",
    ) as Array<{ alias: string }>;
    const progress = JSON.parse(
      backup.entries[SCHOOLS_TEACHER_LESSON_PROGRESS_STORAGE_KEY] ?? "{}",
    ) as { state: { currentLessonId: string | null }; version: number };

    expect(roster).toHaveLength(1);
    expect(roster[0].alias).toHaveLength(32);
    expect(progress.version).toBe(2);
    expect(progress.state.currentLessonId).toBeNull();
  });

  it("backs up and repairs Field Missions and class consequences", () => {
    const storage = storageMock({
      [SCHOOLS_FIELD_CLASS_CONSEQUENCE_STORAGE_KEY]: JSON.stringify({
        state: { values: { trust: 999 }, trustedSystemUnlocked: "yes" },
        version: 1,
      }),
      [SCHOOLS_FIELD_MISSION_PROGRESS_STORAGE_KEY]: JSON.stringify({
        state: { records: { "silent-signal": { completed: true } } },
        version: 1,
      }),
    });
    const backup = createFieldBackup(storage, new Date("2026-07-22T00:00:00.000Z"));

    expect(Object.keys(backup.entries)).toEqual(
      expect.arrayContaining([
        SCHOOLS_FIELD_CLASS_CONSEQUENCE_STORAGE_KEY,
        SCHOOLS_FIELD_MISSION_PROGRESS_STORAGE_KEY,
      ]),
    );
    const consequences = JSON.parse(
      backup.entries[SCHOOLS_FIELD_CLASS_CONSEQUENCE_STORAGE_KEY] ?? "{}",
    ) as { state: { values: { trust: number }; trustedSystemUnlocked: boolean } };
    expect(consequences.state.values.trust).toBe(100);
    expect(consequences.state.trustedSystemUnlocked).toBe(false);

    const missions = JSON.parse(
      backup.entries[SCHOOLS_FIELD_MISSION_PROGRESS_STORAGE_KEY] ?? "{}",
    ) as { state: { records: Record<string, { completed: boolean }> } };
    expect(missions.state.records["silent-signal"].completed).toBe(true);
  });

  it("rejects unknown storage keys", () => {
    expect(() =>
      parseFieldBackup(
        JSON.stringify({
          kind: FIELD_BACKUP_KIND,
          schemaVersion: 1,
          product: "MetaPet Field Mode — Australian Schools",
          createdAt: "2026-07-22T00:00:00.000Z",
          entries: { "metapet-wallet": "{}" },
        }),
      ),
    ).toThrow(/unapproved storage key/i);
  });

  it("restores atomically and enters the existing retention window", () => {
    const storage = storageMock({
      [SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY]: "[]",
    });
    const backup = parseFieldBackup(
      JSON.stringify({
        kind: FIELD_BACKUP_KIND,
        schemaVersion: 1,
        product: "MetaPet Field Mode — Australian Schools",
        createdAt: "2026-07-22T00:00:00.000Z",
        entries: {
          [SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY]: JSON.stringify([
            { id: "one", alias: "Banksia 7", addedAt: 10 },
          ]),
        },
      }),
    );

    applyFieldBackup(storage, backup, 12345);

    expect(storage.getItem(SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY)).toContain(
      "Banksia 7",
    );
    expect(storage.getItem(SCHOOLS_LOCAL_STATE_META_STORAGE_KEY)).toBe(
      JSON.stringify({ updatedAt: 12345 }),
    );
  });

  it("rolls back the prior local state if a write fails", () => {
    const base = storageMock({
      [SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY]: JSON.stringify([
        { id: "old", alias: "Old alias", addedAt: 1 },
      ]),
    });
    let shouldFail = true;
    const storage = {
      ...base,
      setItem(key: string, value: string) {
        if (shouldFail && key === SCHOOLS_TEACHER_LESSON_PROGRESS_STORAGE_KEY) {
          shouldFail = false;
          throw new Error("disk full");
        }
        base.state.set(key, value);
      },
    };
    const backup = parseFieldBackup(
      JSON.stringify({
        kind: FIELD_BACKUP_KIND,
        schemaVersion: 1,
        product: "MetaPet Field Mode — Australian Schools",
        createdAt: "2026-07-22T00:00:00.000Z",
        entries: {
          [SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY]: JSON.stringify([
            { id: "new", alias: "New alias", addedAt: 2 },
          ]),
          [SCHOOLS_TEACHER_LESSON_PROGRESS_STORAGE_KEY]: JSON.stringify({}),
        },
      }),
    );

    expect(() => applyFieldBackup(storage, backup)).toThrow("disk full");
    expect(storage.getItem(SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY)).toContain(
      "Old alias",
    );
  });
});
