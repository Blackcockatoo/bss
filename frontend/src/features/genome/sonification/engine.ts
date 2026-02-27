import {
  FAMILY_TO_INSTRUMENT,
  mapEffectToAudio,
  mapInteractionsToChord,
  type TraitVector,
} from "./mappings";

export type SonifiedTrack = {
  traitId: string;
  instrument: string;
  volume: number;
  filter: number;
  tempo: number;
  chord: string[];
};

export type TrackPlaybackState = {
  muted: boolean;
  solo: boolean;
};

export function buildSonifiedTracks(vectors: TraitVector[]): SonifiedTrack[] {
  return vectors.map((vector) => {
    const audio = mapEffectToAudio(vector.effectSize, vector.confidence);

    return {
      traitId: vector.traitId,
      instrument: FAMILY_TO_INSTRUMENT[vector.family],
      volume: audio.volume,
      filter: audio.filter,
      tempo: audio.tempo,
      chord: mapInteractionsToChord(vector.interactionStrength),
    };
  });
}

export function synchronizeTracks(primary: SonifiedTrack[], secondary: SonifiedTrack[]) {
  return primary.map((track, index) => ({
    primary: track,
    secondary: secondary[index % Math.max(secondary.length, 1)],
    activeGenomeRegion: `region-${index + 1}`,
  }));
}

type ToneModule = typeof import("tone");

type PlaybackPair = ReturnType<typeof synchronizeTracks>[number];

type TrackSynthNode = {
  synth: import("tone").PolySynth;
  filter: import("tone").Filter;
  gain: import("tone").Volume;
};

export class SonificationPlaybackController {
  private tone: ToneModule | null = null;
  private tracks: PlaybackPair[] = [];
  private currentRegionIndex = 0;
  private eventId: number | null = null;
  private initialized = false;
  private primaryNodes: TrackSynthNode[] = [];
  private secondaryNodes: TrackSynthNode[] = [];
  private stepSeconds = 0.5;
  private trackState: Record<string, TrackPlaybackState> = {};

  async initialize(tracks: PlaybackPair[]) {
    if (typeof window === "undefined") {
      return;
    }

    if (!this.tone) {
      this.tone = await import("tone");
    }

    await this.tone.start();
    this.disposeNodes();

    this.tracks = tracks;
    const meanTempo =
      tracks.reduce((total, pair) => total + pair.primary.tempo + pair.secondary.tempo, 0) /
      Math.max(1, tracks.length * 2);

    this.tone.Transport.bpm.value = meanTempo;
    this.stepSeconds = (60 / meanTempo) * 2;
    this.currentRegionIndex = 0;

    this.primaryNodes = tracks.map((pair) => this.buildNode(pair.primary));
    this.secondaryNodes = tracks.map((pair) => this.buildNode(pair.secondary));

    for (const pair of tracks) {
      this.trackState[pair.primary.traitId] = this.trackState[pair.primary.traitId] ?? { muted: false, solo: false };
      this.trackState[pair.secondary.traitId] = this.trackState[pair.secondary.traitId] ?? { muted: false, solo: false };
    }

    if (this.eventId !== null) {
      this.tone.Transport.clear(this.eventId);
    }

    this.eventId = this.tone.Transport.scheduleRepeat((time) => {
      if (this.tracks.length === 0) {
        return;
      }

      const index = this.currentRegionIndex % this.tracks.length;
      const pair = this.tracks[index];

      this.triggerNode(this.primaryNodes[index], pair.primary, time);
      this.triggerNode(this.secondaryNodes[index], pair.secondary, time);

      this.currentRegionIndex = (index + 1) % this.tracks.length;
    }, "2n");

    this.initialized = true;
  }

  private buildNode(track: SonifiedTrack): TrackSynthNode {
    if (!this.tone) {
      throw new Error("Tone runtime not initialized.");
    }

    const filter = new this.tone.Filter(track.filter, "lowpass");
    const gain = new this.tone.Volume(track.volume);
    const oscillatorType =
      track.instrument === "bass"
        ? "triangle"
        : track.instrument === "pad"
          ? "sine"
          : track.instrument === "plucks"
            ? "square"
            : "sawtooth";

    const synth = new this.tone.PolySynth(this.tone.Synth, {
      oscillator: { type: oscillatorType },
      envelope: { attack: 0.05, release: 0.35 },
    });

    synth.connect(filter);
    filter.connect(gain);
    gain.toDestination();

    return { synth, filter, gain };
  }

  private isAudible(track: SonifiedTrack) {
    const state = this.trackState[track.traitId] ?? { muted: false, solo: false };
    const hasSolo = Object.values(this.trackState).some((candidate) => candidate.solo);
    if (state.muted) {
      return false;
    }
    if (hasSolo && !state.solo) {
      return false;
    }
    return true;
  }

  private triggerNode(node: TrackSynthNode, track: SonifiedTrack, time: number) {
    if (!this.isAudible(track)) {
      return;
    }

    node.gain.volume.value = track.volume;
    node.filter.frequency.value = track.filter;
    node.synth.triggerAttackRelease(track.chord, "8n", time);
  }

  setTrackState(traitId: string, nextState: TrackPlaybackState) {
    this.trackState[traitId] = nextState;
  }

  play() {
    if (!this.tone || !this.initialized) {
      return;
    }

    this.tone.Transport.start();
  }

  pause() {
    if (!this.tone || !this.initialized) {
      return;
    }

    this.tone.Transport.pause();
  }

  seek(progress: number) {
    if (!this.tone || !this.initialized || this.tracks.length === 0) {
      return;
    }

    const bounded = Math.max(0, Math.min(1, progress));
    const region = Math.floor(bounded * (this.tracks.length - 1));
    this.currentRegionIndex = region;
    this.tone.Transport.seconds = region * this.stepSeconds;
  }

  getPlaybackState() {
    if (!this.tone || !this.initialized || this.tracks.length === 0) {
      return { isPlaying: false, progress: 0, activeRegionIndex: 0 };
    }

    const totalDuration = this.tracks.length * this.stepSeconds;
    const seconds = this.tone.Transport.seconds % Math.max(totalDuration, 0.0001);
    const activeRegionIndex = Math.floor(seconds / this.stepSeconds) % this.tracks.length;

    return {
      isPlaying: this.tone.Transport.state === "started",
      progress: seconds / totalDuration,
      activeRegionIndex,
    };
  }

  dispose() {
    if (!this.tone) {
      return;
    }

    if (this.eventId !== null) {
      this.tone.Transport.clear(this.eventId);
      this.eventId = null;
    }

    this.tone.Transport.stop();
    this.tone.Transport.seconds = 0;
    this.disposeNodes();
    this.initialized = false;
  }

  private disposeNodes() {
    for (const node of [...this.primaryNodes, ...this.secondaryNodes]) {
      node.synth.dispose();
      node.filter.dispose();
      node.gain.dispose();
    }

    this.primaryNodes = [];
    this.secondaryNodes = [];
  }
}
