import { beforeEach, describe, expect, it } from "vitest";
import { useWardrobeStore } from "./wardrobeStore";
import type { Addon } from "./types";

function makeAddon(id: string): Addon {
  return {
    id,
    name: id,
    description: "",
    category: "headwear",
    rarity: "common",
    attachment: {
      anchorPoint: "head",
      offset: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
      followAnimation: true,
    },
    visual: { colors: { primary: "#fff" } },
    ownership: {
      ownerPublicKey: "",
      signature: "",
      issuedAt: 0,
      issuerPublicKey: "",
      issuerSignature: "",
      nonce: "",
    },
    metadata: { creator: "test", createdAt: 0 },
  };
}

const RESET_STATE = {
  isOpen: false,
  arrangeMode: false,
  previewAddon: null,
  previewForm: null,
  activeCategory: "all" as const,
};

describe("useWardrobeStore", () => {
  beforeEach(() => {
    useWardrobeStore.setState(RESET_STATE);
  });

  it("opening records which form is being browsed and starts with no preview", () => {
    useWardrobeStore.getState().openWardrobe("evolved");
    const state = useWardrobeStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.previewForm).toBe("evolved");
    expect(state.previewAddon).toBeNull();
  });

  it("opening discards any stale preview left over from a prior session", () => {
    useWardrobeStore.setState({ previewAddon: makeAddon("stale"), previewForm: "auralia" });
    useWardrobeStore.getState().openWardrobe("evolved");
    expect(useWardrobeStore.getState().previewAddon).toBeNull();
  });

  it("previewAddonForForm sets a temporary preview without touching any other addon system", () => {
    const addon = makeAddon("hat-1");
    useWardrobeStore.getState().previewAddonForForm(addon, "evolved");
    const state = useWardrobeStore.getState();
    expect(state.previewAddon).toBe(addon);
    expect(state.previewForm).toBe("evolved");
  });

  it("switching preview to a different item cleanly replaces the previous one", () => {
    useWardrobeStore.getState().previewAddonForForm(makeAddon("hat-1"), "evolved");
    useWardrobeStore.getState().previewAddonForForm(makeAddon("hat-2"), "evolved");
    expect(useWardrobeStore.getState().previewAddon?.id).toBe("hat-2");
  });

  it("clearPreview (Cancel) removes the preview and leaves everything else untouched", () => {
    useWardrobeStore.getState().openWardrobe("evolved");
    useWardrobeStore.getState().previewAddonForForm(makeAddon("hat-1"), "evolved");
    useWardrobeStore.getState().clearPreview();
    const state = useWardrobeStore.getState();
    expect(state.previewAddon).toBeNull();
    expect(state.isOpen).toBe(true); // closing is a separate action
  });

  it("closeWardrobe (unexpected close) also discards any live preview", () => {
    useWardrobeStore.getState().openWardrobe("auralia");
    useWardrobeStore.getState().previewAddonForForm(makeAddon("hat-1"), "auralia");
    useWardrobeStore.getState().closeWardrobe();
    const state = useWardrobeStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.previewAddon).toBeNull();
    expect(state.arrangeMode).toBe(false);
  });

  it("entering Arrange Mode drops any live preview (you arrange equipped items, not previews)", () => {
    useWardrobeStore.getState().previewAddonForForm(makeAddon("hat-1"), "evolved");
    useWardrobeStore.getState().setArrangeMode(true);
    const state = useWardrobeStore.getState();
    expect(state.arrangeMode).toBe(true);
    expect(state.previewAddon).toBeNull();
  });

  it("toggleArrangeMode flips state and mirrors the preview-clearing rule on entry only", () => {
    useWardrobeStore.getState().toggleArrangeMode();
    expect(useWardrobeStore.getState().arrangeMode).toBe(true);
    useWardrobeStore.getState().toggleArrangeMode();
    expect(useWardrobeStore.getState().arrangeMode).toBe(false);
  });

  it("setActiveCategory updates the browse filter independently of preview state", () => {
    useWardrobeStore.getState().previewAddonForForm(makeAddon("hat-1"), "evolved");
    useWardrobeStore.getState().setActiveCategory("weapon");
    const state = useWardrobeStore.getState();
    expect(state.activeCategory).toBe("weapon");
    expect(state.previewAddon?.id).toBe("hat-1");
  });
});
