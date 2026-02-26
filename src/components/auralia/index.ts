/**
 * Auralia Guardian - Main Exports
 *
 * Virtual companion system with sacred mathematics and generative art
 */

// ===== MAIN COMPONENT =====
export { default as AuraliaMetaPet } from '../AuraliaMetaPet';
export { SubAtomicParticleField } from './SubAtomicParticleField';
export { TemporalEchoTrail } from './TemporalEchoTrail';

// ===== TYPES =====
export type * from './types';

// ===== CONFIGURATIONS =====
export { GUARDIAN_FORMS, FORM_CONDITIONS, getActiveForm } from './config/forms';
export { TIME_THEMES, getTimeOfDay, getTimeTheme, HIGH_CONTRAST_THEME } from './config/themes';
export { AUDIO_SCALES, BASE_FREQUENCY, DRONE_RATIOS, AMBIENT_FREQUENCIES, AUDIO_PARAMS } from './config/audioScales';

// ===== UTILITIES =====
export {
  RED,
  BLACK,
  BLUE,
  initField,
  generateSigilPoints,
} from './utils/mossPrimeSeed';

export {
  saveGuardianState,
  loadGuardianState,
  clearGuardianState,
  exportGuardianState,
  importGuardianState,
  createSnapshot,
  isLocalStorageAvailable,
} from './utils/persistence';

export {
  generateFibonacciTrivia,
  generateSigilPattern,
  validatePattern,
  GAME_REWARDS,
  getCelebrationNotes,
} from './utils/miniGames';
