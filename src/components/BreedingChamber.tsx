"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

import dynamic from "next/dynamic";
import { CoatOfArmsRenderer } from "./lineage/CoatOfArmsRenderer";
import { usePetHeraldry } from "./lineage/usePetHeraldry";
import "./living-genome/living-genome.css";
const BirthCertificate = dynamic(
  () =>
    import("./RegistrationCertificate").then(
      (module) => module.RegistrationCertificate,
    ),
  { ssr: false },
);

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
  const operationLock = useRef(false);
  const [loading, setLoading] = useState(true);
  const [certificateOpen, setCertificateOpen] = useState(false);
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
    refreshRecords()
      .catch((error) => {
        setNotice({
          kind: "error",
          message:
            error instanceof Error
              ? error.message
              : "Could not open the pet registry.",
        });
      })
      .finally(() => setLoading(false));
  }, [refreshRecords]);

  const byId = useMemo(
    () => new Map(records.map((record) => [record.petId, record])),
    [records],
  );
  const parentOne = byId.get(parentOneId) ?? null;
  const parentTwo = byId.get(parentTwoId) ?? null;

  const clearConception = () => {
    setCertificateOpen(false);
    setNotice(null);
    setPacket(null);
    setPreview(null);
    setRegistered(null);
  };

  const chooseParentOne = (petId: string) => {
    if (operationLock.current) return;
    setParentOneId(petId);
    if (petId === parentTwoId) {
      setParentTwoId(
        records.find((record) => record.petId !== petId)?.petId ?? "",
      );
    }
    clearConception();
  };

  const chooseParentTwo = (petId: string) => {
    if (operationLock.current) return;
    setParentTwoId(petId);
    if (petId === parentOneId) {
      setParentOneId(
        records.find((record) => record.petId !== petId)?.petId ?? "",
      );
    }
    clearConception();
  };

  const createPartner = async () => {
    if (operationLock.current) return;
    operationLock.current = true;
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
      operationLock.current = false;
      setBusy(false);
    }
  };

  const createPreview = async () => {
    if (operationLock.current) return;
    if (!parentOne || !parentTwo || parentOne.petId === parentTwo.petId) {
      setNotice({
        kind: "error",
        message: "Choose two different registered parents.",
      });
      return;
    }
    operationLock.current = true;
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
      operationLock.current = false;
      setBusy(false);
    }
  };

  const registerPreview = async () => {
    if (operationLock.current) return;
    if (registered || !parentOne || !parentTwo || !packet || !preview) return;
    operationLock.current = true;
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
      operationLock.current = false;
      setBusy(false);
    }
  };

  const copyBreedingPacket = async () => {
    if (!packet) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(packet));
      setNotice({
        kind: "success",
        message: "Breeding recipe copied. It reproduces this exact preview.",
      });
    } catch {
      setNotice({
        kind: "error",
        message: "Clipboard is unavailable. Your preview is still here.",
      });
    }
  };

  const importRegisteredPet = async () => {
    if (operationLock.current) return;
    if (!importPacket.trim()) return;
    operationLock.current = true;
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
      operationLock.current = false;
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
      className="living-world lineage-chamber rounded-3xl border border-cyan-900/50 bg-slate-950/80 p-4 sm:p-6"
      aria-busy={busy || loading}
      data-testid="breeding-chamber"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-2">
          <Dna className="h-5 w-5 text-cyan-300" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[.2em] text-cyan-300 mb-1">
            Living Genome · Lineage
          </p>
          <h3 className="text-xl font-semibold text-white">
            Geometry Breeding Chamber
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Two companions. One new beginning. Choose your parents, explore a
            blend, then register the child you preview.
          </p>
        </div>
      </div>

      <ol className="lineage-steps" aria-label="Breeding progress">
        {["Choose parents", "Preview child", "Register"].map((step, index) => (
          <li
            key={step}
            aria-current={
              (registered ? 2 : preview ? 1 : 0) === index ? "step" : undefined
            }
          >
            <span>{index + 1}</span>
            {step}
          </li>
        ))}
      </ol>
      {loading && (
        <p role="status" className="py-4 text-sm text-cyan-100">
          Opening your local pet registry…
        </p>
      )}
      {records.length < 2 ? (
        <div className="mt-4 rounded-xl border border-dashed border-fuchsia-700/60 bg-slate-950/55 p-4">
          <p className="text-sm text-slate-300">
            Breeding needs two registered pets. Your active companion stays
            selected; a second founder is stored without replacing it.
          </p>
          <Button
            type="button"
            onClick={createPartner}
            disabled={busy || loading}
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
                disabled={busy || loading}
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
                disabled={busy || loading}
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

          <div className="lineage-parents">
            {parentOne && (
              <ParentHeraldry record={parentOne} label="Parent one" />
            )}
            {parentTwo && (
              <ParentHeraldry record={parentTwo} label="Parent two" />
            )}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="space-y-1 text-xs text-slate-400">
              Blend style
              <select
                disabled={busy || loading}
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
                disabled={busy || loading || Boolean(registered)}
                maxLength={80}
                value={childName}
                onChange={(event) => setChildName(event.target.value)}
                placeholder="Optional"
                className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white placeholder:text-slate-600"
              />
            </label>
            <Button
              type="button"
              onClick={createPreview}
              disabled={
                busy ||
                loading ||
                !parentOne ||
                !parentTwo ||
                parentOneId === parentTwoId
              }
              className="h-11 gap-2 bg-cyan-700 text-white hover:bg-cyan-600"
            >
              {busy ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Dna className="h-4 w-4" />
              )}
              Blend Geometry
            </Button>
          </div>
          <p className="mt-3 text-sm text-slate-300">
            {MODE_COPY[mode].description} Each new blend can be different.
            Registration keeps this exact preview.
          </p>
        </>
      )}

      {preview && packet && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-950/80">
          <div className="px-4 pt-4">
            <p className="text-xs uppercase tracking-widest text-cyan-300">
              Your child preview
            </p>
            <h4 className="mt-1 text-xl font-semibold text-white">
              {childName.trim() || "A new companion"}
            </h4>
            <p className="mt-1 text-sm text-slate-300">
              Preview only until you register. Your active companion stays
              selected.
            </p>
          </div>
          <div className="relative min-h-[22rem] overflow-hidden bg-gradient-to-b from-cyan-950/30 to-slate-950">
            <GeometryAvatarRenderer
              animated
              compact
              showPersonality={false}
              genomeOverride={preview.offspring}
              traitsOverride={preview.traits}
              heptaProfileOverride={preview.heptaProfile}
              projectionVersionOverride={PROJECTION_VERSION_V2}
              identityKeyOverride={packet.checksum}
              // An offspring has not been born, let alone evolved: it must
              // show its own first stage, never borrow the active parent's
              // earned crown and wings.
              evolutionStateOverride="GENETICS"
            />
          </div>

          <div className="px-4 pb-4">
            <p className="text-sm text-slate-300 mb-2">
              DNA inherited from each parent
            </p>
            <div
              className="lineage-contribution"
              role="img"
              aria-label={`${canonicalParentOne?.name ?? "Parent one"} ${preview.contribution.parent1}%, ${canonicalParentTwo?.name ?? "Parent two"} ${preview.contribution.parent2}%`}
            >
              <span style={{ width: `${preview.contribution.parent1}%` }} />
              <span style={{ width: `${preview.contribution.parent2}%` }} />
            </div>
            <div className="mt-2 flex justify-between gap-3 text-sm text-cyan-100">
              <span>
                {canonicalParentOne?.name ?? "Parent one"} ·{" "}
                {preview.contribution.parent1}%
              </span>
              <span>
                {canonicalParentTwo?.name ?? "Parent two"} ·{" "}
                {preview.contribution.parent2}%
              </span>
            </div>
          </div>
          <details className="px-4">
            <summary>Inheritance details &amp; genome fingerprint</summary>
            <div className="grid gap-3 p-0 py-4 text-xs sm:grid-cols-2">
              <div className="rounded-lg bg-slate-900/75 p-3 text-slate-300">
                <span className="text-slate-400">
                  {canonicalParentOne?.name ?? "Parent 1"} contribution:{" "}
                </span>
                {preview.contribution.parent1}%
                <br />
                <span className="text-slate-400">
                  {canonicalParentTwo?.name ?? "Parent 2"} contribution:{" "}
                </span>
                {preview.contribution.parent2}%
              </div>
              <div className="rounded-lg bg-slate-900/75 p-3 text-slate-300">
                <span className="text-slate-400">Hepta character: </span>
                {preview.heptaProfile.temperament}
                <br />
                <span className="text-slate-400">Crownwheel: </span>
                {preview.crownwheel.outcome} ·{" "}
                {preview.crownwheel.compatibility}%
              </div>
              <div className="rounded-lg bg-slate-900/75 p-3 text-slate-300">
                <span className="text-slate-400">Inheritance: </span>
                {preview.chamberProvenance.length} declared chambers
                <br />
                <span className="text-slate-400">Mutations: </span>
                {preview.mutations.length} unique loci
              </div>
              <div className="break-all rounded-lg bg-slate-900/75 p-3 font-mono text-xs text-cyan-300/80">
                {preview.geometryFingerprint}
              </div>
            </div>
          </details>
          <div className="flex flex-col gap-2 border-t border-slate-800 p-4 sm:flex-row">
            <Button
              type="button"
              onClick={copyBreedingPacket}
              variant="outline"
              className="gap-2 border-slate-700 text-slate-200"
            >
              <Copy className="h-4 w-4" />
              Copy breeding recipe
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

      {registered && (
        <div className="lineage-registration-success mt-4 rounded-2xl border border-emerald-800/60 bg-emerald-950/20 p-4">
          <p className="text-xs uppercase tracking-widest text-emerald-300">
            Welcome to the registry
          </p>
          <h4 className="mt-1 text-xl font-semibold text-white">
            {registered.name}
          </h4>
          <p className="my-2 text-sm text-slate-300">
            Generation {registered.lineage.generation} · Saved on this device.
            Your current companion remains active.
          </p>
          <Button onClick={() => setCertificateOpen(true)} variant="outline">
            View birth certificate
          </Button>
        </div>
      )}
      {registered && certificateOpen && (
        <BirthCertificate
          record={registered}
          crest={registered.crest}
          heptaCode={registered.heptaCode?.digits ?? null}
          isOpen
          onClose={() => setCertificateOpen(false)}
        />
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
        <p className="mt-2 text-xs text-slate-400">
          The packet is verified before it is stored and never silently becomes
          the active companion.
        </p>
        <textarea
          aria-label="Registered pet packet"
          disabled={busy || loading}
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

function ParentHeraldry({
  record,
  label,
}: { record: PetRecordV2; label: string }) {
  const { coat, notice } = usePetHeraldry(
    record.petId,
    record.lineage.generation,
  );
  return (
    <figure className="lineage-parent">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-widest text-cyan-300">
          {label}
        </p>
        <figcaption className="mt-1 text-lg font-semibold text-white break-words">
          {record.name}
        </figcaption>
        <p className="mt-1 text-sm text-slate-300">
          Generation {record.lineage.generation}
        </p>
        <p className="mt-2 text-xs font-mono text-slate-400 break-all">
          {shortId(record.petId)}
        </p>
        {notice && (
          <p className="mt-2 text-xs text-amber-200">Temporary shield</p>
        )}
      </div>
      {coat && (
        <CoatOfArmsRenderer
          coatOfArms={coat}
          size={100}
          label={`${record.name} coat of arms`}
        />
      )}
    </figure>
  );
}
