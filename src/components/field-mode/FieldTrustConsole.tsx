"use client";

import { Download, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { createFieldBackup, serializeFieldBackup } from "@/lib/fieldMode/backup";
import { getFieldPackOverview } from "@/lib/fieldMode/offlinePack.client";
import {
  SCHOOLS_LOCAL_STATE_META_STORAGE_KEY,
  SCHOOLS_STORAGE_KEYS,
  clearSchoolsLocalState,
  getSchoolsDataExpiryDate,
} from "@/lib/schools/storage";

interface TrustSnapshot {
  recordSets: number;
  oldestTimestamp: number | null;
  expiresAt: number | null;
  packVersion: string;
  lastVerifiedAt: number | null;
}

function collectTimestamps(value: unknown, found: number[], depth = 0): void {
  if (depth > 8 || value === null) return;
  if (typeof value === "number" && value > 1_577_836_800_000 && value < 4_102_444_800_000) {
    found.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectTimestamps(item, found, depth + 1));
    return;
  }
  if (typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((item) => collectTimestamps(item, found, depth + 1));
  }
}

function formatDate(value: number | null): string {
  return value ? new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short" }).format(value) : "Not yet established";
}

async function readTrustSnapshot(): Promise<TrustSnapshot> {
  const timestamps: number[] = [];
  let recordSets = 0;
  for (const key of SCHOOLS_STORAGE_KEYS) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    if (key !== SCHOOLS_LOCAL_STATE_META_STORAGE_KEY) recordSets += 1;
    try { collectTimestamps(JSON.parse(raw), timestamps); } catch { /* Plain strings carry no record timestamp. */ }
  }
  const pack = await getFieldPackOverview();
  const expiry = getSchoolsDataExpiryDate(window.localStorage);
  return {
    recordSets,
    oldestTimestamp: timestamps.length ? Math.min(...timestamps) : null,
    expiresAt: expiry?.getTime() ?? null,
    packVersion: pack.active?.version ?? pack.available?.version ?? "Not installed",
    lastVerifiedAt: pack.active?.installedAt ?? null,
  };
}

export function FieldTrustConsole() {
  const [snapshot, setSnapshot] = useState<TrustSnapshot | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setSnapshot(await readTrustSnapshot());
  }, []);

  useEffect(() => {
    let cancelled = false;
    void readTrustSnapshot().then((nextSnapshot) => {
      if (!cancelled) setSnapshot(nextSnapshot);
    });
    return () => { cancelled = true; };
  }, []);

  const exportRecords = () => {
    const backup = createFieldBackup(window.localStorage);
    const url = URL.createObjectURL(new Blob([serializeFieldBackup(backup)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `metapet-field-backup-${backup.createdAt.slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Alias-only Field backup downloaded. Nothing was uploaded.");
  };

  const deleteAll = () => {
    if (!window.confirm("Delete every MetaPet School classroom record on this device? This cannot be undone unless you already exported a backup.")) return;
    clearSchoolsLocalState(window.localStorage);
    setNotice("Every allowlisted school-mode key was deleted from this device.");
    void refresh();
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Current Field Mode trust status">
        {[
          ["Local record sets", String(snapshot?.recordSets ?? 0)],
          ["Oldest known record", formatDate(snapshot?.oldestTimestamp ?? null)],
          ["Automatic expiry", formatDate(snapshot?.expiresAt ?? null)],
          ["Offline pack version", snapshot?.packVersion ?? "Checking…"],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">{label}</p>
            <p className="mt-3 break-words text-lg font-semibold">{value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Declared behaviour</h2>
          <dl className="mt-4 grid gap-4 text-sm leading-6">
            <div><dt className="font-semibold">Stored locally</dt><dd className="text-slate-600">Teacher-created aliases, lesson setup, progress and optional light evidence only.</dd></div>
            <div><dt className="font-semibold">Third-party services in Field Mode</dt><dd className="text-slate-600">None declared. Site analytics are disabled on school surfaces.</dd></div>
            <div><dt className="font-semibold">Expected network behaviour</dt><dd className="text-slate-600">Same-origin page and offline-pack requests. Routine lesson use does not require a cloud write.</dd></div>
            <div><dt className="font-semibold">Last successful offline verification</dt><dd className="text-slate-600">{formatDate(snapshot?.lastVerifiedAt ?? null)}</dd></div>
          </dl>
        </article>
        <article className="rounded-3xl border border-emerald-900/15 bg-emerald-50 p-6 text-emerald-950">
          <div className="flex items-center gap-3"><ShieldCheck className="h-6 w-6" aria-hidden="true" /><h2 className="text-2xl font-semibold">Teacher controls</h2></div>
          <p className="mt-3 text-sm leading-6">Export is manual and downloads to this device. Delete all removes every allowlisted school-mode key. Consumer profile data is excluded from Field backups.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={exportRecords} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white"><Download className="h-5 w-5" aria-hidden="true" />Export local records</button>
            <button type="button" onClick={deleteAll} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-rose-300 bg-white px-5 py-3 text-sm font-semibold text-rose-900"><Trash2 className="h-5 w-5" aria-hidden="true" />Delete all</button>
            <button type="button" onClick={() => void refresh()} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-emerald-800 px-5 py-3 text-sm font-semibold"><RefreshCw className="h-5 w-5" aria-hidden="true" />Verify again</button>
          </div>
          {notice ? <p className="mt-4 rounded-xl bg-white p-3 text-sm" role="status">{notice}</p> : null}
        </article>
      </section>
    </div>
  );
}
