import type { Addon } from "@/lib/addons/types";
import type {
  AddonTradeability,
  PublicTradePacket,
  TradeOffer,
  WalletInventorySnapshot,
} from "./types";

export const MIN_TRADE_LIFETIME_MS = 60 * 60 * 1000;
export const MAX_TRADE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_TRADE_NOTE_LENGTH = 240;
export const MAX_ADDONS_PER_TRADE = 6;

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/[_\s]+/g, "-");
}

export function uniqueAddonIds(addonIds: readonly string[]): string[] {
  return Array.from(
    new Set(addonIds.map((id) => id.trim()).filter((id) => id.length > 0)),
  );
}

export function fingerprintOwnerKey(ownerPublicKey: string): string {
  if (!ownerPublicKey.trim()) return "UNLINKED";

  // FNV-1a is used only for a short, human-readable fingerprint. The actual
  // public key and Web Crypto signatures remain the ownership authority.
  let hash = 0x811c9dc5;
  for (let index = 0; index < ownerPublicKey.length; index += 1) {
    hash ^= ownerPublicKey.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0").toUpperCase();
}

export function walletIdFromOwnerKey(ownerPublicKey: string): string {
  const fingerprint = fingerprintOwnerKey(ownerPublicKey);
  return fingerprint === "UNLINKED"
    ? ""
    : `BSS-${fingerprint.slice(0, 4)}-${fingerprint.slice(4)}`;
}

export function getAddonTradeability(
  addon: Addon,
  options: {
    walletOwnerPublicKey: string;
    equippedAddonIds: readonly string[];
    lockedAddonIds: readonly string[];
    now?: number;
  },
): AddonTradeability {
  const now = options.now ?? Date.now();
  const tags = (addon.metadata.tags ?? []).map(normalizeTag);

  if (
    options.walletOwnerPublicKey &&
    addon.ownership.ownerPublicKey !== options.walletOwnerPublicKey
  ) {
    return {
      tradeable: false,
      reason: "not-owned",
      label: "Ownership key mismatch",
    };
  }
  if (addon.ownership.expiresAt && addon.ownership.expiresAt <= now) {
    return { tradeable: false, reason: "expired", label: "Expired" };
  }
  if (
    tags.includes("soulbound") ||
    tags.includes("soul-bound") ||
    tags.includes("non-tradeable") ||
    tags.includes("non-tradable")
  ) {
    return { tradeable: false, reason: "soulbound", label: "Bound to pet" };
  }
  if (options.lockedAddonIds.includes(addon.id)) {
    return {
      tradeable: false,
      reason: "locked",
      label: "Locked in another offer",
    };
  }
  if (options.equippedAddonIds.includes(addon.id)) {
    return {
      tradeable: false,
      reason: "equipped",
      label: "Unequip before trading",
    };
  }
  return { tradeable: true, reason: "ready", label: "Trade ready" };
}

export function validateTradeInventory(
  addonIds: readonly string[],
  inventory: WalletInventorySnapshot,
): string | null {
  const uniqueIds = uniqueAddonIds(addonIds);

  if (uniqueIds.length === 0) return "Choose at least one add-on.";
  if (uniqueIds.length > MAX_ADDONS_PER_TRADE) {
    return `A trade can contain up to ${MAX_ADDONS_PER_TRADE} add-ons.`;
  }

  const missing = uniqueIds.find(
    (id) => !inventory.ownedAddonIds.includes(id),
  );
  if (missing) return "One of these add-ons is no longer in your Vault.";

  const equipped = uniqueIds.find((id) =>
    inventory.equippedAddonIds.includes(id),
  );
  if (equipped) return "Unequip every offered add-on before locking the trade.";

  const blocked = uniqueIds.find(
    (id) => !inventory.tradeableAddonIds.includes(id),
  );
  if (blocked) return "One of these add-ons is not currently tradeable.";

  return null;
}

export function buildPublicTradePacket(
  trade: TradeOffer,
  addons: Record<string, Addon>,
): PublicTradePacket {
  return {
    kind: "bss.metapet.trade-offer",
    version: 1,
    settlement: "preview-only",
    offer: {
      id: trade.id,
      fromWalletId: trade.fromWalletId,
      toWalletId: trade.toWalletId,
      requestedItemsNote: trade.requestedItemsNote,
      createdAt: trade.createdAt,
      expiresAt: trade.expiresAt,
      addons: trade.offeredAddonIds.flatMap((id) => {
        const addon = addons[id];
        if (!addon) return [];
        return [
          {
            id: addon.id,
            name: addon.name,
            rarity: addon.rarity,
            category: addon.category,
            creator: addon.metadata.creator,
            ...(addon.metadata.edition
              ? { edition: addon.metadata.edition }
              : {}),
          },
        ];
      }),
    },
    warning:
      "Preview packet only. No ownership changes until both connected wallets settle through the Meta-Pet transaction service.",
  };
}
