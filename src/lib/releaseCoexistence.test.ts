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
    expect(bodyForgeWorkshop).toContain("Aura lab");
    expect(bodyForgeWorkshop).toContain("Import Body Forge packet");
    // The Forge must exit through the one canonical return-form constant —
    // never a scattered string literal, and never the legacy `geometric`.
    expect(bodyForgeWorkshop).toContain("setPetType(BODY_FORGE_RETURN_FORM)");
    expect(bodyForgeWorkshop).not.toContain('"geometric"');
    expect(bodyForgeWorkshop).not.toContain("'geometric'");
    expect(bodyForgeWorkshop).toContain('router.push("/pet")');
    expect(canonicalPetRoute).toContain("<PetRuntimeStage");
    expect(duplicatePetRoute).toContain("redirect('/pet')");
    expect(petRuntimeStage).toContain("<VisualDNAPet");
    expect(petRuntimeStage).toContain("<AuraliaMetaPet");
    expect(petRuntimeStage).toContain("<SriYantraPetDisplay");

    // The Geometry form renders Sri Yantra geometry and must be labelled as
    // such: Moss60 is the movement/identity layer on the Evolved body, not a
    // renderer, so no surface may present the Sri Yantra as "Moss60".
    const i18n = readSource("src/lib/i18n.ts");
    expect(canonicalPetRoute).toContain("Geometry / Sri Yantra");
    expect(canonicalPetRoute).not.toContain("Geometry / Moss60");
    expect(i18n).not.toContain("/ Moss60'");
    // The Evolved body performs the Moss60 movement vocabulary.
    expect(visualDnaPet).toContain("useMovementController");
    expect(visualDnaPet).toContain("interpretMovement");
    expect(petRuntimeStage).not.toContain("avatarDataUrl");
    expect(petRuntimeStage).not.toContain("identity/profile");
    expect(canonicalPetRoute).not.toContain("avatarDataUrl");
    expect(petHero).toContain("<GeometryAvatarRenderer");
    expect(visualDnaPet).toContain("resolveBodySpec");
    expect(visualDnaPet).toContain("runtimeAura");
    expect(bodyResolver).toContain("genomeToVisualGenes");
    expect(bodyResolver).toContain("loadForgedBody");
    expect(bodyResolver).toContain("body-spec:v3");
    expect(bodyResolver).toContain("PREVIOUS_BODY_FORGE_STORAGE_KEY");
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
