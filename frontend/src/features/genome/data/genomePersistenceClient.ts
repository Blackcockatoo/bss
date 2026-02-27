export type SavedScenario = {
  id: string;
  name: string;
  controls: Record<string, number>;
  sharedToken: string;
  updatedAt: string;
};

const SCENARIO_KEY = "genome-whatif-scenarios";
const BOOKMARK_KEY = "genome-timeline-bookmarks";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

export async function listSavedScenarios(): Promise<SavedScenario[]> {
  return readJson<SavedScenario[]>(SCENARIO_KEY, []);
}

export async function saveScenario(name: string, controls: Record<string, number>): Promise<SavedScenario> {
  const scenarios = readJson<SavedScenario[]>(SCENARIO_KEY, []);
  const scenario: SavedScenario = {
    id: crypto.randomUUID(),
    name,
    controls,
    sharedToken: crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
  };
  writeJson(SCENARIO_KEY, [...scenarios, scenario]);
  return scenario;
}

export async function bookmarkBranch(branchId: string): Promise<string[]> {
  const bookmarks = readJson<string[]>(BOOKMARK_KEY, []);
  const next = bookmarks.includes(branchId)
    ? bookmarks.filter((item) => item !== branchId)
    : [...bookmarks, branchId];
  writeJson(BOOKMARK_KEY, next);
  return next;
}

export async function listBookmarks(): Promise<string[]> {
  return readJson<string[]>(BOOKMARK_KEY, []);
}
