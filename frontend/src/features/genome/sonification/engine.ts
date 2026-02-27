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
