'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { HUD } from '@/components/HUD';
import { HeptaTag } from '@/components/HeptaTag';
import { Button } from '@/components/ui/button';
import {
  getDeviceHmacKey,
  mintPrimeTailId,
  verifyCrest
} from '@/lib/identity/crest';
import {
  heptaEncode42,
  heptaDecode42,
  playHepta,
  stopHepta
} from '@/lib/identity/hepta';
import type {
  PrimeTailID,
  HeptaPayload,
  HeptaDigits,
  Vault,
  Rotation,
  PrivacyPreset
} from '@/lib/identity/types';
import type { MirrorOutcome } from '@/lib/store';
import { Play, Volume2, VolumeX, RefreshCw, Shield, Info, Sparkles, Clock3, HeartHandshake, Hash } from 'lucide-react';

/**
 * Mock Mode Configuration
 */
interface MockConfig {
  enabled: boolean;
  autoPlay: boolean;
  mockVitalsDecay: boolean;
}

interface SessionMetrics {
  totalSessions: number;
  averageLengthMs: number | null;
  d1ReturnRate: number | null;
  d7ReturnRate: number | null;
}

const DEFAULT_MOCK_CONFIG: MockConfig = {
  enabled: true,
  autoPlay: false,
  mockVitalsDecay: true,
};

/**
 * Safety Rails
 */
const SAFETY_RAILS = {
  MAX_AUDIO_DURATION_MS: 30000, // 30 seconds max
  MIN_TICK_INTERVAL_MS: 100,
  MAX_TICK_INTERVAL_MS: 10000,
  VITALS_MIN: 0,
  VITALS_MAX: 100,
  MOCK_DNA_LENGTH: 64,
} as const;

const ANALYTICS_STORAGE_KEY = 'metapet-analytics';
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * ScaffoldPage: Complete integration demo
 * - PrimeTail ID identity minting
 * - HeptaCode v1 (ECC, MAC, visuals, chime)
 * - Real-time vitals loop via Zustand
 * - Mock mode with safety rails
 */
