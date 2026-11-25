declare module "gifenc" {
  type PixelFormat = "rgb565" | "rgb444" | "rgba4444";
  export function quantize(pixels: Uint8ClampedArray, colors: number, opts?: {
    format: PixelFormat; oneBitAlpha?: number; clearAlphaThreshold?: number;
  }): number[][];
  export function applyPalette(pixels: Uint8ClampedArray, palette: number[][], format?: PixelFormat): Uint8Array;
  export function GIFEncoder(): {
    writeFrame(pixels: Uint8Array, width: number, height: number, options: {
      palette: number[][]; transparent: boolean; transparentIndex: number;
      delay: number; repeat: number; dispose: number;
    }): void;
    finish(): void;
    bytes(): Uint8Array<ArrayBuffer>;
  };
}
