'use client';

import { useEffect, useState } from 'react';

export const COMPACT_VIEWPORT_QUERY = '(max-width: 640px)';

export const getLabelLines = (label: string): string[] => {
  if (label.length <= 11 || !label.includes(' ')) {
    return [label];
  }

  const words = label.split(' ');

  if (
    words.length === 2
    && words[0].length <= 2
    && words[1].length >= 7
  ) {
    return [label];
  }

  const halfway = Math.ceil(words.length / 2);
  return [words.slice(0, halfway).join(' '), words.slice(halfway).join(' ')];
};

export function useIsCompactViewport() {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(COMPACT_VIEWPORT_QUERY);
    const syncCompact = () => setIsCompact(media.matches);
    syncCompact();

    media.addEventListener('change', syncCompact);
    return () => media.removeEventListener('change', syncCompact);
  }, []);

  return isCompact;
}
