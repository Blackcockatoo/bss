import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  MAX_TRADE_LIFETIME_MS,
  MAX_TRADE_NOTE_LENGTH,
  MIN_TRADE_LIFETIME_MS,
  fingerprintOwnerKey,
  uniqueAddonIds,
  validateTradeInventory,
  walletIdFromOwnerKey,
} from "./rules";
import {
  WALLET_SCHEMA_VERSION,
  WALLET_STORAGE_KEY,
  type CreateTradeInput,
  type LockTradeInput,
  type TradeOffer,
  type WalletActionResult,
  type WalletLedgerEntry,
  type WalletLedgerEvent,
  type WalletState,
} from "./types";

const DEFAULT_GUARDRAILS = {
  guardianApprovalRequired: true,
  reversibleUntilSettlement: true,
  cashValueEnabled: false,
} as const;

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ledgerEntry(
  event: WalletLedgerEvent,
  message: string,
  occurredAt: number,
  options: { tradeId?: string; addonIds?: string[] } = {},
): WalletLedgerEntry {
  return {
    id: createId("ledger"),
    event,
    occurredAt,
    tradeId: options.tradeId,
    addonIds: options.addonIds ?? [],
    message,
  };
}

function releaseLocks(
  currentLockedIds: readonly string[],
  trade: TradeOffer,
): string[] {
  const released = new Set(trade.offeredAddonIds);
  return currentLockedIds.filter((id) => !released.has(id));
}

export interface WalletStore extends WalletState {
  ensureWallet: (ownerPublicKey: string, now?: number) => string;
  createTrade: (
    input: CreateTradeInput,
  ) => WalletActionResult<TradeOffer>;
  lockTrade: (input: LockTradeInput) => WalletActionResult<TradeOffer>;
  cancelTrade: (
    tradeId: string,
    now?: number,
  ) => WalletActionResult<TradeOffer>;
  expireTrades: (now?: number) => number;
  isAddonLocked: (addonId: string) => boolean;
}

