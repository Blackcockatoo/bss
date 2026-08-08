"use client";

import { useMemo, useState, useSyncExternalStore } from "react";

import {
  SCHOOLS_LOCAL_DATA_RETENTION_DAYS,
  buildSchoolsAggregateSummary,
  clearSchoolsClassSession,
  clearSchoolsLocalState,
  describeSchoolsLocalData,
  purgeExpiredSchoolsLocalState,
  type SchoolsAggregateSummary,
  type SchoolsLocalDataReport,
} from "@/lib/schools/storage";

type PendingDeletion = "class-session" | "everything" | null;

const DATE_FORMAT = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(value: Date | null): string {
  return value ? DATE_FORMAT.format(value) : "—";
}

/**
 * Local storage is an external store, so the report is read through
 * `useSyncExternalStore` rather than an effect. The snapshot is a revision
 * number: the server renders `-1` (nothing readable), the client renders the
 * current revision, and a deletion bumps it so the page re-reads.
 */
let storageRevision = 0;
const storageListeners = new Set<() => void>();

function subscribeToLocalData(listener: () => void) {
  storageListeners.add(listener);
  return () => {
    storageListeners.delete(listener);
  };
}

function getLocalDataRevision() {
  return storageRevision;
}

function getServerLocalDataRevision() {
  return -1;
}

function markLocalDataChanged() {
  storageRevision += 1;
  for (const listener of storageListeners) {
    listener();
  }
}

/**
 * Adult-only local-data controls.
 *
 * Two deliberate design decisions:
 *
 * 1. Deletion is two-step. Both actions are irreversible and one of them wipes
 *    a teacher's whole setup, so each needs an explicit confirmation naming
 *    what is about to go.
 * 2. The export is counts only. A per-child export would be a child profile in
 *    a spreadsheet, which is precisely what this product refuses to produce.
 */
export function LocalDataControls() {
  const [pending, setPending] = useState<PendingDeletion>(null);
  const [status, setStatus] = useState<string>("");
  const [summary, setSummary] = useState<SchoolsAggregateSummary | null>(null);

  const revision = useSyncExternalStore(
    subscribeToLocalData,
    getLocalDataRevision,
    getServerLocalDataRevision,
  );

  const report = useMemo<SchoolsLocalDataReport | null>(() => {
    if (revision < 0) return null;
    try {
      purgeExpiredSchoolsLocalState(window.localStorage);
      return describeSchoolsLocalData(window.localStorage);
    } catch {
      // Private browsing or a locked-down profile can deny storage entirely.
      return null;
    }
  }, [revision]);

  const confirmDeletion = () => {
    if (!pending) return;
    try {
      if (pending === "everything") {
        clearSchoolsLocalState(window.localStorage);
        setStatus(
          "All MetaPet School data on this device has been deleted. Nothing was sent anywhere.",
        );
      } else {
        clearSchoolsClassSession(window.localStorage);
        setStatus(
          "The class session, aliases, progress and evidence on this device have been deleted. Your teacher setup was kept.",
        );
      }
    } catch {
      setStatus(
        "This browser blocked access to local storage, so nothing could be deleted. Clearing site data for this page will remove everything.",
      );
    }
    setPending(null);
    setSummary(null);
    markLocalDataChanged();
  };

  if (!report) {
    return (
      <p className="text-base text-muted-foreground">
        Reading local records on this device…
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="held-heading" className="space-y-4">
        <h2 id="held-heading" className="text-2xl font-semibold">
          What is held on this device
        </h2>

        {report.empty ? (
          <p className="rounded-2xl border border-border bg-card p-5 text-base leading-7 text-muted-foreground">
            Nothing is stored yet. This browser holds no MetaPet School
            classroom records.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {report.categories.map((category) => (
              <li
                key={category.id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-foreground">
                    {category.label}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      category.present
                        ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {category.present ? "Held" : "Empty"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {category.purpose}
                </p>
              </li>
            ))}
          </ul>
        )}

        <dl className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3">
          <div>
            <dt className="text-sm font-semibold text-foreground">
              Most recent activity
            </dt>
            <dd className="mt-1 text-base text-muted-foreground">
              {formatDate(report.lastActivity)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-foreground">
              Scheduled automatic deletion
            </dt>
            <dd className="mt-1 text-base text-muted-foreground">
              {formatDate(report.expiresAt)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-foreground">
              Days remaining
            </dt>
            <dd className="mt-1 text-base text-muted-foreground">
              {report.daysRemaining ?? "—"}
            </dd>
          </div>
        </dl>
        <p className="text-sm leading-6 text-muted-foreground">
          Records are cleared automatically after{" "}
          {SCHOOLS_LOCAL_DATA_RETENTION_DAYS} days without use. The countdown
          restarts whenever a session is run on this device.
        </p>
      </section>

      <section aria-labelledby="delete-heading" className="space-y-4">
        <h2 id="delete-heading" className="text-2xl font-semibold">
          Delete records now
        </h2>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          Deletion happens in this browser and cannot be undone. Nothing is sent
          to the studio, and no request or approval is required.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setPending("class-session");
              setStatus("");
            }}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-border px-5 py-3 text-base font-semibold text-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          >
            Delete the class session
          </button>
          <button
            type="button"
            onClick={() => {
              setPending("everything");
              setStatus("");
            }}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-rose-700 px-5 py-3 text-base font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
          >
            Delete all MetaPet School data
          </button>
        </div>

        {pending ? (
          <div
            role="alertdialog"
            aria-labelledby="confirm-heading"
            aria-describedby="confirm-body"
            className="rounded-2xl border-2 border-rose-600 bg-rose-500/10 p-5"
          >
            <h3
              id="confirm-heading"
              className="text-lg font-semibold text-rose-900 dark:text-rose-200"
            >
              {pending === "everything"
                ? "Delete all MetaPet School data on this device?"
                : "Delete the class session on this device?"}
            </h3>
            <p id="confirm-body" className="mt-2 text-base leading-7 text-rose-900 dark:text-rose-200">
              {pending === "everything"
                ? "This removes aliases, session progress, evidence, teacher setup and the lesson queue. It cannot be undone."
                : "This removes aliases, session progress and evidence for the current class. Your teacher setup is kept. It cannot be undone."}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={confirmDeletion}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-rose-700 px-5 py-3 text-base font-semibold text-white hover:bg-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
              >
                Yes, delete it
              </button>
              <button
                type="button"
                onClick={() => setPending(null)}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border px-5 py-3 text-base font-semibold text-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
              >
                Keep it
              </button>
            </div>
          </div>
        ) : null}

        <p aria-live="polite" className="text-base font-medium text-emerald-900">
          {status}
        </p>
      </section>

      <section aria-labelledby="export-heading" className="space-y-4">
        <h2 id="export-heading" className="text-2xl font-semibold">
          Export a minimal summary
        </h2>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          Counts and dates only, for a pilot record. There is no per-student
          export, because a per-student export is a child profile.
        </p>
        <button
          type="button"
          onClick={() => {
            try {
              setSummary(buildSchoolsAggregateSummary(window.localStorage));
            } catch {
              setSummary(null);
            }
          }}
          className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-border px-5 py-3 text-base font-semibold text-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          Show the summary
        </button>
        {summary ? (
          <pre className="overflow-x-auto rounded-2xl border border-border bg-muted p-4 text-sm text-foreground">
            {JSON.stringify(summary, null, 2)}
          </pre>
        ) : null}
      </section>
    </div>
  );
}
