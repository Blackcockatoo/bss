import type { PetRecordV2 } from "@/lib/registry/record";
import { copyGenome, LANES } from "./engine";
import { sha256 } from "./random";

/** Read a detached, content-checked copy. Never refresh, mint or save a record. */
export async function copyActivePetDna(record: PetRecordV2) {
  const genome = copyGenome(record.genome, record.genomeRadix);
  const hashes = [record.genomeHash.redHash, record.genomeHash.blueHash, record.genomeHash.blackHash];
  const actual = await Promise.all(LANES.map(lane => sha256(genome[lane].join(""))));
  if (actual.some((hash, i) => hash !== hashes[i])) throw new TypeError("Active pet DNA does not match its stored fingerprint");
  return { genome, radix: record.genomeRadix };
}