export const INITIAL_WALLET_STATE: WalletState = {
  walletId: "",
  ownerKeyFingerprint: "",
  mode: "local-qa",
  guardrails: DEFAULT_GUARDRAILS,
  trades: {},
  lockedAddonIds: [],
  ledger: [],
};

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_WALLET_STATE,

      ensureWallet: (ownerPublicKey, now = Date.now()) => {
        const walletId = walletIdFromOwnerKey(ownerPublicKey);
        if (!walletId) return "";

        const current = get();
        if (current.walletId === walletId) return walletId;

        // Do not silently relink a wallet after it has active trade history.
        // A future account service can provide an explicit migration flow.
        if (current.walletId && Object.keys(current.trades).length > 0) {
          return current.walletId;
        }

        const alreadyCreated = current.ledger.some(
          (entry) => entry.event === "wallet.created",
        );
        set({
          walletId,
          ownerKeyFingerprint: fingerprintOwnerKey(ownerPublicKey),
          ledger: alreadyCreated
            ? current.ledger
            : [
                ledgerEntry(
                  "wallet.created",
                  "B$S Vault linked to this device's add-on ownership key.",
                  now,
                ),
                ...current.ledger,
              ],
        });
        return walletId;
      },

      createTrade: (input) => {
        const now = input.now ?? Date.now();
        const state = get();
        if (!state.walletId) {
          return { ok: false, error: "Link the Vault before creating a trade." };
        }

        const toWalletId = input.toWalletId.trim().toUpperCase();
        if (toWalletId.length < 6) {
          return { ok: false, error: "Enter the other player's Wallet ID." };
        }
        if (toWalletId === state.walletId.toUpperCase()) {
          return { ok: false, error: "Choose a different Wallet ID." };
        }

        const requestedItemsNote = (input.requestedItemsNote ?? "").trim();
        if (requestedItemsNote.length > MAX_TRADE_NOTE_LENGTH) {
          return {
            ok: false,
            error: `Keep the request under ${MAX_TRADE_NOTE_LENGTH} characters.`,
          };
        }
        if (
          input.expiresInMs < MIN_TRADE_LIFETIME_MS ||
          input.expiresInMs > MAX_TRADE_LIFETIME_MS
        ) {
          return { ok: false, error: "Choose an expiry from 1 hour to 7 days." };
        }

        const offeredAddonIds = uniqueAddonIds(input.offeredAddonIds);
        const inventoryError = validateTradeInventory(
          offeredAddonIds,
          input.inventory,
        );
        if (inventoryError) return { ok: false, error: inventoryError };

        const id = createId("trade");
        const trade: TradeOffer = {
          id,
          schemaVersion: WALLET_SCHEMA_VERSION,
          direction: "outgoing",
          status: "draft",
          fromWalletId: state.walletId,
          toWalletId,
          offeredAddonIds,
          requestedItemsNote,
          createdAt: now,
          updatedAt: now,
          expiresAt: now + input.expiresInMs,
        };

        set({
          trades: { ...state.trades, [id]: trade },
          ledger: [
            ledgerEntry(
              "trade.created",
              `Draft created with ${offeredAddonIds.length} add-on${
                offeredAddonIds.length === 1 ? "" : "s"
              }.`,
              now,
              { tradeId: id, addonIds: offeredAddonIds },
            ),
            ...state.ledger,
          ],
        });
        return { ok: true, value: trade };
      },

      lockTrade: (input) => {
        const now = input.now ?? Date.now();
        const state = get();
        const trade = state.trades[input.tradeId];
        if (!trade) return { ok: false, error: "Trade draft not found." };
        if (trade.status !== "draft") {
          return { ok: false, error: "Only a draft can be locked." };
        }
        if (trade.expiresAt <= now) {
          get().expireTrades(now);
          return { ok: false, error: "This draft has expired." };
        }
        if (
          state.guardrails.guardianApprovalRequired &&
          !input.guardianApproved
        ) {
          return {
            ok: false,
            error: "Guardian or wallet-owner review is required before locking.",
          };
        }

        const inventoryError = validateTradeInventory(
          trade.offeredAddonIds,
          input.inventory,
        );
        if (inventoryError) return { ok: false, error: inventoryError };

        const alreadyLocked = trade.offeredAddonIds.find((id) =>
          state.lockedAddonIds.includes(id),
        );
        if (alreadyLocked) {
          return {
            ok: false,
            error: "One of these add-ons is already locked in another offer.",
          };
        }

        const lockedTrade: TradeOffer = {
          ...trade,
          status: "locked",
          lockedAt: now,
          updatedAt: now,
          ...(input.guardianApproved ? { guardianApprovedAt: now } : {}),
        };
        set({
          trades: { ...state.trades, [trade.id]: lockedTrade },
          lockedAddonIds: uniqueAddonIds([
            ...state.lockedAddonIds,
            ...trade.offeredAddonIds,
          ]),
          ledger: [
            ledgerEntry(
              "trade.locked",
              "Offer locked. Assets remain in the Vault until connected settlement exists.",
              now,
              { tradeId: trade.id, addonIds: trade.offeredAddonIds },
            ),
            ...state.ledger,
          ],
        });
        return { ok: true, value: lockedTrade };
      },

      cancelTrade: (tradeId, now = Date.now()) => {
        const state = get();
        const trade = state.trades[tradeId];
        if (!trade) return { ok: false, error: "Trade not found." };
        if (trade.status !== "draft" && trade.status !== "locked") {
          return { ok: false, error: "This trade can no longer be cancelled." };
        }

        const cancelledTrade: TradeOffer = {
          ...trade,
          status: "cancelled",
          updatedAt: now,
        };
        set({
          trades: { ...state.trades, [trade.id]: cancelledTrade },
          lockedAddonIds: releaseLocks(state.lockedAddonIds, trade),
          ledger: [
            ledgerEntry(
              "trade.cancelled",
              "Trade cancelled. Every offered add-on is available again.",
              now,
              { tradeId: trade.id, addonIds: trade.offeredAddonIds },
            ),
            ...state.ledger,
          ],
        });
        return { ok: true, value: cancelledTrade };
      },

      expireTrades: (now = Date.now()) => {
        const state = get();
        const expiredTrades = Object.values(state.trades).filter(
          (trade) =>
            (trade.status === "draft" || trade.status === "locked") &&
            trade.expiresAt <= now,
        );
        if (expiredTrades.length === 0) return 0;

        const trades = { ...state.trades };
        let lockedAddonIds = [...state.lockedAddonIds];
        const entries: WalletLedgerEntry[] = [];
        for (const trade of expiredTrades) {
          trades[trade.id] = { ...trade, status: "expired", updatedAt: now };
          lockedAddonIds = releaseLocks(lockedAddonIds, trade);
          entries.push(
            ledgerEntry(
              "trade.expired",
              "Trade expired. Its add-ons were automatically released.",
              now,
              { tradeId: trade.id, addonIds: trade.offeredAddonIds },
            ),
          );
        }
        set({
          trades,
          lockedAddonIds,
          ledger: [...entries, ...state.ledger],
        });
        return expiredTrades.length;
      },

      isAddonLocked: (addonId) => get().lockedAddonIds.includes(addonId),
    }),
    {
      name: WALLET_STORAGE_KEY,
      version: WALLET_SCHEMA_VERSION,
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<WalletState>;
        return {
          ...current,
          ...saved,
          mode: "local-qa" as const,
          guardrails: { ...DEFAULT_GUARDRAILS, ...saved.guardrails },
          trades: saved.trades ?? {},
          lockedAddonIds: uniqueAddonIds(saved.lockedAddonIds ?? []),
          ledger: saved.ledger ?? [],
        };
      },
    },
  ),
);
