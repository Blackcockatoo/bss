import { beforeAll, describe, expect, it } from "vitest";

import { createMemoryStorage, createPetRepository } from "./repository";
import { buildPetRecord } from "./registration";
import { exportPetPacket, importPetPacket, parsePetPacket } from "./protocol";

let hmacKey: CryptoKey;

beforeAll(async () => {
  hmacKey = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
});

describe("MP2 pet packets", () => {
  it("round-trips and verifies the registered genome, geometry, crest and HeptaCode", async () => {
    const record = await buildPetRecord({ hmacKey, random: () => 0.42 });
    const packet = await exportPetPacket(record);
    await expect(parsePetPacket(packet, { hmacKey })).resolves.toEqual(record);
  });

  it("verifies portably without the originating device HMAC key", async () => {
    const record = await buildPetRecord({ hmacKey, random: () => 0.27 });
    const unrelatedDeviceKey = await crypto.subtle.generateKey(
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );

    await expect(
      parsePetPacket(await exportPetPacket(record), {
        hmacKey: unrelatedDeviceKey,
      }),
    ).resolves.toEqual(record);
  });

  it("rejects a modified envelope", async () => {
    const record = await buildPetRecord({ hmacKey, random: () => 0.31 });
    const packet = await exportPetPacket(record);
    const corrupted = `${packet.slice(0, -1)}${packet.endsWith("a") ? "b" : "a"}`;
    await expect(parsePetPacket(corrupted, { hmacKey })).rejects.toThrow(
      "checksum",
    );
  });

  it("imports a verified pet without changing the active pet", async () => {
    const record = await buildPetRecord({ hmacKey, random: () => 0.63 });
    const repository = createPetRepository(createMemoryStorage());
    const imported = await importPetPacket(
      await exportPetPacket(record),
      repository,
      { hmacKey },
    );
    expect(imported.petId).toBe(record.petId);
    expect(await repository.getRecord(record.petId)).toEqual(record);
    expect(await repository.loadActiveRecord()).toBeNull();
  });
});
