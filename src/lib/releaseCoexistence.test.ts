import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("BSS release coexistence contract", () => {
  it("ships the graphical Vimana atlas and the live Body Forge pipeline together", () => {
    const vimanaMap = readSource("src/components/VimanaMap.tsx");
    const bodyForgeRoute = readSource("src/app/body-forge/page.tsx");
    const bodyForgeWorkshop = readSource(
      "src/components/body-forge/BodyForge.tsx",
    );
    const visualDnaPet = readSource("src/components/VisualDNAPet.tsx");
    const bodyResolver = readSource("src/visual-dna/bodyForgeAdapter.ts");

    expect(vimanaMap).toContain('data-testid="vimana-field-interface"');
    expect(vimanaMap).toContain("Vimana Field Atlas");
    expect(bodyForgeRoute).toContain("<BodyForge />");
    expect(bodyForgeWorkshop).toContain("Set inherited body");
    expect(visualDnaPet).toContain("resolveBodySpec");
    expect(bodyResolver).toContain("genomeToVisualGenes");
    expect(bodyResolver).toContain("loadForgedBody");
  });
});
