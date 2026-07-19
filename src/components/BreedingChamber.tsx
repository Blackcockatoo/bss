"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Dna,
  LoaderCircle,
  Sparkles,
  Upload,
} from "lucide-react";

import {
  breedRegisteredPets,
  createBreedingPacket,
  registerOffspring,
  type BreedingPacketV1,
  type RegisteredBreedingMode,
  type RegisteredBreedingPreview,
} from "@/lib/breeding";
import {
  buildPetRecord,
  getPetRepository,
  importPetPacket,
  PROJECTION_VERSION_V2,
  type PetRecordV2,
} from "@/lib/registry";
import { useStore } from "@/lib/store";

import { Button } from "./ui/button";
import { GeometryAvatarRenderer } from "./GeometryAvatarRenderer";

const MODE_COPY: Record<
  RegisteredBreedingMode,
  { label: string; description: string }
> = {
  BALANCED: {
    label: "Balanced blend",
    description: "Six whole DNA chambers from each parent, per strand.",
  },
  DOMINANT: {
    label: "Dominant blend",
    description: "One parent contributes eight chambers and the other four.",
  },
  MUTATION: {
    label: "Wild blend",
    description:
      "Balanced inheritance with a higher unique-locus mutation rate.",
  },
};

type Notice = { kind: "success" | "error" | "info"; message: string } | null;

function shortId(value: string): string {
  return value.length <= 18
    ? value
    : `${value.slice(0, 10)}…${value.slice(-6)}`;
}

