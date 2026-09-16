/** An opt-in game RNG. Existing Moss seeds and stored pet rules are untouched. */
export const RNG_VERSION = "moss60-rng/experimental-v2" as const;

export interface RandomCheckpoint {
  version: typeof RNG_VERSION;
  s0: string;
  s1: string;
}

export async function sha256(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function createLabRandom(seed: string, checkpoint?: RandomCheckpoint) {
  if (typeof seed !== "string" || seed.length > 256) throw new TypeError("Seed must contain at most 256 characters");
  let s0: bigint;
  let s1: bigint;
  if (checkpoint) {
    if (checkpoint.version !== RNG_VERSION || typeof checkpoint.s0 !== "string" || typeof checkpoint.s1 !== "string" ||
        !/^[0-9a-f]{1,16}$/.test(checkpoint.s0) || !/^[0-9a-f]{1,16}$/.test(checkpoint.s1)) {
      throw new TypeError("Invalid random checkpoint");
    }
    s0 = BigInt(`0x${checkpoint.s0}`);
    s1 = BigInt(`0x${checkpoint.s1}`);
    if ((s0 | s1) === 0n) throw new TypeError("Random state cannot be zero");
  } else {
    const hash = await sha256(`${RNG_VERSION}|${seed}`);
    s0 = BigInt(`0x${hash.slice(0, 16)}`);
    s1 = BigInt(`0x${hash.slice(16, 32)}`);
    if ((s0 | s1) === 0n) s1 = 1n;
  }
  return {
    next(): number {
      let x = s0;
      const y = s1;
      s0 = y;
      x ^= BigInt.asUintN(64, x << 23n);
      x ^= x >> 17n;
      x ^= y ^ (y >> 26n);
      s1 = BigInt.asUintN(64, x);
      return Number(BigInt.asUintN(64, s0 + s1) >> 11n) / 9007199254740992;
    },
    snapshot(): RandomCheckpoint {
      return { version: RNG_VERSION, s0: s0.toString(16), s1: s1.toString(16) };
    },
  };
}
