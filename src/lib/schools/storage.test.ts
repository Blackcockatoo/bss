import { describe, expect, it } from "vitest";

import {
  SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY,
  SCHOOLS_LOCAL_DATA_RETENTION_MS,
  SCHOOLS_LOCAL_STATE_META_STORAGE_KEY,
  SCHOOLS_STORAGE_KEYS,
  clearSchoolsLocalState,
  purgeExpiredSchoolsLocalState,
  touchSchoolsLocalState,
} from "@/lib/schools/storage";

function createStorageMock() {
  const state = new Map<string, string>();

  return {
    state,
    getItem(key: string) {
      return state.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      state.set(key, value);
    },
    removeItem(key: string) {
      state.delete(key);
    },
  };
}

describe("schools storage helpers", () => {
  it("writes a timestamped local-state marker", () => {
    const storage = createStorageMock();

    touchSchoolsLocalState(storage, 1234);

    expect(storage.getItem(SCHOOLS_LOCAL_STATE_META_STORAGE_KEY)).toBe(
      JSON.stringify({ updatedAt: 1234 }),
    );
  });

  it("clears every documented school storage key", () => {
    const storage = createStorageMock();

    for (const key of SCHOOLS_STORAGE_KEYS) {
      storage.setItem(key, "value");
    }

    clearSchoolsLocalState(storage);

    for (const key of SCHOOLS_STORAGE_KEYS) {
      expect(storage.getItem(key)).toBeNull();
    }
  });

  it("purges expired classroom data when the retention window is exceeded", () => {
    const storage = createStorageMock();
    const now = Date.now();

    storage.setItem(
      SCHOOLS_LOCAL_STATE_META_STORAGE_KEY,
      JSON.stringify({
        updatedAt: now - SCHOOLS_LOCAL_DATA_RETENTION_MS - 1,
      }),
    );
    storage.setItem(SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY, "[]");
    storage.setItem("metapet-classroom-roster", "[]");

    const purged = purgeExpiredSchoolsLocalState(storage, now);

    expect(purged).toBe(true);
    expect(storage.getItem(SCHOOLS_LOCAL_STATE_META_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY)).toBeNull();
    expect(storage.getItem("metapet-classroom-roster")).toBeNull();
  });

  it("keeps active classroom data when the retention window has not expired", () => {
    const storage = createStorageMock();
    const now = Date.now();

    storage.setItem(
      SCHOOLS_LOCAL_STATE_META_STORAGE_KEY,
      JSON.stringify({
        updatedAt: now - SCHOOLS_LOCAL_DATA_RETENTION_MS + 1000,
      }),
    );
    storage.setItem(SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY, "[]");

    const purged = purgeExpiredSchoolsLocalState(storage, now);

    expect(purged).toBe(false);
    expect(storage.getItem(SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY)).toBe("[]");
  });
});
