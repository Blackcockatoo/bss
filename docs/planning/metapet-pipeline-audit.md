# MetaPet Pipeline Audit — DNA → Personality → Movement → Visual → Offspring

Date: 2026-07-19
Branch: `codex/metapet-phases-3-7-restore`
Baseline: `main` @ `b9b8844` (post PR #156)
Status: Phases 0–7 implemented; full release gates green

## Verdict

MetaPet has most of the individual maths and rendering pieces, but they do not
form one causal DNA → personality → movement → visual → offspring pipeline.

Most importantly: the new Sri Yantra geometry sprite must remain completely
untouched. All implementation belongs in adapters, controllers, registration,
and genome services around it.

| Area | Current reality | Required correction |
| --- | --- | --- |
| Live DNA | Store starts with `genome: null`; production never registers or hydrates one | Atomic pet genesis/registration followed by store hydration |
| Sri Yantra visual | Engine supports DNA variation, but `/pet` passes `undefined` and gets zero strands | Feed a versioned projection of the registered genome |
| DNA coverage | Engine samples only 10 positions per strand: 30 of 180 digits | External projection must fold all 180 digits into those 30 inputs |
| Animation | Seven working presets exist, but `/pet` never supplies movement, so it remains idle | Personality-driven Geometry behavior controller |
| Personality | Eight traits are decoded, but most are not used; sums cause many genome collisions | Seven-axis Hepta profile plus position-aware characteristic derivation |
| Registration | `/pet` uses hardcoded `"Meta-Pet"` / `"visual-dna-main"` and null crest/Hepta values | Certificate must read one canonical registered PetRecord |
| Hepta | Identity code, element triple, and intended personality axes are conflated | Separate HeptaCode, HeptaProfile, and element maths |
| Breeding | Alternating digits, weak mutation accounting, no actual offspring registration or UI | Chamber crossover → child genome → child projection → registered offspring |

## Verified evidence (current `main`)

Every claim below was re-verified against the working tree at `b9b8844`:

- **Store never hydrates a genome.** `src/store/index.ts:321` initializes
  `genome: null`; `setGenome` (`src/store/index.ts:383`) has no production
  caller — only tests invoke it.
- **`/pet` renders zero strands.** `src/components/PetRuntimeStage.tsx:80-85`
  passes `genome?.red60.join('')` (i.e. `undefined` when null) into
  `SriYantraPetDisplay`, and the engine's `digitAt` fallback
  (`src/components/SriYantraPetEngine.tsx:362-368`) substitutes an all-zero
  strand.
- **Only 30 of 180 digits matter.** The engine samples
  `red[index * 3]`, `blue[index * 5]`, `black[index * 7]` for ten regions
  (`src/components/SriYantraPetEngine.tsx:381-383`).
- **Universal movement tick.** `BRAIN_TICK_MS = 2400` in
  `src/pet/movement/useMovementController.ts:99` — the same cadence for every
  pet; `/pet` supplies no movement to the geometry renderer at all.
- **Hardcoded identity.** `src/app/pet/page.tsx:163-164`:
  `const petName = "Meta-Pet"; const petId = "visual-dna-main";`
- **HeptaCode ECC cannot locate errors.** `src/lib/identity/hepta/ecc.ts`
  uses 6 data symbols + 1 weighted parity per block; `correctBlock`
  (`ecc.ts:93-122`) flip-searches from position 0, whose weight is 1 —
  any single-symbol parity mismatch is "corrected" by rewriting the first
  digit, generally producing the wrong codeword.
- **Breeding maths.** `src/lib/breeding/index.ts`: alternating-digit
  crossover (`i % 2`, line 72); mutation count computed as
  `Math.floor(60 * mutationRate)` while positions span three 60-digit strands
  (180 loci, lines 133-137) with repeatable positions; prediction confidence
  is inverted — `100 - (similarity / 2)` at line 338 makes similar parents
  *less* confident despite the comment saying the opposite.
- **Baseline tests pass but miss the integration failure.** 113 test files /
  892 tests green. Geometry tests inject a genome instead of testing real
  hydration; the Hepta correction test corrupts only position zero — the one
  case the faulty algorithm happens to correct; breeding tests encode the
  backwards confidence calculation as expected behavior.

## Older-branch conclusion

The relevant historical work is already represented in `main`:

- PR #140: all 180 digits projected into Body Forge's 30 visual genes.
- PR #154: deterministic movement scheduler and movement parade.
- PR #155: consolidated Auralia, Evolved, and Geometry runtime.
- PR #156: touch and wardrobe integration.

Older Body Forge, movement, and runtime branches are substantially behind
`main`. No older branch contains a meaningfully complete breeding or
registration implementation. The current geometry engine came from the latest
`37f2bed` / `cc63f26` work and should be treated as a locked asset.

The answer is not to resurrect an old branch or cherry-pick whole files:
recover the contracts and ideas, then implement the missing connective layer
on current `main`.

The implementation branch starts from the completed Phase 0–2 line and also
restores the newest unmerged Body Forge / Digital DNA work (`031a3c7` through
`76f30bf`, plus `8a68d49`) before applying Phases 3–7. No geometry-engine file
was taken from an older branch or modified during that restoration.

## Implementation plan

### Phase 0 — Lock the new geometry sprite

> **Status: implemented** — see `docs/protocol/geometry-sprite-lock.md`,
> `scripts/check-geometry-sprite-lock.mjs`, and
> `src/components/SriYantraPetEngine.golden.test.tsx`.

Protect `SriYantraPetEngine.tsx` with:

- An approved source checksum in CI.
- Golden render snapshots for several fixed DNA packets.
- A rule that geometry paths, constants, movement profiles, SVG structure,
  and assets are outside this project's edit surface.
- One integration wrapper — `GeometryAvatarRenderer` or a new
  `RegisteredGeometryPet` — as the only production caller.

The `/pet` route stops invoking `SriYantraPetDisplay` directly.

### Phase 1 — Establish one canonical pet and genome record

> **Status: implemented** — see `src/lib/registry/` (record, genesis,
> registration, repository, bootstrap) and `PetRegistryBootstrap` on `/pet`.
> `heptaProfile` stays null until the Phase 2 ruleset lands; ongoing
> vitals/evolution write-back into the record arrives with the later phases.

Create `PetRecordV2` as the single source of truth:

```
schemaVersion, rulesetVersion, petId, name, createdAt, generation,
parentIds, genome + genomeHash + radix, traits, heptaProfile, heptaCode,
crest/registrationSignature, projectionVersion, geometryFingerprint,
evolution, vitals, lineage, mutationLog
```

Math bases become explicit:

- Canonical MOSS/species strands: decimal 0–9.
- Individual Genome V2: decimal 0–9, three 60-digit strands.
- Hepta identity code and ECC: base 7.
- Legacy base-7 genomes remain readable and are migrated without rerolling
  their identity.

Registration becomes one atomic transaction:

1. Produce or migrate the genome.
2. Hash it.
3. Derive birth traits and Hepta profile.
4. Derive the geometry projection/fingerprint.
5. Mint the pet ID, crest, and Hepta code.
6. Save the complete record.
7. Hydrate the runtime store from that record.

Consolidate the competing persistence modules behind one `PetRepository`.
Existing IndexedDB records get idempotent migrations; no existing genome is
silently regenerated.

### Phase 2 — Implement proper Hepta and characteristic maths

> **Status: implemented** — `src/lib/heptaProfile/` (seven-axis profile with
> published vectors in `docs/protocol/vectors/hepta-profile-v2.json`) and
> `src/lib/identity/hepta/eccV2.ts` (GF(7) single-symbol-correcting code,
> all 252 corruption cases tested; V1 kept read-only). Registration mints
> hepta-ecc/v2 codes and derives the profile; pre-ruleset records backfill
> idempotently. The vitals/bond expression overlay lands with Phase 4.

Two deliberately separate concepts:

- **HeptaCode**: the portable 42-digit identity/error-correction code.
- **HeptaProfile**: seven inherited characteristic axes —
  `void · spark · sense · voice · frame · flux · crown`.

Derivation contract:

- Split each 60-digit strand into positional lanes using `index mod 7`.
- Retain the intended digit families: 0, 1/9, 2/8, 3, 4/6, 5, 7.
- Include Red, Blue, Black, Union, and Shadow:
  - `Union = (R + B) mod 10`
  - `Shadow = (R - B + 10) mod 10`
- Build a versioned 7×7 Hepta matrix instead of collapsing blocks to simple
  sums.
- Derive normalized 0–100 axes, dominant/secondary axes, temperament, and
  behavior weights.
- Publish fixed test vectors so the result is reproducible outside the UI.

Separate inherited character from current state:

- Birth character = genome + Hepta profile.
- Current expression = birth character + vitals + bond + evolution + memory.
- Hunger can suppress a dance, but it must not permanently rewrite a playful
  genome.

**HeptaCode repair.** The current ECC (six data symbols, one weighted parity)
cannot locate arbitrary errors. Implement HeptaCode V2 as:

- Six blocks; five data symbols plus two parity symbols per block.
- A systematic single-symbol-correcting code over GF(7).
- Exactly 30 data + 12 parity = 42 digits.
- Exhaustive tests for all 252 single-symbol corruption cases.
- Read-only V1 decoding for old codes.

The short Hepta MAC is tamper/typing protection; the full registration record
carries the real cryptographic signature.

### Phase 3 — Make all 180 digits visibly drive Sri Yantra

> **Status: implemented** — `src/lib/geometry/projection.ts` keeps legacy v1
> stable and adds the versioned `sri-yantra-chambers/v2` fold. Property tests
> prove every one of 180 loci changes an input sampled by the locked engine.

The protected engine reads Red at `3 × region`, Blue at `5 × region`, Black at
`7 × region` for ten regions — only 30 raw positions currently matter.

Add `deriveSriYantraProjectionV1(genome)` outside the sprite:

- Preserve each strand's twelve five-digit MOSS chambers.
- Map the twelve chambers into the engine's ten named geometry regions.
- Fold every digit using a fixed position-weighted decimal formula.
- Write the resulting ten values into exactly the locations the engine
  samples.
- Store `projectionVersion` with the pet, so future maths never changes an
  existing pet's appearance.
- Guarantee by test that mutating any one of the 180 source digits changes
  the projected packet.

The renderer receives the projected Red/Blue/Black strings and remains
completely unaware of registration, breeding, or Hepta internals.

### Phase 4 — Make personality obvious through timed behavior

> **Status: implemented** — `src/pet/behavior/` derives cadence, greeting,
> attention, touch response, novelty, reaction, recovery, and movement weights
> from the complete Hepta profile plus all numeric personality traits. The
> Geometry wrapper runs the deterministic recursive scheduler and displays its
> current temperament and intent.

Create a renderer-neutral `BehaviorSpec` derived from the full Hepta profile
and personality traits: activity cadence, greeting likelihood, movement
preferences, repeat avoidance, attention span, touch response, novelty bias,
reaction strength, recovery speed.

Replace the universal 2.4-second interval with a deterministic recursive
timeout:

- `cadence = spark + flux + energy + social weights`
- next delay = 2.5–12 seconds with pet-seeded ±15% jitter.

Behavior-to-existing-movement mapping:

- Void → idle, lotus, slower gaze.
- Spark → dance, dab, energetic reactions.
- Sense → walk, scanning and pointer attention.
- Voice/social → wave and greeting.
- Frame → steadier routines and lower random variation.
- Flux → shuffle and greater move variety.
- Crown → confident entrance and stronger reactions.

Care actions retain priority. Sickness, extreme hunger, reduced-motion
settings, and sleep override ambient personality.

Personality becomes tangible within roughly 20–30 seconds through movement
cadence, preferred actions, reactions, and a short visible "current intent"
line. No new sprite animation needs to be authored.

### Phase 5 — Repair registration and certificate UI

> **Status: implemented** — the certificate/profile read the canonical
> `PetRecordV2`; mutable vitals/evolution write back to that record. MP2 export
> and import verify genome, traits, Hepta profile, geometry, lineage, mutations,
> and a portable ECDSA P-256 registration proof before an inactive import.

The registration certificate reads the actual PetRecord:

- Real pet name and ID.
- Genome fingerprint.
- Creation date and generation.
- Hepta profile and HeptaCode.
- Crest/signature verification state.
- Parent IDs and lineage for offspring.
- Ruleset and projection versions.

Owner email/profile remains separate from pet identity.

For portability, add a versioned MP2 pet packet and MPB1 breeding packet.
Importing a packet verifies hashes/signatures before creating or updating
local state.

### Phase 6 — Ship geometry-first breeding

> **Status: implemented** — `src/lib/breeding/registered.ts` and the Mechanics
> Lab `BreedingChamber` provide canonical MPB1 packets, whole-pentad crossover,
> unique 180-locus mutation, full chamber provenance, exact child preview, and
> registration of that same genome without replacing the active pet.

The child's genome — not SVG paths — becomes the source of truth:

1. Select two registered parent records.
2. Canonicalize parent order.
3. Create a conception packet from parent IDs/hashes, ruleset, and a fresh
   conception nonce.
4. Cross over at five-digit MOSS chamber boundaries.
5. Guarantee meaningful contribution from both parents.
6. Apply mutation over all 180 positions, using unique loci.
7. Record every mutation as strand/index/before/after/reason.
8. Derive the child's traits, Hepta profile, and geometry projection.
9. Show that exact child in preview.
10. Register the same genome as the offspring — no second random roll.

The conception nonce allows siblings to differ while making the same packet
perfectly replayable.

The breeding result includes: child genome; parent provenance mask for every
chamber; mutation log; generation number; parent hashes and IDs; child
geometry fingerprint; child Hepta profile and personality summary.

Because the geometry projection is chamber-aware, the offspring will visibly
carry recognizable regions from both parents while still being a
mathematically real new pet.

Fix the current breeding errors in `src/lib/breeding/index.ts`:

- Mutation percentage must use 180 positions, not 60.
- Repeated mutation positions must be prevented.
- Similar parents should produce higher prediction confidence.
- A conception nonce must permit different siblings.
- Parent contribution must be reported per chamber/locus, not just per
  strand.
- Breeding must create a child record, not merely award XP.

### Phase 7 — Add Crownwheel and rare outcomes afterward

> **Status: implemented** — Crownwheel body/tail compatibility uses the full
> K₃,₃ − I edge table. Invalid pairs deterministically resolve to labeled tail,
> body, wild, or rare three-strand mythic-prime mutations.

Once geometry breeding is stable, layer in the richer Crownwheel
compatibility:

- Body chambers: RB / BC / CW. Tail chambers: A / B / C.
- Compatibility through the intended K₃,₃ − I relationship.
- Invalid matches resolve through versioned outcomes: tail mutation, body
  shift, wild/unstable offspring, rare mythic-prime result.

This modifies crossover and mutation rules; it does not replace the base
breeding engine.

## Release gates

The work is complete only when:

- [x] Fresh install creates or migrates one real registered pet.
- [x] Reload restores the identical genome, personality, and geometry.
- [x] Geometry never receives zero/default strands in normal production.
- [x] Every one of 180 loci has tested influence on the geometry projection.
- [x] Two contrasting genomes are unmistakably different visually.
- [x] Two contrasting Hepta personalities behave noticeably differently.
- [x] Geometry movement occurs at pet-specific deterministic intervals.
- [x] Same breeding packet produces the same child.
- [x] New conception nonce produces a different sibling.
- [x] Non-mutated child loci always come from a declared parent.
- [x] Preview and registered offspring are identical.
- [x] All existing tests plus the new integration/property tests pass.
- [x] The protected Sri Yantra sprite checksum remains unchanged.
