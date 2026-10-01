# MetaPet repair and navigation audit — 1 October 2026

## Scope and preservation

Inspected current `Blackcockatoo/bss` main at `4ccc448d201ff45c4c3f8dd7e4e498c80649cc3b`, matching the active Vercel production deployment. Repair branch: `codex/metapet-rotation-evolution-repair`. No dependency upgrades, route removals, DNA replacements, threshold reductions, or navigation redesign. Existing MOSS60 experiments and the separate observatory branch remain intact. These changes are reviewable branch changes, not a production release.

## FIXED / TETRIS ROOT CAUSE

Vimana Tetris uses coordinate lists, not matrix rendering. The hand-authored L orientation lists contained mirrored geometry in states 1 and 3. The spawn was correct; its subsequent definitions were not rotations of that spawn. J had the same problem, while T/I used the opposite turning order and S/Z reused two states with inconsistent origins.

Generate all four states from each existing spawn using the screen-coordinate clockwise transform `(x,y) → (-y,x)` about one fixed pivot. JLSTZ use `(0,0)`, I uses `(0.5,0.5)`, and O stays stationary. Preserve original spawn coordinates, colors, scoring, movement and locking. Match JLSTZ kick lookup to the existing downward spawn (canonical SRS orientation 2). The engine still validates every kick against the board before committing; blocked rotations leave position, orientation and timers untouched. Horizontal or vertical movement happens only for a valid wall/floor kick.

Regression coverage checks literal L coordinates for 0/90/180/270 degrees, both directions and return to spawn; consistent empty-board position; left/right walls, floor, ceiling and occupied cells; hold/spawn; and all seven pieces' geometry and round trips. Existing gameplay tests also pass.

## EVOLUTION ROOT CAUSE

This was a pipeline fault, not a missing button call:

1. The panel trusted cached `canEvolve`. Its age-only eligibility could stay stale until another store update. The progress percentage omitted level and the live special condition, so it could show completion while the store correctly refused evolution.
2. Registry hydration/persistence retained vitals and evolution but omitted minigame/battle evidence, essence and other progression state. A reload restored a stage while losing inputs needed for later eligibility and rewards.
3. Boot/save ownership lived only on `/pet`. Activities entered directly could use an unregistered runtime; navigation unmounted persistence. Saves used a restarting debounce and were not serialized, allowing continuous updates to postpone writes and overlapping writes to overwrite newer state or canonical metadata.
4. Pre-level evolution saves were hydrated without backfilling numeric fields, allowing undefined/invalid XP values to poison arithmetic.
5. There was no durable transition history.

Repair: derive panel eligibility from the same live context and function used by `tryEvolve`, refresh age each second, include every gate in progress, normalize legacy numeric fields without resetting an evolved stage, and append real transitions. Put boot/persistence in the consumer shell, leaving school/field isolation intact. Backfill available legacy progress, save a typed progression snapshot, throttle ordinary updates, immediately queue completed evolution actions, serialize writes, re-read canonical metadata, and flush on page hide/disposal. Do not save unhydrated defaults. Concurrent Strict Mode boots share one pending operation.

## EVOLUTION FLOW

Create/load/migrate registered pet → hydrate identical genome/traits and saved progression → care, play, battle or explore update immutable Zustand state → shared eligibility checks age since previous evolution, interaction count, vitals, level and stage condition → `tryEvolve` revalidates → existing branch and ability logic commits the next stage and effects → append transition history → subscribed body renderers/panel update → persistence queues the full action snapshot → IndexedDB registry saves it → navigation retains the runtime → reload hydrates the same stage, DNA, activity evidence, essence and history.

| Target | Time since last evolution | Interactions | Vitals average | Level | Existing special condition |
|---|---:|---:|---:|---:|---|
| NEURO | 1 hour | 12 | 55 | 5 | At least one minigame or battle win |
| QUANTUM | 24 hours | 40 | 65 | 10 | Three battle wins or five minigames |
| SPECIATION | 48 hours | 80 | 75 | 15 | Genome path: essence and/or battle/activity mastery; existing fallback preserved |

