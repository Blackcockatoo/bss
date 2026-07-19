"use client";

import {
  ArrowLeftRight,
  Check,
  Clock3,
  Copy,
  History,
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TradeOfferCard } from "@/components/wallet/TradeOfferCard";
import { WalletAddonCard } from "@/components/wallet/WalletAddonCard";
import { useAddonStore } from "@/lib/addons";
import { initializeStarterAddons } from "@/lib/addons/starter";
import { useEnforceChildSafeClientRoute } from "@/lib/childSafeRoute.client";
import {
  buildPublicTradePacket,
  getAddonTradeability,
  useWalletStore,
} from "@/lib/wallet";
import type {
  AddonTradeability,
  TradeOffer,
  WalletInventorySnapshot,
} from "@/lib/wallet";

type WalletTab = "collection" | "trade" | "activity";
type CollectionFilter = "all" | "ready" | "equipped" | "locked";

const EXPIRY_OPTIONS = [
  { label: "24 hours", milliseconds: 24 * 60 * 60 * 1000 },
  { label: "3 days", milliseconds: 3 * 24 * 60 * 60 * 1000 },
  { label: "7 days", milliseconds: 7 * 24 * 60 * 60 * 1000 },
];

const TABS: Array<{
  id: WalletTab;
  label: string;
  icon: typeof WalletCards;
}> = [
  { id: "collection", label: "Collection", icon: PackageCheck },
  { id: "trade", label: "Trade Desk", icon: ArrowLeftRight },
  { id: "activity", label: "Ledger", icon: History },
];

function formatLedgerTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function copyToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export default function WalletPage() {
  const childSafeBlocked = useEnforceChildSafeClientRoute("/wallet");
  const addons = useAddonStore((state) => state.addons);
  const equipped = useAddonStore((state) => state.equipped);
  const ownerPublicKey = useAddonStore((state) => state.ownerPublicKey);
  const walletId = useWalletStore((state) => state.walletId);
  const ownerKeyFingerprint = useWalletStore(
    (state) => state.ownerKeyFingerprint,
  );
  const trades = useWalletStore((state) => state.trades);
  const lockedAddonIds = useWalletStore((state) => state.lockedAddonIds);
  const ledger = useWalletStore((state) => state.ledger);
  const ensureWallet = useWalletStore((state) => state.ensureWallet);
  const createTrade = useWalletStore((state) => state.createTrade);
  const lockTrade = useWalletStore((state) => state.lockTrade);
  const cancelTrade = useWalletStore((state) => state.cancelTrade);
  const expireTrades = useWalletStore((state) => state.expireTrades);

  const [tab, setTab] = useState<WalletTab>("collection");
  const [filter, setFilter] = useState<CollectionFilter>("all");
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [recipientWalletId, setRecipientWalletId] = useState("");
  const [requestedItemsNote, setRequestedItemsNote] = useState("");
  const [expiryMs, setExpiryMs] = useState(EXPIRY_OPTIONS[0].milliseconds);
  const [booting, setBooting] = useState(true);
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    expireTrades();
    void initializeStarterAddons().then((result) => {
      const currentOwnerKey = useAddonStore.getState().ownerPublicKey;
      if (result.success && currentOwnerKey) {
        ensureWallet(currentOwnerKey);
      }
      if (active) setBooting(false);
    });
    return () => {
      active = false;
    };
  }, [ensureWallet, expireTrades]);

  const addonList = useMemo(
    () =>
      Object.values(addons).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      ),
    [addons],
  );
  const equippedAddonIds = useMemo(
    () => Object.values(equipped).filter((id): id is string => !!id),
    [equipped],
  );
  const tradeabilityById = useMemo(() => {
    const result: Record<string, AddonTradeability> = {};
    for (const addon of addonList) {
      result[addon.id] = getAddonTradeability(addon, {
        walletOwnerPublicKey: ownerPublicKey,
        equippedAddonIds,
        lockedAddonIds,
      });
    }
    return result;
  }, [addonList, equippedAddonIds, lockedAddonIds, ownerPublicKey]);
  const tradeableAddonIds = useMemo(
    () =>
      addonList
        .filter((addon) => tradeabilityById[addon.id]?.tradeable)
        .map((addon) => addon.id),
    [addonList, tradeabilityById],
  );
  const inventorySnapshot = useMemo<WalletInventorySnapshot>(
    () => ({
      ownedAddonIds: addonList.map((addon) => addon.id),
      equippedAddonIds,
      tradeableAddonIds,
    }),
    [addonList, equippedAddonIds, tradeableAddonIds],
  );
  const filteredAddons = useMemo(
    () =>
      addonList.filter((addon) => {
        const state = tradeabilityById[addon.id];
        if (filter === "ready") return state?.tradeable;
        if (filter === "equipped") return state?.reason === "equipped";
        if (filter === "locked") return state?.reason === "locked";
        return true;
      }),
    [addonList, filter, tradeabilityById],
  );
  const sortedTrades = useMemo(
    () =>
      Object.values(trades).sort(
        (a, b) => b.updatedAt - a.updatedAt,
      ),
    [trades],
  );
  const activeTradeCount = useMemo(
    () =>
      sortedTrades.filter(
        (trade) => trade.status === "draft" || trade.status === "locked",
      ).length,
    [sortedTrades],
  );
  const signedCount = useMemo(
    () =>
      addonList.filter(
        (addon) =>
          !!addon.ownership.signature && !!addon.ownership.issuerSignature,
      ).length,
    [addonList],
  );

  useEffect(() => {
    setSelectedAddonIds((current) =>
      current.filter((id) => tradeabilityById[id]?.tradeable),
    );
  }, [tradeabilityById]);

  const toggleSelectedAddon = (addonId: string) => {
    setNotice(null);
    setSelectedAddonIds((current) =>
      current.includes(addonId)
        ? current.filter((id) => id !== addonId)
        : [...current, addonId],
    );
  };

  const handleCreateTrade = () => {
    const result = createTrade({
      toWalletId: recipientWalletId,
      offeredAddonIds: selectedAddonIds,
      requestedItemsNote,
      expiresInMs: expiryMs,
      inventory: inventorySnapshot,
    });
    if (!result.ok) {
      setNotice({
        tone: "error",
        message: result.error ?? "Trade draft could not be created.",
      });
      return;
    }

    setSelectedAddonIds([]);
    setRecipientWalletId("");
    setRequestedItemsNote("");
    setNotice({
      tone: "success",
      message: "Trade draft created. Review it below before locking anything.",
    });
  };

  const handleLockTrade = (tradeId: string, reviewed: boolean) => {
    const result = lockTrade({
      tradeId,
      guardianApproved: reviewed,
      inventory: inventorySnapshot,
    });
    setNotice(
      result.ok
        ? {
            tone: "success",
            message:
              "Offer locked safely. The add-ons remain yours until connected settlement exists.",
          }
        : {
            tone: "error",
            message: result.error ?? "This offer could not be locked.",
          },
    );
  };

  const handleCancelTrade = (tradeId: string) => {
    const result = cancelTrade(tradeId);
    setNotice(
      result.ok
        ? {
            tone: "success",
            message: "Trade cancelled and every offered item was released.",
          }
        : {
            tone: "error",
            message: result.error ?? "This trade could not be cancelled.",
          },
    );
  };

  const handleCopyPacket = async (trade: TradeOffer) => {
    const packet = buildPublicTradePacket(trade, addons);
    const copied = await copyToClipboard(JSON.stringify(packet, null, 2));
    setNotice(
      copied
        ? {
            tone: "success",
            message: "Safe preview packet copied. It cannot move an item.",
          }
        : {
            tone: "error",
            message: "Clipboard access is unavailable on this device.",
          },
    );
  };

  const handleCopyWalletId = async () => {
    const copied = await copyToClipboard(walletId);
    setNotice(
      copied
        ? { tone: "success", message: "Wallet ID copied." }
        : { tone: "error", message: "Could not copy the Wallet ID." },
    );
  };

  if (childSafeBlocked) return null;

  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-5 pb-10 text-zinc-100 sm:px-4 sm:py-8">
      <section className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-[radial-gradient(circle_at_top_right,#0e749033,#020617_55%)] p-5 shadow-2xl shadow-cyan-950/20 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300 sm:text-xs">
              <WalletCards className="h-4 w-4" />
              B$S Vault · Meta-Pet Add-On Wallet
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
              Own it. Lock it. Trade it safely.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
              One place for signed add-ons, controlled offers and permanent
              activity history. No crypto, withdrawals or paid chance.
            </p>
          </div>

          <div className="w-full rounded-2xl border border-cyan-300/25 bg-slate-950/80 p-4 lg:max-w-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-cyan-300/70">
                  Local QA Wallet
                </p>
                <p className="mt-1 font-mono text-sm font-semibold text-white sm:text-base">
                  {booting ? "LINKING…" : walletId || "NOT LINKED"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyWalletId}
                disabled={!walletId}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200 disabled:opacity-40"
                aria-label="Copy Wallet ID"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-800 pt-3 text-[10px] text-slate-500">
              <span>Key fingerprint</span>
              <span className="font-mono text-slate-300">
                {ownerKeyFingerprint || "pending"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Owned", value: addonList.length, icon: PackageCheck },
            { label: "Signed", value: signedCount, icon: ShieldCheck },
            { label: "Trade ready", value: tradeableAddonIds.length, icon: Sparkles },
            { label: "Active offers", value: activeTradeCount, icon: LockKeyhole },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  {label}
                </p>
                <Icon className="h-3.5 w-3.5 text-cyan-300/70" />
              </div>
              <p className="mt-1 text-2xl font-black text-white">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {notice && (
        <div
          role="status"
          className={`mt-4 flex items-start gap-2 rounded-2xl border px-4 py-3 text-xs leading-relaxed ${
            notice.tone === "success"
              ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
              : "border-rose-400/25 bg-rose-500/10 text-rose-100"
          }`}
        >
          {notice.tone === "success" ? (
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {notice.message}
        </div>
      )}

      <nav
        aria-label="Wallet sections"
        className="mt-6 grid grid-cols-3 gap-1 rounded-2xl border border-slate-800 bg-slate-950/80 p-1.5"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold transition sm:flex-row sm:text-xs ${
              tab === id
                ? "bg-cyan-300 text-slate-950"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      {tab === "collection" && (
        <section className="mt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Your collection</h2>
              <p className="mt-1 text-xs text-slate-500">
                Equipped and locked items remain visible but cannot enter a new
                offer.
              </p>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {(
                ["all", "ready", "equipped", "locked"] as CollectionFilter[]
              ).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-semibold capitalize transition ${
                    filter === value
                      ? "border-cyan-300/50 bg-cyan-500/15 text-cyan-100"
                      : "border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          {booting ? (
            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-8 text-center text-sm text-slate-400">
              Linking signed collection…
            </div>
          ) : filteredAddons.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-8 text-center">
              <p className="text-sm text-slate-300">No add-ons in this view.</p>
              <Link
                href="/shop"
                className="mt-3 inline-flex rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-200"
              >
                Visit the Add-On Workshop
              </Link>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredAddons.map((addon) => (
                <WalletAddonCard
                  key={addon.id}
                  addon={addon}
                  tradeability={tradeabilityById[addon.id]}
                  selected={selectedAddonIds.includes(addon.id)}
                  onToggle={toggleSelectedAddon}
                />
              ))}
            </div>
          )}

          {selectedAddonIds.length > 0 && (
            <div className="sticky bottom-24 z-20 mx-auto mt-5 max-w-xl rounded-2xl border border-cyan-300/30 bg-slate-950/95 p-3 shadow-2xl shadow-black/60 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-white">
                    {selectedAddonIds.length} add-on
                    {selectedAddonIds.length === 1 ? "" : "s"} selected
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Nothing is locked yet.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab("trade")}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-bold text-slate-950"
                >
                  Review trade
                  <ArrowLeftRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === "trade" && (
        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div>
            <h2 className="text-xl font-bold text-white">Build an offer</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Stage one makes a draft. Stage two reviews and locks it. No item
              leaves this device.
            </p>

            <div className="mt-4 space-y-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div>
                <label
                  htmlFor="recipient-wallet"
                  className="text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                >
                  Recipient Wallet ID
                </label>
                <input
                  id="recipient-wallet"
                  value={recipientWalletId}
                  onChange={(event) =>
                    setRecipientWalletId(event.target.value.toUpperCase())
                  }
                  placeholder="BSS-1234-ABCD"
                  maxLength={32}
                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 font-mono text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60"
                />
              </div>

              <div>
                <label
                  htmlFor="requested-items"
                  className="text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                >
                  What are you asking for?
                </label>
                <textarea
                  id="requested-items"
                  value={requestedItemsNote}
                  onChange={(event) =>
                    setRequestedItemsNote(event.target.value.slice(0, 240))
                  }
                  placeholder="Example: one lunar aura or another agreed add-on"
                  rows={3}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60"
                />
                <p className="mt-1 text-right text-[9px] text-slate-600">
                  {requestedItemsNote.length}/240
                </p>
              </div>

              <div>
                <label
                  htmlFor="trade-expiry"
                  className="text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                >
                  Draft expiry
                </label>
                <select
                  id="trade-expiry"
                  value={expiryMs}
                  onChange={(event) => setExpiryMs(Number(event.target.value))}
                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none focus:border-cyan-300/60"
                >
                  {EXPIRY_OPTIONS.map((option) => (
                    <option
                      key={option.milliseconds}
                      value={option.milliseconds}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    You offer
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab("collection")}
                    className="text-[10px] font-semibold text-cyan-300 hover:text-cyan-200"
                  >
                    {selectedAddonIds.length > 0 ? "Change" : "Choose add-ons"}
                  </button>
                </div>
                {selectedAddonIds.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-600">
                    Nothing selected. Choose up to six trade-ready items.
                  </p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {selectedAddonIds.map((id) => (
                      <div
                        key={id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-slate-950 px-2.5 py-2 text-xs"
                      >
                        <span className="truncate text-slate-200">
                          {addons[id]?.name ?? id}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSelectedAddon(id)}
                          className="text-slate-500 hover:text-rose-300"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleCreateTrade}
                disabled={selectedAddonIds.length === 0 || !walletId}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeftRight className="h-4 w-4" />
                Create review draft
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Your offers</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Locked does not mean transferred.
                </p>
              </div>
              <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[10px] text-slate-400">
                {activeTradeCount} active
              </span>
            </div>

            {sortedTrades.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-8 text-center">
                <ArrowLeftRight className="mx-auto h-8 w-8 text-slate-700" />
                <p className="mt-3 text-sm text-slate-400">No trade drafts yet.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {sortedTrades.map((trade) => (
                  <TradeOfferCard
                    key={trade.id}
                    trade={trade}
                    addons={addons}
                    onLock={handleLockTrade}
                    onCancel={handleCancelTrade}
                    onCopy={handleCopyPacket}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "activity" && (
        <section className="mt-6">
          <div>
            <h2 className="text-xl font-bold text-white">Vault ledger</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
              Append-only local history of wallet creation, trade drafts,
              locks, cancellations and expiry releases.
            </p>
          </div>

          {ledger.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-8 text-center text-sm text-slate-500">
              Ledger will appear after the Vault links.
            </div>
          ) : (
            <div className="relative mt-5 space-y-3 before:absolute before:bottom-3 before:left-[17px] before:top-3 before:w-px before:bg-slate-800">
              {ledger.map((entry) => (
                <article
                  key={entry.id}
                  className="relative flex gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5"
                >
                  <div className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cyan-400/25 bg-slate-950 text-cyan-300">
                    {entry.event === "trade.locked" ? (
                      <LockKeyhole className="h-4 w-4" />
                    ) : entry.event === "trade.expired" ? (
                      <Clock3 className="h-4 w-4" />
                    ) : (
                      <History className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-1">
                      <p className="text-xs font-semibold text-slate-200">
                        {entry.event.replace(".", " · ")}
                      </p>
                      <time className="text-[9px] text-slate-600">
                        {formatLedgerTime(entry.occurredAt)}
                      </time>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      {entry.message}
                    </p>
                    {entry.addonIds.length > 0 && (
                      <p className="mt-1.5 truncate font-mono text-[9px] text-slate-600">
                        {entry.addonIds.join(" · ")}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: ShieldCheck,
            title: "Two-stage review",
            body: "Draft first, then guardian or wallet-owner confirmation before assets lock.",
          },
          {
            icon: LockKeyhole,
            title: "No silent loss",
            body: "Locks block equipment conflicts but never remove an add-on from local ownership.",
          },
          {
            icon: WalletCards,
            title: "No cash value",
            body: "This foundation tracks game assets only. There is no withdrawal, crypto or paid chance.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
          >
            <Icon className="h-5 w-5 text-cyan-300" />
            <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
