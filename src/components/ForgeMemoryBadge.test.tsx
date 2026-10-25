import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForgeMemoryBadge } from "./ForgeMemoryBadge";
import { DEFAULT_INPUT, type Project } from "@/lib/tools/activities";
import type { ForgeMemory } from "@/lib/tools/learningMemory";
const io = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock("@/lib/tools/forgePersistence", () => ({ loadForgeMemory: io.load }));
vi.mock("@/lib/registry", () => ({
  usePetRegistryStore: (selector: (state: unknown) => unknown) =>
    selector({
      activeRecord: {
        petId: "a",
        genomeHash: { redHash: "r", blueHash: "b", blackHash: "c" },
      },
    }),
}));
const project: Project = {
  version: 1,
  id: "work",
  toolId: "pattern-forge",
  title: "",
  createdAt: 1,
  updatedAt: 1,
  revision: 1,
  spark: { spot: "", prediction: "", reflection: "" },
  input: structuredClone(DEFAULT_INPUT),
};
const memory: ForgeMemory = {
  version: 1,
  petId: "a",
  discoveries: [],
  projects: [project],
};
beforeEach(() => vi.clearAllMocks());
describe("Companion recall audit", () => {
  it("renders a valid imported creation with an empty title without dereferencing a missing discovery", async () => {
    io.load.mockResolvedValue(memory);
    render(<ForgeMemoryBadge petId="a" />);
    expect(
      await screen.findByRole("button", {
        name: "Hear companion echo (optional)",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Companion response values/ }),
    ).toBeInTheDocument();
  });
  it("does not revive an old response when an earlier read resolves after a delete", async () => {
    const resolves: ((value: ForgeMemory) => void)[] = [];
    io.load.mockImplementation(
      () => new Promise<ForgeMemory>((resolve) => resolves.push(resolve)),
    );
    render(<ForgeMemoryBadge petId="a" />);
    fireEvent(window, new Event("focus"));
    await act(async () => resolves[1]({ ...memory, projects: [] }));
    await act(async () => resolves[0](memory));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", {
          name: "Hear companion echo (optional)",
        }),
      ).not.toBeInTheDocument(),
    );
  });
});
