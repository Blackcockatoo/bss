# Meta-Pet consolidation — browser validation

Captured with Playwright + bundled Chromium against `next dev`, service
workers blocked, WAAPI/clock frozen for deterministic captures. All checks
scripted and rerunnable; 23/23 passed (8 round-trip + 15 matrix).

## Body Forge → /pet round-trip (390 px, fresh profile, real UI clicks)

1. `rt-1-forge-preview.png` — distinctive creature authored in the Forge UI
   (Mutate + hourglass/chrome/moth/attract via the real selects).
2. `rt-2-pet-after-save.png` — after pressing **Set inherited body**: lands on
   `/pet`, store `petType === 'evolved'`, v3 packet saved with all forged
   fields, form preference persisted.
3. `rt-3-pet-after-reload.png` — after a hard reload: same creature, form
   still `evolved` (no renderer revert), dev diagnostics reads
   `form evolved · body body-forge v3 · migrated none (authored v3) ·
   moss60 clip idle_breathe`.

## Three forms (`form-*-390.png`, plus 768/1280)

- Auralia mounts `auralia-pet-runtime`; Geometry mounts
  `geometry-pet-runtime` (actual Sri Yantra, labelled “Geometry / Sri
  Yantra” — zero “Geometry / Moss60” labels found on the page); Evolved
  mounts `visual-dna-pet-runtime`.
- No horizontal overflow at 390/768/1280.

## Moss60 movement on the inherited body (`moss60-*.png`)

- feed → `head_tilt` (anticipation), play → `happy_bounce`, clean →
  `aura_pulse`, sleep-path reaction, love via real press-and-hold; each
  interrupts `idle_breathe` (verified via the diagnostics readout) and the
  forged silhouette stays readable throughout.
- Wing variants (blade/attack, veil/defend) and the wingless fallback all
  render distinctly on `/pet`.
- `parade-moss60_orbit.png` — red/blue/black strands orbit the inherited
  creature; `parade-black_wing_bloom.png` — bloom on real wings. The parade
  reached all seven major clips (orbit, quantum split/stutter, black wing
  bloom, evolution ceremony, oracle blink, sacred toy bounce).

## Migration & persistence

- `migrated-v1.png` — a bare legacy v1 BodySpec renders on `/pet` and is
  re-saved as v3 with `migratedFrom: "v1"` provenance.
- Legacy `geometric` value in the form-preference key normalises to
  `evolved` on load.

## Reduced motion

- `reduced-motion.png` — `prefers-reduced-motion: reduce` context renders a
  fully visible, softly-performing body.
