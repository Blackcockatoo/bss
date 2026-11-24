import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { serializeLocalSprite, stripGeometryBackdrop } from "@/lib/games/geometryPilot";
import { animationFramePlan, artworkCapturePhase, sampleArtwork, type Artwork } from "./artwork";
import { isStudioWardrobeAsset } from "@/lib/expressions/wardrobeAssets";
import type { GifCommand } from "@/lib/expressions/gif.worker";
import { ASPECTS, ExpressionArt } from "./ExpressionArt";

export type { Artwork } from "./artwork";
export type PanelArtwork = Artwork;
export type Progress = (done: number, total: number) => void;

function stickerCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Your browser could not create an image.");
  return { canvas, context };
}

export function canvasBlob(canvas: HTMLCanvasElement, mime = "image/png") {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => blob?.type === mime ? resolve(blob) : reject(new Error("Your browser could not encode this image format.")), mime, .88);
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function rasterize(markup: string, width: number, height: number, signal: AbortSignal) {
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    signal.throwIfAborted();
    const { canvas, context } = stickerCanvas(width, height);
    context.drawImage(image, 0, 0, width, height);
    return { canvas, context };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function wardrobePixels(path: string, signal: AbortSignal) {
  if (!isStudioWardrobeAsset(path)) throw new Error("This wardrobe asset is unavailable for local export.");
  const response = await fetch(path, { mode: "same-origin", redirect: "error", credentials: "omit", signal });
  if (!response.ok) throw new Error("Could not load a local wardrobe asset.");
  const text = await response.text();
  if (text.length > 64_000) throw new Error("The wardrobe asset exceeded the export budget.");
  const asset = new DOMParser().parseFromString(text, "image/svg+xml").documentElement;
  if (!(asset instanceof SVGSVGElement)) throw new Error("A local wardrobe asset could not be read.");
  for (const node of asset.querySelectorAll("animate, animateTransform, animateMotion, set")) node.remove();
  const { canvas } = await rasterize(serializeLocalSprite(asset), 384, 384, signal);
  return canvas.toDataURL("image/png");
}

/** Uses the same SVG component and sample function as on-screen playback. */
export function createFrameRenderer() {
  const host = document.createElement("div");
  // A detached React root keeps its SVG IDs independent of the live preview.
  const root = createRoot(host, { identifierPrefix: "expression-export-" });
  const wardrobe = new Map<string, string>();
  return {
    async draw(art: Artwork, size: number, signal: AbortSignal, progress = artworkCapturePhase(art)) {
      signal.throwIfAborted();
      flushSync(() => root.render(<ExpressionArt {...sampleArtwork(art, progress)} />));
      const original = host.querySelector("svg");
      if (!original) throw new Error("The creature frame is missing.");
      const svg = original.cloneNode(true) as SVGSVGElement;
      const lattice = svg.querySelector<SVGSVGElement>("[data-expression-lattice] > svg");
      if (lattice) stripGeometryBackdrop(lattice);
      // Imported recipes never supply markup. Strip UI attributes and remove
      // decorative SMIL as a second guard against timing-dependent captures.
      const ids = new Set<string>();
      for (const node of [svg, ...svg.querySelectorAll("*")]) {
        if (node.localName.startsWith("animate") || node.localName === "title" || node.localName === "desc") {
          node.remove();
          continue;
        }
        for (const attr of node.getAttributeNames()) {
          if (attr === "class" || attr === "role" || attr === "tabindex" || attr.startsWith("data-") || attr.startsWith("aria-")) node.removeAttribute(attr);
        }
        if (node.id) {
          if (ids.has(node.id)) throw new Error("Two sprite effects share the same identifier.");
          ids.add(node.id);
        }
      }
      const [aspectWidth, aspectHeight] = ASPECTS[art.aspect ?? "square"];
      const width = aspectWidth / 512 * size;
      const height = aspectHeight / 512 * size;
      svg.removeAttribute("xmlns"); // The XML serializer emits the SVG namespace.
      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(height));
      for (const element of svg.querySelectorAll("image")) {
        const path = element.getAttribute("href") ?? "";
        let pixels = wardrobe.get(path);
        if (!pixels) {
          pixels = await wardrobePixels(path, signal);
          wardrobe.set(path, pixels);
        }
        element.setAttribute("href", pixels);
      }
      return rasterize(serializeLocalSprite(svg, { allowEmbeddedPng: true }), width, height, signal);
    },
    dispose() {
      root.unmount();
    },
  };
}

export async function exportPng(art: Artwork, size: number, signal: AbortSignal) {
  const renderer = createFrameRenderer();
  try {
    const { canvas } = await renderer.draw(art, size, signal);
    return await canvasBlob(canvas);
  } finally {
    renderer.dispose();
  }
}

