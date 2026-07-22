"use client";

import {
  ArchiveRestore,
  CheckCircle2,
  CloudOff,
  Download,
  FileDown,
  HardDriveDownload,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
  Wifi,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { FIELD_MODE_PRINT_PATH_PREFIX } from "@/lib/childSafeBaseline";
import {
  FIELD_BACKUP_MAX_BYTES,
  applyFieldBackup,
  createFieldBackup,
  parseFieldBackup,
  serializeFieldBackup,
} from "@/lib/fieldMode/backup";
import { useFieldConnectivity } from "@/lib/fieldMode/connectivity";
import {
  getFieldPackOverview,
  installFieldPack,
  removeFieldPack,
  rollbackFieldPack,
  setFieldPackBypass,
  type FieldPackOverview,
} from "@/lib/fieldMode/offlinePack.client";
import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

type Notice = { tone: "success" | "error" | "info"; message: string };

function readableDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export function OfflinePackManager() {
  const online = useFieldConnectivity();
  const [overview, setOverview] = useState<FieldPackOverview | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const next = await getFieldPackOverview();
    setOverview(next);
    return next;
  }, []);

  useEffect(() => {
    void refresh().catch((error: unknown) =>
      setNotice({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to read Field Pack status.",
      }),
    );
  }, [online, refresh]);

  const run = async (
    label: string,
    action: () => Promise<unknown>,
    success: string,
  ) => {
    setBusy(label);
    setNotice(null);
    try {
      await action();
      await refresh();
      setNotice({ tone: "success", message: success });
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Field Pack operation failed.",
      });
    } finally {
      setBusy(null);
    }
  };

  const exportBackup = () => {
    try {
      const backup = createFieldBackup(window.localStorage);
      const blob = new Blob([serializeFieldBackup(backup)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `metapet-field-backup-${backup.createdAt.slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice({
        tone: "success",
        message: "Local classroom backup downloaded. Keep it in a teacher-controlled location.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Backup could not be created.",
      });
    }
  };

  const importBackup = async (file: File) => {
    setBusy("import");
    setNotice(null);
    try {
      if (file.size > FIELD_BACKUP_MAX_BYTES) {
        throw new Error("This backup is larger than the 5 MB safety limit.");
      }
      const backup = parseFieldBackup(await file.text());
      if (
        !window.confirm(
          "Replace the current Field classroom records on this device with this backup?",
        )
      ) {
        return;
      }
      applyFieldBackup(window.localStorage, backup);
      setNotice({
        tone: "success",
        message: "Backup restored. Reloading the local classroom records…",
      });
      window.setTimeout(() => window.location.reload(), 250);
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Backup could not be restored.",
      });
    } finally {
      if (importRef.current) importRef.current.value = "";
      setBusy(null);
    }
  };

  const supported = overview?.supported !== false;
  const active = overview?.active ?? null;
  const updateAvailable = overview?.updateAvailable === true;
  const emergencyDisabled = overview?.available?.emergencyNoop === true;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3" aria-label="Field Pack status">
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            {online ? <Wifi className="h-5 w-5 text-emerald-700" /> : <CloudOff className="h-5 w-5 text-amber-700" />}
            Connection
          </div>
          <p className="mt-3 text-2xl font-semibold">{online ? "Online" : "Offline"}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {online
              ? "The latest Field Pack can be checked safely."
              : active
                ? "The installed pack remains available on this device."
                : "Reconnect before downloading a complete pack."}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <HardDriveDownload className="h-5 w-5 text-emerald-700" />
            Installed pack
          </div>
          <p className="mt-3 text-2xl font-semibold">
            {active && !overview?.bypassed ? "Ready" : "Not active"}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {active
              ? `${active.itemCount} verified files · ${readableDate(active.installedAt)}`
              : "No complete Field Pack is stored yet."}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <ShieldCheck className="h-5 w-5 text-emerald-700" />
            Safe update state
          </div>
          <p className="mt-3 text-2xl font-semibold">
            {emergencyDisabled
              ? "Paused"
              : updateAvailable
                ? "Update ready"
                : overview?.previous
                  ? "Rollback ready"
                  : "Protected"}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            A new pack becomes active only after every required route and asset succeeds.
          </p>
        </div>
      </section>

      {notice ? (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          className={`rounded-2xl border p-4 text-sm leading-6 ${
            notice.tone === "error"
              ? "border-rose-300 bg-rose-50 text-rose-900"
              : notice.tone === "success"
                ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                : "border-cyan-300 bg-cyan-50 text-cyan-950"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-800">
            Complete Field Pack
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Prepare this device before class</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Downloads all seven guided lessons, classroom pages, teacher and safety references,
            printable fallbacks, and the exact code, images, fonts and audio they require.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!online || !supported || emergencyDisabled || busy !== null}
            onClick={() =>
              void run(
                "install",
                installFieldPack,
                active ? "Field Pack checked and replaced atomically." : "Complete Field Pack installed.",
              )
            }
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "install" ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            {active ? (updateAvailable ? "Install safe update" : "Check and repair pack") : "Download complete Field Pack"}
          </button>
          {overview?.previous ? (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void run("rollback", rollbackFieldPack, "Previous complete Field Pack restored.")}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-950 disabled:opacity-50"
            >
              <ArchiveRestore className="h-5 w-5" />
              Use previous pack
            </button>
          ) : null}
          {active ? (
            <button
              type="button"
              disabled={!online || busy !== null}
              onClick={() =>
                void run(
                  "bypass",
                  () => setFieldPackBypass(!overview?.bypassed),
                  overview?.bypassed ? "Installed pack active again." : "Network-only emergency mode enabled.",
                )
              }
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 disabled:opacity-50"
            >
              <Wifi className="h-5 w-5" />
              {overview?.bypassed ? "Reactivate installed pack" : "Emergency network-only"}
            </button>
          ) : null}
          {active ? (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => {
                if (window.confirm("Remove the offline Field Pack from this device? Classroom records will stay.")) {
                  void run("remove", removeFieldPack, "Offline pack removed. Classroom records were kept.");
                }
              }}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-900 disabled:opacity-50"
            >
              <Trash2 className="h-5 w-5" />
              Remove offline pack
            </button>
          ) : null}
        </div>
        {emergencyDisabled ? (
          <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">
            Offline installation is temporarily paused by the release safety switch. Use the live network version until the school deployment is cleared.
          </p>
        ) : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <FileDown className="h-6 w-6 text-cyan-800" />
            <h2 className="text-2xl font-semibold">Local class backup</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Export only Field-safe classroom settings, aliases, progress and lesson evidence.
            Consumer profiles and pet records are never included, and nothing is uploaded.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportBackup}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-cyan-800 px-5 py-3 text-sm font-semibold text-white"
            >
              <Download className="h-5 w-5" />
              Download local backup
            </button>
            <label className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-cyan-300 bg-cyan-50 px-5 py-3 text-sm font-semibold text-cyan-950">
              <Upload className="h-5 w-5" />
              Restore backup
              <input
                ref={importRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                disabled={busy !== null}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importBackup(file);
                }}
              />
            </label>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            Restored data re-enters the existing 35-day local retention window. Only versioned,
            allowlisted Field backup keys are accepted.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-800" />
            <h2 className="text-2xl font-semibold">Emergency classroom behaviour</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>• Offline lessons automatically use static pet visuals.</li>
            <li>• The installed version stays fixed until a teacher completes a safe update.</li>
            <li>• A failed download never replaces the last complete pack.</li>
            <li>• The previous complete pack can be restored without deleting class records.</li>
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
        <h2 className="text-2xl font-semibold">Printable lesson fallbacks</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Each static lesson sheet can be printed or saved as a PDF and is included in the complete Field Pack.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {LESSON_DEFINITIONS.map((lesson) => (
            <a
              key={lesson.id}
              href={`${FIELD_MODE_PRINT_PATH_PREFIX}/${lesson.slug}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              <span>Lesson {lesson.number}: {lesson.title}</span>
              <FileDown className="h-5 w-5 text-emerald-800" aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
