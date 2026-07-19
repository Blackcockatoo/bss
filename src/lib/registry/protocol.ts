/** Portable, integrity-checked PetRecord packet (MP2). */

import { decodeGenome, hashGenome } from "@/lib/genome";
import {
  deriveSriYantraProjection,
  fingerprintSriYantraProjection,
} from "@/lib/geometry/projection";
import { getDeviceHmacKey, verifyCrest } from "@/lib/identity/crest";
import { deriveHeptaProfile } from "@/lib/heptaProfile";
import { heptaDecode42, heptaDecode42V2 } from "@/lib/identity/hepta";
import { webGenomeCryptoAdapter } from "@/lib/genome/webCrypto";

import {
  HEPTA_CODE_VERSION_V2,
  isPetRecordV2,
  type PetRecordV2,
} from "./record";
import type { PetRepository } from "./repository";
import { verifyRegistrationProof } from "./attestation";

export const PET_PACKET_PROTOCOL = "MP2" as const;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

const sameHash = (
  left: PetRecordV2["genomeHash"],
  right: PetRecordV2["genomeHash"],
): boolean =>
  left.redHash === right.redHash &&
  left.blueHash === right.blueHash &&
  left.blackHash === right.blackHash;

export async function exportPetPacket(record: PetRecordV2): Promise<string> {
  if (!isPetRecordV2(record))
    throw new Error("Cannot export a malformed pet record");
  const payload = JSON.stringify(record);
  const checksum = await webGenomeCryptoAdapter.sha256(
    `${PET_PACKET_PROTOCOL}|${payload}`,
  );
  return `${PET_PACKET_PROTOCOL}.${bytesToBase64Url(new TextEncoder().encode(payload))}.${checksum}`;
}

export interface ParsePetPacketOptions {
  hmacKey?: CryptoKey;
  /**
   * Force the legacy device-HMAC check in addition to the portable public
   * proof. It defaults on only for records that predate public attestation.
   */
  verifyLocalSignature?: boolean;
}

export async function parsePetPacket(
  packet: string,
  options: ParsePetPacketOptions = {},
): Promise<PetRecordV2> {
  const [protocol, encodedPayload, checksum, ...extra] = packet
    .trim()
    .split(".");
  if (
    protocol !== PET_PACKET_PROTOCOL ||
    !encodedPayload ||
    !checksum ||
    extra.length > 0
  ) {
    throw new Error("Invalid MP2 packet envelope");
  }

  const payload = new TextDecoder().decode(base64UrlToBytes(encodedPayload));
  const expectedChecksum = await webGenomeCryptoAdapter.sha256(
    `${PET_PACKET_PROTOCOL}|${payload}`,
  );
  if (checksum !== expectedChecksum) throw new Error("MP2 checksum mismatch");

  const parsed: unknown = JSON.parse(payload);
  if (!isPetRecordV2(parsed)) throw new Error("MP2 record shape is invalid");
  const record = parsed;

  const computedGenomeHash = await hashGenome(record.genome);
  if (!sameHash(computedGenomeHash, record.genomeHash)) {
    throw new Error("MP2 genome hash mismatch");
  }

  const projection = deriveSriYantraProjection(
    record.genome,
    record.projectionVersion,
  );
  const geometryFingerprint = await fingerprintSriYantraProjection(projection);
  if (geometryFingerprint !== record.geometryFingerprint) {
    throw new Error("MP2 geometry fingerprint mismatch");
  }

  const traits = decodeGenome(record.genome);
  if (JSON.stringify(traits) !== JSON.stringify(record.traits)) {
    throw new Error("MP2 derived traits mismatch");
  }
  if (
    record.heptaProfile &&
    JSON.stringify(deriveHeptaProfile(record.genome)) !==
      JSON.stringify(record.heptaProfile)
  ) {
    throw new Error("MP2 HeptaProfile mismatch");
  }

  if (record.registrationProof) {
    if (!(await verifyRegistrationProof(record))) {
      throw new Error("MP2 portable registration proof is invalid");
    }
  }

  if (options.verifyLocalSignature ?? !record.registrationProof) {
    const key = options.hmacKey ?? (await getDeviceHmacKey());
    if (!record.crest || !(await verifyCrest(record.crest, key))) {
      throw new Error("MP2 registration signature is not valid on this device");
    }
    if (record.heptaCode) {
      const decoded =
        record.heptaCode.version === HEPTA_CODE_VERSION_V2
          ? await heptaDecode42V2(record.heptaCode.digits, key)
          : await heptaDecode42(record.heptaCode.digits, key);
      if (!decoded) throw new Error("MP2 HeptaCode verification failed");
    }
  }

  return record;
}

export async function importPetPacket(
  packet: string,
  repository: PetRepository,
  options: ParsePetPacketOptions = {},
): Promise<PetRecordV2> {
  const record = await parsePetPacket(packet, options);
  await repository.saveRecord(record, { activate: false });
  return record;
}
