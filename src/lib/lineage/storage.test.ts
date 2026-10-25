import { describe, expect, it, vi } from "vitest";
import { generateFounderCoatOfArms } from "./generator";
import { heraldryKey, isCoatOfArms, loadPetHeraldry } from "./storage";

describe("saved companion heraldry", () => {
  it("keeps a valid existing coat exactly, including a customised motto", () => {
    const coat = {
      ...generateFounderCoatOfArms("pet", 47),
      motto: "Grow together",
    };
    const storage = { getItem: () => JSON.stringify(coat), setItem: vi.fn() };
    expect(loadPetHeraldry("pet", 3, storage)).toEqual({ coat, notice: null });
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it.each(["{bad json", '{"charges":null}', "null"])(
    "preserves damaged saved data: %s",
    (value) => {
      const storage = { getItem: () => value, setItem: vi.fn() };
      const result = loadPetHeraldry("pet", 2, storage);
      expect(isCoatOfArms(result.coat)).toBe(true);
      expect(result.coat.generation).toBe(2);
      expect(result.notice).toContain("saved data has been kept");
      expect(storage.setItem).not.toHaveBeenCalled();
    },
  );

  it("keeps the existing storage key and deterministic default design", () => {
    const storage = { getItem: () => null, setItem: vi.fn() };
    const first = loadPetHeraldry("pet", 1, storage).coat;
    const second = loadPetHeraldry("pet", 1, storage).coat;
    expect(first.charges).toEqual(second.charges);
    expect(storage.setItem).toHaveBeenCalledWith(
      heraldryKey("pet"),
      JSON.stringify(first),
    );
    expect(isCoatOfArms(first)).toBe(true);
  });

  it("survives unavailable local storage without mutating companion records", () => {
    const storage = {
      getItem: () => {
        throw new Error("Denied");
      },
      setItem: vi.fn(),
    };
    expect(loadPetHeraldry("pet", 0, storage).notice).toBeTruthy();
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