export function BreedingChamber() {
  const repository = useMemo(() => getPetRepository(), []);
  const recordBreeding = useStore((state) => state.recordBreeding);
  const [records, setRecords] = useState<PetRecordV2[]>([]);
  const [parentOneId, setParentOneId] = useState("");
  const [parentTwoId, setParentTwoId] = useState("");
  const [mode, setMode] = useState<RegisteredBreedingMode>("BALANCED");
  const [childName, setChildName] = useState("");
  const [packet, setPacket] = useState<BreedingPacketV1 | null>(null);
  const [preview, setPreview] = useState<RegisteredBreedingPreview | null>(
    null,
  );
  const [registered, setRegistered] = useState<PetRecordV2 | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [importPacket, setImportPacket] = useState("");

  const refreshRecords = useCallback(async () => {
    const next = (await repository.listRecords()).sort(
      (left, right) => left.createdAt - right.createdAt,
    );
    setRecords(next);
    setParentOneId((current) =>
      current && next.some((record) => record.petId === current)
        ? current
        : (next[0]?.petId ?? ""),
    );
    setParentTwoId((current) => {
      if (current && next.some((record) => record.petId === current)) {
        return current;
      }
      return (
        next.find((record) => record.petId !== next[0]?.petId)?.petId ?? ""
      );
    });
  }, [repository]);

  useEffect(() => {
    refreshRecords().catch((error) => {
      setNotice({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not open the pet registry.",
      });
    });
  }, [refreshRecords]);

  const byId = useMemo(
    () => new Map(records.map((record) => [record.petId, record])),
    [records],
  );
  const parentOne = byId.get(parentOneId) ?? null;
  const parentTwo = byId.get(parentTwoId) ?? null;

  const clearConception = () => {
    setPacket(null);
    setPreview(null);
    setRegistered(null);
  };

  const chooseParentOne = (petId: string) => {
    setParentOneId(petId);
    if (petId === parentTwoId) {
      setParentTwoId(
        records.find((record) => record.petId !== petId)?.petId ?? "",
      );
    }
    clearConception();
  };

  const chooseParentTwo = (petId: string) => {
    setParentTwoId(petId);
    if (petId === parentOneId) {
      setParentOneId(
        records.find((record) => record.petId !== petId)?.petId ?? "",
      );
    }
    clearConception();
  };

  const createPartner = async () => {
    setBusy(true);
    setNotice({
      kind: "info",
      message: "Awakening a second registered founder…",
    });
    try {
      const founder = await buildPetRecord({ name: "Second Founder" });
      await repository.saveRecord(founder, { activate: false });
      await refreshRecords();
      setParentTwoId(founder.petId);
      clearConception();
      setNotice({
        kind: "success",
        message: `${founder.name} is registered and ready to blend.`,
      });
    } catch (error) {
      setNotice({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Founder creation failed.",
      });
    } finally {
      setBusy(false);
    }
  };

  const createPreview = async () => {
    if (!parentOne || !parentTwo || parentOne.petId === parentTwo.petId) {
      setNotice({
        kind: "error",
        message: "Choose two different registered parents.",
      });
      return;
    }
    setBusy(true);
    setNotice({ kind: "info", message: "Combining whole DNA chambers…" });
    try {
      const nextPacket = createBreedingPacket(parentOne, parentTwo, { mode });
      const nextPreview = await breedRegisteredPets(
        parentOne,
        parentTwo,
        nextPacket,
      );
      setPacket(nextPacket);
      setPreview(nextPreview);
      setRegistered(null);
      setNotice({
        kind: "success",
        message: "This exact geometry is locked to the conception packet.",
      });
    } catch (error) {
      setNotice({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Geometry blend failed.",
      });
    } finally {
      setBusy(false);
    }
  };

  const registerPreview = async () => {
    if (!parentOne || !parentTwo || !packet || !preview) return;
    setBusy(true);
    setNotice({ kind: "info", message: "Registering the previewed genome…" });
    try {
      const result = await registerOffspring(
        parentOne,
        parentTwo,
        packet,
        repository,
        childName,
      );
      if (
        result.record.geometryFingerprint !== preview.geometryFingerprint ||
        JSON.stringify(result.record.genome) !==
          JSON.stringify(preview.offspring)
      ) {
        throw new Error(
          "Registration did not reproduce the locked preview genome",
        );
      }
      recordBreeding();
      setRegistered(result.record);
      await refreshRecords();
      setNotice({
        kind: "success",
        message: `${result.record.name} is registered as generation ${result.record.lineage.generation}.`,
      });
    } catch (error) {
      setNotice({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Offspring registration failed.",
      });
    } finally {
      setBusy(false);
    }
  };

  const copyBreedingPacket = async () => {
    if (!packet) return;
    await navigator.clipboard.writeText(JSON.stringify(packet));
    setNotice({ kind: "success", message: "Replayable MPB1 packet copied." });
  };

  const importRegisteredPet = async () => {
    if (!importPacket.trim()) return;
    setBusy(true);
    setNotice({
      kind: "info",
      message: "Verifying MP2 hashes and registration proof…",
    });
    try {
      const imported = await importPetPacket(importPacket, repository);
      await refreshRecords();
      setImportPacket("");
      setNotice({
        kind: "success",
        message: `${imported.name} verified and imported without changing the active pet.`,
      });
    } catch (error) {
      setNotice({
        kind: "error",
        message: error instanceof Error ? error.message : "MP2 import failed.",
      });
    } finally {
      setBusy(false);
    }
  };

  const canonicalParentOne = preview
    ? byId.get(preview.packet.parentIds[0])
    : null;
  const canonicalParentTwo = preview
    ? byId.get(preview.packet.parentIds[1])
    : null;

  return (
    <section
      className="rounded-2xl border border-fuchsia-800/60 bg-gradient-to-br from-fuchsia-950/35 via-slate-950/80 to-cyan-950/30 p-4"
      data-testid="breeding-chamber"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/10 p-2">
          <Dna className="h-5 w-5 text-fuchsia-300" />
        </div>
        <div>
          <h3 className="font-semibold text-white">
            Geometry Breeding Chamber
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Blend the registered genomes. Offspring inherit whole five-digit
            chambers, and the exact child genome drives the existing Sri Yantra
            renderer—no geometry asset is rewritten.
          </p>
        </div>
      </div>

      {records.length < 2 ? (
        <div className="mt-4 rounded-xl border border-dashed border-fuchsia-700/60 bg-slate-950/55 p-4">
          <p className="text-sm text-slate-300">
            Breeding needs two registered pets. Your active companion stays
            selected; a second founder is stored without replacing it.
          </p>
          <Button
            type="button"
            onClick={createPartner}
            disabled={busy}
            className="mt-3 gap-2 bg-fuchsia-700 text-white hover:bg-fuchsia-600"
          >
            {busy ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Awaken Second Founder
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-xs text-slate-400">
              Parent one
              <select
                value={parentOneId}
                onChange={(event) => chooseParentOne(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white"
              >
                {records.map((record) => (
                  <option key={record.petId} value={record.petId}>
                    {record.name} · G{record.lineage.generation} ·{" "}
                    {shortId(record.petId)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-slate-400">
              Parent two
              <select
                value={parentTwoId}
                onChange={(event) => chooseParentTwo(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white"
              >
                {records.map((record) => (
                  <option key={record.petId} value={record.petId}>
                    {record.name} · G{record.lineage.generation} ·{" "}
                    {shortId(record.petId)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="space-y-1 text-xs text-slate-400">
              Blend style
              <select
                value={mode}
                onChange={(event) => {
                  setMode(event.target.value as RegisteredBreedingMode);
                  clearConception();
                }}
                className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white"
              >
                {Object.entries(MODE_COPY).map(([value, copy]) => (
                  <option key={value} value={value}>
                    {copy.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-slate-400">
              Offspring name
              <input
                value={childName}
                onChange={(event) => setChildName(event.target.value)}
                placeholder="Optional"
                className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white placeholder:text-slate-600"
              />
            </label>
            <Button
              type="button"
              onClick={createPreview}
              disabled={busy || !parentOne || !parentTwo}
              className="h-11 gap-2 bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-white hover:from-fuchsia-500 hover:to-cyan-500"
            >
              {busy ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Dna className="h-4 w-4" />
              )}
              Blend Geometry
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {MODE_COPY[mode].description} A fresh conception nonce makes each
            sibling distinct while keeping every preview replayable.
          </p>
        </>
      )}

      {preview && packet && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-950/80">
          <div className="relative min-h-[22rem] overflow-hidden bg-gradient-to-b from-cyan-950/30 to-slate-950">
            <GeometryAvatarRenderer
              animated
              compact
              genomeOverride={preview.offspring}
              traitsOverride={preview.traits}
              heptaProfileOverride={preview.heptaProfile}
              projectionVersionOverride={PROJECTION_VERSION_V2}
              identityKeyOverride={packet.checksum}
            />
          </div>

          <div className="grid gap-3 border-t border-slate-800 p-4 text-xs sm:grid-cols-2">
            <div className="rounded-lg bg-slate-900/75 p-3 text-slate-300">
              <span className="text-slate-500">
                {canonicalParentOne?.name ?? "Parent 1"} contribution:{" "}
              </span>
              {preview.contribution.parent1}%
              <br />
              <span className="text-slate-500">
                {canonicalParentTwo?.name ?? "Parent 2"} contribution:{" "}
              </span>
              {preview.contribution.parent2}%
            </div>
            <div className="rounded-lg bg-slate-900/75 p-3 text-slate-300">
              <span className="text-slate-500">Hepta character: </span>
              {preview.heptaProfile.temperament}
              <br />
              <span className="text-slate-500">Crownwheel: </span>
              {preview.crownwheel.outcome} · {preview.crownwheel.compatibility}%
            </div>
            <div className="rounded-lg bg-slate-900/75 p-3 text-slate-300">
              <span className="text-slate-500">Inheritance: </span>
              {preview.chamberProvenance.length} declared chambers
              <br />
              <span className="text-slate-500">Mutations: </span>
              {preview.mutations.length} unique loci
            </div>
            <div className="break-all rounded-lg bg-slate-900/75 p-3 font-mono text-[10px] text-cyan-300/80">
              {preview.geometryFingerprint}
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-800 p-4 sm:flex-row">
            <Button
              type="button"
              onClick={copyBreedingPacket}
              variant="outline"
              className="gap-2 border-slate-700 text-slate-200"
            >
              <Copy className="h-4 w-4" />
              Copy MPB1
            </Button>
            <Button
              type="button"
              onClick={registerPreview}
              disabled={busy || Boolean(registered)}
              className="flex-1 gap-2 bg-cyan-700 text-white hover:bg-cyan-600"
              data-testid="register-offspring"
            >
              {registered ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : busy ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {registered
                ? `Registered as ${registered.name}`
                : "Register This Exact Child"}
            </Button>
          </div>
        </div>
      )}

      {notice && (
        <p
          className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
            notice.kind === "error"
              ? "border-rose-800 bg-rose-950/40 text-rose-200"
              : notice.kind === "success"
                ? "border-emerald-800 bg-emerald-950/35 text-emerald-200"
                : "border-cyan-900 bg-cyan-950/30 text-cyan-200"
          }`}
          role="status"
        >
          {notice.message}
        </p>
      )}

      <details className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
        <summary className="cursor-pointer text-xs font-semibold text-slate-300">
          Import a registered MP2 pet
        </summary>
        <p className="mt-2 text-[11px] text-slate-500">
          The packet is verified before it is stored and never silently becomes
          the active companion.
        </p>
        <textarea
          value={importPacket}
          onChange={(event) => setImportPacket(event.target.value)}
          rows={3}
          placeholder="MP2.…"
          className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 placeholder:text-slate-700"
        />
        <Button
          type="button"
          onClick={importRegisteredPet}
          disabled={busy || !importPacket.trim()}
          variant="outline"
          className="mt-2 gap-2 border-cyan-800 text-cyan-200"
        >
          <Upload className="h-4 w-4" />
          Verify and Import MP2
        </Button>
      </details>
    </section>
  );
}
