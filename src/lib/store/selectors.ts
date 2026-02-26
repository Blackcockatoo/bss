import type { MetaPetState } from '@/lib/store';

export const selectHudState = (state: MetaPetState) => ({
  vitals: state.vitals,
  ritualProgress: state.ritualProgress,
  essence: state.essence,
  lastRewardSource: state.lastRewardSource,
  lastRewardAmount: state.lastRewardAmount,
  feed: state.feed,
  clean: state.clean,
  play: state.play,
  sleep: state.sleep,
});
