import { beforeEach, describe, expect, it } from "vitest";
import type { Addon } from "@/lib/addons/types";
import { buildPublicTradePacket, getAddonTradeability } from "./rules";
import { INITIAL_WALLET_STATE, useWalletStore } from "./store";

const NOW = 1_800_000_000_000;
const OWNER_KEY = "owner-public-key-for-wallet-tests";

function makeAddon(id: string, overrides: Partial<Addon> = {}): Addon {
  return {
    id,
    name: `Addon ${id}`,
    description: "",
    category: "accessory",
    rarity: "rare",
    attachment: {
      anchorPoint: "body",
      offset: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
      followAnimation: true,
    },
    visual: { colors: { primary: "#00ffff" } },
    ownership: {
      ownerPublicKey: OWNER_KEY,
      signature: "owner-signature-must-not-leak",
      issuedAt: NOW - 100,
      issuerPublicKey: "issuer-public-key",
      issuerSignature: "issuer-signature-must-not-leak",
      nonce: "private-ish-nonce-must-not-leak",
    },
    metadata: {
      creator: "B$S Test Forge",
      createdAt: NOW - 100,
      edition: 4,
    },
    ...overrides,
  };
}

function inventory(overrides: {
  owned?: string[];
  equipped?: string[];
  tradeable?: string[];
} = {}) {
  return {
    ownedAddonIds: overrides.owned ?? ["addon-1", "addon-2"],
    equippedAddonIds: overrides.equipped ?? [],
    tradeableAddonIds: overrides.tradeable ?? ["addon-1", "addon-2"],
  };
}

function createDraft() {
  useWalletStore.getState().ensureWallet(OWNER_KEY, NOW);
  return useWalletStore.getState().createTrade({
    toWalletId: "BSS-CAFE-BABE",
    offeredAddonIds: ["addon-1"],
    requestedItemsNote: "One aura from the lunar set",
    expiresInMs: 24 * 60 * 60 * 1000,
    inventory: inventory(),
    now: NOW,
  });
}

