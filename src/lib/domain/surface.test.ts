import { describe, expect, it } from "vitest";

import {
  getSurfaceConfig,
  normalizeHostname,
  resolveProductSurface,
} from "./surface";

describe("resolveProductSurface", () => {
  it("resolves the school domain and its www variant", () => {
    expect(resolveProductSurface("metapet.school")).toBe("school");
    expect(resolveProductSurface("www.metapet.school")).toBe("school");
    expect(resolveProductSurface("metapet.school:443")).toBe("school");
    expect(resolveProductSurface("MetaPet.School")).toBe("school");
  });

  it("resolves the studio domain and its www variant", () => {
    expect(resolveProductSurface("bluesnakestudios.com")).toBe("studio");
    expect(resolveProductSurface("www.bluesnakestudios.com")).toBe("studio");
  });

  it("resolves school subdomains to the school surface", () => {
    expect(resolveProductSurface("preview.metapet.school")).toBe("school");
  });

  it("falls back to studio for unclassified hosts (previews, localhost)", () => {
    expect(resolveProductSurface("bss-git-feature.vercel.app")).toBe("studio");
    expect(resolveProductSurface("localhost")).toBe("studio");
    expect(resolveProductSurface("127.0.0.1")).toBe("studio");
    expect(resolveProductSurface("")).toBe("studio");
    expect(resolveProductSurface(null)).toBe("studio");
  });

  it("honours an explicit override above hostname resolution", () => {
    // A school override on a studio host (dev/preview testing).
    expect(
      resolveProductSurface("bluesnakestudios.com", { override: "school" }),
    ).toBe("school");
    expect(
      resolveProductSurface("localhost", { override: "school" }),
    ).toBe("school");
    expect(
      resolveProductSurface("metapet.school", { override: "studio" }),
    ).toBe("studio");
  });

  it("ignores an invalid override and uses hostname resolution", () => {
    expect(
      // @ts-expect-error exercising a bad override value at runtime
      resolveProductSurface("metapet.school", { override: "nonsense" }),
    ).toBe("school");
  });
});

describe("normalizeHostname", () => {
  it("lowercases, strips the port and drops a leading www", () => {
    expect(normalizeHostname("WWW.MetaPet.School:3000")).toBe("metapet.school");
    expect(normalizeHostname(undefined)).toBe("");
  });
});

describe("getSurfaceConfig", () => {
  it("exposes school config with consumer features disabled", () => {
    const school = getSurfaceConfig("school");
    expect(school.name).toBe("MetaPet School");
    expect(school.featureFlags.wallet).toBe(false);
    expect(school.featureFlags.breeding).toBe(false);
    expect(school.featureFlags.marketplace).toBe(false);
    expect(school.featureFlags.bodyForge).toBe(false);
    expect(school.featureFlags.consumerGlobalNav).toBe(false);
    expect(school.featureFlags.fieldMode).toBe(true);
  });

  it("exposes studio config with the full ecosystem enabled", () => {
    const studio = getSurfaceConfig("studio");
    expect(studio.name).toBe("Blue Snake Studios");
    expect(studio.featureFlags.wallet).toBe(true);
    expect(studio.featureFlags.bodyForge).toBe(true);
    // The one clearly-separated cross-link to the school product.
    const schoolLink = studio.navigation.find((item) => item.external);
    expect(schoolLink?.href).toBe("https://metapet.school");
  });
});
