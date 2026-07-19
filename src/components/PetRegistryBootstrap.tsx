'use client';

import { useEffect, useRef } from 'react';

import { bootRegisteredPet } from '@/lib/registry';

/**
 * Mounts the Phase 1 registry boot on the canonical /pet route: ensures one
 * registered pet exists (load → migrate legacy archive → mint genesis) and
 * hydrates the runtime store from its record, so the renderers always draw a
 * real registered genome. Renders nothing.
 */
export function PetRegistryBootstrap() {
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    bootRegisteredPet().catch((error) => {
      console.error('[registry] pet boot failed', error);
    });
  }, []);

  return null;
}
