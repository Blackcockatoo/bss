# Moss60 Observatory — experimental v1

The observatory adds `/app/moss60-lab` to the consumer app. It makes the DNA and Moss60 simulation work inspectable without migrating existing pets or changing their behaviour. The implementation started from main commit `4ccc448d201ff45c4c3f8dd7e4e498c80649cc3b` on 15 September 2026.

All changes are additions. Existing source files, navigation, canonical strands, registered breeding, pet schemas, identity rules, service workers, deployment configuration, dependencies and the lockfile are preserved. The existing school-host, schools-profile and Field Mode policies keep the laboratory outside the classroom surface. The new page also returns `notFound()` in a schools build.

## Try it

Run the app with its existing `npm run dev` command and open `/app/moss60-lab` on a consumer/local host.

1. Start with the canonical Red, Blue and Black strands, or open your companion first and use **Copy active pet DNA**. The copy checks all three stored content hashes. It does not mint, refresh, activate or save a pet record.
2. Choose an environment and run 600 fixed steps (10 simulated seconds). Expression, amplitude and phase change; the inherited digits and their fingerprint remain constant.
3. Inspect any source locus in a ring, icosahedron or dodecahedron. The polyhedral views use 60 face-corner incidences: 20 × 3 or 12 × 5. These are display slots, not claims that the solids have 60 vertices.
4. Explore window widths 1–60, both directions, canonical prime/palindrome labels and seven-digit colours. The separate Lukus atlas preserves `213471897639` exactly.
5. Change the environment, run again, then replay from the beginning. Export and import reproduce the event history from the DNA and seed. Reset applies an edited seed and clears the simulated experience.

The lab intentionally has no entry in existing navigation. Its own return link goes to the existing MOSS60 Studio. A direct fresh visit uses canonical DNA; copying a pet becomes available after the existing app has loaded an active record.

## Rules and compatibility

| Layer | Experimental rule | Existing data |
| --- | --- | --- |
| DNA | Exactly three 60-digit strands; explicit radix 7 or 10; detached frozen arrays | No changes |
| Random stream | `moss60-rng/experimental-v2`; SHA-256 seed derivation; two bounded 64-bit words; 53-bit outputs | Original seed streams preserved |
| Clock | 60 fixed ticks/second, with an accumulator for fractional time; invalid advances are atomic | Original resonance engine preserved |
| Resonance | Three degree-four rings coupled at corresponding loci; synchronous diffusion coefficient 0.4 per edge; input and damping applied per 1/60-second step | Visual shape does not change topology |
| Expression | 180 values, initially 0.5; target = 0.5 × normalized digit + 0.5 × environmental input; smoothing 0.02 per tick | No inherited digit changes |
| Gates | At `(locus + tick) mod 60`, a clockwise seven-digit prime or three/five-digit palindrome admits full exposure; otherwise exposure × 0.25 | Inspector width/direction are display controls |
| Traits | Mean digit / (radix − 1); percentage personality, size 0.5–2 and potential 60–100 | Existing decoder shown alongside the preview |
| Residues | Decimal seven-digit circular readings modulo 60; 180 counts in 60 bins | Existing element summaries and identity hashes preserved |
| Replay | `moss60-observatory/experimental-v1`; DNA, radix, seed, fingerprint, environment events, fractional time | Not a signed registered-pet packet |

Environments supply Red/Blue/Black exposures: balanced `[0.4, 0.4, 0.4]`, spark `[0.9, 0.2, 0.1]`, shadow `[0.1, 0.2, 0.9]`. These are specified game rules, not biological or physical models. The RNG is not offered as a cryptographic generator. Experimental traits are previews, not a new balance policy for current pets.

An experiment is limited to 36,000 ticks, 1,000 environment segments and a 256,000-byte import. Adjacent identical environments coalesce. Import validates the entire event list before replay, checks the full DNA fingerprint, derives dynamic state afresh and replaces the current lab state only after success. The fingerprint detects inconsistent input; it does not authenticate authorship. Earlier standalone report files used a different snapshot format and are not accepted as replay logs.

