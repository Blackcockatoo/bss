// RIFF WebP full-canvas animation. Keep only the browser-encoded pixel chunks.
const tag = (name: string) => Uint8Array.from(name, char => char.charCodeAt(0));
const nameAt = (bytes: Uint8Array, offset: number) => String.fromCharCode(...bytes.subarray(offset, offset + 4));
const chunkHeader = (size: number, name: string) => {
  const header = new Uint8Array(8);
  header.set(tag(name));
  new DataView(header.buffer).setUint32(4, size, true);
  return header;
};

export function readWebpPixels(bytes: Uint8Array<ArrayBuffer>) {
  if (nameAt(bytes, 0) !== "RIFF" || nameAt(bytes, 8) !== "WEBP") throw new Error("This browser could not encode WebP.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let bitstream = false;
  let alpha = false;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const name = nameAt(bytes, offset);
    const size = view.getUint32(offset + 4, true);
    const end = offset + 8 + size + (size % 2);
    if (end > bytes.length) throw new Error("The browser returned an incomplete WebP frame.");
    if (name === "VP8 " || name === "VP8L" || name === "ALPH") {
      bitstream ||= name !== "ALPH";
      alpha ||= name === "ALPH" || (name === "VP8L" && size >= 5 && (bytes[offset + 12] & 16) !== 0);
      chunks.push(bytes.subarray(offset, end));
    }
    offset = end;
  }
  if (!bitstream) throw new Error("The browser returned no WebP pixels.");
  return { chunks, alpha };
}

function uint24(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = value & 255;
  bytes[offset + 1] = (value >> 8) & 255;
  bytes[offset + 2] = (value >> 16) & 255;
}

export function animatedWebp(width: number, height: number, frames: ReturnType<typeof readWebpPixels>[], delay: number | readonly number[], loop: boolean) {
  const extended = new Uint8Array(10);
  extended[0] = 2 | (frames.some(frame => frame.alpha) ? 16 : 0);
  uint24(extended, 4, width - 1);
  uint24(extended, 7, height - 1);
  const animation = new Uint8Array(6);
  animation[4] = loop ? 0 : 1;
  const parts = [tag("WEBP"), chunkHeader(10, "VP8X"), extended, chunkHeader(6, "ANIM"), animation];
  for (const [index, frame] of frames.entries()) {
    const header = new Uint8Array(16);
    uint24(header, 6, width - 1);
    uint24(header, 9, height - 1);
    uint24(header, 12, typeof delay === "number" ? delay : delay[index] ?? 100);
    header[15] = 2; // Replace the previous full canvas, including transparent pixels.
    const size = frame.chunks.reduce((total, bytes) => total + bytes.byteLength, header.byteLength);
    parts.push(chunkHeader(size, "ANMF"), header, ...frame.chunks);
  }
  const payload = parts.reduce((total, bytes) => total + bytes.byteLength, 0);
  return new Blob([chunkHeader(payload, "RIFF"), ...parts], { type: "image/webp" });
}