function gifRequest(worker: Worker, message: GifCommand, signal: AbortSignal) {
  return new Promise<Uint8Array<ArrayBuffer> | undefined>((resolve, reject) => {
    function clean() {
      signal.removeEventListener("abort", abort);
      worker.removeEventListener("message", response);
      worker.removeEventListener("error", fail);
      worker.removeEventListener("messageerror", fail);
    }
    function fail() {
      clean();
      reject(new Error("The animation encoder stopped. Try a PNG or retry the GIF."));
    }
    function abort() {
      clean();
      reject(signal.reason);
    }
    function response(event: MessageEvent<{ error?: string; bytes?: Uint8Array<ArrayBuffer> }>) {
      clean();
      if (event.data.error) reject(new Error(event.data.error));
      else resolve(event.data.bytes);
    }
    signal.throwIfAborted();
    signal.addEventListener("abort", abort, { once: true });
    worker.addEventListener("message", response, { once: true });
    worker.addEventListener("error", fail, { once: true });
    worker.addEventListener("messageerror", fail, { once: true });
    try {
      worker.postMessage(message, message.type === "frame" ? [message.pixels.buffer] : []);
    } catch (error) {
      clean();
      reject(error);
    }
  });
}

export async function exportGif(art: Artwork, signal: AbortSignal, update: Progress) {
  const worker = new Worker(new URL("../../lib/expressions/gif.worker.ts", import.meta.url));
  const renderer = createFrameRenderer();
  try {
    const frames = animationFramePlan(art);
    for (const [index, frame] of frames.entries()) {
      const { canvas, context } = await renderer.draw(art, 256, signal, frame.progress);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      await gifRequest(worker, {
        type: "frame", pixels, width: canvas.width, height: canvas.height,
        delay: frame.delay, loop: art.settings.loop && frames.length > 1,
      }, signal);
      update(index + 1, frames.length);
    }
    const bytes = await gifRequest(worker, { type: "finish" }, signal);
    if (!bytes) throw new Error("The animation encoder produced no frames.");
    return new Blob([bytes], { type: "image/gif" });
  } finally {
    worker.terminate();
    renderer.dispose();
  }
}

export async function exportWebp(art: Artwork, signal: AbortSignal, update: Progress) {
  const { animatedWebp, readWebpPixels } = await import("@/lib/expressions/webp");
  const renderer = createFrameRenderer();
  try {
    const frames = animationFramePlan(art);
    const [width, height] = ASPECTS[art.aspect ?? "square"].map(axis => axis / 2);
    const pixels: ReturnType<typeof readWebpPixels>[] = [];
    for (const [index, sample] of frames.entries()) {
      const { canvas } = await renderer.draw(art, 256, signal, sample.progress);
      const frame = await canvasBlob(canvas, "image/webp");
      pixels.push(readWebpPixels(new Uint8Array(await frame.arrayBuffer())));
      update(index + 1, frames.length);
    }
    signal.throwIfAborted();
    return animatedWebp(width, height, pixels, frames.map(frame => frame.delay), art.settings.loop);
  } finally {
    renderer.dispose();
  }
}

export async function exportPack(art: Artwork[], signal: AbortSignal, update: Progress) {
  const { zipSync } = await import("fflate");
  const renderer = createFrameRenderer();
  const files: Record<string, Uint8Array> = {};
  try {
    for (const [index, item] of art.entries()) {
      const { canvas } = await renderer.draw(item, 512, signal);
      const png = await canvasBlob(canvas);
      files[`${item.form}-${item.expression.id}.png`] = new Uint8Array(await png.arrayBuffer());
      update(index + 1, art.length);
    }
    signal.throwIfAborted();
    return new Blob([zipSync(files, { level: 0 })], { type: "application/zip" });
  } finally {
    renderer.dispose();
  }
}

export async function exportSheet(panels: PanelArtwork[], signal: AbortSignal, update: Progress, kind: "comic" | "stickers") {
  const sheet = kind === "stickers";
  const cols = sheet ? (panels.length > 9 ? 4 : 3) : 2;
  const rows = Math.ceil(panels.length / cols);
  const tile = sheet ? 320 : 512;
  const gap = sheet ? 14 : 10;
  const { canvas, context } = stickerCanvas(tile * cols + gap * (cols + 1), tile * rows + gap * (rows + 1));
  context.fillStyle = sheet ? "#ffffff" : "#11182b";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const renderer = createFrameRenderer();
  try {
    for (const [index, panel] of panels.entries()) {
      const { canvas: frame } = await renderer.draw({ ...panel, aspect: "square" }, tile, signal);
      const x = gap + (index % cols) * (tile + gap);
      const y = gap + Math.floor(index / cols) * (tile + gap);
      context.drawImage(frame, x, y);
      context.strokeStyle = sheet ? "#c4c9d2" : "#ac8750";
      context.strokeRect(x, y, tile, tile);
      update(index + 1, panels.length);
    }
    return await canvasBlob(canvas);
  } finally {
    renderer.dispose();
  }
}
