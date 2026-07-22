import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WalletPage from "./page";
import type { Addon } from "@/lib/addons/types";
import { useAddonStore } from "@/lib/addons/store";
import { INITIAL_WALLET_STATE, useWalletStore } from "@/lib/wallet/store";

const initializeStarterAddons = vi.fn().mockResolvedValue({
  success: true,
  addonsCreated: 0,
});

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/childSafeRoute.client", () => ({
  useEnforceChildSafeClientRoute: () => false,
}));

vi.mock("@/lib/addons/starter", () => ({
  initializeStarterAddons: () => initializeStarterAddons(),
}));

function makeAddon(id: string): Addon {
  return {
    id,
    name: "Addon One",
    description: "Trade test asset",
    category: "accessory",
    rarity: "epic",
    attachment: {
      anchorPoint: "body",
      offset: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
      followAnimation: true,
    },
    visual: { colors: { primary: "#22d3ee" } },
    ownership: {
      ownerPublicKey: "owner-key",
      signature: "owner-signature",
      issuedAt: 100,
      issuerPublicKey: "issuer-key",
      issuerSignature: "issuer-signature",
      nonce: "nonce",
    },
    metadata: {
      creator: "B$S Test Forge",
      createdAt: 100,
      edition: 1,
      maxEditions: 10,
    },
  };
}

describe("B$S Vault page", () => {
  beforeEach(() => {
    window.localStorage.clear();
    initializeStarterAddons.mockClear();
    useWalletStore.setState({ ...INITIAL_WALLET_STATE });
    useAddonStore.setState({
      addons: { "addon-1": makeAddon("addon-1") },
      equipped: {},
      ownerPublicKey: "owner-key",
      positionOverrides: {},
    });
  });

  it("creates, reviews, and locks a trade without removing the addon", async () => {
    render(<WalletPage />);

    await waitFor(() => {
      expect(initializeStarterAddons).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/^BSS-[A-F0-9]{4}-[A-F0-9]{4}$/)).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Add Addon One to trade" }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Review trade/i }));
    fireEvent.change(screen.getByLabelText(/Recipient Wallet ID/i), {
      target: { value: "BSS-CAFE-BABE" },
    });
    fireEvent.change(screen.getByLabelText(/What are you asking for/i), {
      target: { value: "One lunar aura" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Create review draft/i }),
    );

    expect(
      screen.getByText(/Trade draft created\. Review it below/i),
    ).toBeInTheDocument();
    expect(useWalletStore.getState().lockedAddonIds).toEqual([]);

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: /Lock reviewed offer/i }),
    );

    expect(
      screen.getByText(/Offer locked safely\. The add-ons remain yours/i),
    ).toBeInTheDocument();
    expect(useWalletStore.getState().lockedAddonIds).toEqual(["addon-1"]);
    expect(useAddonStore.getState().addons["addon-1"]).toBeDefined();
    expect(
      screen.getByRole("button", { name: /Copy safe offer packet/i }),
    ).toBeInTheDocument();
  });

  it("shows equipped assets but prevents adding them to a trade", async () => {
    useAddonStore.setState({ equipped: { accessory: "addon-1" } });
    render(<WalletPage />);

    await waitFor(() => expect(initializeStarterAddons).toHaveBeenCalled());

    expect(screen.getByText("Unequip before trading")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Addon One to trade" }),
    ).toBeDisabled();
  });
});
