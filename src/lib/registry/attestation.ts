/** Portable public-key attestation for immutable registered-pet identity. */

import type { PetRecordV2, RegistrationProofV1 } from "./record";

export const REGISTRATION_PROOF_VERSION = "registration-proof/v1" as const;
export const REGISTRATION_PROOF_ALGORITHM = "ECDSA-P256-SHA256" as const;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
    .buffer as ArrayBuffer;
}

/**
 * Canonical immutable subject. Mutable display name, vitals and evolution are
 * deliberately excluded. A Hepta privacy rotation requires a new attestation.
 * Genome-derived values are independently recomputed during MP2 import.
 */
export function registrationProofPayload(record: PetRecordV2): string {
  return JSON.stringify({
    proofVersion: REGISTRATION_PROOF_VERSION,
    schemaVersion: record.schemaVersion,
    rulesetVersion: record.rulesetVersion,
    petId: record.petId,
    createdAt: record.createdAt,
    genomeHash: [
      record.genomeHash.redHash,
      record.genomeHash.blueHash,
      record.genomeHash.blackHash,
    ],
    genomeRadix: record.genomeRadix,
    projection: [record.projectionVersion, record.geometryFingerprint],
    crest: record.crest
      ? [
          record.crest.vault,
          record.crest.rotation,
          [...record.crest.tail],
          record.crest.coronatedAt,
          record.crest.dnaHash,
          record.crest.mirrorHash,
          record.crest.signature,
        ]
      : null,
    heptaCode: record.heptaCode
      ? [record.heptaCode.version, [...record.heptaCode.digits]]
      : null,
    lineage: [
      record.lineage.generation,
      [...record.lineage.parentIds],
      [...record.lineage.ancestorIds],
    ],
    mutations: record.mutationLog.map((entry) => [
      entry.strand,
      entry.index,
      entry.before,
      entry.after,
      entry.reason,
      entry.at,
    ]),
  });
}

export async function createRegistrationProof(
  record: PetRecordV2,
): Promise<RegistrationProofV1> {
  const pair = (await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  const payload = new TextEncoder().encode(registrationProofPayload(record));
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    pair.privateKey,
    payload,
  );

  return {
    version: REGISTRATION_PROOF_VERSION,
    algorithm: REGISTRATION_PROOF_ALGORITHM,
    publicKeyJwk: await crypto.subtle.exportKey("jwk", pair.publicKey),
    signature: bytesToBase64Url(new Uint8Array(signature)),
  };
}

export async function verifyRegistrationProof(
  record: PetRecordV2,
): Promise<boolean> {
  const proof = record.registrationProof;
  if (
    !proof ||
    proof.version !== REGISTRATION_PROOF_VERSION ||
    proof.algorithm !== REGISTRATION_PROOF_ALGORITHM
  ) {
    return false;
  }

  try {
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      proof.publicKeyJwk,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    return crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      publicKey,
      base64UrlToBytes(proof.signature),
      new TextEncoder().encode(registrationProofPayload(record)),
    );
  } catch {
    return false;
  }
}
