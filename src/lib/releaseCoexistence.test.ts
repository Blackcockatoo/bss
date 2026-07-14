import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("BSS release coexistence contract", () => {
  it("ships Vimana and Body Forge through one canonical pet runtime", () => {
    const vimanaMap = readSource("src/components/VimanaMap.tsx");
    const bodyForgeRoute = readSource("src/app/body-forge/page.tsx");
    const bodyForgeWorkshop = readSource(
      "src/components/body-forge/BodyForge.tsx",
    );
    const canonicalPetRoute = readSource("src/app/pet/page.tsx");
    const duplicatePetRoute = readSource("src/app/app/pet/page.tsx");
    const petRuntimeStage = readSource("src/components/PetRuntimeStage.tsx");
    const petHero = readSource("src/components/PetHero.tsx");
    const visualDnaPet = readSource("src/components/VisualDNAPet.tsx");
    const bodyResolver = readSource("src/visual-dna/bodyForgeAdapter.ts");

    expect(vimanaMap).toContain('data-testid="vimana-field-interface"');
    expect(vimanaMap).toContain("Vimana Field Atlas");
    expect(bodyForgeRoute).toContain("<BodyForge />");
    expect(bodyForgeWorkshop).toContain("Set inherited body");
    expect(bodyForgeWorkshop).toContain("setPetType('evolved')");
    expect(bodyForgeWorkshop).toContain("router.push('/pet')");
    expect(canonicalPetRoute).toContain("<PetRuntimeStage");
    expect(duplicatePetRoute).toContain("redirect('/pet')");
    expect(petRuntimeStage).toContain("<VisualDNAPet");
    expect(petRuntimeStage).toContain("<AuraliaMetaPet");
    expect(petRuntimeStage).toContain("<SriYantraPetDisplay");
    expect(petRuntimeStage).not.toContain("avatarDataUrl");
    expect(petRuntimeStage).not.toContain("identity/profile");
    expect(canonicalPetRoute).not.toContain("avatarDataUrl");
    expect(petHero).toContain("<GeometryAvatarRenderer");
    expect(visualDnaPet).toContain("resolveBodySpec");
    expect(bodyResolver).toContain("genomeToVisualGenes");
    expect(bodyResolver).toContain("loadForgedBody");
  });

  it("shows the same identity avatar without feeding it into the Meta-Pet body", () => {
    const identityPage = readSource("src/app/identity/page.tsx");
    const petProfilePanel = readSource(
      "src/components/addons/PetProfilePanel.tsx",
    );
    const bodyForge = readSource("src/components/body-forge/BodyForge.tsx");
    const petRuntimeStage = readSource("src/components/PetRuntimeStage.tsx");

    expect(identityPage).toContain("src={form.avatarDataUrl}");
    expect(identityPage.match(/object-contain/g)).toHaveLength(2);
    expect(petProfilePanel).toContain("src={profile.avatarDataUrl}");
    expect(petProfilePanel).toContain("object-contain");
    expect(bodyForge).toContain("src={identityProfile.avatarDataUrl}");
    expect(bodyForge).toContain('href="/identity"');
    expect(petRuntimeStage).not.toContain("avatarDataUrl");
    expect(petRuntimeStage).not.toContain("Identity");
  });
});
