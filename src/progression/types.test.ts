import { describe, expect, it } from 'vitest';

import { ACHIEVEMENT_TARGETS, createDefaultVimanaState } from './types';

describe('progression defaults', () => {
  it('guarantees enough preset anomalies for the anomaly achievement', () => {
    const vimana = createDefaultVimanaState({
      layout: 'preset',
      random: () => 0.99,
    });

    const anomalyCount = vimana.cells.filter((cell) => cell.anomaly).length;
    expect(anomalyCount).toBeGreaterThanOrEqual(
      ACHIEVEMENT_TARGETS['explorer-anomaly-hunter'],
    );
  });

  it('guarantees enough grid anomalies for the anomaly achievement', () => {
    const vimana = createDefaultVimanaState({
      layout: 'grid',
      random: () => 0.99,
    });

    const anomalyCount = vimana.cells.filter((cell) => cell.anomaly).length;
    expect(anomalyCount).toBeGreaterThanOrEqual(
      ACHIEVEMENT_TARGETS['explorer-anomaly-hunter'],
    );
  });
});