Age is stage age, not total creature age. DNA determines latent path, branch and rare abilities; evolution expresses that genome rather than rewriting it. Existing evolved saves remain evolved; missing historical transitions are not invented.

## TESTS AND VERIFICATION

| Check | Result |
|---|---|
| Baseline suite before edits | 175 files, 1,277 tests passed |
| Final `npm test -- --run` | 178 files, 1,304 tests passed |
| `npm run lint` | Passed school-doc sync check, TypeScript and ESLint |
| `npx tsc --noEmit` | Passed |
| `npm run build` | Passed production webpack build and route generation |
| Production browser route audit | 48 combinations loaded with HTTP 200 and no framework error overlay |
| Real mobile lifecycle | Feed crossed level threshold; Tetris and Sigil Sequence used actual controls; eligible → NEURO → navigate away/back → reload; IndexedDB stage, DNA, essence, activities and history verified |

Focused tests: `vimanaStack.test.ts` (48 tests); `EvolutionPanel.test.tsx` (6); new `progressPersistence.test.ts` (6 lifecycle/serialization/retry/legacy cases); new `OnboardingTutorial.test.tsx` (1); new `FullScreenOverlays.test.tsx` (2). Existing eligibility, branch, stage-adornment and registry tests remain passing. The persistence test progresses through NEURO, QUANTUM and SPECIATION using actual store actions and a fresh store/repository reload. It covers invalid/repeated attempts, metadata preservation, continuous updates, slow writes and failure retry.

Browser testing uses 390×844, 1280×900 and selected 320px routes. Age and preceding XP were shortened with a dev-only fixture; final feed XP, activity rewards, evolution, navigation and IndexedDB reload used real controls. Higher stages use automated store/repository tests, not a claimed multi-day manual browser run. A zero-clear Tetris run correctly grants no bonding activity; a real Sigil Sequence result does.

Production route list: `/`, `/app`, `/pet`, `/body-forge`, `/dna-hub` (redirect), `/digital-dna`, `/app/genome`, `/genome-explorer`, `/genome-resonance`, `/visualizer`, `/moss60`, `/app/moss60`, `/app/activities?tab=games`, `/arcade`, `/app/battle`, `/app/wellness`, `/identity`, `/school-game`, `/schools`, `/teachers`, `/teachers/passport`, `/schools/field`. All 22 checked at mobile and desktop, plus four principal consumer routes at 320px. This is major-route coverage, not a claim that every internal tool/export was exercised.

Evidence: `docs/release-evidence/metapet-repair/browser-audit.json`, `lifecycle.json` and mobile screenshots. Reproduce with `node scripts/metapet-repair-browser.mjs --routes-only` against a production server, or `--lifecycle-only` against a dev server; provide `METAPET_BROWSER_MODULE` for Playwright and optionally `METAPET_CHROMIUM`/`METAPET_BASE_URL`.

Remaining findings: Genome Explorer overflows horizontally at 390px. React hydration error #418 appeared twice in `/app/moss60` and once in `/teachers/passport`; pages recover and load. Relevant pre-existing components/hooks read local storage during initial rendering; investigate their server/client snapshots separately. These warnings are recorded, not suppressed. The UI audit is not a clean-console certification. Existing hunger semantics also deserve a separate review: feeding and decay both raise hunger while high hunger can cause sickness and the evolution average treats it positively. This repair does not rebalance those established rules.

## NAVIGATION AUDIT

### Critical

| Current behavior | Why confusing / consequence | Proposed improvement | Difficulty / risk | Mobile impact |
|---|---|---|---|---|
| Tutorial, game and ceremony fixed overlays render inside transformed pet/activity containers | Ancestors capture/clamp the overlay; page chrome overlaps important controls | **Fixed:** portal these existing overlays to the viewport; bounded scrolling tutorial; semantic dialog labels | Low, regression tests added | Actual tutorial, Rotate and Close controls are reachable |
| Evolution is behind Advanced/Mechanics Lab → Systems → Evolution | A central creature milestone reads as a hidden technical tool | Add a direct growth entry on the pet summary, pointing to the existing panel | Low–medium; retain tabs and route | Avoid several tiny tab choices |
| Genome Explorer overflows at 390px | Horizontal movement obscures context and controls | Identify intrinsic-width chart/text containers; contain only their intentional scrolling | Low–medium; no blanket clipping | Improves one-hand reading |
| Global Back relies on browser history when present | A direct/external arrival can leave MetaPet instead of returning to a parent area | Prefer known parent/context destination, with history only for confirmed internal journeys | Medium; test external entry and school exceptions | Predictable escape from tools |

