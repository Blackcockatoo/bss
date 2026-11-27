import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildPetRecord } from "@/lib/registry/registration";
import { makeCreatureSnapshot } from "@/lib/expressions/snapshot";
import { DEFAULT_SETTINGS, EXPRESSIONS, FORMS, getExpression, sampleExpression } from "@/lib/expressions/studio";
import { PROP_KINDS } from "@/lib/expressions/contract";
import { PROP_ANCHORS, PropLayer } from "./PropLayer";
import { getGenomeVisualFingerprint } from "@/visual-dna/bodyForgeAdapter";
import { DEFAULT_BODY_SPEC } from "@/components/body-forge/PetBodyRenderer";
import { getWardrobeItemById } from "@/lib/wardrobe/catalog";
import { DEFAULT_CAPTION, DEFAULT_SCENE, ExpressionArt, bodyFit } from "./ExpressionArt";
import { OLD_VIC_MANTLE } from "@/lib/addons/oldVicMantle";
import type { Addon } from "@/lib/addons/types";

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
          const html = renderToStaticMarkup(
            <ExpressionArt pet={pet} frame={frame} expression={expression} form={form}
              caption={{ ...DEFAULT_CAPTION, bottom: expression.caption }} scene={DEFAULT_SCENE} />,
          );
          expect(html, `${expression.id}/${form}`).not.toMatch(/(?:href|src)="(?:https?:|\/\/|javascript:)/i);
          expect(html).not.toContain("NaN");
          const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
          expect(new Set(ids).size, `${expression.id}/${form}`).toBe(ids.length);
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

describe("bodyFit", () => {
  const still = { x: 0, y: 0, angle: 0, scale: 1, squash: 0 } as Parameters<typeof bodyFit>[1];
  it("leaves resting poses and the round forms alone", () => {
    expect(bodyFit("geometry", still)).toBe(1);
    expect(bodyFit("auralia", { ...still, angle: 180, y: -45, squash: -.25, scale: 1.3 })).toBe(1);
  });
  it("keeps an upside-down, stretched Geometry jump inside the stage", () => {
    const frame = { ...still, angle: 180, y: -18, squash: -.2 };
    const fit = bodyFit("geometry", frame);
    expect(fit).toBeLessThan(1);
    // The body's former bottom (185 below the pivot) now points up; it must clear the top margin.
    expect(247 + frame.y - 185 * (1 - frame.squash) * fit).toBeGreaterThanOrEqual(8 - 1e-6);
  });
  it("keeps a maxed Lab stretch on Evolved (horns and all) inside the stage, and leaves resting Evolved alone", () => {
    expect(bodyFit("evolved", still)).toBe(1);
    const frame = { ...still, y: -40, squash: -.3, scale: 1.25 };
    const fit = bodyFit("evolved", frame);
    expect(fit).toBeLessThan(1);
    expect(247 + frame.y - 140 * frame.scale * (1 - frame.squash) * fit).toBeGreaterThanOrEqual(8 - 1e-6);
  });
});

describe("bodyFit with Geometry aura rings", () => {
  it("keeps the outer ring inside the stage on a stretched jump", () => {
    const frame = { x: 0, y: -45, angle: 0, scale: 1, squash: -.23, aura: 1, mouthOpen: 1 } as Parameters<typeof bodyFit>[1];
    const fit = bodyFit("geometry", frame);
    const ring = (148 + 2 * 17 + 6) * 356 / 400 + 1;
    expect(fit).toBeLessThan(1);
    expect(247 + frame.y - ring * (1 - frame.squash) * fit).toBeGreaterThanOrEqual(8 - 1e-6);
  });
});

describe("Geometry wardrobe", () => {
  it("draws the equipped Old Vic State Mantle behind the core, and only when equipped", async () => {
    const record = await representativePet(1);
    const appearance = (addons: Addon[]) => ({
      guardian: { energy: 50, health: 80, bond: 50, curiosity: 50, dreamCount: 0, activatedCount: 0, reduceMotion: false },
      forged: null, addons, positions: {}, cosmetics: [],
    });
    const expression = getExpression("happy")!;
    const draw = (addons: Addon[]) => {
      const pet = makeCreatureSnapshot(record, appearance(addons));
      const frame = sampleExpression(expression, expression.staticFrame, DEFAULT_SETTINGS, pet.personality, pet.seed);
      return render(<ExpressionArt pet={pet} frame={frame} expression={expression} form="geometry"
        caption={DEFAULT_CAPTION} scene={DEFAULT_SCENE} />);
    };
    const worn = draw([OLD_VIC_MANTLE as Addon]);
    const mantle = worn.container.querySelector("[data-geometry-mantle]");
    expect(mantle?.querySelector("path")?.getAttribute("d")).toBe(OLD_VIC_MANTLE.visual.svgPath);
    // Behind the body: the mantle precedes the geometry lattice inside the same group.
    expect(mantle!.compareDocumentPosition(worn.container.querySelector("[data-expression-lattice]")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    worn.unmount();
    const bare = draw([]);
    expect(bare.container.querySelector("[data-geometry-mantle]")).toBeNull();
    bare.unmount();
  });
});
