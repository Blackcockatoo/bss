"use client";

import {
  CheckCircle2,
  Clock3,
  Copy,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import type { Addon } from "@/lib/addons/types";
import type { TradeOffer } from "@/lib/wallet/types";

const STATUS_STYLE: Record<TradeOffer["status"], string> = {
  draft: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  locked: "border-cyan-400/30 bg-cyan-500/10 text-cyan-200",
  accepted: "border-indigo-400/30 bg-indigo-500/10 text-indigo-200",
  settled: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  declined: "border-rose-400/30 bg-rose-500/10 text-rose-200",
  cancelled: "border-slate-600 bg-slate-800/60 text-slate-300",
  expired: "border-slate-600 bg-slate-800/60 text-slate-300",
  reversed: "border-violet-400/30 bg-violet-500/10 text-violet-200",
};

export function TradeOfferCard({
  trade,
  addons,
  onLock,
  onCancel,
  onCopy,
}: {
  trade: TradeOffer;
  addons: Record<string, Addon>;
  onLock: (tradeId: string, reviewed: boolean) => void;
  onCancel: (tradeId: string) => void;
  onCopy: (trade: TradeOffer) => void;
}) {
  const [reviewed, setReviewed] = useState(false);
  const active = trade.status === "draft" || trade.status === "locked";

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-lg shadow-black/10">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            To {trade.toWalletId}
          </p>
          <p className="mt-1 font-mono text-xs text-slate-400">
            {trade.id.slice(0, 20)}…
          </p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLE[trade.status]}`}
        >
          {trade.status}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {trade.offeredAddonIds.map((addonId) => {
          const addon = addons[addonId];
          return (
            <div
              key={addonId}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-100">
                  {addon?.name ?? "Unavailable add-on"}
                </p>
                <p className="text-[10px] capitalize text-slate-500">
                  {addon ? `${addon.rarity} · ${addon.category}` : addonId}
                </p>
              </div>
              {trade.status === "locked" && (
                <LockKeyhole className="h-4 w-4 shrink-0 text-cyan-300" />
              )}
            </div>
          );
        })}
      </div>

      {trade.requestedItemsNote && (
        <div className="mt-3 rounded-xl border border-violet-400/20 bg-violet-500/5 px-3 py-2">
          <p className="text-[9px] uppercase tracking-wider text-violet-300/70">
            Asking for
          </p>
          <p className="mt-1 text-xs leading-relaxed text-violet-100">
            {trade.requestedItemsNote}
          </p>
        </div>
      )}

      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500">
        <Clock3 className="h-3 w-3" />
        Expires {new Date(trade.expiresAt).toLocaleString()}
      </div>

      {trade.status === "draft" && (
        <div className="mt-4 space-y-3 rounded-xl border border-amber-400/20 bg-amber-500/5 p-3">
          <label className="flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-slate-300">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(event) => setReviewed(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-cyan-400"
            />
            <span>
              Guardian or wallet owner reviewed the exact items and recipient.
            </span>
          </label>
          <button
            type="button"
            onClick={() => onLock(trade.id, reviewed)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-200"
          >
            <ShieldCheck className="h-4 w-4" />
            Lock reviewed offer
          </button>
        </div>
      )}

      {trade.status === "locked" && (
        <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-3">
          <div className="flex items-start gap-2 text-xs leading-relaxed text-cyan-100">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Offer packet is ready. Assets stay here until connected two-party
              settlement is built.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onCopy(trade)}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
          >
            <Copy className="h-4 w-4" />
            Copy safe offer packet
          </button>
        </div>
      )}

      {active && (
        <button
          type="button"
          onClick={() => onCancel(trade.id)}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-300 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-200"
        >
          <RotateCcw className="h-4 w-4" />
          Cancel and release items
        </button>
      )}
    </article>
  );
}
