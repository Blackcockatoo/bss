import { describe, expect, it } from "vitest";

import { SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY } from "@/lib/schools/storage";

import { groupCountFor, makeEvenGroups, randomiseGroups } from "./groupRandomiser";
import {
  parseLocalAliasRoster,
  placeholderStudentLabels,
  readLocalAliasRoster,
} from "./localAliasRoster";

describe("group randomiser", () => {
  it("keeps group sizes within one of each other and avoids a group of one when possible", () => {
    expect(groupCountFor(7, 3)).toBe(3);
    expect(makeEvenGroups(["a", "b", "c", "d", "e", "f", "g"], 3).map((group) => group.length)).toEqual([
      3, 2, 2,
    ]);
    expect(makeEvenGroups(["a", "b", "c", "d", "e"], 2).map((group) => group.length)).toEqual([
      3, 2,
    ]);
    expect(makeEvenGroups(["a", "b", "c"], 3)).toEqual([["a", "b", "c"]]);
  });

  it("shuffles with the provided random function and does not drop anyone", () => {
    const aliases = ["Pip", "Jo", "Sam", "Alex"];
    let calls = 0;
    const random = () => {
      calls += 1;
      return 0;
    };
    const groups = randomiseGroups(aliases, 2, random);
    expect(calls).toBeGreaterThan(0);
    expect(groups.flat().sort()).toEqual([...aliases].sort());
  });

  it("reads aliases from the existing local roster only", () => {
    const storage = {
      getItem(key: string) {
        if (key === SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY) {
          return JSON.stringify([
            { id: "1", alias: "Pip", addedAt: 1 },
            { id: "2", alias: "Pip", addedAt: 2 },
            { id: "3", alias: "  Jo ", addedAt: 3 },
          ]);
        }
        return null;
      },
    };
    expect(readLocalAliasRoster(storage).map((entry) => entry.alias)).toEqual([
      "Pip",
      "Jo",
    ]);
    expect(parseLocalAliasRoster("not-json")).toEqual([]);
    expect(placeholderStudentLabels(3)).toEqual([
      "Student 1",
      "Student 2",
      "Student 3",
    ]);
    expect(placeholderStudentLabels(999)).toHaveLength(60);
  });
});
