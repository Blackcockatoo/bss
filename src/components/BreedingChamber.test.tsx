import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PetRecordV2 } from "@/lib/registry";

import { BreedingChamber } from "./BreedingChamber";

const mocks = vi.hoisted(() => ({
  records: [] as PetRecordV2[],
  recordBreeding: vi.fn(),
  saveRecord: vi.fn(),
  createPacket: vi.fn(),
  breed: vi.fn(),
  register: vi.fn(),
}));

vi.mock("@/lib/store", () => ({
  useStore: (selector: (state: { recordBreeding: () => void }) => unknown) =>
    selector({ recordBreeding: mocks.recordBreeding }),
}));

vi.mock("@/lib/registry", () => ({
  PROJECTION_VERSION_V2: "sri-yantra-chambers/v2",
  getPetRepository: () => ({
    listRecords: async () => mocks.records,
    saveRecord: mocks.saveRecord,
  }),
  buildPetRecord: vi.fn(),
  importPetPacket: vi.fn(),
}));

vi.mock("@/lib/breeding", () => ({
  createBreedingPacket: mocks.createPacket,
  breedRegisteredPets: mocks.breed,
  registerOffspring: mocks.register,
}));

vi.mock("./GeometryAvatarRenderer", () => ({
  GeometryAvatarRenderer: ({
    identityKeyOverride,
  }: {
    identityKeyOverride: string;
  }) => (
    <div
      data-testid="offspring-geometry-preview"
      data-identity={identityKeyOverride}
    />
  ),
}));

function record(petId: string, name: string, createdAt: number): PetRecordV2 {
  return {
    petId,
    name,
    createdAt,
    lineage: { generation: 0, parentIds: [], ancestorIds: [] },
  } as unknown as PetRecordV2;
}

describe("BreedingChamber", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const one = record("pet-one", "One", 1);
    const two = record("pet-two", "Two", 2);
    mocks.records = [one, two];
    const packet = {
      protocol: "MPB1",
      checksum: "locked-conception",
      parentIds: [one.petId, two.petId],
    };
    const preview = {
      packet,
      offspring: {
        red60: Array(60).fill(1),
        blue60: Array(60).fill(2),
        black60: Array(60).fill(3),
      },
      traits: { personality: { temperament: "Bright" } },
      heptaProfile: {
        temperament: "spark-voice",
        dominantAxis: "spark",
        secondaryAxis: "voice",
      },
      geometryFingerprint: "geometry-child-fingerprint",
      contribution: { parent1: 50, parent2: 50 },
      crownwheel: { outcome: "stable", compatibility: 100 },
      chamberProvenance: Array(36).fill({}),
      mutations: [],
    };
    const child = {
      ...record("pet-child", "Nova", 3),
      genome: preview.offspring,
      geometryFingerprint: preview.geometryFingerprint,
      lineage: {
        generation: 1,
        parentIds: [one.petId, two.petId],
        ancestorIds: [one.petId, two.petId],
      },
    } as unknown as PetRecordV2;
    mocks.createPacket.mockReturnValue(packet);
    mocks.breed.mockResolvedValue(preview);
    mocks.register.mockResolvedValue({ record: child, preview });
  });

  it("previews and registers the exact packet-derived geometry", async () => {
    render(<BreedingChamber />);

    const blend = await screen.findByRole("button", {
      name: "Blend Geometry",
    });
    expect(blend).toBeEnabled();
    fireEvent.click(blend);

    const geometry = await screen.findByTestId("offspring-geometry-preview");
    expect(geometry).toHaveAttribute("data-identity", "locked-conception");
    expect(mocks.breed).toHaveBeenCalledWith(
      mocks.records[0],
      mocks.records[1],
      expect.objectContaining({ checksum: "locked-conception" }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Register This Exact Child" }),
    );
    await waitFor(() => expect(mocks.register).toHaveBeenCalledTimes(1));
    expect(mocks.recordBreeding).toHaveBeenCalledTimes(1);
  });
});
