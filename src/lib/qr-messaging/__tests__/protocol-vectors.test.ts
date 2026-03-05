import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  computeSharedSecret,
  decodeMoss60,
  decodeProtocolPayload,
  deriveKeys,
  encodeMoss60,
  extendedHash,
  generateKeyPair,
  moss60Hash,
  parseProtocolEnvelope,
  toBase60,
  validateProtocolEnvelope,
} from "@/lib/qr-messaging";
import { describe, expect, it } from "vitest";

function getModuleFilePath(metaUrl: string): string {
  if (metaUrl.startsWith("file://")) {
    return fileURLToPath(metaUrl);
  }

  const fsSegment = "/@fs/";
  const fsIndex = metaUrl.indexOf(fsSegment);
  if (fsIndex >= 0) {
    return decodeURIComponent(metaUrl.slice(fsIndex + fsSegment.length));
  }

  return process.cwd();
}

const protocolFixtureRoot = path.resolve(
  path.dirname(getModuleFilePath(import.meta.url)),
  "../../../../docs/protocol/vectors",
);

function loadFixture<T>(name: string): T {
  const fixturePath = path.join(protocolFixtureRoot, name);
  return JSON.parse(readFileSync(fixturePath, "utf8")) as T;
}

describe("MOSS60 protocol fixtures", () => {
  it("matches hash vectors", () => {
    const fixture = loadFixture<{
      vectors: Array<{ input: string; hash: string; extended8: string }>;
    }>("hash-vectors.json");

    for (const vector of fixture.vectors) {
      expect(moss60Hash(vector.input)).toBe(vector.hash);
      expect(extendedHash(vector.input, 8)).toBe(vector.extended8);
    }
  });

  it("matches encoding vectors", () => {
    const fixture = loadFixture<{
      vectors: Array<{
        input: string;
        base60: string;
        moss60: string;
        roundTrip: string;
      }>;
    }>("encoding-vectors.json");

    for (const vector of fixture.vectors) {
      expect(toBase60(vector.input)).toBe(vector.base60);
      expect(encodeMoss60(vector.input)).toBe(vector.moss60);
      expect(decodeMoss60(vector.moss60)).toBe(vector.roundTrip);
    }
  });

  it("matches key derivation vectors", () => {
    const fixture = loadFixture<{
      seeds: { alice: string; bob: string };
      bobPublic: string;
      sharedSecret: number[];
      encryptionKey: number[];
      decryptionKey: number[];
    }>("key-derivation-vectors.json");

    const alice = generateKeyPair(fixture.seeds.alice);
    const sharedSecret = computeSharedSecret(alice.private, fixture.bobPublic);
    const keys = deriveKeys(sharedSecret);

    expect(sharedSecret).toEqual(fixture.sharedSecret);
    expect(keys.encryptionKey).toEqual(fixture.encryptionKey);
    expect(keys.decryptionKey).toEqual(fixture.decryptionKey);
  });

  it("matches envelope vectors and validates negotiation", () => {
    const fixture = loadFixture<{
      vectors: Array<{ name: string; rawEnvelope: string }>;
    }>("envelope-vectors.json");

    for (const vector of fixture.vectors) {
      const envelope = parseProtocolEnvelope(vector.rawEnvelope);
      expect(envelope, vector.name).not.toBeNull();
      if (!envelope) continue;

      expect(() => validateProtocolEnvelope(envelope)).not.toThrow();

      const decoded = decodeProtocolPayload(vector.rawEnvelope);
      expect(decoded.decoded.length).toBeGreaterThan(0);
      expect(decoded.envelope?.version).toBe("1.0");
      expect(decoded.envelope?.capabilities.length).toBeGreaterThanOrEqual(4);
    }
  });
});
