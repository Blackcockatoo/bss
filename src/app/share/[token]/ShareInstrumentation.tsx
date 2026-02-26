'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

export function ShareInstrumentation({ verified, digest }: { verified: boolean; digest: string }) {
  useEffect(() => {
    const key = `moss60-share-${digest}`;
    const seen = window.localStorage.getItem(key);

    trackEvent(seen ? 'moss60_reimport' : 'moss60_import', { digest });
    if (verified) {
      trackEvent('moss60_verify', { source: 'share-route', digest });
    }

    window.localStorage.setItem(key, '1');
  }, [digest, verified]);

  return null;
}