### High Value / Low Risk — six UX quick wins

| Current behavior | Confusion | Improvement | Difficulty / risk | Mobile impact |
|---|---|---|---|---|
| No prominent growth entry on creature | Eligibility and next milestone are hard to find | Show existing next-stage summary with “View growth” | Low–medium | Faster route to evolution |
| “Evolved” names a presentation form; earned evolution has separate stages | User can mistake selecting a renderer for evolving | Explain “visual form” versus “evolution stage” beside existing labels | Low | Clear without extra navigation |
| Six bottom destinations plus Back; very small labels | DNA/body/play are less apparent than school/identity | Improve destination names and selected-state/context text first; validate truncation | Low | Better scanability at 320px without replacing nav |
| Body Forge chips/actions include 16–30px targets; DNA Load controls are 26px high | Interactive controls are difficult to tap | Increase padding/minimum target height while preserving layout | Low–medium | Fewer accidental taps |
| Tools do not consistently show registered pet identity | Users lose track of whose body/DNA they are exploring | Add a compact current-pet label and explicit return-to-pet link | Low–medium | Persistent context without large headers |
| Global journey strip and route progression cards repeat teacher/pilot steps | Creature tasks compete with a school/demo journey | Make copy contextual; avoid repeating completed guidance | Medium; preserve school behavior | Recovers screen space |

These are recommendations, except the overlay repair. No speculative navigation redesign was implemented.

### Structural Ideas / BIGGER IDEAS

- Explore already provides curated activity cards and the Vimana wheel. Build on that rather than replacing it. A future creature-centric destination model could clarify Pet/Growth, DNA, Body, Play and World; do not force six new tabs. Test fewer mobile primary destinations plus a clearly named hub.
- Group live-genome tools separately from exploratory instruments, encryption lessons and standalone experiments. Carry the current pet context through each group without mutating its DNA.
- Separate first-time companion onboarding from teacher deployment/pilot guidance. Preserve school/field focus and child-safe boundaries.
- Give each deep tool an explicit parent destination and consistent breadcrumb. Test route entry from a bookmark, shared URL and internal navigation.
- Decide separately whether guardian memory, wellness bond and body edits should contribute to canonical progress. That requires product semantics, save migration and privacy decisions, not invented evolution bonuses.

### Keep

- Canonical `/pet`, working aliases/redirects and all three visual forms.
- DNA identity, latent evolution paths, stage upgrades, wardrobe/mastery and MOSS60 exploration.
- Explore's readable cards as an alternative to the spatial wheel; direct `?tab=games` entry.
- School/field navigation isolation and teacher-specific flows.
- Existing visual style and curated minigames. The repair makes current systems usable and durable.

## CONNECTION AUDIT

| System | Status | Actual flow / limitation |
|---|---|---|
| Genome, derived/latent traits, branches, rare abilities | CONNECTED | Canonical genome → traits → path-specific eligibility and branch/abilities; persisted without DNA replacement |
| Evolution and creature body/renderers | CONNECTED | Stage changes feed existing upgrades/adornments across visual forms; browser verifies NEURO horns after reload |
| Core care, vitals, XP, interactions | CONNECTED | Store care actions update eligibility inputs and progression; now canonical persistence |
| Integrated minigames and battles | CONNECTED | Valid outcomes update XP, essence, counts, achievements and special conditions; persist across reload |
| Vimana environment/exploration | CONNECTED | Core exploration changes vitals, XP/rewards and stored world progress |
| Body Forge / BodySpec | PARTIALLY CONNECTED | Uses live traits/stage for visual body generation and customization; edits are presentation state, not new evolution eligibility |
| Auralia behavior, emotion, local memory/dreams/relationships | PARTIALLY CONNECTED | Guardian has real separately persisted state and stage visuals; most gestures/emotions are not core evolution evidence. Minigame wins bridge to core |
| Wellness bond/moments | PARTIALLY CONNECTED | Separate bond persistence exists; dashboard uses fixed `auralia-main`, not registered pet ID; no core evolution gate |
| Ritual progress | PARTIALLY CONNECTED | Core progress exists and is now saved; evolution context does not directly consume it |
| DNA music/imprint → MOSS60 | PARTIALLY CONNECTED | Real local imprint handoff and pet-derived projections; exploratory edits do not rewrite immutable registered genome or grant XP |
| Standalone games/instruments and experimental outputs | DISCONNECTED from core evolution | Independent features unless an explicit store bridge exists; retain them and do not award arbitrary progression |
| Separate guardian weather/memory/relationship events → evolution | DISCONNECTED as direct eligibility inputs | No direct gate in actual evolution context; recommendations require deliberate design |

