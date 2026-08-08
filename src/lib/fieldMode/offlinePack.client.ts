"use client";

import { FIELD_MODE_PACK_MANIFEST_PATH } from "@/lib/childSafeBaseline";
import type { FieldPackManifest } from "@/lib/fieldMode/cachePolicy";

export const FIELD_PACK_STATUS_EVENT = "metapet-field-pack-status";

export interface InstalledFieldPack {
  version: string;
  cacheName: string;
  installedAt: number;
  itemCount: number;
}

export interface FieldPackWorkerStatus {
  supported: boolean;
  active: InstalledFieldPack | null;
  previous: InstalledFieldPack | null;
  bypassed: boolean;
}

export interface FieldPackOverview extends FieldPackWorkerStatus {
  available: FieldPackManifest | null;
  updateAvailable: boolean;
}

type FieldPackCommand =
  | { type: "FIELD_PACK_STATUS" }
  | { type: "FIELD_PACK_INSTALL"; manifest: FieldPackManifest }
  | { type: "FIELD_PACK_REMOVE" }
  | { type: "FIELD_PACK_ROLLBACK" }
  | { type: "FIELD_PACK_BYPASS"; enabled: boolean }
  | { type: "FIELD_PACK_EMERGENCY_NOOP" };

interface WorkerReply {
  ok: boolean;
  result?: FieldPackWorkerStatus;
  error?: string;
}

const EMPTY_STATUS: FieldPackWorkerStatus = {
  supported: false,
  active: null,
  previous: null,
  bypassed: false,
};

function notifyStatusChanged(): void {
  window.dispatchEvent(new Event(FIELD_PACK_STATUS_EVENT));
}

async function waitForActivation(
  worker: ServiceWorker,
): Promise<ServiceWorker> {
  if (worker.state === "activated") return worker;
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error("The offline worker did not become ready.")),
      15_000,
    );
    worker.addEventListener("statechange", () => {
      if (worker.state === "activated") {
        window.clearTimeout(timeout);
        resolve(worker);
      }
      if (worker.state === "redundant") {
        window.clearTimeout(timeout);
        reject(new Error("The offline worker was replaced before activation."));
      }
    });
  });
}

async function fieldWorker(): Promise<ServiceWorker> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support offline Field Packs.");
  }

  const existing = await navigator.serviceWorker.getRegistration("/");
  const registration =
    existing ??
    (await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    }));
  if (navigator.onLine) {
    try {
      await registration.update();
    } catch {
      if (!registration.active) {
        throw new Error("The offline worker could not be installed.");
      }
      // Keep using the last active worker if an update check is interrupted.
    }
  }

  const candidate =
    registration.active ?? registration.waiting ?? registration.installing;
  if (!candidate) {
    throw new Error("The offline worker is not available.");
  }
  return waitForActivation(candidate);
}

async function sendCommand(
  command: FieldPackCommand,
  timeoutMs = 20_000,
): Promise<FieldPackWorkerStatus> {
  const worker = await fieldWorker();
  const channel = new MessageChannel();

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      channel.port1.close();
      reject(new Error("The Field Pack operation timed out."));
    }, timeoutMs);

    channel.port1.onmessage = (event: MessageEvent<WorkerReply>) => {
      window.clearTimeout(timeout);
      channel.port1.close();
      if (!event.data?.ok || !event.data.result) {
        reject(
          new Error(event.data?.error || "The Field Pack operation failed."),
        );
        return;
      }
      if (command.type !== "FIELD_PACK_STATUS") {
        notifyStatusChanged();
      }
      resolve(event.data.result);
    };

    worker.postMessage(command, [channel.port2]);
  });
}

export async function fetchFieldPackManifest(): Promise<FieldPackManifest> {
  const response = await fetch(FIELD_MODE_PACK_MANIFEST_PATH, {
    cache: "no-store",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Field Pack check failed (HTTP ${response.status}).`);
  }

  const manifest = (await response.json()) as Partial<FieldPackManifest>;
  if (
    manifest.schemaVersion !== 1 ||
    typeof manifest.version !== "string" ||
    !Array.isArray(manifest.routes) ||
    !Array.isArray(manifest.assets)
  ) {
    throw new Error("The Field Pack manifest is not valid.");
  }
  return manifest as FieldPackManifest;
}

export async function getFieldPackStatus(): Promise<FieldPackWorkerStatus> {
  if (!("serviceWorker" in navigator)) return EMPTY_STATUS;
  return sendCommand({ type: "FIELD_PACK_STATUS" });
}

export async function getFieldPackOverview(): Promise<FieldPackOverview> {
  const status = await getFieldPackStatus().catch(() => EMPTY_STATUS);
  let available: FieldPackManifest | null = null;

  if (navigator.onLine) {
    try {
      available = await fetchFieldPackManifest();
      if (available.emergencyNoop) {
        await sendCommand({ type: "FIELD_PACK_EMERGENCY_NOOP" });
        return {
          ...EMPTY_STATUS,
          supported: status.supported,
          bypassed: true,
          available,
          updateAvailable: false,
        };
      }
    } catch {
      // The installed pack remains usable if an update check cannot reach the
      // server. Offline status should never invalidate a known-good cache.
    }
  }

  return {
    ...status,
    available,
    updateAvailable: Boolean(
      status.active && available && status.active.version !== available.version,
    ),
  };
}

export async function installFieldPack(): Promise<FieldPackWorkerStatus> {
  const manifest = await fetchFieldPackManifest();
  if (manifest.emergencyNoop) {
    await sendCommand({ type: "FIELD_PACK_EMERGENCY_NOOP" });
    throw new Error("Offline installation is temporarily disabled for safety.");
  }
  return sendCommand(
    { type: "FIELD_PACK_INSTALL", manifest },
    120_000,
  );
}

export function removeFieldPack(): Promise<FieldPackWorkerStatus> {
  return sendCommand({ type: "FIELD_PACK_REMOVE" });
}

export function rollbackFieldPack(): Promise<FieldPackWorkerStatus> {
  return sendCommand({ type: "FIELD_PACK_ROLLBACK" }, 30_000);
}

export function setFieldPackBypass(
  enabled: boolean,
): Promise<FieldPackWorkerStatus> {
  return sendCommand({ type: "FIELD_PACK_BYPASS", enabled });
}
