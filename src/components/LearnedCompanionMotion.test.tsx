import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, it, expect, vi } from "vitest";
import { LearnedCompanionMotion } from "./LearnedCompanionMotion";
import { usePetRegistryStore } from "@/lib/registry/runtime";
import { buildPetRecord } from "@/lib/registry/registration";
import { DEFAULT_INPUT, type Project } from "@/lib/tools/activities";
const io = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock("@/lib/tools/forgePersistence", () => ({ loadForgeMemory: io.load }));
const alive = vi.hoisted(() => ({ director: null as unknown, play: vi.fn() }));
vi.mock("@/pet/alive/AliveContext", () => ({ useAlive: () => alive.director }));
vi.mock("@/pet/alive/music", () => ({ playBeatPose: alive.play }));
beforeEach(() => { vi.clearAllMocks(); alive.director = null; });
it("does not display another pet’s old creation name after identity changes", async () => {
  const hmacKey = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const a = await buildPetRecord({ hmacKey, random: () => 0.42 });
  const b = await buildPetRecord({ hmacKey, random: () => 0.24 });
  const project: Project = {
    version: 1,
    id: "work",
    toolId: "pattern-forge",
    title: "Private project A",
    createdAt: 1,
    updatedAt: 1,
    revision: 1,
    spark: { spot: "", prediction: "", reflection: "" },
    input: structuredClone(DEFAULT_INPUT),
  };
  io.load.mockImplementation(async (petId: string) => ({
    version: 1,
    petId,
    discoveries: [],
    projects: [
      {
        ...project,
        title: petId === a.petId ? "Private project A" : "Project B",
      },
    ],
  }));
  usePetRegistryStore.getState().setActiveRecord(a);
  render(
    <LearnedCompanionMotion>
      <div>Companion</div>
    </LearnedCompanionMotion>,
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Show learned movement" }),
  );
  expect(screen.getByText(/Private project A/)).toBeInTheDocument();
  act(() =>
    usePetRegistryStore
      .getState()
      .setActiveRecord({ ...a, name: "Same pet, updated metadata" }),
  );
  expect(io.load).toHaveBeenCalledTimes(1);
  act(() => usePetRegistryStore.getState().setActiveRecord(b));
  await screen.findByRole("button", { name: "Show learned movement" });
  expect(screen.queryByText(/Private project A/)).toBeNull();
});

it("keeps a still response under reduced motion even when the living director is present", async () => {
  const hmacKey = await crypto.subtle.generateKey({ name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  const pet = await buildPetRecord({ hmacKey, random: () => 0.42 });
  io.load.mockResolvedValue({
    version: 1, petId: pet.petId, discoveries: [],
    projects: [{
      version: 1, id: "work", toolId: "pattern-forge", title: "Calm pattern", createdAt: 1, updatedAt: 1, revision: 1,
      spark: { spot: "", prediction: "", reflection: "" }, input: structuredClone(DEFAULT_INPUT),
    } satisfies Project],
  });
  alive.director = {};
  const matchMedia = vi.spyOn(window, "matchMedia").mockImplementation((query: string) =>
    ({ matches: query.includes("reduce"), media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList);
  usePetRegistryStore.getState().setActiveRecord(pet);
  render(<LearnedCompanionMotion><div>Companion</div></LearnedCompanionMotion>);
  fireEvent.click(await screen.findByRole("button", { name: "Show learned movement" }));
  expect(screen.getByText(/Still response from Calm pattern/)).toBeInTheDocument();
  expect(alive.play).not.toHaveBeenCalled();
  matchMedia.mockRestore();
});
