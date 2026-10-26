'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { usePetRegistryStore } from '@/lib/registry';
import './living-genome.css';
import type { PetMovementPreset } from '../SriYantraPetEngine';

const Companion = dynamic(() => import('../PetRuntimeStage').then(m => m.PetRuntimeStage), {
  ssr: false,
  loading: () => <p role="status">Preparing companion…</p>,
});

const Geometry = dynamic(() => import('../GeometryAvatarRenderer').then(module => module.GeometryAvatarRenderer), { ssr: false, loading: () => <p role="status">Preparing geometry…</p> });

/** Reuses the canonical renderer, including the active genome, body and cosmetics. */
export function LivingCompanion({ geometry = false, movement }: { geometry?: boolean; movement?: PetMovementPreset } = {}) {
  const petType = useStore(state => state.petType);
  const showGeometry = geometry || petType === 'geometry';
  const container = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  useEffect(() => {
    const updatePage = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', updatePage);
    updatePage();
    const observer = new IntersectionObserver(entries => setVisible(entries[0]?.isIntersecting ?? false));
    if (container.current) observer.observe(container.current);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', updatePage); };
  }, []);
  const name = usePetRegistryStore(s => s.activeRecord?.name) ?? 'Your Pet';
  return <figure ref={container} className="living-companion" aria-label={name}>
    <div className={`living-companion-form ${showGeometry ? "living-geometry-form" : ""}`} aria-hidden="true" inert>{pageVisible ? showGeometry ? <Geometry animated={visible} movement={movement} compact showPersonality={false} /> : visible ? <Companion compact /> : null : null}</div>
    <figcaption>{name}</figcaption>
  </figure>;
}

/** A vessel illustration, not a fictional upgrade or resource system. */
export function LivingVessel({ active = false }: { active?: boolean }) {
  return <svg className="living-vessel" data-active={active} viewBox="0 0 600 260" role="img" aria-label="Vimana living exploration vessel">
    <ellipse cx="300" cy="220" rx="210" ry="16" fill="#38bdf8" opacity=".08" />
    <path d="M60 148Q155 130 235 75Q300 15 365 75Q445 130 540 148L448 174Q300 216 152 174Z" fill="#102b40" stroke="#72c9df" strokeWidth="2" />
    <path d="M85 148Q205 174 300 98Q395 174 515 148Q415 205 300 190Q185 205 85 148Z" fill="#163e50" stroke="#62a7ba" />
    <path d="M235 75Q300 42 365 75L342 130Q300 153 258 130Z" fill="#09202f" stroke="#d1ad66" strokeWidth="2" />
    <g fill="none" stroke="#71d7e4" opacity=".6">
      <path d="M150 147Q230 108 268 85M450 147Q370 108 332 85M193 162L240 126M407 162L360 126" />
      <ellipse cx="300" cy="159" rx="130" ry="23" />
    </g>
    <circle className="living-core" cx="300" cy="104" r="24" fill="#67e8f9" />
    <circle cx="300" cy="104" r="12" fill="#ecfeff" />
    <path d="M270 192L300 207L330 192" fill="none" stroke="#d1ad66" strokeWidth="3" />
  </svg>;
}