describe("B$S Vault store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useWalletStore.setState({ ...INITIAL_WALLET_STATE });
  });

  it("links one stable wallet identity to the add-on ownership key", () => {
    const walletId = useWalletStore
      .getState()
      .ensureWallet(OWNER_KEY, NOW);

    expect(walletId).toMatch(/^BSS-[A-F0-9]{4}-[A-F0-9]{4}$/);
    expect(useWalletStore.getState().walletId).toBe(walletId);
    expect(useWalletStore.getState().ledger[0].event).toBe("wallet.created");

    useWalletStore.getState().ensureWallet(OWNER_KEY, NOW + 1);
    expect(useWalletStore.getState().ledger).toHaveLength(1);
  });

  it("creates a draft without locking or removing the offered addon", () => {
    const result = createDraft();

    expect(result.ok).toBe(true);
    expect(result.value?.status).toBe("draft");
    expect(useWalletStore.getState().lockedAddonIds).toEqual([]);
    expect(useWalletStore.getState().ledger[0].event).toBe("trade.created");
  });

  it("requires review, re-checks inventory, and locks only at stage two", () => {
    const draft = createDraft();
    const tradeId = draft.value!.id;

    const withoutApproval = useWalletStore.getState().lockTrade({
      tradeId,
      guardianApproved: false,
      inventory: inventory(),
      now: NOW + 1,
    });
    expect(withoutApproval.ok).toBe(false);
    expect(useWalletStore.getState().lockedAddonIds).toEqual([]);

    const equippedAtReview = useWalletStore.getState().lockTrade({
      tradeId,
      guardianApproved: true,
      inventory: inventory({ equipped: ["addon-1"] }),
      now: NOW + 2,
    });
    expect(equippedAtReview.ok).toBe(false);

    const locked = useWalletStore.getState().lockTrade({
      tradeId,
      guardianApproved: true,
      inventory: inventory(),
      now: NOW + 3,
    });
    expect(locked.ok).toBe(true);
    expect(locked.value?.status).toBe("locked");
    expect(useWalletStore.getState().lockedAddonIds).toEqual(["addon-1"]);
  });

  it("cancels a locked trade without moving the addon", () => {
    const tradeId = createDraft().value!.id;
    useWalletStore.getState().lockTrade({
      tradeId,
      guardianApproved: true,
      inventory: inventory(),
      now: NOW + 1,
    });

    const result = useWalletStore
      .getState()
      .cancelTrade(tradeId, NOW + 2);

    expect(result.ok).toBe(true);
    expect(result.value?.status).toBe("cancelled");
    expect(useWalletStore.getState().lockedAddonIds).toEqual([]);
    expect(useWalletStore.getState().ledger[0].event).toBe("trade.cancelled");
  });

  it("expires offers and releases every lock automatically", () => {
    const tradeId = createDraft().value!.id;
    useWalletStore.getState().lockTrade({
      tradeId,
      guardianApproved: true,
      inventory: inventory(),
      now: NOW + 1,
    });

    const expired = useWalletStore
      .getState()
      .expireTrades(NOW + 24 * 60 * 60 * 1000 + 1);

    expect(expired).toBe(1);
    expect(useWalletStore.getState().trades[tradeId].status).toBe("expired");
    expect(useWalletStore.getState().lockedAddonIds).toEqual([]);
  });

  it("exports only a non-settling public preview packet", () => {
    const trade = createDraft().value!;
    const addon = makeAddon("addon-1");
    const packet = buildPublicTradePacket(trade, { "addon-1": addon });
    const serialized = JSON.stringify(packet);

    expect(packet.settlement).toBe("preview-only");
    expect(packet.offer.addons[0]).toMatchObject({
      id: "addon-1",
      name: "Addon addon-1",
      edition: 4,
    });
    expect(serialized).not.toContain(addon.ownership.signature);
    expect(serialized).not.toContain(addon.ownership.issuerSignature);
    expect(serialized).not.toContain(addon.ownership.nonce);
  });
});

describe("wallet tradeability rules", () => {
  const addon = makeAddon("addon-1");

  it("makes equipped and locked assets unavailable with a clear reason", () => {
    expect(
      getAddonTradeability(addon, {
        walletOwnerPublicKey: OWNER_KEY,
        equippedAddonIds: [addon.id],
        lockedAddonIds: [],
        now: NOW,
      }),
    ).toMatchObject({ tradeable: false, reason: "equipped" });

    expect(
      getAddonTradeability(addon, {
        walletOwnerPublicKey: OWNER_KEY,
        equippedAddonIds: [],
        lockedAddonIds: [addon.id],
        now: NOW,
      }),
    ).toMatchObject({ tradeable: false, reason: "locked" });
  });

  it("blocks expired, soulbound, and wrong-owner assets", () => {
    expect(
      getAddonTradeability(
        makeAddon("expired", {
          ownership: { ...addon.ownership, expiresAt: NOW },
        }),
        {
          walletOwnerPublicKey: OWNER_KEY,
          equippedAddonIds: [],
          lockedAddonIds: [],
          now: NOW,
        },
      ).reason,
    ).toBe("expired");

    expect(
      getAddonTradeability(
        makeAddon("bound", {
          metadata: {
            ...addon.metadata,
            tags: ["Soul Bound", "collector"],
          },
        }),
        {
          walletOwnerPublicKey: OWNER_KEY,
          equippedAddonIds: [],
          lockedAddonIds: [],
          now: NOW,
        },
      ).reason,
    ).toBe("soulbound");

    expect(
      getAddonTradeability(
        makeAddon("other", {
          ownership: { ...addon.ownership, ownerPublicKey: "someone-else" },
        }),
        {
          walletOwnerPublicKey: OWNER_KEY,
          equippedAddonIds: [],
          lockedAddonIds: [],
          now: NOW,
        },
      ).reason,
    ).toBe("not-owned");
  });
});
