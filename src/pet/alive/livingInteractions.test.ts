import { describe, expect, it } from "vitest";
import { beatGaps } from "./BeatReply";
import { isRepeatedFigureEight } from "./MirrorGesture";
import { readGreetingHabit, rememberedGreetingSide, updateGreetingHabit, writeGreetingHabit } from "./greetingHabit";

describe("living interactions", () => {
  it("bounds the two reply intervals to the playable range", () => {
    expect(beatGaps([200, 230, 1440, 1490])).toEqual([150, 900]);
    expect(beatGaps([0, 230.4, 540.8])).toEqual([230, 310]);
  });

  it("requires four alternating closed lobes for two sideways eights", () => {
    const makeLobe = (side: number) => Array.from({ length: 26 }, (_, index) => {
      const angle = index * Math.PI * 2 / 25;
      return { x: side * .37 * (1 - Math.cos(angle)), y: .62 * Math.sin(angle) };
    });
    const normal = [...makeLobe(1), ...makeLobe(-1)];
    expect(isRepeatedFigureEight([...normal, ...normal])).toBe(true);
    expect(isRepeatedFigureEight(normal)).toBe(false);
    expect(isRepeatedFigureEight(makeLobe(1).concat(makeLobe(1), makeLobe(1), makeLobe(1)))).toBe(false);
    expect(isRepeatedFigureEight(normal.map(point => ({ ...point, y: 0 })))).toBe(false);
  });

  it("stores only a bounded, optional hint per pet and supports clearing it", () => {
    const petId = "test-left";
    writeGreetingHabit(petId, null);
    expect(readGreetingHabit(petId)).toBeNull();
    expect(rememberedGreetingSide(-2)).toBe(0);
    expect(rememberedGreetingSide(-3)).toBe(-1);
    expect(rememberedGreetingSide(4)).toBe(1);
    expect(updateGreetingHabit(-5, -1)).toBe(-5);
    expect(updateGreetingHabit(5, 1)).toBe(5);
    expect(updateGreetingHabit(4, 0)).toBe(4);
    expect(writeGreetingHabit(petId, -4)).toBe(true);
    expect(readGreetingHabit(petId)).toBe(-4);
    expect(readGreetingHabit("test-right")).toBeNull();
    localStorage.setItem("metapet:alive:greeting:v1:test-left", "99");
    expect(readGreetingHabit(petId)).toBeNull();
    writeGreetingHabit(petId, null);
    expect(readGreetingHabit(petId)).toBeNull();
  });
});
