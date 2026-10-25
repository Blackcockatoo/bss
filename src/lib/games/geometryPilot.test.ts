import { afterEach, describe, expect, it, vi } from "vitest";
import {
  serializeGeometrySprite,
  saveGeometryPilot,
  GEOMETRY_PILOT_KEY,
} from "./geometryPilot";

function scene() {
  const root = document.createElement("div");
  root.innerHTML =
    '<div data-geometry-sprite data-geometry-identity="my-pet"><svg viewBox="0 0 1200 1200"><defs><linearGradient id="colour" /></defs><rect width="1200" height="1200"/><path data-body="saved-shape" d="M5 10L40 20" fill="url(#colour)"/></svg><svg data-testid="geometry-evolution-stage" viewBox="0 0 400 400"><path data-earned-crown="true" d="M5 5L8 3"/></svg></div>';
  return root;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("geometry arcade sprite capture", () => {
  it("captures the displayed body and earned adornments, without the scene backdrop", () => {
    const root = scene();
    const result = serializeGeometrySprite(root, "my-pet");
    const svg = new DOMParser().parseFromString(
      result,
      "image/svg+xml",
    ).documentElement;
    expect(svg.querySelector('[data-body="saved-shape"]')).not.toBeNull();
    expect(svg.querySelector('[data-earned-crown="true"]')).not.toBeNull();
    expect(
      [...svg.children].some((node) => node.tagName.toLowerCase() === "rect"),
    ).toBe(false);
    expect(svg.querySelector("linearGradient")?.id).toBe("colour");
    expect(svg.getAttribute("width")).toBe("256");
    expect(root.querySelector("rect")).not.toBeNull(); // Never mutate the displayed/locked sprite.
  });
  it("rejects a stale companion or an unloaded renderer", () => {
    expect(() => serializeGeometrySprite(scene(), "other-pet")).toThrow(
      /registered geometry/,
    );
    const root = scene();
    root.querySelector("svg")?.remove();
    root.querySelector("svg")?.remove();
    expect(() => serializeGeometrySprite(root, "my-pet")).toThrow(
      /still loading/,
    );
  });
  it("refuses image content that could make the capture depend on another service", () => {
    const root = scene();
    const image = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "image",
    );
    image.setAttribute("href", "https://example.com/image.png");
    root.querySelector("svg")?.appendChild(image);
    expect(() => serializeGeometrySprite(root, "my-pet")).toThrow(
      /external content/,
    );
  });
});

it("stores only rendered PNG pixels in session storage, without genome or identifiers", async () => {
  vi.stubGlobal(
    "Image",
    class {
      src = "";
      decode = async () => {};
    },
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
  } as never);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
    "data:image/png;base64,AAAA",
  );
  sessionStorage.clear();
  await saveGeometryPilot(scene(), "my-pet");
  expect(JSON.parse(sessionStorage.getItem(GEOMETRY_PILOT_KEY)!)).toEqual({
    version: 1,
    image: "data:image/png;base64,AAAA",
  });
});
