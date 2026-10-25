import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyForgeMemory, type ForgeMemory } from "./learningMemory";
const io = vi.hoisted(() => ({
  load: vi.fn(),
  mutate: vi.fn(),
  purge: vi.fn(),
}));
vi.mock("./forgePersistence", () => ({
  loadForgeMemory: io.load,
  mutateForgeMemory: io.mutate,
  purgeLegacyForgeMemory: io.purge,
}));
import { useForgeLearningStore } from "./learningStore";
beforeEach(() => {
  vi.clearAllMocks();
  useForgeLearningStore.setState({
    petId: null,
    memory: null,
    status: "idle",
    error: null,
  });
});
describe("Learning store identity races", () => {
  it("ignores a stale A load after switching A → B → A", async () => {
    const resolvers: ((m: ForgeMemory) => void)[] = [];
    io.load.mockImplementation(
      () => new Promise<ForgeMemory>((resolve) => resolvers.push(resolve)),
    );
    const store = useForgeLearningStore;
    const a1 = store.getState().hydrate("a");
    const b = store.getState().hydrate("b");
    const a2 = store.getState().hydrate("a");
    const current = { ...emptyForgeMemory("a"), projects: [] };
    resolvers[2](current);
    await a2;
    resolvers[0]({ ...emptyForgeMemory("a"), discoveries: [] });
    resolvers[1](emptyForgeMemory("b"));
    await Promise.all([a1, b]);
    expect(store.getState().petId).toBe("a");
    expect(store.getState().memory).toBe(current);
  });
  it("exposes failed writes without claiming a save, then recovers on retry", async () => {
    io.load.mockResolvedValue(emptyForgeMemory("a"));
    await useForgeLearningStore.getState().hydrate("a");
    io.mutate.mockRejectedValue(new Error("Quota exceeded"));
    await expect(
      useForgeLearningStore.getState().clearDiscoveries(),
    ).rejects.toThrow("Quota");
    expect(useForgeLearningStore.getState().status).toBe("error");
    expect(useForgeLearningStore.getState().memory?.petId).toBe("a");
    await useForgeLearningStore.getState().hydrate("a");
    expect(useForgeLearningStore.getState().status).toBe("ready");
  });
});
