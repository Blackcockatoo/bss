import { afterEach, describe, expect, it, vi } from "vitest";

import { detectWebGLSupport } from "@/lib/renderSupport";

describe("detectWebGLSupport", () => {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    vi.restoreAllMocks();
  });

  it("reports support when a webgl context is available", () => {
    HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
      if (type === "webgl") {
        return {} as WebGLRenderingContext;
      }

      return null;
    }) as typeof HTMLCanvasElement.prototype.getContext;

    const result = detectWebGLSupport(document);

    expect(result.supported).toBe(true);
    expect(result.reason).toBeNull();
  });

  it("returns the guided fallback when webgl is unavailable", () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as typeof HTMLCanvasElement.prototype.getContext;

    const result = detectWebGLSupport(document);

    expect(result.supported).toBe(false);
    expect(result.fallbackMode).toBe("journey");
    expect(result.reason).toMatch(/guided/i);
  });
});
