import { beforeAll, describe, expect, it } from "vitest";

import {
  buildPetRecord,
  createMemoryStorage,
  createPetRepository,
} from "@/lib/registry";

import {
  breedRegisteredPets,
  createBreedingPacket,
  evaluateCrownwheel,
  isCrownwheelEdge,
  registerOffspring,
} from "./registered";

let hmacKey: CryptoKey;

beforeAll(async () => {
  hmacKey = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
});

async function parents() {
  const one = await buildPetRecord({
    hmacKey,
    random: () => 0.11,
    name: "One",
  });
  const two = await buildPetRecord({
    hmacKey,
    random: () => 0.88,
    name: "Two",
  });
  return [one, two] as const;
}

describe("registered geometry breeding", () => {
  it("is commutative and perfectly replayable for one MPB1 packet", async () => {
    const [one, two] = await parents();
    const packet = createBreedingPacket(one, two, {
      conceptionNonce: "same-conception",
      conceivedAt: 1_800_000_000_000,
    });
    const forward = await breedRegisteredPets(one, two, packet);
    const reverse = await breedRegisteredPets(two, one, packet);
    expect(reverse.offspring).toEqual(forward.offspring);
    expect(reverse.geometryFingerprint).toBe(forward.geometryFingerprint);
    expect(reverse.mutations).toEqual(forward.mutations);
  });

  it("uses a fresh conception nonce to create a different sibling", async () => {
    const [one, two] = await parents();
    const first = await breedRegisteredPets(
      one,
      two,
      createBreedingPacket(one, two, {
        conceptionNonce: "sibling-a",
        conceivedAt: 1,
      }),
    );
    const second = await breedRegisteredPets(
      one,
      two,
      createBreedingPacket(one, two, {
        conceptionNonce: "sibling-b",
        conceivedAt: 2,
      }),
    );
    expect(second.offspring).not.toEqual(first.offspring);
  });

  it("inherits whole pentad chambers and declares every non-mutated locus", async () => {
    const [one, two] = await parents();
    const preview = await breedRegisteredPets(
      one,
      two,
      createBreedingPacket(one, two, {
        conceptionNonce: "provenance",
        conceivedAt: 3,
        mutationRate: 0,
      }),
    );
    expect(preview.chamberProvenance).toHaveLength(36);
    expect(preview.contribution.parent1).toBeGreaterThanOrEqual(33);
    expect(preview.contribution.parent2).toBeGreaterThanOrEqual(33);
    const mutationLoci = new Set(
      preview.mutations.map((entry) => `${entry.strand}:${entry.index}`),
    );
    for (const entry of preview.chamberProvenance) {
      const parent = entry.parentId === one.petId ? one : two;
      const parentLane =
        entry.strand === "red"
          ? parent.genome.red60
          : entry.strand === "blue"
            ? parent.genome.blue60
            : parent.genome.black60;
      const childLane =
        entry.strand === "red"
          ? preview.offspring.red60
          : entry.strand === "blue"
            ? preview.offspring.blue60
            : preview.offspring.black60;
      for (let index = entry.start; index <= entry.end; index += 1) {
        if (!mutationLoci.has(`${entry.strand}:${index}`)) {
          expect(childLane[index]).toBe(parentLane[index]);
        }
      }
    }
  });

  it("applies mutation rate across all 180 unique loci with provenance", async () => {
    const [one, two] = await parents();
    const preview = await breedRegisteredPets(
      one,
      two,
      createBreedingPacket(one, two, {
        mode: "MUTATION",
        conceptionNonce: "mutation-count",
        conceivedAt: 4,
        mutationRate: 0.1,
      }),
    );
    const loci = new Set(
      preview.mutations.map((entry) => `${entry.strand}:${entry.index}`),
    );
    const crownwheelMutationCount = {
      stable: 0,
      "tail-mutation": 1,
      "body-shift": 1,
      wild: 5,
      "mythic-prime": 3,
    }[preview.crownwheel.outcome];
    const expectedMutationCount = 18 + crownwheelMutationCount;
    expect(preview.mutations).toHaveLength(expectedMutationCount);
    expect(loci.size).toBe(expectedMutationCount);
    expect(
      preview.mutations.every((entry) => entry.before !== entry.after),
    ).toBe(true);
  });

  it("implements K3,3 minus the three matching Crownwheel edges", async () => {
    const [one, two] = await parents();
    const result = evaluateCrownwheel(one, two, "fixed-crownwheel");
    const bodyIndex = ["RB", "BC", "CW"].indexOf(result.parent1.body);
    const tailIndex = ["A", "B", "C"].indexOf(result.parent2.tail);
    expect(result.forwardEdgeValid).toBe(bodyIndex !== tailIndex);
    expect(result.compatibility).toBeGreaterThanOrEqual(30);

    const bodies = ["RB", "BC", "CW"] as const;
    const tails = ["A", "B", "C"] as const;
    for (const [bodyIndex, body] of bodies.entries()) {
      for (const [tailIndex, tail] of tails.entries()) {
        expect(isCrownwheelEdge(body, tail)).toBe(bodyIndex !== tailIndex);
      }
    }
  });

  it("registers exactly the previewed child without activating it", async () => {
    const [one, two] = await parents();
    const repository = createPetRepository(createMemoryStorage());
    await repository.saveRecord(one);
    await repository.saveRecord(two, { activate: false });
    const packet = createBreedingPacket(one, two, {
      conceptionNonce: "mint-child",
      conceivedAt: 5,
    });
    const { record, preview } = await registerOffspring(
      one,
      two,
      packet,
      repository,
      "Nova",
    );
    expect(record.name).toBe("Nova");
    expect(record.genome).toEqual(preview.offspring);
    expect(record.geometryFingerprint).toBe(preview.geometryFingerprint);
    expect(record.lineage.parentIds).toEqual(packet.parentIds);
    expect(await repository.loadActiveRecord()).toEqual(one);
  });
});
