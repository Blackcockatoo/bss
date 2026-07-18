import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WIZARD_HAT, WIZARD_STAFF } from "@/lib/addons/catalog";
import { useAddonStore } from "@/lib/addons/store";
import type { Addon, AddonOwnershipProof } from "@/lib/addons/types";
import { useWardrobeStore } from "@/lib/addons/wardrobeStore";
import { LivingWardrobe } from "./LivingWardrobe";

const FAKE_OWNERSHIP: AddonOwnershipProof = {
  ownerPublicKey: "tester",
  signature: "sig",
  issuedAt: 1,
  issuerPublicKey: "issuer",
  issuerSignature: "isig",
  nonce: "nonce",
};

function ownedAddon(template: typeof WIZARD_HAT): Addon {
  return {
    ...template,
    ownership: FAKE_OWNERSHIP,
    metadata: { ...template.metadata, createdAt: 1 },
  };
}

function resetStores() {
  useAddonStore.setState({
    addons: {},
    equipped: {},
    ownerPublicKey: "tester",
    positionOverrides: {},
  });
  useWardrobeStore.setState({
    isOpen: false,
    arrangeMode: false,
    previewAddon: null,
    previewForm: null,
    activeCategory: "all",
  });
}

describe("LivingWardrobe", () => {
  beforeEach(() => {
    resetStores();
  });

  it("open wardrobe snapshot: renders the header, category filter and item grid for the active form", () => {
    render(<LivingWardrobe isOpen onClose={vi.fn()} form="evolved" />);
    expect(screen.getByText("Evolved / Body Forge")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Living Wardrobe" })).toBeInTheDocument();
    expect(screen.getByText("Mystical Wizard Hat")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    render(<LivingWardrobe isOpen={false} onClose={vi.fn()} form="evolved" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("tapping an owned item starts a temporary preview and offers Equip", () => {
    useAddonStore.setState({ addons: { [WIZARD_HAT.id]: ownedAddon(WIZARD_HAT) } });
    render(<LivingWardrobe isOpen onClose={vi.fn()} form="evolved" />);

    fireEvent.click(screen.getByText("Mystical Wizard Hat"));

    expect(useWardrobeStore.getState().previewAddon?.id).toBe(WIZARD_HAT.id);
    expect(screen.getByRole("button", { name: /equip/i })).toBeEnabled();
  });

  it("preview switching cleanly replaces the previous preview instead of stacking", () => {
    useAddonStore.setState({
      addons: {
        [WIZARD_HAT.id]: ownedAddon(WIZARD_HAT),
        [WIZARD_STAFF.id]: ownedAddon(WIZARD_STAFF),
      },
    });
    render(<LivingWardrobe isOpen onClose={vi.fn()} form="evolved" />);

    fireEvent.click(screen.getByText("Mystical Wizard Hat"));
    expect(useWardrobeStore.getState().previewAddon?.id).toBe(WIZARD_HAT.id);

    fireEvent.click(screen.getByText("Staff of Eternal Wisdom"));
    expect(useWardrobeStore.getState().previewAddon?.id).toBe(WIZARD_STAFF.id);
  });

  it("equip commits the preview through the canonical addon store and clears the preview", () => {
    useAddonStore.setState({ addons: { [WIZARD_HAT.id]: ownedAddon(WIZARD_HAT) } });
    render(<LivingWardrobe isOpen onClose={vi.fn()} form="evolved" />);

    fireEvent.click(screen.getByText("Mystical Wizard Hat"));
    fireEvent.click(screen.getByRole("button", { name: /equip/i }));

    expect(useAddonStore.getState().equipped.headwear).toBe(WIZARD_HAT.id);
    expect(useWardrobeStore.getState().previewAddon).toBeNull();
  });

  it("cancel discards the preview without ever touching the equipment store", () => {
    useAddonStore.setState({ addons: { [WIZARD_HAT.id]: ownedAddon(WIZARD_HAT) } });
    render(<LivingWardrobe isOpen onClose={vi.fn()} form="evolved" />);

    fireEvent.click(screen.getByText("Mystical Wizard Hat"));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(useWardrobeStore.getState().previewAddon).toBeNull();
    expect(useAddonStore.getState().equipped.headwear).toBeUndefined();
  });

  it("a failed/incompatible preview never unequips the currently equipped item", () => {
    useAddonStore.setState({
      addons: { [WIZARD_HAT.id]: ownedAddon(WIZARD_HAT) },
      equipped: { headwear: WIZARD_HAT.id },
    });
    // Geometry has no compatible anchor system, so the hat reads incompatible.
    render(<LivingWardrobe isOpen onClose={vi.fn()} form="geometry" />);

    fireEvent.click(screen.getByText("Mystical Wizard Hat"));

    expect(screen.getByText(/isn't wired up for the Geometry/i)).toBeInTheDocument();
    expect(useAddonStore.getState().equipped.headwear).toBe(WIZARD_HAT.id);
  });

  it("closing the wardrobe unexpectedly discards any live preview without corrupting equipment", () => {
    useAddonStore.setState({
      addons: { [WIZARD_HAT.id]: ownedAddon(WIZARD_HAT), [WIZARD_STAFF.id]: ownedAddon(WIZARD_STAFF) },
      equipped: { weapon: WIZARD_STAFF.id },
    });
    const onClose = vi.fn();
    render(<LivingWardrobe isOpen onClose={onClose} form="evolved" />);

    fireEvent.click(screen.getByText("Mystical Wizard Hat"));
    expect(useWardrobeStore.getState().previewAddon).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(useWardrobeStore.getState().previewAddon).toBeNull();
    // The equipment untouched by preview/close survives exactly as it was.
    expect(useAddonStore.getState().equipped.weapon).toBe(WIZARD_STAFF.id);
  });

  it("removing an equipped item is explicit (Remove button), not implied by preview/cancel", () => {
    useAddonStore.setState({
      addons: { [WIZARD_HAT.id]: ownedAddon(WIZARD_HAT) },
      equipped: { headwear: WIZARD_HAT.id },
    });
    render(<LivingWardrobe isOpen onClose={vi.fn()} form="evolved" />);

    fireEvent.click(screen.getByText("Mystical Wizard Hat"));
    expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /remove/i }));

    expect(useAddonStore.getState().equipped.headwear).toBeUndefined();
  });

  it("Arrange Mode lists equipped items with always-visible lock/reset controls (no hover requirement)", () => {
    useAddonStore.setState({
      addons: { [WIZARD_HAT.id]: ownedAddon(WIZARD_HAT) },
      equipped: { headwear: WIZARD_HAT.id },
    });
    render(<LivingWardrobe isOpen onClose={vi.fn()} form="evolved" />);

    fireEvent.click(screen.getByRole("button", { name: /arrange/i }));

    expect(useWardrobeStore.getState().arrangeMode).toBe(true);
    const row = screen.getByText("Mystical Wizard Hat").closest("div");
    expect(row).toBeTruthy();
    expect(screen.getByLabelText(/lock position|unlock position/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reset position/i)).toBeInTheDocument();
  });

  it("preview state is only ever held in the ephemeral wardrobe store, never in useAddonStore", () => {
    useAddonStore.setState({ addons: { [WIZARD_HAT.id]: ownedAddon(WIZARD_HAT) } });
    render(<LivingWardrobe isOpen onClose={vi.fn()} form="evolved" />);
    fireEvent.click(screen.getByText("Mystical Wizard Hat"));

    // useAddonStore's persisted shape has no preview-shaped field at all.
    const persistedKeys = Object.keys(useAddonStore.getState());
    expect(persistedKeys).not.toContain("previewAddon");
  });
});
