import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildPetRecord } from "@/lib/registry/registration";
import { makeCreatureSnapshot } from "@/lib/expressions/snapshot";
import { DEFAULT_SETTINGS, EXPRESSIONS, FORMS, getExpression, sampleExpression } from "@/lib/expressions/studio";
import { PROP_KINDS } from "@/lib/expressions/contract";
import { PROP_ANCHORS, PropLayer } from "./PropLayer";
import { getGenomeVisualFingerprint } from "@/visual-dna/bodyForgeAdapter";
import { DEFAULT_BODY_SPEC } from "@/components/body-forge/PetBodyRenderer";
import { getWardrobeItemById } from "@/lib/wardrobe/catalog";
import { DEFAULT_CAPTION, DEFAULT_SCENE, ExpressionArt } from "./ExpressionArt";

async function representativePet(offset: number) {
  const hmacKey = await crypto.subtle.generateKey({ name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  const strand = (step: number) => Array.from({ length: 60 }, (_, index) =>
    (Math.floor(index / 4) + index * step + offset) % 10,
  );
  return buildPetRecord({
    name: "Private alias",
    genome: { red60: strand(1), blue60: strand(3), black60: strand(7) },
    hmacKey, createdAt: 1_700_000_000_000,
  });
}

describe("expression renderer snapshots", () => {
  it("keeps both registered creatures intact while adapting inherited body shapes and evolution", async () => {
    const [basic, advanced] = await Promise.all([representativePet(0), representativePet(4)]);
    advanced.evolution.state = "SPECIATION";
    const before = structuredClone([basic, advanced]);
    const first = makeCreatureSnapshot(basic);
    const evolved = makeCreatureSnapshot(advanced, {
      guardian: { energy: 92, health: 82, bond: 45, curiosity: 86, dreamCount: 0, activatedCount: 6, reduceMotion: false },
      forged: {
        version: 3, savedAt: 1, genomeFingerprint: getGenomeVisualFingerprint(advanced.genome),
        body: { ...DEFAULT_BODY_SPEC, shape: "crystal", primaryColor: "#1e95ab", features: ["wings", "crown"] },
      },
      addons: [], positions: {},
      cosmetics: [getWardrobeItemById("crown-gold")!, getWardrobeItemById("aura-fire")!],
    });
    expect(first.strands).not.toEqual(evolved.strands);
    expect(first.seed).not.toEqual(evolved.seed);
    expect(evolved.body.shape).toBe("crystal");
    expect(evolved.auralia.form).toBe("wild");
    const expression = getExpression("win")!;
    for (const pet of [first, evolved]) {
      const frame = sampleExpression(expression, expression.staticFrame, DEFAULT_SETTINGS, pet.personality, pet.seed);
      for (const form of FORMS) {
        const { container, unmount } = render(
          <ExpressionArt pet={pet} frame={frame} expression={expression} form={form}
            caption={DEFAULT_CAPTION} scene={DEFAULT_SCENE} />,
        );
        expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 512 512");
        expect(container.querySelectorAll("path, ellipse, circle").length).toBeGreaterThan(12);
        const ids = [...container.querySelectorAll("[id]")].map(node => node.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(container.textContent).not.toContain("Private alias");
        expect(container.innerHTML).not.toContain(advanced.petId);
        expect(container.querySelector("animate, animateTransform")).toBeNull();
        if (pet === evolved && form !== "geometry") {
          expect(container.querySelector('[data-cosmetic-id="crown-gold"]')).toBeTruthy();
          expect(container.querySelector('[data-cosmetic-id="aura-fire"]')).toBeTruthy();
        }
        unmount();
      }
    }
    expect([basic, advanced]).toEqual(before);
  });

  it("renders every expression on every form from a frozen snapshot without touching the record", async () => {
    const record = await representativePet(2);
    const before = structuredClone(record);
    const freeze = <T,>(value: T): T => {
      if (value && typeof value === "object" && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const key of Object.keys(value)) freeze((value as Record<string, unknown>)[key]);
      }
      return value;
    };
    const pet = freeze(makeCreatureSnapshot(record));
    // The snapshot is a copy: nothing in it aliases the canonical record.
    expect(pet.personality).not.toBe(record.traits.personality);
    expect(pet.evolution).not.toBe(record.evolution);
    for (const expression of EXPRESSIONS) {
      for (const phase of [expression.staticFrame, .5, expression.reducedMotionFrame]) {
        const frame = sampleExpression(expression, phase, DEFAULT_SETTINGS, pet.personality, pet.seed);
        for (const form of FORMS) {
          const { container, unmount } = render(
            <ExpressionArt pet={pet} frame={frame} expression={expression} form={form}
              caption={{ ...DEFAULT_CAPTION, bottom: expression.caption }} scene={DEFAULT_SCENE} />,
          );
          const html = container.innerHTML;
          expect(html, `${expression.id}/${form}`).not.toMatch(/(?:href|src)="(?:https?:|\/\/|javascript:)/i);
          expect(html).not.toContain("NaN");
          const ids = [...container.querySelectorAll("[id]")].map(node => node.id);
          expect(new Set(ids).size, `${expression.id}/${form}`).toBe(ids.length);
          unmount();
        }
      }
    }
    expect(record).toEqual(before);
  }, 60_000);

  it("draws every prop as inline vector art at each form's anchor", () => {
    for (const form of FORMS) {
      const { container, unmount } = render(
        <svg><PropLayer props={PROP_KINDS.map(kind => ({ kind, t: .5 }))} anchor={PROP_ANCHORS[form]} /></svg>,
      );
      for (const kind of PROP_KINDS) {
        const node = container.querySelector(`[data-prop="${kind}"]`);
        expect(node, `${form}/${kind}`).toBeTruthy();
        expect(node!.querySelectorAll("path, circle, ellipse, rect, line, polygon, polyline").length).toBeGreaterThan(0);
      }
      expect(container.querySelector("text, image, foreignObject")).toBeNull();
      unmount();
    }
  });
});
