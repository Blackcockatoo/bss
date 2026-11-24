import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildPetRecord } from "@/lib/registry/registration";
import { makeCreatureSnapshot } from "@/lib/expressions/snapshot";
import { DEFAULT_SETTINGS, FORMS, getExpression, sampleExpression } from "@/lib/expressions/studio";
import { DEFAULT_BODY_SPEC } from "@/components/body-forge/PetBodyRenderer";
import { getGenomeVisualFingerprint } from "@/visual-dna/bodyForgeAdapter";
import { DEFAULT_CAPTION, DEFAULT_SCENE, ExpressionArt } from "./ExpressionArt";

/**
 * Visual baselines for three materially different registered creatures.
 *
 * Each fixture is a fixed genome (no randomness), so its traits, personality,
 * body and Sri Yantra projection are fixed. The committed SVG files in
 * `__baselines__/` are the exact markup the preview and exporter rasterise;
 * `scripts/expressions-visual-baseline.mjs` turns them into PNG baselines in
 * Chromium and compares pixels. Regenerate deliberately with
 * `npx vitest run src/components/expressions/visualBaseline.test.tsx -u`
 * after an intended visual change, then re-run the pixel script with --update.
 */
const strand = (offset: number, step: number) =>
  Array.from({ length: 60 }, (_, index) => (Math.floor(index / 4) + index * step + offset) % 10);

const FIXTURES = [
  { name: "hatchling", offset: 0, steps: [1, 3, 7], state: "GENETICS", forge: null },
  { name: "quantum", offset: 4, steps: [2, 5, 9], state: "QUANTUM", forge: null },
  { name: "speciation-crystal", offset: 7, steps: [3, 1, 4], state: "SPECIATION", forge: { shape: "crystal", primaryColor: "#1e95ab", features: ["wings", "crown"] } },
] as const;

const EXPRESSIONS_UNDER_TEST = [
  ["happy", "static"], ["fireworks", "mid"], ["sleepy", "static"],
] as const;

async function fixture(item: typeof FIXTURES[number]) {
  const hmacKey = await crypto.subtle.importKey("raw", new Uint8Array(32).fill(7), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  const record = await buildPetRecord({
    genome: { red60: strand(item.offset, item.steps[0]), blue60: strand(item.offset, item.steps[1]), black60: strand(item.offset, item.steps[2]) },
    hmacKey, createdAt: 1_700_000_000_000, petId: `baseline-${item.name}`,
  });
  record.evolution.state = item.state;
  return makeCreatureSnapshot(record, {
    guardian: { energy: 70, health: 80, bond: 60, curiosity: 65, dreamCount: 0, activatedCount: 3, reduceMotion: false },
    forged: item.forge ? {
      version: 3, savedAt: 1, genomeFingerprint: getGenomeVisualFingerprint(record.genome),
      body: { ...DEFAULT_BODY_SPEC, ...item.forge, features: [...item.forge.features] },
    } : null,
    addons: [], positions: {}, cosmetics: [],
  });
}

describe("expression visual baselines", () => {
  it("fixtures are materially different creatures", async () => {
    const pets = await Promise.all(FIXTURES.map(fixture));
    expect(new Set(pets.map(pet => pet.seed)).size).toBe(3);
    expect(new Set(pets.map(pet => JSON.stringify(pet.body))).size).toBe(3);
    expect(new Set(pets.map(pet => pet.personality.temperament + pet.personality.energy)).size).toBeGreaterThan(1);
  });

  for (const item of FIXTURES) {
    it(`matches the committed baselines for ${item.name}`, async () => {
      const pet = await fixture(item);
      for (const [id, when] of EXPRESSIONS_UNDER_TEST) {
        const expression = getExpression(id)!;
        const phase = when === "static" ? expression.staticFrame : .5;
        const frame = sampleExpression(expression, phase, DEFAULT_SETTINGS, pet.personality, pet.seed);
        for (const form of FORMS) {
          const markup = renderToStaticMarkup(
            <ExpressionArt pet={pet} frame={frame} expression={expression} form={form}
              caption={DEFAULT_CAPTION} scene={{ ...DEFAULT_SCENE, background: "midnight" }} />,
          );
          // Rendering is a pure function of the fixture: the same inputs give the same pixels.
          expect(renderToStaticMarkup(
            <ExpressionArt pet={pet} frame={frame} expression={expression} form={form}
              caption={DEFAULT_CAPTION} scene={{ ...DEFAULT_SCENE, background: "midnight" }} />,
          )).toBe(markup);
          await expect(markup + "\n").toMatchFileSnapshot(`__baselines__/${item.name}-${form}-${id}.svg`);
        }
      }
    });
  }
});