export default function ScaffoldPage() {
  const startTick = useStore(s => s.startTick);
  const stopTick = useStore(s => s.stopTick);
  const mirrorMode = useStore(s => s.mirrorMode);
  const beginMirrorMode = useStore(s => s.beginMirrorMode);
  const confirmMirrorCross = useStore(s => s.confirmMirrorCross);
  const completeMirrorMode = useStore(s => s.completeMirrorMode);
  const refreshConsent = useStore(s => s.refreshConsent);

  const [mockConfig, setMockConfig] = useState<MockConfig>(DEFAULT_MOCK_CONFIG);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [hmacKey, setHmacKey] = useState<CryptoKey | null>(null);
  const [primeTailId, setPrimeTailId] = useState<PrimeTailID | null>(null);
  const [heptaCode, setHeptaCode] = useState<HeptaDigits | null>(null);
   const [ritualPreset, setRitualPreset] = useState<PrivacyPreset>('standard');
   const [ritualNote, setRitualNote] = useState('');
   const [ritualOutcome, setRitualOutcome] = useState<MirrorOutcome>('anchor');
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics | null>(null);

  const showDevMetrics = process.env.NODE_ENV !== 'production';

  const generateMockDNA = useCallback((): string => {
    const chars = 'ACTG0123456789abcdef';
    let dna = '';
    for (let i = 0; i < SAFETY_RAILS.MOCK_DNA_LENGTH; i++) {
      dna += chars[Math.floor(Math.random() * chars.length)];
    }
    return dna;
  }, []);

  const generateTail = useCallback((): [number, number, number, number] => [
    Math.floor(Math.random() * 60),
    Math.floor(Math.random() * 60),
    Math.floor(Math.random() * 60),
    Math.floor(Math.random() * 60),
  ], []);

  const mintNewIdentity = useCallback(async (key: CryptoKey) => {
    try {
      setError(null);

      // Generate mock DNA
      const dna = generateMockDNA();

      // Random vault and rotation
      const vaults: Vault[] = ['red', 'blue', 'black'];
      const rotations: Rotation[] = ['CW', 'CCW'];
      const vault = vaults[Math.floor(Math.random() * vaults.length)];
      const rotation = rotations[Math.floor(Math.random() * rotations.length)];
      const tail = generateTail();

      // Mint PrimeTail ID
      const crest = await mintPrimeTailId({
        dna,
        vault,
        rotation,
        tail,
        hmacKey: key,
      });

      setPrimeTailId(crest);

      // Verify crest immediately
      const verified = await verifyCrest(crest, key);
      setIsVerified(verified);

      // Generate HeptaCode
      const presets: PrivacyPreset[] = ['stealth', 'standard', 'radiant'];
      const preset = presets[Math.floor(Math.random() * presets.length)];

      const payload: HeptaPayload = {
        version: 1,
        preset,
        vault: crest.vault,
        rotation: crest.rotation,
        tail: crest.tail,
        epoch13: Math.floor((Date.now() / 60000) % 8192), // minutes mod 8192
        nonce14: Math.floor(Math.random() * 16384), // 14-bit random
      };

      const digits = await heptaEncode42(payload, key);
      setRitualPreset(preset);
      setHeptaCode(digits);

      // Verify decode
      const decoded = await heptaDecode42(digits, key);
      if (!decoded) {
        setError('HeptaCode decode verification failed');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Minting failed');
    }
  }, [generateMockDNA, generateTail]);

  const handlePlayChime = useCallback(async () => {
    if (!heptaCode || isAudioPlaying) return;

    try {
      setIsAudioPlaying(true);
      setError(null);

      // Safety timeout
      const timeout = setTimeout(() => {
        stopHepta();
        setIsAudioPlaying(false);
      }, SAFETY_RAILS.MAX_AUDIO_DURATION_MS);

      await playHepta(heptaCode, {
        tempo: 180,
        volume: 0.3,
        sustainRatio: 0.75,
      });

      clearTimeout(timeout);
      setIsAudioPlaying(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audio playback failed');
      setIsAudioPlaying(false);
    }
  }, [heptaCode, isAudioPlaying]);

  // Initialize system
  useEffect(() => {
    async function initialize() {
      try {
        // Start vitals tick if mock decay enabled
        if (mockConfig.mockVitalsDecay) {
          startTick();
        }

        // Generate HMAC key
        const key = await getDeviceHmacKey();
        setHmacKey(key);

        // Mint initial identity
        await mintNewIdentity(key);

        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Initialization failed');
      }
    }

    initialize();

    return () => {
      stopTick();
      stopHepta();
    };
  }, [mockConfig.mockVitalsDecay, startTick, stopTick, mintNewIdentity]);

  // Auto-play chime if enabled
  useEffect(() => {
    if (mockConfig.autoPlay && heptaCode && !isAudioPlaying) {
      handlePlayChime();
    }
  }, [handlePlayChime, heptaCode, isAudioPlaying, mockConfig.autoPlay]);

  useEffect(() => {
    if (!showDevMetrics || typeof window === 'undefined') return;

    try {
      const stored = window.localStorage.getItem(ANALYTICS_STORAGE_KEY);
      setSessionMetrics(computeSessionMetrics(stored));
    } catch {
      setSessionMetrics({
        totalSessions: 0,
        averageLengthMs: null,
        d1ReturnRate: null,
        d7ReturnRate: null,
      });
    }
  }, [showDevMetrics]);

  /**
   * Stop audio playback
   */
  function handleStopChime() {
    stopHepta();
    setIsAudioPlaying(false);
  }

  /**
   * Remint identity
   */
  async function handleRemint() {
    if (!hmacKey) return;
    await mintNewIdentity(hmacKey);
  }

  const handleBeginRitual = useCallback(() => {
    beginMirrorMode(ritualPreset);
  }, [beginMirrorMode, ritualPreset]);

  const handleCrossThreshold = useCallback(async () => {
    confirmMirrorCross();
    if (heptaCode && !isAudioPlaying) {
      await handlePlayChime();
    }
  }, [confirmMirrorCross, heptaCode, handlePlayChime, isAudioPlaying]);

  const handleCompleteRitual = useCallback(() => {
    completeMirrorMode(ritualOutcome, ritualNote.trim() || undefined);
    setRitualNote('');
  }, [completeMirrorMode, ritualOutcome, ritualNote]);

  const consentRemainingMinutes = useMemo(() => {
    if (!mirrorMode.consentExpiresAt) return null;
    const delta = mirrorMode.consentExpiresAt - Date.now();
    return Math.max(0, Math.ceil(delta / 60000));
  }, [mirrorMode.consentExpiresAt]);

  const handleRefreshConsent = useCallback(() => {
    refreshConsent(15);
  }, [refreshConsent]);

  /**
   * Toggle mock vitals decay
   */
  function toggleVitalsDecay() {
    const newConfig = {
      ...mockConfig,
      mockVitalsDecay: !mockConfig.mockVitalsDecay,
    };
    setMockConfig(newConfig);

    if (newConfig.mockVitalsDecay) {
      startTick();
    } else {
      stopTick();
    }
  }

  /**
   * Format tail for display
   */
  function formatTail(tail: [number, number, number, number]): string {
    return tail.map(n => n.toString(60).toUpperCase()).join('-');
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin mx-auto" />
          <p className="text-zinc-400">Initializing scaffold...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            PrimeTail ID × HeptaCode v1
          </h1>
          <p className="text-zinc-400">
            Complete scaffold with identity minting, ECC, MAC, visuals, chime & real-time vitals
          </p>
          <p className="text-xs text-zinc-500 mt-2">
            Identity glossary: PrimeTail crest = vault + rotation + tail + DNA hashes; HeptaCode encodes the crest payload. See docs/identity-glossary.md.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Safety Rails Info */}
        <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-cyan-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-cyan-300 mb-2">Safety Rails Active</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                <div>Max Audio: {SAFETY_RAILS.MAX_AUDIO_DURATION_MS / 1000}s</div>
                <div>Tick Range: {SAFETY_RAILS.MIN_TICK_INTERVAL_MS}-{SAFETY_RAILS.MAX_TICK_INTERVAL_MS}ms</div>
                <div>Vitals Range: {SAFETY_RAILS.VITALS_MIN}-{SAFETY_RAILS.VITALS_MAX}</div>
                <div>Mock DNA: {SAFETY_RAILS.MOCK_DNA_LENGTH} chars</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: Identity & HeptaCode */}
          <div className="space-y-6">
            {/* PrimeTail ID Card */}
            <div className="bg-zinc-800/50 backdrop-blur border border-zinc-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">PrimeTail ID</h2>
                {isVerified !== null && (
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                    isVerified
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    <Shield className="w-3 h-3" />
                    {isVerified ? 'Verified' : 'Invalid'}
                  </div>
                )}
              </div>

              {primeTailId ? (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <InfoItem label="Vault" value={primeTailId.vault.toUpperCase()} />
                    <InfoItem label="Rotation" value={primeTailId.rotation} />
                  </div>
                  <InfoItem label="Tail" value={formatTail(primeTailId.tail)} />
                  <InfoItem
                    label="DNA Hash"
                    value={`${primeTailId.dnaHash.slice(0, 12)}...${primeTailId.dnaHash.slice(-8)}`}
                  />
                  <InfoItem
                    label="Mirror Hash"
                    value={`${primeTailId.mirrorHash.slice(0, 12)}...${primeTailId.mirrorHash.slice(-8)}`}
                  />
                  <InfoItem
                    label="Signature"
                    value={`${primeTailId.signature.slice(0, 16)}...`}
                  />
                  <InfoItem
                    label="Coronated"
                    value={new Date(primeTailId.coronatedAt).toLocaleString()}
                  />
                </div>
              ) : (
                <p className="text-zinc-500">No identity minted</p>
              )}

              <Button
                onClick={handleRemint}
                disabled={!hmacKey}
                className="w-full mt-4 gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Mint New Identity
              </Button>
            </div>

            {/* HeptaCode Visual */}
            {heptaCode && (
              <div className="bg-zinc-800/50 backdrop-blur border border-zinc-700 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">HeptaCode (42 digits)</h2>
                  <div className="text-xs text-zinc-500 font-mono">
                    v1 • ECC • MAC-28
                  </div>
                </div>

                <div className="flex justify-center mb-4">
                  <HeptaTag digits={heptaCode} size={280} />
                </div>

                <div className="bg-zinc-900/50 rounded-lg p-3 mb-4">
                  <div className="font-mono text-xs text-zinc-400 break-all">
                    {Array.from(heptaCode).join('')}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handlePlayChime}
                    disabled={isAudioPlaying}
                    className="flex-1 gap-2"
                    variant="secondary"
                  >
                    {isAudioPlaying ? (
                      <><Volume2 className="w-4 h-4 animate-pulse" /> Playing...</>
                    ) : (
                      <><Play className="w-4 h-4" /> Play Chime</>
                    )}
                  </Button>

                  {isAudioPlaying && (
                    <Button
                      onClick={handleStopChime}
                      variant="outline"
                      size="icon"
                    >
                      <VolumeX className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Mirror Mode Ritual */}
            <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 backdrop-blur border border-purple-500/30 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-300" />
                  <div>
                    <h2 className="text-xl font-bold">Threshold Ritual</h2>
                    <p className="text-xs text-zinc-400">Bridge reality ↔ meta with consent</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  mirrorMode.phase === 'crossed'
                    ? 'border-emerald-400 text-emerald-300'
                    : mirrorMode.phase === 'entering'
                      ? 'border-amber-300 text-amber-200'
                      : mirrorMode.phase === 'returning'
                        ? 'border-cyan-300 text-cyan-200'
                        : 'border-zinc-500 text-zinc-300'
                }`}>
                  {mirrorMode.phase.toUpperCase()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-zinc-300">
                <div>
                  <div className="mb-1 text-zinc-400">Privacy Preset</div>
                  <select
                    value={ritualPreset}
                    onChange={event => setRitualPreset(event.target.value as PrivacyPreset)}
                    className="w-full bg-zinc-900/60 border border-purple-500/30 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="stealth">Stealth • keeps crest local</option>
                    <option value="standard">Standard • vault broadcast</option>
                    <option value="radiant">Radiant • full metadata</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock3 className="w-4 h-4 text-cyan-300" />
                    <span className="text-zinc-400">Consent</span>
                    <span className="font-mono text-zinc-100">
                      {consentRemainingMinutes !== null ? `${consentRemainingMinutes}m` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-purple-300" />
                    <span className="text-zinc-400">Presence Token</span>
                    <span className="font-mono text-[11px] text-zinc-100 truncate">
                      {mirrorMode.presenceToken ?? '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleBeginRitual}
                  disabled={mirrorMode.phase !== 'idle' && mirrorMode.phase !== 'returning'}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Open Ritual
                </Button>
                <Button
                  onClick={handleCrossThreshold}
                  disabled={mirrorMode.phase !== 'entering'}
                  variant="secondary"
                  className="gap-2"
                >
                  <Play className="w-4 h-4" />
                  Cross & Chime
                </Button>
                <Button
                  onClick={handleRefreshConsent}
                  variant="outline"
                  className="gap-2"
                >
                  <Clock3 className="w-4 h-4" />
                  +15m Consent
                </Button>
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Reflection Note</label>
                <textarea
                  value={ritualNote}
                  onChange={event => setRitualNote(event.target.value)}
                  rows={3}
                  className="w-full bg-zinc-900/70 border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="What shifted when you crossed?"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={ritualOutcome === 'anchor' ? 'default' : 'outline'}
                  onClick={() => setRitualOutcome('anchor')}
                  className="gap-1"
                >
                  <Shield className="w-4 h-4" />
                  Anchor Buff
                </Button>
                <Button
                  type="button"
                  variant={ritualOutcome === 'drift' ? 'default' : 'outline'}
                  onClick={() => setRitualOutcome('drift')}
                  className="gap-1"
                >
                  <VolumeX className="w-4 h-4" />
                  Drift Reset
                </Button>
                <Button
                  onClick={handleCompleteRitual}
                  disabled={mirrorMode.phase === 'idle'}
                  variant="secondary"
                  className="gap-2"
                >
                  <HeartHandshake className="w-4 h-4" />
                  Commit Reflection
                </Button>
              </div>

              {mirrorMode.lastReflection && (
                <div className="border border-purple-500/30 rounded-lg p-3 bg-zinc-900/60">
                  <div className="flex items-center justify-between text-sm text-zinc-200">
                    <span className="font-semibold">
                      {mirrorMode.lastReflection.outcome === 'anchor' ? 'Anchored' : 'Drifted'} •{' '}
                      {mirrorMode.lastReflection.preset.toUpperCase()}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {new Date(mirrorMode.lastReflection.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {mirrorMode.lastReflection.note && (
                    <p className="text-xs text-zinc-300 mt-2">{mirrorMode.lastReflection.note}</p>
                  )}
                  <div className="text-xs text-zinc-400 mt-2">
                    Mood {mirrorMode.lastReflection.moodDelta >= 0 ? '+' : ''}{mirrorMode.lastReflection.moodDelta} /
                    Energy {mirrorMode.lastReflection.energyDelta >= 0 ? '+' : ''}{mirrorMode.lastReflection.energyDelta}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Vitals & Controls */}
          <div className="space-y-6">
            {/* Mock Mode Controls */}
            <div className="bg-zinc-800/50 backdrop-blur border border-zinc-700 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-bold">Mock Mode</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-300">Mock Mode</span>
                  <button
                    onClick={() => setMockConfig({ ...mockConfig, enabled: !mockConfig.enabled })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      mockConfig.enabled ? 'bg-cyan-500' : 'bg-zinc-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        mockConfig.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-300">Auto-play Chime</span>
                  <button
                    onClick={() => setMockConfig({ ...mockConfig, autoPlay: !mockConfig.autoPlay })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      mockConfig.autoPlay ? 'bg-cyan-500' : 'bg-zinc-600'
                    }`}
                    disabled={!mockConfig.enabled}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        mockConfig.autoPlay ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-300">Vitals Decay</span>
                  <button
                    onClick={toggleVitalsDecay}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      mockConfig.mockVitalsDecay ? 'bg-cyan-500' : 'bg-zinc-600'
                    }`}
                    disabled={!mockConfig.enabled}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        mockConfig.mockVitalsDecay ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {showDevMetrics && (
              <div className="bg-zinc-800/40 backdrop-blur border border-zinc-700/60 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-zinc-200">Metrics (dev)</h2>
                  <span className="text-[10px] uppercase tracking-wide text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                    Dev only
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-zinc-300">
                  <div>
                    <div className="text-zinc-500 mb-1">Total sessions</div>
                    <div className="font-semibold">
                      {sessionMetrics?.totalSessions ?? 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">Avg length</div>
                    <div className="font-semibold">
                      {formatDuration(sessionMetrics?.averageLengthMs ?? null)}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">D1 return</div>
                    <div className="font-semibold">
                      {formatReturnRate(sessionMetrics?.d1ReturnRate ?? null)}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">D7 return</div>
                    <div className="font-semibold">
                      {formatReturnRate(sessionMetrics?.d7ReturnRate ?? null)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-zinc-500">
                  Reads {ANALYTICS_STORAGE_KEY} from localStorage.
                </div>
              </div>
            )}

            {/* Real-time Vitals HUD */}
            <div className="bg-zinc-800/50 backdrop-blur border border-zinc-700 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Real-time Vitals</h2>
              <HUD />

              <div className="mt-4 pt-4 border-t border-zinc-700">
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500">
                  <div>Tick Status: {mockConfig.mockVitalsDecay ? '✓ Active' : '⏸ Paused'}</div>
                  <div>Zustand Store: ✓ Wired</div>
                  <div>Auto-save: ✓ Enabled</div>
                  <div>Persistence: IndexedDB</div>
                </div>
              </div>
            </div>

            {/* Architecture Info */}
            <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 backdrop-blur border border-purple-500/30 rounded-2xl p-6">
              <h3 className="font-semibold text-purple-300 mb-3">Architecture</h3>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li>✓ PrimeTail ID: HMAC-SHA256 identity signing</li>
                <li>✓ HeptaCode v1: 42-digit base-7 with ECC (6×7 blocks)</li>
                <li>✓ MAC-28: Truncated HMAC for compact auth</li>
                <li>✓ Audio: Web Audio API chime generation</li>
                <li>✓ Vitals: Zustand store with auto-tick</li>
                <li>✓ Persistence: IndexedDB auto-save</li>
                <li>✓ Safety: Bounded timers, clamped vitals</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Start Instructions */}
        <div className="mt-8 bg-zinc-800/30 backdrop-blur border border-zinc-700/50 rounded-2xl p-6">
          <h3 className="font-semibold text-zinc-300 mb-3">Quick Start</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-zinc-400">
            <div>
              <div className="font-mono text-cyan-400 mb-1">1. Install</div>
              <code className="text-xs">pnpm install</code>
            </div>
            <div>
              <div className="font-mono text-cyan-400 mb-1">2. Dev</div>
              <code className="text-xs">pnpm dev</code>
            </div>
            <div>
              <div className="font-mono text-cyan-400 mb-1">3. Navigate</div>
              <code className="text-xs">/scaffold</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Info item component
 */
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className="text-zinc-300 font-mono text-xs truncate">{value}</div>
    </div>
  );
}

function computeSessionMetrics(raw: string | null): SessionMetrics {
  if (!raw) {
    return {
      totalSessions: 0,
      averageLengthMs: null,
      d1ReturnRate: null,
      d7ReturnRate: null,
    };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const sessions = normalizeSessions(parsed);
    const starts = sessions
      .map(session => session.start)
      .filter((value): value is number => typeof value === 'number')
      .sort((a, b) => a - b);
    const durations = sessions
      .map(session => session.durationMs)
      .filter((value): value is number => typeof value === 'number' && value >= 0);
    const averageLengthMs = durations.length
      ? durations.reduce((sum, value) => sum + value, 0) / durations.length
      : null;

    return {
      totalSessions: sessions.length,
      averageLengthMs,
      d1ReturnRate: computeReturnRate(starts, 1),
      d7ReturnRate: computeReturnRate(starts, 7),
    };
  } catch {
    return {
      totalSessions: 0,
      averageLengthMs: null,
      d1ReturnRate: null,
      d7ReturnRate: null,
    };
  }
}

function normalizeSessions(raw: unknown): Array<{ start: number; durationMs?: number }> {
  const entries = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object'
      ? ((raw as { sessions?: unknown[]; events?: unknown[] }).sessions ??
          (raw as { events?: unknown[] }).events ??
          [])
      : [];

  return entries.flatMap(entry => {
    if (typeof entry === 'number') {
      return [{ start: entry }];
    }

    if (entry && typeof entry === 'object') {
      const candidate = entry as {
        start?: unknown;
        startedAt?: unknown;
        timestamp?: unknown;
        end?: unknown;
        endedAt?: unknown;
        durationMs?: unknown;
        lengthMs?: unknown;
      };
      const start =
        typeof candidate.start === 'number'
          ? candidate.start
          : typeof candidate.startedAt === 'number'
            ? candidate.startedAt
            : typeof candidate.timestamp === 'number'
              ? candidate.timestamp
              : null;
      const end =
        typeof candidate.end === 'number'
          ? candidate.end
          : typeof candidate.endedAt === 'number'
            ? candidate.endedAt
            : null;
      const explicitDuration =
        typeof candidate.durationMs === 'number'
          ? candidate.durationMs
          : typeof candidate.lengthMs === 'number'
            ? candidate.lengthMs
            : null;
      const durationMs =
        explicitDuration ?? (start !== null && end !== null ? Math.max(0, end - start) : undefined);

      if (start !== null) {
        return [{ start, durationMs }];
      }
    }

    return [];
  });
}

function computeReturnRate(starts: number[], days: number): number | null {
  if (starts.length < 2) return null;
  const gapWindowStart = days * DAY_MS;
  const gapWindowEnd = (days + 1) * DAY_MS;
  const gaps = starts.slice(0, -1).map((start, index) => starts[index + 1] - start);
  const returning = gaps.filter(gap => gap >= gapWindowStart && gap < gapWindowEnd).length;
  return gaps.length ? returning / gaps.length : null;
}

function formatDuration(durationMs: number | null): string {
  if (durationMs === null) return '—';
  const minutes = durationMs / 60000;
  return `${minutes.toFixed(1)}m`;
}

function formatReturnRate(rate: number | null): string {
  if (rate === null) return '—';
  return `${Math.round(rate * 100)}%`;
}
