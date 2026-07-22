import type { Addon } from "@/lib/addons/types";

export const WALLET_STORAGE_KEY = "metapet-bss-vault";
export const WALLET_SCHEMA_VERSION = 1;

export type TradeOfferStatus =
  | "draft"
  | "locked"
  | "accepted"
  | "settled"
  | "declined"
  | "cancelled"
  | "expired"
  | "reversed";

export type WalletLedgerEvent =
  | "wallet.created"
  | "trade.created"
  | "trade.locked"
  | "trade.cancelled"
  | "trade.expired";

export interface WalletGuardrails {
  /** A local confirmation today; designed to become a server-side guardian
   * approval when household accounts are connected. */
  guardianApprovalRequired: boolean;
  /** A locked offer can be cancelled without moving the underlying asset. */
  reversibleUntilSettlement: boolean;
  /** Cash, crypto, and withdrawals are deliberately outside this wallet. */
  cashValueEnabled: false;
}

export interface WalletInventorySnapshot {
  ownedAddonIds: readonly string[];
  equippedAddonIds: readonly string[];
  tradeableAddonIds: readonly string[];
}

export interface TradeOffer {
  id: string;
  schemaVersion: typeof WALLET_SCHEMA_VERSION;
  direction: "outgoing";
  status: TradeOfferStatus;
  fromWalletId: string;
  toWalletId: string;
  offeredAddonIds: string[];
  /** Human-readable request until connected wallets can select recipient
   * asset IDs directly. Never treated as a price or settlement instruction. */
  requestedItemsNote: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  lockedAt?: number;
  guardianApprovedAt?: number;
}

export interface WalletLedgerEntry {
  id: string;
  event: WalletLedgerEvent;
  occurredAt: number;
  tradeId?: string;
  addonIds: string[];
  message: string;
}

export interface WalletState {
  walletId: string;
  ownerKeyFingerprint: string;
  mode: "local-qa";
  guardrails: WalletGuardrails;
  trades: Record<string, TradeOffer>;
  lockedAddonIds: string[];
  ledger: WalletLedgerEntry[];
}

export interface CreateTradeInput {
  toWalletId: string;
  offeredAddonIds: string[];
  requestedItemsNote?: string;
  expiresInMs: number;
  inventory: WalletInventorySnapshot;
  now?: number;
}

export interface LockTradeInput {
  tradeId: string;
  guardianApproved: boolean;
  inventory: WalletInventorySnapshot;
  now?: number;
}

export interface WalletActionResult<T = undefined> {
  ok: boolean;
  value?: T;
  error?: string;
}

export interface AddonTradeability {
  tradeable: boolean;
  reason:
    | "ready"
    | "equipped"
    | "locked"
    | "expired"
    | "not-owned"
    | "soulbound";
  label: string;
}

export interface TradePacketAddon {
  id: string;
  name: string;
  rarity: Addon["rarity"];
  category: Addon["category"];
  creator: string;
  edition?: number;
}

export interface PublicTradePacket {
  kind: "bss.metapet.trade-offer";
  version: typeof WALLET_SCHEMA_VERSION;
  settlement: "preview-only";
  offer: Pick<
    TradeOffer,
    | "id"
    | "fromWalletId"
    | "toWalletId"
    | "requestedItemsNote"
    | "createdAt"
    | "expiresAt"
  > & { addons: TradePacketAddon[] };
  warning: string;
}
