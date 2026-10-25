"use client";

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useId,
  type ComponentProps,
} from "react";
import { CoatOfArmsRenderer } from "@/components/lineage/CoatOfArmsRenderer";
import { HeptaTag } from "@/components/HeptaTag";
import { SeedOfLifeGlyph } from "@/components/SeedOfLifeGlyph";
import { getBlason } from "@/lib/lineage";
import { usePetHeraldry } from "./lineage/usePetHeraldry";
import "./living-genome/living-genome.css";
import type { PrimeTailID, HeptaDigits } from "@/lib/identity/types";
import { getDeviceHmacKey, verifyCrest } from "@/lib/identity/crest";
import {
  exportPetPacket,
  verifyRegistrationProof,
  type PetRecordV2,
} from "@/lib/registry";
import { Button } from "@/components/ui/button";
import { triggerHaptic } from "@/lib/haptics";
import {
  Award,
  Download,
  Share2,
  X,
  Shield,
  Dna,
  Calendar,
  Hash,
  Fingerprint,
  Sparkles,
  Copy,
} from "lucide-react";

interface RegistrationCertificateProps {
  record?: PetRecordV2 | null;
  petId?: string;
  petName?: string;
  crest: PrimeTailID | null;
  heptaCode: HeptaDigits | null;
  createdAt?: number;
  evolutionState?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function RegistrationCertificate({
  record = null,
  petId: legacyPetId = "",
  petName: legacyPetName = "Unnamed Companion",
  crest: legacyCrest,
  heptaCode: legacyHeptaCode,
  createdAt: legacyCreatedAt,
  evolutionState: legacyEvolutionState = "GENESIS",
  isOpen = false,
  onClose,
}: RegistrationCertificateProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [proofResult, setProofResult] = useState<{
    key: string;
    state: "verified" | "invalid";
  } | null>(null);
  const [packetCopied, setPacketCopied] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);
  const petId = record?.petId ?? legacyPetId;
  const petName = record?.name ?? legacyPetName;
  const crest = record?.crest ?? legacyCrest;
  const heptaCode = record?.heptaCode?.digits ?? legacyHeptaCode;
  const createdAt = record?.createdAt ?? legacyCreatedAt;
  const evolutionState = record?.evolution.state ?? legacyEvolutionState;
  const { coat: coatOfArms, notice: heraldryNotice } = usePetHeraldry(
    petId,
    record?.lineage.generation ?? 0,
    isOpen,
  );
  const generation = record?.lineage.generation ?? coatOfArms?.generation ?? 0;
  const proofKey = record
    ? `${record.petId}:${record.registrationProof?.signature ?? record.crest?.signature ?? "none"}`
    : "";
  const proofState = !record
    ? "unavailable"
    : proofResult?.key === proofKey
      ? proofResult.state
      : "checking";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    let cancelled = false;
    if (!record || !isOpen) return;
    const verification = record.registrationProof
      ? verifyRegistrationProof(record)
      : record.crest
        ? getDeviceHmacKey().then((key) => verifyCrest(record.crest!, key))
        : Promise.resolve(false);
    verification
      .then((verified) => {
        if (!cancelled) {
          setProofResult({
            key: proofKey,
            state: verified ? "verified" : "invalid",
          });
        }
      })
      .catch(() => {
        if (!cancelled) setProofResult({ key: proofKey, state: "invalid" });
      });
    return () => {
      cancelled = true;
    };
  }, [proofKey, record, isOpen]);

  // Generate blazon description
  const blazon = useMemo(() => {
    if (!coatOfArms) return "";
    return getBlason(coatOfArms);
  }, [coatOfArms]);

  // Format date
  const formattedDate = useMemo(() => {
    if (!createdAt) return "Unknown";
    return new Date(createdAt).toLocaleDateString("en-AU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [createdAt]);

  // Format time
  const formattedTime = useMemo(() => {
    if (!createdAt) return "";
    return new Date(createdAt).toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [createdAt]);

  // Handle print/download
  const handleDownload = useCallback(async () => {
    triggerHaptic("success");

    // Use browser print dialog for now - can be enhanced with html2canvas later
    if (certificateRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        const safe = {
          petName: escapeHtml(petName),
          petId: escapeHtml(petId),
          evolutionState: escapeHtml(evolutionState),
          formattedDate: escapeHtml(formattedDate),
          formattedTime: escapeHtml(formattedTime),
          vault: escapeHtml(crest?.vault?.toUpperCase() || "N/A"),
          rotation: escapeHtml(crest?.rotation ?? "N/A"),
          tail: escapeHtml(crest?.tail?.join(", ") || "N/A"),
          generation: escapeHtml(generation),
          blazon: escapeHtml(blazon),
          dnaHash: escapeHtml(crest?.dnaHash?.slice(0, 32) || "N/A"),
          mirrorHash: escapeHtml(crest?.mirrorHash?.slice(0, 32) || "N/A"),
          signature: escapeHtml(crest?.signature?.slice(0, 48) || "N/A"),
        };
        const shieldSvg =
          certificateRef.current.querySelector("svg.coat-of-arms")?.outerHTML ??
          "";
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>MetaPet Registration Certificate - ${safe.petName}</title>
              <style>

                body {
                  margin: 0;
                  padding: 20px;
                  background: #0f172a;
                  color: white;
                  font-family: system-ui, sans-serif;
                }
                .certificate {
                  max-width: 800px;
                  margin: 0 auto;
                  background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%);
                  border: 2px solid #6366f1;
                  border-radius: 16px;
                  padding: 32px;
                }
                .header {
                  text-align: center;
                  border-bottom: 1px solid #334155;
                  padding-bottom: 24px;
                  margin-bottom: 24px;
                }
                .title {
                  font-family: Georgia, serif;
                  font-size: 28px;
                  font-weight: 700;
                  color: #c084fc;
                  margin: 0 0 8px 0;
                }
                .subtitle {
                  font-size: 14px;
                  color: #94a3b8;
                }
                .pet-name {
                  font-family: Georgia, serif;
                  font-size: 36px;
                  font-weight: 600;
                  color: #22d3ee;
                  text-align: center;
                  margin: 24px 0;
                }
                .grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 24px;
                  margin-bottom: 24px;
                }
                .detail-row {
                  display: flex;
                  justify-content: space-between;
                  padding: 8px 0;
                  border-bottom: 1px solid #1e293b;
                }
                .label {
                  color: #94a3b8;
                  font-size: 12px;
                }
                .value {
                  color: white;
                  font-weight: 500;
                  font-size: 14px;
                }
                .signature {
                  font-family: monospace;
                  font-size: 10px;
                  color: #64748b;
                  word-break: break-all;
                  background: #0f172a;
                  padding: 12px;
                  border-radius: 8px;
                  margin-top: 16px;
                }
                .footer {
                  text-align: center;
                  margin-top: 24px;
                  padding-top: 16px;
                  border-top: 1px solid #334155;
                  color: #64748b;
                  font-size: 11px;
                  font-style: italic;
                }
                @media print {
                  body { background:white;color:#0f172a;padding:0 }
                  .certificate{background:white;border-color:#475569;box-shadow:none;padding:24px}
                  .title,.pet-name,.value{color:#0f172a}.subtitle,.label,.footer{color:#475569}
                  .signature{background:#f1f5f9;color:#334155}.detail-row{gap:12px}.value{overflow-wrap:anywhere;text-align:right}
                  svg{print-color-adjust:exact;-webkit-print-color-adjust:exact}
                }
                .printed-heraldry{display:flex;justify-content:center;margin:12px 0}.printed-heraldry svg{width:140px;height:auto}
                .value{overflow-wrap:anywhere;min-width:0}.detail-row{gap:12px}
                @media(max-width:500px){.grid{grid-template-columns:1fr}.certificate{padding:16px}.title{font-size:22px}
                }
              </style>
            </head>
            <body>
              <div class="certificate">
                <div class="header">
                  <h1 class="title">METAPET REGISTRATION CERTIFICATE</h1>
                  <p class="subtitle">Local record of companion identity and lineage</p>
                </div>
                <h2 class="pet-name">${safe.petName}</h2>
                <div class="printed-heraldry">${shieldSvg}</div>
                <div class="grid">
                  <div>
                    <div class="detail-row">
                      <span class="label">Pet ID</span>
                      <span class="value">${safe.petId}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Evolution Stage</span>
                      <span class="value">${safe.evolutionState}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Coronation Date</span>
                      <span class="value">${safe.formattedDate}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Coronation Time</span>
                      <span class="value">${safe.formattedTime}</span>
                    </div>
                  </div>
                  <div>
                    <div class="detail-row">
                      <span class="label">Vault</span>
                      <span class="value">${safe.vault}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Rotation</span>
                      <span class="value">${safe.rotation}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Tail Sequence</span>
                      <span class="value">[${safe.tail}]</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Generation</span>
                      <span class="value">${safe.generation}</span>
                    </div>
                  </div>
                </div>
                ${blazon ? `<p style="font-style: italic; color: #9a6b20; text-align: center; margin: 16px 0;">"${safe.blazon}"</p>` : ""}
                <div class="signature">
                  <strong>DNA Hash:</strong> ${safe.dnaHash}...<br/>
                  <strong>Mirror Hash:</strong> ${safe.mirrorHash}...<br/>
                  <strong>Signature:</strong> ${safe.signature}...
                </div>
                <div class="footer">
                  This certificate is a record of genesis. It does not grant custody; it witnesses it.<br/>
                  Generated by MetaPet Registry • ${new Date().toISOString()}
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      } else {
        setActionNotice(
          "The print window was blocked. Allow pop-ups for this page, then try again.",
        );
      }
    }
  }, [
    petId,
    petName,
    crest,
    blazon,
    formattedDate,
    formattedTime,
    evolutionState,
    generation,
  ]);

  const handleShare = useCallback(async () => {
    const shareText = `My MetaPet "${petName}" · Generation ${generation} · ${evolutionState} · Registered ${formattedDate}`;
    try {
      if (navigator.share)
        await navigator.share({
          title: `MetaPet Certificate - ${petName}`,
          text: shareText,
        });
      else {
        await navigator.clipboard.writeText(shareText);
        setActionNotice("Certificate summary copied.");
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError"))
        setActionNotice(
          "Sharing is unavailable. You can still print or save a pet backup.",
        );
    }
  }, [petName, generation, evolutionState, formattedDate]);

  const handleCopyPacket = useCallback(async () => {
    if (!record) return;
    try {
      const packet = await exportPetPacket(record);
      await navigator.clipboard.writeText(packet);
      setPacketCopied(true);
      setActionNotice(
        "Pet packet copied. It contains companion data; keep it private.",
      );
    } catch {
      setActionNotice(
        "The pet packet could not be copied. Try saving a pet backup instead.",
      );
    }
  }, [record]);

  const handleBackup = useCallback(async () => {
    if (!record) return;
    try {
      const packet = await exportPetPacket(record);
      const url = URL.createObjectURL(
        new Blob([packet], { type: "text/plain;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `metapet-${record.petId.replace(/[^a-zA-Z0-9_-]/g, "")}.mp2.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setActionNotice(
        "Pet backup saved. Import the MP2 packet in the breeding chamber to restore it. Heraldry decoration is stored separately on this device.",
      );
    } catch {
      setActionNotice(
        "The pet backup could not be saved. Your registered companion has not changed.",
      );
    }
  }, [record]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="living-world registry-dialog"
      onCancel={() => onClose?.()}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        ref={certificateRef}
        className="registry-certificate relative w-full bg-slate-950 border border-cyan-900/60 rounded-3xl shadow-2xl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition-colors z-10 touch-manipulation"
          aria-label="Close certificate"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Header */}
        <div className="text-center pt-14 pb-6 px-4 sm:px-6 border-b border-slate-700/50">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1
              id={titleId}
              className="text-xl sm:text-3xl font-semibold text-cyan-100 font-serif"
            >
              Registration certificate
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Living Genome · Identity & lineage
          </p>
        </div>

        {/* Pet Name Banner */}
        <div className="text-center py-6 bg-gradient-to-r from-transparent via-cyan-950/30 to-transparent">
          <h2 className="px-4 break-words text-3xl sm:text-4xl font-semibold text-cyan-100 font-serif tracking-wide">
            {petName}
          </h2>
          <p className="px-4 text-xs text-slate-400 mt-2 break-all font-mono">
            {petId}
          </p>
          <p className="mt-3 text-sm text-slate-300">
            Generation {generation} ·{" "}
            {record ? "Registered on this device" : "Legacy companion record"}
          </p>
          <p
            className={`mt-2 text-xs ${proofState === "verified" ? "text-emerald-300" : proofState === "invalid" ? "text-rose-300" : "text-amber-200"}`}
            role="status"
          >
            {proofState === "verified"
              ? "Identity proof verified"
              : proofState === "invalid"
                ? "Identity proof could not be verified"
                : proofState === "checking"
                  ? "Checking identity proof…"
                  : "No registered identity proof"}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Visual Identity Section */}
          <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-4">
            {/* Coat of Arms */}
            <div className="heraldry-stage flex flex-col items-center p-3">
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">
                Coat of Arms
              </p>
              {coatOfArms ? (
                <CoatOfArmsRenderer
                  coatOfArms={coatOfArms}
                  size={150}
                  label={`${petName} coat of arms`}
                  showMarkers
                />
              ) : (
                <div className="w-24 h-28 bg-slate-800 rounded animate-pulse" />
              )}
            </div>

            {/* HeptaTag */}
            <div className="flex flex-col items-center p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">
                Hepta Seal
              </p>
              {heptaCode ? (
                <HeptaTag digits={heptaCode} size={120} />
              ) : (
                <div className="w-28 h-28 bg-slate-800 rounded-full animate-pulse" />
              )}
            </div>

            {/* Seed of Life */}
            <div className="flex flex-col items-center p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">
                Life Glyph
              </p>
              {heptaCode ? (
                <SeedOfLifeGlyph digits={heptaCode} size={120} />
              ) : (
                <div className="w-28 h-28 bg-slate-800 rounded animate-pulse" />
              )}
            </div>
          </div>

          {/* Blazon Description */}
          {blazon && (
            <div className="p-4 bg-amber-950/20 border border-amber-700/30 rounded-xl">
              <p className="text-sm text-amber-300 italic text-center">
                "{blazon}"
              </p>
            </div>
          )}

          {heraldryNotice && (
            <p role="status" className="text-sm text-amber-200">
              {heraldryNotice}
            </p>
          )}
          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Left Column */}
            <div className="space-y-3">
              <DetailRow
                icon={<Calendar className="w-4 h-4 text-cyan-400" />}
                label="Coronation"
                value={formattedDate}
              />
              <DetailRow
                icon={<Sparkles className="w-4 h-4 text-purple-400" />}
                label="Evolution"
                value={evolutionState}
              />
              <DetailRow
                icon={<Shield className="w-4 h-4 text-blue-400" />}
                label="Vault"
                value={crest?.vault?.toUpperCase() || "N/A"}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              <DetailRow
                icon={<Hash className="w-4 h-4 text-green-400" />}
                label="Rotation"
                value={crest?.rotation || "N/A"}
              />
              <DetailRow
                icon={<Dna className="w-4 h-4 text-pink-400" />}
                label="Tail"
                value={crest?.tail ? `[${crest.tail.join(", ")}]` : "N/A"}
              />
              <DetailRow
                icon={<Award className="w-4 h-4 text-amber-400" />}
                label="Generation"
                value={String(generation)}
              />
            </div>
          </div>

          <details className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
            <summary className="flex items-center gap-2 mb-3">
              <Fingerprint className="w-4 h-4 text-emerald-400" />
              <p className="text-xs uppercase tracking-widest text-slate-500">
                Identity proof &amp; verification
              </p>
            </summary>
            <div className="space-y-2 text-xs font-mono break-all">
              <div>
                <span className="text-slate-500">DNA Hash: </span>
                <span className="text-emerald-400">
                  {crest?.dnaHash?.slice(0, 32) || "N/A"}...
                </span>
              </div>
              <div>
                <span className="text-slate-500">Mirror Hash: </span>
                <span className="text-purple-400">
                  {crest?.mirrorHash?.slice(0, 32) || "N/A"}...
                </span>
              </div>
              <div>
                <span className="text-slate-500">Signature: </span>
                <span className="text-cyan-400">
                  {crest?.signature?.slice(0, 40) || "N/A"}...
                </span>
              </div>
              <div>
                <span className="text-slate-500">Verification: </span>
                <span
                  className={
                    proofState === "verified"
                      ? "text-emerald-300"
                      : proofState === "invalid"
                        ? "text-rose-300"
                        : "text-amber-300"
                  }
                >
                  {proofState === "verified"
                    ? record?.registrationProof
                      ? "PORTABLE PROOF VERIFIED"
                      : "VERIFIED ON THIS DEVICE"
                    : proofState === "checking"
                      ? "CHECKING…"
                      : proofState === "invalid"
                        ? "SIGNATURE DOES NOT VERIFY"
                        : "NO REGISTERED PROOF"}
                </span>
              </div>
            </div>
          </details>

          {record && (
            <details className="rounded-xl border border-cyan-900/60 bg-cyan-950/15 p-4 text-xs">
              <summary>Lineage &amp; registration details</summary>
              <div className="grid gap-3 mt-3 sm:grid-cols-2">
                <DetailRow
                  icon={<Hash className="h-4 w-4 text-cyan-400" />}
                  label="Ruleset"
                  value={record.rulesetVersion}
                />
                <DetailRow
                  icon={<Sparkles className="h-4 w-4 text-fuchsia-400" />}
                  label="Projection"
                  value={record.projectionVersion}
                />
                <div className="break-all rounded-lg bg-slate-950/45 p-3 font-mono text-xs text-slate-400 sm:col-span-2">
                  Geometry fingerprint: {record.geometryFingerprint}
                  <br />
                  Registration proof:{" "}
                  {record.registrationProof?.algorithm ?? "legacy device HMAC"}
                </div>
                <div className="rounded-lg bg-slate-950/45 p-3 text-slate-300 sm:col-span-2">
                  <span className="text-slate-500">Hepta character: </span>
                  {record.heptaProfile
                    ? `${record.heptaProfile.temperament} · ${record.heptaProfile.dominantAxis}/${record.heptaProfile.secondaryAxis}`
                    : "Legacy profile pending"}
                  <br />
                  <span className="text-slate-500">Parents: </span>
                  {record.lineage.parentIds.length > 0
                    ? record.lineage.parentIds.join(" + ")
                    : "Genesis founder"}
                </div>
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 pt-4">
            <Button
              onClick={handleDownload}
              disabled={!coatOfArms}
              className="flex-1 h-12 bg-cyan-700 hover:bg-cyan-600 touch-manipulation"
            >
              <Download className="w-4 h-4 mr-2" />
              Print / Download
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex-1 h-12 border-slate-600 hover:bg-slate-800 touch-manipulation"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            {record && (
              <Button
                onClick={handleBackup}
                variant="outline"
                className="min-h-12 border-cyan-800 text-cyan-100"
              >
                <Download className="h-4 w-4 mr-2" />
                Save pet backup
              </Button>
            )}
            {record && (
              <Button
                onClick={handleCopyPacket}
                variant="outline"
                className="flex-1 h-12 border-cyan-700 text-cyan-200 hover:bg-cyan-950 touch-manipulation"
              >
                <Copy className="w-4 h-4 mr-2" />
                {packetCopied ? "MP2 Copied" : "Copy MP2"}
              </Button>
            )}
          </div>

          {actionNotice && (
            <p role="status" className="text-sm text-cyan-100">
              {actionNotice}
            </p>
          )}
          {/* Footer */}
          <div className="text-center pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-400 italic">
              This certificate is a record of genesis. It does not grant
              custody; it witnesses it.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              MetaPet Registry • {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </dialog>
  );
}

// Detail row component
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 p-3 bg-slate-900/30 rounded-lg">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <span className="text-sm font-medium text-white break-all text-right">
        {value}
      </span>
    </div>
  );
}

// Inline certificate preview button for use in other components
export function CertificateButton({
  onClick,
  className = "",
  variant,
  size,
}: {
  onClick: () => void;
  className?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
}) {
  // Callers that pass a variant style the button themselves; the gradient is
  // only the standalone default.
  const defaultStyle = variant
    ? ""
    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700";
  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => {
        triggerHaptic("medium");
        onClick();
      }}
      className={`${defaultStyle} touch-manipulation ${className}`}
    >
      <Award className="w-4 h-4 mr-2" />
      View Certificate
    </Button>
  );
}
