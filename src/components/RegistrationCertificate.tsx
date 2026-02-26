'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { CoatOfArmsRenderer } from '@/components/lineage/CoatOfArmsRenderer';
import { HeptaTag } from '@/components/HeptaTag';
import { SeedOfLifeGlyph } from '@/components/SeedOfLifeGlyph';
import { generateFounderCoatOfArms, getBlason } from '@/lib/lineage';
import type { CoatOfArms } from '@/lib/lineage';
import type { PrimeTailID, HeptaDigits } from '@/lib/identity/types';
import { Button } from '@/components/ui/button';
import { triggerHaptic } from '@/lib/haptics';
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
} from 'lucide-react';

interface RegistrationCertificateProps {
  petId: string;
  petName?: string;
  crest: PrimeTailID | null;
  heptaCode: HeptaDigits | null;
  createdAt?: number;
  evolutionState?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

// Simple string hash function
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function RegistrationCertificate({
  petId,
  petName = 'Unnamed Companion',
  crest,
  heptaCode,
  createdAt,
  evolutionState = 'GENESIS',
  isOpen = false,
  onClose,
}: RegistrationCertificateProps) {
  const [coatOfArms, setCoatOfArms] = useState<CoatOfArms | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  // Generate or load coat of arms
  useEffect(() => {
    if (!petId) return;

    const storedCoa = localStorage.getItem(`auralia_coat_of_arms_${petId}`);

    if (storedCoa) {
      try {
        setCoatOfArms(JSON.parse(storedCoa));
      } catch {
        const seed = hashString(petId);
        const newCoa = generateFounderCoatOfArms(petId, seed);
        localStorage.setItem(`auralia_coat_of_arms_${petId}`, JSON.stringify(newCoa));
        setCoatOfArms(newCoa);
      }
    } else {
      const seed = hashString(petId);
      const newCoa = generateFounderCoatOfArms(petId, seed);
      localStorage.setItem(`auralia_coat_of_arms_${petId}`, JSON.stringify(newCoa));
      setCoatOfArms(newCoa);
    }
  }, [petId]);

  // Generate blazon description
  const blazon = useMemo(() => {
    if (!coatOfArms) return '';
    return getBlason(coatOfArms);
  }, [coatOfArms]);

  // Format date
  const formattedDate = useMemo(() => {
    if (!createdAt) return 'Unknown';
    return new Date(createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [createdAt]);

  // Format time
  const formattedTime = useMemo(() => {
    if (!createdAt) return '';
    return new Date(createdAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [createdAt]);

  // Handle print/download
  const handleDownload = useCallback(async () => {
    triggerHaptic('success');

    // Use browser print dialog for now - can be enhanced with html2canvas later
    if (certificateRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>MetaPet Registration Certificate - ${petName}</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
                body {
                  margin: 0;
                  padding: 20px;
                  background: #0f172a;
                  color: white;
                  font-family: 'Inter', sans-serif;
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
                  font-family: 'Cinzel', serif;
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
                  font-family: 'Cinzel', serif;
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
                  body { background: white; color: black; }
                  .certificate { border-color: #6366f1; }
                }
              </style>
            </head>
            <body>
              <div class="certificate">
                <div class="header">
                  <h1 class="title">METAPET REGISTRATION CERTIFICATE</h1>
                  <p class="subtitle">Official Record of Digital Companion Genesis</p>
                </div>
                <h2 class="pet-name">${petName}</h2>
                <div class="grid">
                  <div>
                    <div class="detail-row">
                      <span class="label">Pet ID</span>
                      <span class="value">${petId.slice(0, 16)}...</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Evolution Stage</span>
                      <span class="value">${evolutionState}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Coronation Date</span>
                      <span class="value">${formattedDate}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Coronation Time</span>
                      <span class="value">${formattedTime}</span>
                    </div>
                  </div>
                  <div>
                    <div class="detail-row">
                      <span class="label">Vault</span>
                      <span class="value">${crest?.vault?.toUpperCase() || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Rotation</span>
                      <span class="value">${crest?.rotation || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Tail Sequence</span>
                      <span class="value">[${crest?.tail?.join(', ') || 'N/A'}]</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Generation</span>
                      <span class="value">${coatOfArms?.generation || 0}</span>
                    </div>
                  </div>
                </div>
                ${blazon ? `<p style="font-style: italic; color: #fbbf24; text-align: center; margin: 16px 0;">"${blazon}"</p>` : ''}
                <div class="signature">
                  <strong>DNA Hash:</strong> ${crest?.dnaHash?.slice(0, 32) || 'N/A'}...<br/>
                  <strong>Mirror Hash:</strong> ${crest?.mirrorHash?.slice(0, 32) || 'N/A'}...<br/>
                  <strong>Signature:</strong> ${crest?.signature?.slice(0, 48) || 'N/A'}...
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
      }
    }
  }, [petId, petName, crest, blazon, formattedDate, formattedTime, evolutionState, coatOfArms?.generation]);

  // Handle share
  const handleShare = useCallback(async () => {
    triggerHaptic('medium');

    const shareText = `Check out my MetaPet "${petName}"!
Vault: ${crest?.vault?.toUpperCase() || 'N/A'}
Evolution: ${evolutionState}
Coronated: ${formattedDate}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `MetaPet Certificate - ${petName}`,
          text: shareText,
        });
      } catch (err) {
        // User cancelled or share failed
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareText);
      alert('Certificate details copied to clipboard!');
    }
  }, [petName, crest, evolutionState, formattedDate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        ref={certificateRef}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 border-2 border-indigo-500/50 rounded-2xl shadow-2xl shadow-indigo-500/20"
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
        <div className="text-center pt-8 pb-6 px-6 border-b border-slate-700/50">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Award className="w-8 h-8 text-purple-400" />
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-serif">
              REGISTRATION CERTIFICATE
            </h1>
            <Award className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-sm text-slate-400">Official Record of Digital Companion Genesis</p>
        </div>

        {/* Pet Name Banner */}
        <div className="text-center py-6 bg-gradient-to-r from-transparent via-cyan-950/30 to-transparent">
          <h2 className="text-3xl sm:text-4xl font-bold text-cyan-300 font-serif tracking-wide">
            {petName}
          </h2>
          <p className="text-sm text-slate-500 mt-1">{petId.slice(0, 20)}...</p>
        </div>

        {/* Main Content Grid */}
        <div className="p-6 space-y-6">
          {/* Visual Identity Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Coat of Arms */}
            <div className="flex flex-col items-center p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">Coat of Arms</p>
              {coatOfArms ? (
                <CoatOfArmsRenderer coatOfArms={coatOfArms} size={120} showMarkers />
              ) : (
                <div className="w-24 h-28 bg-slate-800 rounded animate-pulse" />
              )}
            </div>

            {/* HeptaTag */}
            <div className="flex flex-col items-center p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">Hepta Seal</p>
              {heptaCode ? (
                <HeptaTag digits={heptaCode} size={120} />
              ) : (
                <div className="w-28 h-28 bg-slate-800 rounded-full animate-pulse" />
              )}
            </div>

            {/* Seed of Life */}
            <div className="flex flex-col items-center p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">Life Glyph</p>
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
              <p className="text-sm text-amber-300 italic text-center">"{blazon}"</p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
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
                value={crest?.vault?.toUpperCase() || 'N/A'}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              <DetailRow
                icon={<Hash className="w-4 h-4 text-green-400" />}
                label="Rotation"
                value={crest?.rotation || 'N/A'}
              />
              <DetailRow
                icon={<Dna className="w-4 h-4 text-pink-400" />}
                label="Tail"
                value={crest?.tail ? `[${crest.tail.join(', ')}]` : 'N/A'}
              />
              <DetailRow
                icon={<Award className="w-4 h-4 text-amber-400" />}
                label="Generation"
                value={String(coatOfArms?.generation || 0)}
              />
            </div>
          </div>

          {/* Cryptographic Signature */}
          <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Fingerprint className="w-4 h-4 text-emerald-400" />
              <p className="text-xs uppercase tracking-widest text-slate-500">Cryptographic Proof</p>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div>
                <span className="text-slate-500">DNA Hash: </span>
                <span className="text-emerald-400">{crest?.dnaHash?.slice(0, 32) || 'N/A'}...</span>
              </div>
              <div>
                <span className="text-slate-500">Mirror Hash: </span>
                <span className="text-purple-400">{crest?.mirrorHash?.slice(0, 32) || 'N/A'}...</span>
              </div>
              <div>
                <span className="text-slate-500">Signature: </span>
                <span className="text-cyan-400">{crest?.signature?.slice(0, 40) || 'N/A'}...</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleDownload}
              className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 touch-manipulation"
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
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-600 italic">
              This certificate is a record of genesis. It does not grant custody; it witnesses it.
            </p>
            <p className="text-[10px] text-slate-700 mt-2">
              MetaPet Registry • {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
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
    <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}

// Inline certificate preview button for use in other components
export function CertificateButton({
  onClick,
  className = '',
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      onClick={() => {
        triggerHaptic('medium');
        onClick();
      }}
      className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 touch-manipulation ${className}`}
    >
      <Award className="w-4 h-4 mr-2" />
      View Certificate
    </Button>
  );
}
