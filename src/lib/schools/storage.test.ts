import { describe, expect, it } from "vitest";

import {
  SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY,
  SCHOOLS_LOCAL_DATA_CATEGORIES,
  SCHOOLS_LOCAL_DATA_RETENTION_DAYS,
  buildSchoolsAggregateSummary,
  clearSchoolsClassSession,
  describeSchoolsLocalData,
  SCHOOLS_FIELD_SESSION_STORAGE_KEY,
  SCHOOLS_LOCAL_DATA_RETENTION_MS,
  SCHOOLS_LOCAL_STATE_META_STORAGE_KEY,
  SCHOOLS_TEACHER_LESSON_PROGRESS_STORAGE_KEY,
  SCHOOLS_TEACHER_ONBOARDING_STORAGE_KEY,
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

  it("keeps Field lesson records inside the existing school deletion contract", () => {
    expect(SCHOOLS_STORAGE_KEYS).toContain(SCHOOLS_FIELD_SESSION_STORAGE_KEY);
    expect(SCHOOLS_STORAGE_KEYS).toContain(
      SCHOOLS_TEACHER_LESSON_PROGRESS_STORAGE_KEY,
    );
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
    storage.setItem(SCHOOLS_TEACHER_ONBOARDING_STORAGE_KEY, "{}");
    storage.setItem("metapet-classroom-roster", "[]");

    const purged = purgeExpiredSchoolsLocalState(storage, now);

    expect(purged).toBe(true);
    expect(storage.getItem(SCHOOLS_LOCAL_STATE_META_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(SCHOOLS_TEACHER_ONBOARDING_STORAGE_KEY)).toBeNull();
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

  it("expires local records exactly 35 days after the last activity", () => {
    const storage = createStorageMock();
    const lastActivity = Date.UTC(2026, 0, 1);
    const DAY_MS = 24 * 60 * 60 * 1000;

    expect(SCHOOLS_LOCAL_DATA_RETENTION_DAYS).toBe(35);
    touchSchoolsLocalState(storage, lastActivity);
    storage.setItem(SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY, "[]");

    // One millisecond before the window closes: still held.
    expect(
      purgeExpiredSchoolsLocalState(
        storage,
        lastActivity + 35 * DAY_MS,
      ),
    ).toBe(false);
    expect(storage.getItem(SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY)).toBe("[]");

    // One millisecond after: gone.
    expect(
      purgeExpiredSchoolsLocalState(
        storage,
        lastActivity + 35 * DAY_MS + 1,
      ),
    ).toBe(true);
    expect(storage.getItem(SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY)).toBeNull();
  });

  it("restarts the expiry countdown whenever a session is run", () => {
    const storage = createStorageMock();
    const DAY_MS = 24 * 60 * 60 * 1000;
    const firstUse = Date.UTC(2026, 0, 1);

    touchSchoolsLocalState(storage, firstUse);
    storage.setItem(SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY, "[]");

    // A session on day 30 pushes the deletion date out to day 65.
    touchSchoolsLocalState(storage, firstUse + 30 * DAY_MS);

    expect(
      purgeExpiredSchoolsLocalState(storage, firstUse + 40 * DAY_MS),
    ).toBe(false);
    expect(
      purgeExpiredSchoolsLocalState(storage, firstUse + 66 * DAY_MS),
    ).toBe(true);
  });
});

describe("adult-facing local data report", () => {
  it("reports an empty device honestly", () => {
    const report = describeSchoolsLocalData(createStorageMock(), Date.now());

    expect(report.empty).toBe(true);
    expect(report.lastActivity).toBeNull();
    expect(report.expiresAt).toBeNull();
    expect(report.daysRemaining).toBeNull();
    expect(report.categories.every((category) => !category.present)).toBe(true);
  });

  it("reports which categories are held, the last activity and the expiry date", () => {
    const storage = createStorageMock();
    const DAY_MS = 24 * 60 * 60 * 1000;
    const lastActivity = Date.UTC(2026, 0, 1);

    touchSchoolsLocalState(storage, lastActivity);
    storage.setItem(SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY, "[]");

    const report = describeSchoolsLocalData(
      storage,
      lastActivity + 5 * DAY_MS,
    );

    expect(report.empty).toBe(false);
    expect(report.lastActivity?.getTime()).toBe(lastActivity);
    expect(report.expiresAt?.getTime()).toBe(lastActivity + 35 * DAY_MS);
    expect(report.daysRemaining).toBe(30);

    const aliases = report.categories.find((c) => c.id === "aliases");
    expect(aliases?.present).toBe(true);
    const evidence = report.categories.find((c) => c.id === "evidence");
    expect(evidence?.present).toBe(false);
  });

  it("never exposes a raw storage key in the adult-facing report", () => {
    const storage = createStorageMock();
    touchSchoolsLocalState(storage, Date.now());
    storage.setItem(SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY, "[]");

    const rendered = JSON.stringify(
      describeSchoolsLocalData(storage, Date.now()),
    );
    for (const key of SCHOOLS_STORAGE_KEYS) {
      expect(rendered, key).not.toContain(key);
    }
  });

  it("covers every documented storage key with a described category", () => {
    // A key nobody can see is a key nobody can decide about.
    const described = new Set(
      SCHOOLS_LOCAL_DATA_CATEGORIES.flatMap((category) => category.keys),
    );
    const undescribed = SCHOOLS_STORAGE_KEYS.filter(
      (key) => key !== SCHOOLS_LOCAL_STATE_META_STORAGE_KEY && !described.has(key),
    );

    expect(undescribed).toEqual([]);
  });
});

describe("teacher deletion controls", () => {
  it("deletes the class session while keeping teacher setup", () => {
    const storage = createStorageMock();
    storage.setItem(SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY, "[]");
    storage.setItem(SCHOOLS_FIELD_SESSION_STORAGE_KEY, "{}");
    storage.setItem(SCHOOLS_TEACHER_LESSON_PROGRESS_STORAGE_KEY, "{}");
    storage.setItem(SCHOOLS_TEACHER_ONBOARDING_STORAGE_KEY, "{}");

    clearSchoolsClassSession(storage);

    expect(storage.getItem(SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(SCHOOLS_FIELD_SESSION_STORAGE_KEY)).toBeNull();
    expect(
      storage.getItem(SCHOOLS_TEACHER_LESSON_PROGRESS_STORAGE_KEY),
    ).toBeNull();
    expect(storage.getItem(SCHOOLS_TEACHER_ONBOARDING_STORAGE_KEY)).toBe("{}");
  });

  it("deletes everything, including legacy keys, on the full wipe", () => {
    const storage = createStorageMock();
    for (const key of SCHOOLS_STORAGE_KEYS) {
      storage.setItem(key, "value");
    }

    clearSchoolsLocalState(storage);

    expect(storage.state.size).toBe(0);
  });
});

describe("minimal aggregate summary", () => {
  it("exports counts and dates only, never a student record", () => {
    const storage = createStorageMock();
    const now = Date.UTC(2026, 0, 6);
    touchSchoolsLocalState(storage, Date.UTC(2026, 0, 1));
    storage.setItem(SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY, JSON.stringify(["Pip", "Ash"]));

    const summary = buildSchoolsAggregateSummary(storage, now);

    expect(summary).toEqual({
      generatedOn: "2026-01-06",
      categoriesHeld: 1,
      categoriesTotal: SCHOOLS_LOCAL_DATA_CATEGORIES.length,
      lastActivityOn: "2026-01-01",
      retentionThresholdOn: "2026-02-05",
      retentionDays: 35,
    });

    // The aliases that were in storage must not survive into the export.
    const serialised = JSON.stringify(summary);
    expect(serialised).not.toContain("Pip");
    expect(serialised).not.toContain("Ash");
  });
});