## Atlas provenance

`src/lib/moss60/lab/canonical-atlas.json` contains 21,888 flags: all widths, both directions and all starts for three 60-digit strands and the 12-digit Lukus string. Index = `(width − 1) × 2 × length + directionOffset + start`, where the counter-clockwise offset is `length`. Each decimal character encodes a small bit field: low two bits 0 = not prime, 1 = prime, 2 = probable prime; bit 2 = palindrome.

Numbers below 2⁶⁴ use exact trial division or the deterministic Miller–Rabin bases `2, 325, 9375, 28178, 450775, 9780504, 1795265022`. Larger numbers use 32 SHA-256-derived witnesses and are labelled **probable prime**. Leading zeroes remain in the window string. One is a separate Moss symbolic gate, never a mathematical prime. Custom genomes are classified only through seven-digit windows; longer custom readings say **not classified**.

The static atlas came from the prior exhaustive source audit. `scripts/moss60-lab/verify-atlas.py` independently recomputes every flag from the current canonical strand source using only Python's standard library. A canonical change makes verification fail so the atlas and experiment version can be reviewed deliberately. The Vitest suite also checks all 21,888 direction reversals, all seven-digit prime labels, RED's six-beat mirror address and its two full-length probable-prime addresses.

`geometry.json` contains unit-regular icosahedron and dual-dodecahedron face corners inset 65% from each face centre, plus a unit ring. Inset corners are distinct per face so all 60 locus labels have individual positions; visual adjacency stays inside each displayed face. Simulation edges are specified separately in `engine.ts`.

## Reproduce the checks

Use the repository's locked dependencies (`npm ci`). CI continues to use Node 22 and the existing workflow.

```sh
npx vitest run src/lib/moss60/lab src/components/moss60-lab src/app/app/moss60-lab
python3 scripts/moss60-lab/verify-atlas.py
npm run lint
npm test -- --run
npm run check:geometry-sprite-lock
npm run check:child-safe-deployment
npm run build
```

The optional `scripts/moss60-lab/verify-browser.cjs` runner exercises the built app at 1280 px and 360 px. Supply Playwright through `MOSS60_PLAYWRIGHT_MODULE` (module path) and, if needed, Chromium through `MOSS60_CHROMIUM_PATH`. `MOSS60_TEST_ORIGIN` defaults to `http://127.0.0.1:3086`; `MOSS60_BROWSER_OUTPUT` selects the screenshot, export and JSON-results directory. The browser runner uses a fresh context per viewport and checks complete experiment flows, the real production school-host redirect, and byte-for-byte preservation of a registered pet in IndexedDB after copying, simulation and replay. It adds no dependency to the app.

The focused tests include an independently calculated RNG vector, one million random draws, 36,000 simulation ticks (6.48 million node updates), 30/60/120-FPS equivalence, mixed-environment replay, unchanged parent records, rejected oversized/stale/malformed imports, all atlas addresses and the school route boundary. UI tests exercise run, environment changes, reset, replay, active-pet copying and failed-import recovery. These checks do not establish physical-phone frame rates or game balance.

The earlier stress audit covered the existing engines separately: 40,000 trait decodes, 110,000 primary breeding trials and a million-tick isolated oscillator prototype. Those results motivated these versioned additions; they are not performance claims for this new 180-node integrated UI.

Local validation completed 16 September 2026: all 1,277 original tests passed before changes; the expanded suite passed all 1,296 tests in 178 files. The final 19 focused checks passed after the browser-label fix. Lint, TypeScript, production build and geometry sprite lock passed. Chromium passed both viewport flows with zero script errors or horizontal overflow, preserved the actual saved registered record, and confirmed the school-host redirect. The deployment-config command skipped its student assertion because this checkout used the consumer profile; school-profile and Field Mode restrictions are separately covered by route tests. No production deployment was performed.

## Deliberate next steps

Connecting these rules to the main companion's movement, sound, memory, registered breeding or saved expression requires a separate, explicit versioned integration. This PR supplies a runnable consumer laboratory and replay contract while preserving the current product.