“Disconnected” here means no demonstrated core evolution connection, not that the feature has no persistence or value. No arbitrary connections were introduced.

## FILES CHANGED

| File | Purpose |
|---|---|
| `src/lib/minigames/vimanaStack.ts` | Generate consistent rotations and align JLSTZ kicks |
| `src/lib/minigames/vimanaStack.test.ts` | L/all-piece geometry and collision regressions |
| `src/evolution/index.ts` | Legacy normalization, complete progress, transition history |
| `src/evolution/types.ts` | Optional typed evolution history |
| `src/store/index.ts` | Normalize saved evolution at hydration |
| `src/components/EvolutionPanel.tsx` | Live eligibility/time and visible level progress |
| `src/components/EvolutionPanel.test.tsx` | Stale eligibility and age-only regressions |
| `src/lib/registry/record.ts` | Typed optional canonical progression snapshot |
| `src/lib/registry/repository.ts` | Preserve available legacy progression during migration |
| `src/lib/registry/bootstrap.ts` | Hydrate progress and share concurrent boots |
| `src/lib/registry/progressPersistence.ts` | Ordered throttled saves and immediate stage flush |
| `src/lib/registry/progressPersistence.test.ts` | All-stage lifecycle, reload, race, retry and old-save tests |
| `src/components/PetRegistryBootstrap.tsx` | Consumer boot/save bridge and hide/dispose flush |
| `src/app/ClientBody.tsx` | Mount bridge across consumer routes |
| `src/app/pet/page.tsx` | Remove route-only duplicate bridge |
| `src/components/OnboardingTutorial.tsx` | Viewport portal and mobile scroll bounds |
| `src/components/OnboardingTutorial.test.tsx` | Portal ownership and dismissal persistence |
| `src/components/MiniGamesPanel.tsx` | Viewport game dialog above navigation |
| `src/components/EvolutionCeremony.tsx` | Viewport ceremony portal |
| `src/components/FullScreenOverlays.test.tsx` | Game/ceremony placement and escape controls |
| `scripts/metapet-repair-browser.mjs` | Repeatable browser lifecycle and route audit |
| `docs/reports/metapet-repair-ux-audit-2026-10-01.md` | This complete report |
| `docs/release-evidence/metapet-repair/browser-audit.json` | Route, mobile control, overflow and runtime-error evidence |
| `docs/release-evidence/metapet-repair/lifecycle.json` | Actual reload lifecycle result |
| `docs/release-evidence/metapet-repair/pet-mobile-before.png` | Initial tutorial/creature viewport after overlay repair |
| `docs/release-evidence/metapet-repair/tetris-mobile.png` | Actual mobile game |
| `docs/release-evidence/metapet-repair/evolution-mobile.png` | Actual NEURO state/ceremony |
| `docs/release-evidence/metapet-repair/body-forge-mobile.png` | Forge mobile audit |
| `docs/release-evidence/metapet-repair/digital-dna-mobile.png` | DNA mobile audit |
| `docs/release-evidence/metapet-repair/app-activities-tab-games-mobile.png` | Activities mobile audit |
| `docs/release-evidence/metapet-repair/schools-field-mobile.png` | Field mobile audit |
