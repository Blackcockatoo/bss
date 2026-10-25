# Living Genome: Battle and Vimana implementation

## Scope and repository truth

Work began on a clean checkout at `9686f35`, the tip of the existing
`feature/project-forge-first-slice-20261025` branch. Its earlier Forge work is
preserved. Implementation is isolated on `forge/living-genome-battle-vimana`.

Battle is exposed at `/app/battle` and through `FeaturesDashboard` on
`/app/activities?tab=battle`. Vimana is the existing dashboard exploration tab,
`/app/activities?tab=vimana`; no new prototype route was created.

- Combat engine: `src/lib/battle/index.ts`. Shield determines combat type;
  vitals, shield and streak determine combat stats. These rules are unchanged.
- Exploration: `VimanaMap`, `src/store/index.ts`, `src/lib/vimana` and existing
  progression helpers. Discovery stages, field rewards and anomaly resolution
  remain the existing store actions. There is no exposed ship upgrade,
  inventory, habitat management or companion-switching mechanic in this map.
- Identity: `PetRuntimeStage` chooses Auralia, Visual DNA/forged body or geometry
  from the live store. Geometry uses the canonical registry/genome projection.
  `LivingCompanion` reuses that switch and reads the active registry name.
- Persistence: the consumer shell's `PetRegistryBootstrap` and
  `createPetProgressPersistence` already save runtime progress to the canonical
  local record. No schema, save key or migration was changed. As before,
  unfinished individual battles are component state, not resumable saves.

## Changes

- `src/components/living-genome/LivingScene.tsx`: lazy-loaded canonical
  companion display; decorative vessel SVG with a visible core; offscreen and
  background companion rendering suspended through observer/listener cleanup.
- `src/components/living-genome/living-genome.css`: shared cyan/gold scene
  styling, responsive compositions, touch/focus states, turn-order motion,
  damage reactions and reduced-motion alternatives. No new rendering engine.
- `BattleArena.tsx`: companion scene, opponent type sigil, compact health cards,
  real power/accuracy/status chance/type effectiveness/remaining-use details,
  selected move indication, speed-based turn indicator, actual HP-loss labels,
  expandable battle history, result/recovery scenes and a synchronous turn lock.
  An engine outcome is computed once; completed win/loss progress is recorded
  before cosmetic delay, so navigation cannot discard the completed result.
  Cosmetic timers are cleared on unmount; reduced motion updates immediately.
- `VimanaMap.tsx`: vessel/companion deck, native destination selector usable on
  phones, keyboard map focus, optional detailed field readings, and brief vessel
  feedback after existing exploration actions. Store updates run before visual
  feedback and never depend on an animation finishing.
- `PetRuntimeStage.tsx`: optional compact mode suppresses auxiliary genome and
  personality readouts; default full pet presentation remains unchanged.
- `BattleArena.test.tsx`, `VimanaMap.test.tsx`: new regression coverage for turn
  locking, exact outcome HP/status, result recording before unmount, win/loss
  rematches, reduced motion, destination selection and keyboard selection.

Opponent creature models were not present in the original arena. Opponents are
explicitly represented as type sigils, rather than invented companion records.
No fictional DNA, rewards, resources, upgrade controls or destinations were added.

## Executed validation

Baseline: four targeted files passed, 31 tests.

After implementation:

- Full Vitest suite: **188 files, 1,368 tests passed**.
- Targeted final Battle/Vimana/runtime regression run: **3 files, 15 tests passed**.
- `npm run lint`: school-document check, TypeScript and ESLint passed.
- `npm run build`: production webpack build passed.
- `git diff --check`: passed.

The full suite includes existing local registry persistence, genome/runtime,
Vimana progression, school boundaries and learning tests. These establish
regression evidence, not proof of every possible manual journey.

## Verification limits and release state

No desktop/mobile screenshot, real touch-device check, keyboard browser journey,
client runtime browser check or 60 fps benchmark has been completed in this run.
Playwright could not launch because its Chromium binary was absent. An attempted
Chromium install failed with a truncated archive (`End of central directory
record signature not found`). Automated tests and a production build do not
replace those acceptance checks.

Responsive CSS includes compact-phone and desktop arrangements, safe-area
padding, 44px HTML controls and reduced-motion rules. Small SVG map targets have
an equivalent native destination selector. These arrangements still require
rendered browser review, including all three companion forms and portrait /
landscape widths.

No production deployment or live-site verification is claimed. The implementation
is suitable for branch review; the visual acceptance gate remains open.
