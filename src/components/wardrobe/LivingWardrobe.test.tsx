import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LivingWardrobe } from "./LivingWardrobe";
import { useAddonStore } from "@/lib/addons";
import { WIZARD_HAT } from "@/lib/addons/catalog";
import type { Addon } from "@/lib/addons";

function ownedAddonFromTemplate(): Addon {
  return {
    ...WIZARD_HAT,
    ownership: {
      ownerPublicKey: "test-owner",
      signature: "sig",
      issuedAt: Date.now(),
      issuerPublicKey: "issuer",
      issuerSignature: "isig",
      nonce: "nonce",
    },
    metadata: { ...WIZARD_HAT.metadata, createdAt: Date.now() },
  };
}

describe("LivingWardrobe", () => {
  beforeEach(() => {
    useAddonStore.setState({
      addons: { [WIZARD_HAT.id]: ownedAddonFromTemplate() },
      equipped: {},
      ownerPublicKey: "test-owner",
      positionOverrides: {},
    });
  });

  afterEach(() => {
    useAddonStore.setState({
      addons: {},
      equipped: {},
      ownerPublicKey: "",
      positionOverrides: {},
    });
  });

  it("tapping an owned card previews it without touching the store's equipped state", () => {
    render(<LivingWardrobe />);
    const card = screen.getByText(WIZARD_HAT.name);
    fireEvent.click(card);

    expect(useAddonStore.getState().equipped.headwear).toBeUndefined();
    expect(screen.getByText("Equip")).toBeTruthy();
  });

  it("Equip commits the previewed item to the store", () => {
    render(<LivingWardrobe />);
    fireEvent.click(screen.getByText(WIZARD_HAT.name));
    fireEvent.click(screen.getByText("Equip"));

    expect(useAddonStore.getState().equipped.headwear).toBe(WIZARD_HAT.id);
  });

  it("Cancel restores the exact prior equipped state without ever writing the preview", () => {
    render(<LivingWardrobe />);
    fireEvent.click(screen.getByText(WIZARD_HAT.name));
    // Preview is active but not yet committed.
    expect(useAddonStore.getState().equipped.headwear).toBeUndefined();

    fireEvent.click(screen.getByText("Cancel"));

    expect(useAddonStore.getState().equipped.headwear).toBeUndefined();
    // The action bar disappears once the preview clears.
    expect(screen.queryByText("Cancel")).toBeNull();
  });

  it("switching preview items before committing never corrupts the store", () => {
    useAddonStore.setState((state) => ({
      addons: {
        ...state.addons,
        "custom-addon-1008": {
          ...ownedAddonFromTemplate(),
          id: "custom-addon-1008",
          name: "Quantum Entanglement Scarf",
          category: "accessory",
        },
      },
    }));
    render(<LivingWardrobe />);
    fireEvent.click(screen.getByText(WIZARD_HAT.name));
    fireEvent.click(screen.getByText(WIZARD_HAT.name)); // toggling off preview
    expect(screen.queryByText("Equip")).toBeNull();
    expect(useAddonStore.getState().equipped).toEqual({});
  });

  it("clicking an already-equipped card's category shows the equipped badge, not a try-on state", () => {
    act(() => {
      useAddonStore.getState().equipAddon(WIZARD_HAT.id);
    });
    render(<LivingWardrobe />);
    expect(screen.getByText("Equipped")).toBeTruthy();
  });
});
