import { zipSync } from "fflate";

export type ZipCommand = { type: "zip"; files: Record<string, Uint8Array> };

// Store-only ZIP (PNG is already compressed). Runs off the main thread.
self.onmessage = ({ data }: MessageEvent<ZipCommand>) => {
  try {
    if (data?.type !== "zip" || !data.files || typeof data.files !== "object") throw new Error("Invalid pack request.");
    const bytes = zipSync(data.files, { level: 0 });
    self.postMessage({ bytes }, { transfer: [bytes.buffer] });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "Could not build the sticker pack." });
  }
};
