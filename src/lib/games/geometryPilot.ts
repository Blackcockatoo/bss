/** Session-only rendered pixels. No genome, registry keys or child details. */
export const GEOMETRY_PILOT_KEY = "metapet:geometry-pilot:v1";

export function serializeGeometrySprite(
  root: HTMLElement,
  expectedPetId: string,
): string {
  const sprite = root.querySelector<HTMLElement>("[data-geometry-sprite]");
  if (!sprite || sprite.dataset.geometryIdentity !== expectedPetId)
    throw new Error("Wait for your registered geometry companion to appear.");
  const original = sprite.querySelector("svg");
  if (!original) throw new Error("Your geometry sprite is still loading.");
  const svg = original.cloneNode(true) as SVGSVGElement;
  const view = original.viewBox?.baseVal;
  const width =
    view?.width ||
    Number(original.getAttribute("viewBox")?.split(/\s+/)[2]) ||
    1200;
  const height = view?.height || width;
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", "256");
  svg.setAttribute("height", "256");
  svg.removeAttribute("class");
  svg.removeAttribute("style");
  // Remove only the scene backdrop from the exported copy, never the locked asset.
  [...svg.children]
    .find((node) => node.tagName.toLowerCase() === "rect")
    ?.remove();
  for (const originalOverlay of sprite.querySelectorAll<SVGSVGElement>(
    ':scope > svg[data-testid="geometry-evolution-stage"]',
  )) {
    const overlay = originalOverlay.cloneNode(true) as SVGSVGElement;
    overlay.removeAttribute("class");
    overlay.setAttribute("x", "0");
    overlay.setAttribute("y", "0");
    overlay.setAttribute("width", String(width));
    overlay.setAttribute("height", String(height));
    svg.appendChild(overlay);
  }
  // Exports must be entirely self-contained before rasterising to local pixels.
  if (svg.querySelector("script, foreignObject, image, iframe, style, link"))
    throw new Error("The sprite contains unsupported external content.");
  for (const node of [svg, ...svg.querySelectorAll("*")]) {
    for (const attribute of [...node.attributes]) {
      const value = attribute.value.trim();
      const isReference = /(?:^|:)(?:href|src)$/i.test(attribute.name);
      const externalUrl = [...value.matchAll(/url\(([^)]*)\)/gi)].some(
        (match) =>
          !match[1]
            .trim()
            .replace(/^['"]|['"]$/g, "")
            .startsWith("#"),
      );
      if (
        /^on/i.test(attribute.name) ||
        (isReference && !value.startsWith("#")) ||
        externalUrl
      ) {
        throw new Error("The sprite contains unsupported external content.");
      }
    }
  }
  return new XMLSerializer().serializeToString(svg);
}

export async function saveGeometryPilot(
  root: HTMLElement,
  petId: string,
): Promise<void> {
  const svg = serializeGeometrySprite(root, petId);
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context)
    throw new Error("This browser could not prepare a game sprite.");
  context.drawImage(image, 0, 0, 256, 256);
  const pixels = canvas.toDataURL("image/png");
  if (!pixels.startsWith("data:image/png;base64,") || pixels.length > 500_000)
    throw new Error("The game sprite could not be prepared.");
  sessionStorage.setItem(
    GEOMETRY_PILOT_KEY,
    JSON.stringify({ version: 1, image: pixels }),
  );
}
