import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DEFAULT_BODY_SPEC } from "@/components/body-forge/PetBodyRenderer";
import { getWardrobeItemById } from "@/lib/wardrobe/catalog";
import type { WardrobeItem } from "@/lib/wardrobe/types";
import {
  WardrobeCosmeticLayer,
  orderWardrobeItems,
  resolveAuraliaCosmeticAnchor,
  resolveBodyForgeCosmeticAnchor,
} from "./WardrobeCosmeticLayer";

function item(id: string): WardrobeItem {
  const found = getWardrobeItemById(id);
  if (!found) throw new Error(`missing catalogue item ${id}`);
  return found;
}

describe("orderWardrobeItems", () => {
  it("sorts equipped items into the documented back-to-front layer order", () => {
    const ordered = orderWardrobeItems([
      item("effect-sparkle"), // trail (last)
      item("crown-gold"), // head
      item("aura-fire"), // aura (behind)
    ]);
    expect(ordered.map((entry) => entry.id)).toEqual([
      "aura-fire",
      "crown-gold",
      "effect-sparkle",
    ]);
  });
});

describe("WardrobeCosmeticLayer", () => {
  const resolveAnchor = () => ({ x: 0, y: 0 });

  it("splits behind/front layers: auras behind the body, head items in front", () => {
    const items = [item("aura-fire"), item("crown-gold")];
    const behind = render(
      <svg>
        <WardrobeCosmeticLayer items={items} layer="behind" resolveAnchor={resolveAnchor} />
      </svg>,
    );
    expect(behind.container.querySelector('[data-cosmetic-id="aura-fire"]')).toBeTruthy();
    expect(behind.container.querySelector('[data-cosmetic-id="crown-gold"]')).toBeNull();

    const front = render(
      <svg>
        <WardrobeCosmeticLayer items={items} layer="front" resolveAnchor={resolveAnchor} />
      </svg>,
    );
    expect(front.container.querySelector('[data-cosmetic-id="crown-gold"]')).toBeTruthy();
    expect(front.container.querySelector('[data-cosmetic-id="aura-fire"]')).toBeNull();
  });

  it("renders every equipped item exactly once across the two layers", () => {
    const items = [
      item("aura-void"),
      item("pattern-stars"),
      item("horns-crystal"),
      item("effect-quantum"),
    ];
    const { container } = render(
      <svg>
        <WardrobeCosmeticLayer items={items} layer="behind" resolveAnchor={resolveAnchor} />
        <WardrobeCosmeticLayer items={items} layer="front" resolveAnchor={resolveAnchor} />
      </svg>,
    );
    const rendered = container.querySelectorAll('[data-testid="cosmetic-renderer-root"]');
    expect(rendered).toHaveLength(items.length);
  });

  it("renders nothing for an empty equipment list", () => {
    const { container } = render(
      <svg>
        <WardrobeCosmeticLayer items={[]} layer="front" resolveAnchor={resolveAnchor} />
      </svg>,
    );
    expect(container.querySelector('[data-testid="cosmetic-renderer-root"]')).toBeNull();
  });

  it("renders under reduced motion without throwing", () => {
    expect(() =>
      render(
        <svg>
          <WardrobeCosmeticLayer
            items={[item("aura-fire"), item("effect-sparkle")]}
            layer="front"
            resolveAnchor={resolveAnchor}
            reduceMotion
          />
        </svg>,
      ),
    ).not.toThrow();
  });
});

describe("anchor resolution", () => {
  it("Body Forge anchors stay inside the 280×250 viewBox for the default spec", () => {
    const anchors = [
      "headTop",
      "forehead",
      "faceCenter",
      "backCenter",
      "wingRoots",
      "bodyCenter",
      "hand",
      "auraRing",
      "ground",
    ] as const;
    for (const anchor of anchors) {
      const { x, y } = resolveBodyForgeCosmeticAnchor(DEFAULT_BODY_SPEC, anchor);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(280);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(250);
    }
  });

  it("Auralia head anchor sits above the body anchor", () => {
    expect(resolveAuraliaCosmeticAnchor("headTop").y).toBeLessThan(
      resolveAuraliaCosmeticAnchor("bodyCenter").y,
    );
  });
});
