import { applyPalette, GIFEncoder, quantize } from "gifenc";

export type GifCommand =
  | { type: "frame"; pixels: Uint8ClampedArray; width: number; height: number; delay: number; loop: boolean }
  | { type: "finish" };

const encoder = GIFEncoder();
self.onmessage = ({ data }: MessageEvent<GifCommand>) => {
  try {
    if (data.type === "finish") {
      encoder.finish();
      const bytes = encoder.bytes();
      self.postMessage({ bytes }, { transfer: [bytes.buffer] });
      return;
    }
    const { pixels, width, height, delay, loop } = data;
    // Reserve an unambiguous one-bit alpha index for transparent pixels.
    const palette = quantize(pixels, 255, {
      format: "rgba4444", oneBitAlpha: 38, clearAlphaThreshold: 38,
    }).filter(color => color[3] === 255);
    palette.unshift([0, 0, 0, 0]);
    if (palette.length === 1) palette.push([0, 0, 0, 255]);
    const indexed = applyPalette(pixels, palette, "rgba4444");
    for (let index = 0; index < indexed.length; index++) {
      const alpha = pixels[index * 4 + 3];
      if (alpha <= 38) indexed[index] = 0;
      else if (indexed[index] === 0) indexed[index] = 1;
    }
    encoder.writeFrame(indexed, width, height, {
      palette, transparent: true, transparentIndex: 0, delay, repeat: loop ? 0 : -1, dispose: 2,
    });
    self.postMessage({ frame: true });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "Could not encode the animation." });
  }
};
