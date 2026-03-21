export type WebGLSupport = {
  supported: boolean;
  reason: string | null;
  fallbackMode: "journey";
};

export function detectWebGLSupport(
  doc: Document | undefined = typeof document === "undefined"
    ? undefined
    : document,
): WebGLSupport {
  if (!doc) {
    return {
      supported: true,
      reason: null,
      fallbackMode: "journey",
    };
  }

  try {
    const canvas = doc.createElement("canvas");
    const context =
      canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");

    if (!context) {
      return {
        supported: false,
        reason:
          "This device cannot open the 3D helix, so the hub starts in a guided 2D mode instead.",
        fallbackMode: "journey",
      };
    }

    return {
      supported: true,
      reason: null,
      fallbackMode: "journey",
    };
  } catch {
    return {
      supported: false,
      reason:
        "WebGL is unavailable in this browser right now, so the hub will stay in guided 2D modes.",
      fallbackMode: "journey",
    };
  }
}
