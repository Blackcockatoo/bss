import { describe, expect, it } from 'vitest';

import {
  ACHIEVEMENT_TARGETS,
  MIN_VIMANA_ANOMALIES,
  createDefaultVimanaState,
} from './types';

describe('progression defaults', () => {
  it('keeps the anomaly floor in sync with the anomaly achievement target', () => {
    expect(MIN_VIMANA_ANOMALIES).toBeGreaterThanOrEqual(
      ACHIEVEMENT_TARGETS['explorer-anomaly-hunter'],
    );
  });

  it('guarantees enough preset anomalies for the anomaly achievement', () => {
    const vimana = createDefaultVimanaState({
      layout: 'preset',
      random: () => 0.99,
    });

    const anomalyCount = vimana.nodes.filter((node) => node.anomaly !== null).length;
    expect(anomalyCount).toBeGreaterThanOrEqual(
      ACHIEVEMENT_TARGETS['explorer-anomaly-hunter'],
    );
  });

  it('guarantees enough grid anomalies for the anomaly achievement', () => {
    const vimana = createDefaultVimanaState({
      layout: 'grid',
      random: () => 0.99,
    });

    const anomalyCount = vimana.nodes.filter((node) => node.anomaly !== null).length;
    expect(anomalyCount).toBeGreaterThanOrEqual(
      ACHIEVEMENT_TARGETS['explorer-anomaly-hunter'],
    );
  });
});
