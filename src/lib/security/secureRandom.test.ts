import { describe, expect, it, vi } from "vitest";
import { secureRandomFloat, secureRandomHex, secureRandomInt } from "./secureRandom";

describe("secureRandom", () => {
  it("returns integers inside the requested bound", () => {
    for (let i = 0; i < 2000; i += 1) {
      const value = secureRandomInt(16384);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(16384);
    }
    expect(secureRandomInt(1)).toBe(0);
  });

  it("rejects invalid bounds", () => {
    expect(() => secureRandomInt(0)).toThrow(RangeError);
    expect(() => secureRandomInt(1.5)).toThrow(RangeError);
    expect(() => secureRandomHex(0)).toThrow(RangeError);
  });

  it("uses crypto.getRandomValues, never Math.random", () => {
    const mathSpy = vi.spyOn(Math, "random");
    const cryptoSpy = vi.spyOn(globalThis.crypto, "getRandomValues");
    secureRandomInt(7);
    secureRandomFloat();
    secureRandomHex(8);
    expect(mathSpy).not.toHaveBeenCalled();
    expect(cryptoSpy).toHaveBeenCalled();
    mathSpy.mockRestore();
    cryptoSpy.mockRestore();
  });

  it("rejection-samples values that would bias the modulo", () => {
    const spy = vi
      .spyOn(globalThis.crypto, "getRandomValues")
      .mockImplementationOnce(<T extends ArrayBufferView | null>(array: T): T => {
        (array as unknown as Uint32Array)[0] = 0xffffffff; // above limit for bound 3
        return array;
      })
      .mockImplementationOnce(<T extends ArrayBufferView | null>(array: T): T => {
        (array as unknown as Uint32Array)[0] = 5;
        return array;
      });
    expect(secureRandomInt(3)).toBe(2);
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });

  it("produces hex of the requested length and floats in [0, 1)", () => {
    expect(secureRandomHex(12)).toMatch(/^[0-9a-f]{24}$/);
    const f = secureRandomFloat();
    expect(f).toBeGreaterThanOrEqual(0);
    expect(f).toBeLessThan(1);
  });
});
