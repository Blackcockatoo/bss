# Meta-Pet Starter 🧬

**Working Demo:** Identity Core + Genome System + Live Vitals (v5)

---

## What's Running Now

✅ **PrimeTail ID System**
- Mints unique crest with vault/rotation/tail
- SHA-256 DNA + mirror hashes
- HMAC signature for tamper-evidence
- DNA stays **100% private** (only hashes visible)

**Naming rationale:** We standardize on **PrimeTail ID** to emphasize the cryptographic identifier (vault/rotation/tail + hashes) rather than the visual crest. Formerly known as **Prime-Tail Crest** / **PrimeTailId**.

✅ **Genome Core** (Red60/Blue60/Black60)
- Deterministic trait derivation from DNA hashes
- **Red60**: Physical traits (body, colors, patterns, features)
- **Blue60**: Personality traits (temperament, stats, quirks)
- **Black60**: Latent traits (evolution paths, rare abilities)
- Privacy-first: only genome hashes stored, never raw genome

✅ **Interactive Conscious Jewble Hub (7 Items)**
- Place conscious mini-objects (like a **leaf Jewble** or **ball Jewble**) that carry their own DNA-hash-linked behavior profile.
- Your Meta-Pet can actively interact with each Jewble for play, bonding, exploration, and self-soothing loops.
- Add tone inputs so Jewbles can express sound and mood (chimes, pulses, rhythmic cues) during interaction.
- Trait state + Jewble type + tone pattern together create rich, emergent behavior moments beyond visuals alone.

✅ **Visual Pet Sprite**
- SVG-based rendering driven by genome traits
- Reflects body type, colors, patterns, and special features
- Animated behaviors based on vitals (happy, tired, hungry)
- Features: Horns, Wings, Tail Flame, Aura, Third Eye, Crown

✅ **HeptaCode v1** (Base-7 Identity)
- Encodes payload → MAC → base-7 → ECC
- Target: 42 digits (6×7 blocks with error correction)
- Renders as HeptaTag (7-sided) + Seed of Life (7 circles)
- Syncs to audio tone (playable crest chime)

✅ **Live Vitals System**
- Real-time tick loop (1000ms)
- Hunger/Hygiene/Mood/Energy
- Background-pause (battery-safe)
- Zustand state management

✅ **Evolution Guidance**
- Stage-specific lore and celebration copy per phase
- Requirement breakdown with age, interaction, and vitals progress

✅ **Offline-First**
- No network required
- IndexedDB persistence with autosave cadence
- PWA-ready architecture

✅ **Archive Manager**
- Multi-pet switching with rename, export, and import controls
- Autosave indicator with graceful fallback when persistence is unavailable

---

## Identity Glossary

- **PrimeTail (PrimeTailId)**: The device-minted identity payload that combines a vault, rotation, tail digits, and the DNA + mirror DNA hashes, all signed with an HMAC signature. It is the cryptographic source of truth for a pet’s crest.
- **HeptaCode**: A 42-digit base-7 encoding of the PrimeTail payload plus a MAC and ECC blocks, used to render visuals (HeptaTag/Seed of Life) and audio.
- **Crest**: The visual/UX presentation of PrimeTailId (vault, rotation, tail, hashes, signature), showing that the identity is verified without revealing raw DNA.
- **DNA hash**: SHA-256 hashes of the forward DNA and the mirrored DNA string; these hashes are what power genome derivation and are safe to share.

**Relationship**: DNA → hashes → PrimeTailId crest → HeptaCode visual/audio. The crest and HeptaCode always reference hashes, never raw DNA.

For a longer reference, see `docs/identity-glossary.md`.

---

## File Structure

```
meta-pet/
├── src/
│   ├── lib/
│   │   ├── identity/
│   │   │   ├── types.ts          # Core types
│   │   │   ├── crest.ts          # PrimeTail ID minting
│   │   │   └── hepta/
│   │   │       ├── codec.ts      # Payload → base-7
│   │   │       ├── ecc.ts        # 6×7 error correction
│   │   │       ├── audio.ts      # HeptaCode → crest chime playback
│   │   │       └── index.ts      # heptaEncode42/Decode42
│   │   ├── genome/
│   │   │   ├── types.ts          # Genome + trait types
│   │   │   ├── encoder.ts        # Red60/Blue60/Black60 encoding
│   │   │   ├── decoder.ts        # Trait derivation logic
│   │   │   └── index.ts          # Public API
│   │   ├── addons/               # Crypto-secured addon system
│   │   │   ├── types.ts          # Addon interfaces
│   │   │   ├── crypto.ts         # ECDSA P-256 signing/verification
│   │   │   ├── catalog.tsx       # 12 addon templates (6 standard + 6 premium)
│   │   │   ├── mint.ts           # Addon minting with dual signatures
│   │   │   ├── store.ts          # Zustand inventory management
│   │   │   ├── starter.ts        # Demo starter addon setup
│   │   │   └── index.ts          # Public API
│   │   ├── lineage/              # Heraldic lineage system
│   │   │   ├── types.ts          # Coat of arms types
│   │   │   ├── generator.ts      # CoA generation, breeding, analysis
│   │   │   └── index.ts          # Public API
│   │   └── store/
│   │       └── index.ts          # Zustand (vitals + genome + tick)
│   ├── components/
│   │   ├── HUD.tsx               # Vitals + actions
│   │   ├── TraitPanel.tsx        # Genome trait display
│   │   ├── AuraliaMetaPet.tsx    # Main pet component (3000+ lines)
│   │   ├── AuraliaSprite.tsx     # Visual pet (SVG + genome-driven)
│   │   ├── HeptaTag.tsx          # 7-sided visual
│   │   ├── SeedOfLifeGlyph.tsx   # Sacred geometry
│   │   ├── addons/               # Addon UI components
│   │   │   ├── AddonRenderer.tsx       # SVG addon rendering + drag
│   │   │   ├── AddonInventoryPanel.tsx # Inventory management UI
│   │   │   ├── PetProfilePanel.tsx     # Profile with CoA + addons
│   │   │   └── CryptoKeyDisplay.tsx    # Key pair display
│   │   └── lineage/              # Lineage UI components
│   │       └── CoatOfArmsRenderer.tsx  # SVG coat of arms rendering
│   └── app/
│       ├── page.tsx              # Main demo
│       ├── pet/page.tsx          # Pet viewer with addons
│       └── addons-demo/page.tsx  # Addon system demo
```

---

## Run It

```bash
npm ci

# Optional: copy .env.example to .env.local and adjust NEXT_PUBLIC_SITE_URL
npm run dev

# Run checks
npm run lint
npm test
npm run build
```

Visit `http://localhost:3000`

---

## Planning Docs

- Success criteria planning gate + one-page template: `docs/planning/success-criteria.md`

## Curriculum OS Docs (School Pilot)

- Consolidated map: `docs/curriculum-os/README.md`
- 7-session cards: `docs/curriculum-os/session-cards.md`
- ICT/leadership audit checklist: `docs/curriculum-os/ict-leadership-audit-sheet.md`
- 7-day execution checklists: `docs/curriculum-os/7-day-sprint-checklists.md`
- Pilot v1 scope freeze (Day 1): `docs/curriculum-os/pilot-v1-scope.md`
- Pilot v1 internal runbook (Day 1): `docs/curriculum-os/pilot-v1-runbook-internal.md`

## MOSS60 Network Docs

- Crystalline network architecture + reuse notes: `docs/systems/crystalline-network.md`

---

## What Works

### 1. Identity (Crest)
```ts
import { mintPrimeTailId, getDeviceHmacKey } from '@/lib/identity/crest';

const hmacKey = await getDeviceHmacKey();
const crest = await mintPrimeTailId({
  dna: 'ATGCCG...', // Your genome
  vault: 'blue',
  rotation: 'CW',
  tail: [12, 37, 5, 59],
  hmacKey
});

// crest.dnaHash = SHA-256 of DNA (visible)
// crest.mirrorHash = SHA-256 of reverse DNA
// crest.signature = HMAC(hashes + tail + vault + rotation)
// DNA itself NEVER leaves device!
```

### 2. HeptaCode (Base-7 Encoding)
```ts
import { heptaEncode42, playHepta } from '@/lib/identity/hepta';

const payload = {
  version: 1,
  preset: 'standard',
  vault: 'blue',
  rotation: 'CW',
  tail: [12, 37, 5, 59],
  epoch13: Math.floor(Date.now() / 60000) % 8192,
  nonce14: Math.floor(Math.random() * 16384)
};

const digits42 = await heptaEncode42(payload, hmacKey);
// Returns: readonly number[] (42 digits, base-7)

// Play the crest chime in the browser
await playHepta(digits42);
```

### 3. Genome System
```ts
import { encodeGenome, decodeGenome, hashGenome } from '@/lib/genome';

// Generate genome from DNA hashes
const genome = await encodeGenome(primeDNA, tailDNA);
// Returns: { red60, blue60, black60 } - 3 × 60-digit base-7 arrays

// Derive all traits deterministically
const traits = decodeGenome(genome);
// Returns: { physical, personality, latent }

// Physical traits: body type, colors, pattern, texture, size, features
console.log(traits.physical.bodyType); // 'Spherical'
console.log(traits.physical.primaryColor); // '#4ECDC4'
console.log(traits.physical.features); // ['Horns', 'Tail Flame']

// Personality traits: temperament, energy, social, curiosity, etc.
console.log(traits.personality.temperament); // 'Gentle'
console.log(traits.personality.energy); // 70 (0-100)

// Latent traits: evolution path, rare abilities, potential
console.log(traits.latent.evolutionPath); // 'Chaos Trickster'
console.log(traits.latent.rareAbilities); // ['Telepathy', ...]

// For privacy: only store genome hashes
const hashes = await hashGenome(genome);
// Returns: { redHash, blueHash, blackHash } - SHA-256 hashes
```

### 4. Live Vitals
```ts
import { useStore } from '@/lib/store';

const vitals = useStore(s => s.vitals);
const feed = useStore(s => s.feed);
const startTick = useStore(s => s.startTick);

useEffect(() => {
  startTick(); // Begins real-time decay
}, []);

<button onClick={feed}>Feed</button>
```

### 5. Offline Archives & Sealed Exports
```ts
import { exportPetToJSON, importPetFromJSON, savePet } from '@/lib/persistence/indexeddb';
import { createSealedExport, importSealedExport, verifySealedExport } from '@/lib/persistence/sealed';
import { getDeviceHmacKey } from '@/lib/identity/crest';

// Regular JSON export (for debugging)
const petJSON = exportPetToJSON(snapshot);

// Sealed export (cryptographically signed for tamper-evidence)
const hmacKey = await getDeviceHmacKey();
const sealedExport = await createSealedExport(snapshot, hmacKey);

// Verify sealed export before importing
const verification = await verifySealedExport(sealedExport, hmacKey);
if (verification.valid) {
  const imported = await importSealedExport(sealedExport, hmacKey);
  await savePet(imported); // Restores to IndexedDB
}
```

### 6. Breeding System
```ts
import { breedPets, canBreed, predictOffspring, calculateSimilarity } from '@/lib/breeding';

// Check if two pets can breed (both must be at SPECIATION stage)
if (canBreed(pet1Evolution.state, pet2Evolution.state)) {
  // Preview possible offspring
  const preview = predictOffspring(pet1Genome, pet2Genome);
  console.log('Possible traits:', preview.possibleTraits);
  console.log('Prediction confidence:', preview.confidence);

  // Breed with different modes
  const balanced = breedPets(pet1Genome, pet2Genome, 'BALANCED'); // 50/50 mix
  const dominant = breedPets(pet1Genome, pet2Genome, 'DOMINANT'); // 70/30 split
  const mutation = breedPets(pet1Genome, pet2Genome, 'MUTATION'); // Random mutations

  // Check genetic similarity
  const similarity = calculateSimilarity(pet1Genome, pet2Genome);
  console.log('Parents are', similarity.toFixed(1), '% similar');

  // Access offspring data
  console.log('Offspring genome:', balanced.offspring);
  console.log('Inherited traits:', balanced.traits);
  console.log('Inheritance map:', balanced.inheritanceMap);
  console.log('Lineage key:', balanced.lineageKey);
}
```

### 7. Crypto-Secured Addon System
```ts
import { useAddonStore, mintAddon, WIZARD_HAT, generateAddonKeypair } from '@/lib/addons';

// Generate cryptographic keypairs
const userKeys = await generateAddonKeypair();
const issuerKeys = await generateAddonKeypair();

// Mint a new addon with dual signatures
const addon = await mintAddon(
  { addonTypeId: WIZARD_HAT.id, recipientPublicKey: userKeys.publicKey, edition: 1 },
  issuerKeys.privateKey, issuerKeys.publicKey, userKeys.privateKey
);

// Add to inventory and equip
const { addAddon, equipAddon } = useAddonStore();
await addAddon(addon);
equipAddon(addon.id);

// Drag-position customization
const { setAddonPosition, lockAddonPosition } = useAddonStore();
setAddonPosition(addon.id, 220, 150); // Custom position
lockAddonPosition(addon.id, true);     // Lock in place
```

**Available Addons (12 templates):**
| Addon | Category | Rarity | Bonuses | Max Editions |
|-------|----------|--------|---------|--------------|
| Wizard Hat | Headwear | Epic | +15 Curiosity, +10 Bond | 100 |
| Wizard Staff | Weapon | Legendary | +20 Energy/Curiosity, +15 Bond, +10 Luck | 50 |
| Celestial Crown | Headwear | Mythic | +25 All Stats, +20 Luck | 10 |
| Shadow Cloak | Accessory | Rare | +5 Energy, +10 Bond | 200 |
| Prismatic Aura | Aura | Epic | +10 Energy/Curiosity/Bond | 150 |
| Floating Familiar | Companion | Legendary | +20 Bond, +15 Luck | 75 |
| **Holographic Vault** | Effect | Mythic | +25 Bond, +20 Luck | 25 |
| **Ethereal Background** | Effect | Mythic | +30 Energy, +25 Curiosity | 25 |
| **Quantum Data Flow** | Effect | Mythic | +25 Energy, +30 Curiosity, +15 Luck | 25 |
| **Phoenix Wings** | Accessory | Legendary | +30 Energy, +15 Curiosity, +20 Luck | 30 |
| **Crystal Heart** | Companion | Epic | +35 Bond, +10 Energy | 50 |
| **Void Mask** | Headwear | Mythic | +40 Curiosity, +15 Bond, +25 Luck | 15 |

### 8. Heraldic Lineage System
```ts
import { generateFounderCoatOfArms, breedCoatsOfArms, analyzeLineage, getBlason } from '@/lib/lineage';

// Generate founder coat of arms
const coa = generateFounderCoatOfArms(petId, seed);
console.log(getBlason(coa)); // "Azure, bearing a star Or, a lion Gules"

// Breed two coats of arms
const { offspring, inheritance } = breedCoatsOfArms(parent1Coa, parent2Coa, offspringId, seed);
console.log(`Generation ${offspring.generation} coat with ${offspring.charges.length} charges`);

// Analyze lineage
const analysis = analyzeLineage(offspring);
console.log(`Dominant colors: ${analysis.dominantTinctures.join(', ')}`);
console.log(`Inbreeding coefficient: ${analysis.inbreedingCoefficient}`);
console.log(`Lineage purity: ${(analysis.purity * 100).toFixed(1)}%`);
```

**Heraldic Components:**
- **8 Divisions**: plain, per-pale, per-fess, per-bend, per-saltire, quarterly, chevron, canton
- **8 Tinctures**: Or (gold), Argent (silver), Azure (blue), Gules (red), Sable (black), Vert (green), Purpure (purple), Tenné (orange)
- **14 Charges**: star, moon, sun, cross, chevron, lion, eagle, tree, flower, crown, key, sword, book, orb

### 9. Privacy Presets

The dashboard ships with three share-level presets that re-encode the 42-digit HeptaCode on demand:

| Preset | Share Level | Best For |
| --- | --- | --- |
| **Stealth** | Tail digits only; crest metadata stays local. | Solo play, hidden alt vaults. |
| **Standard** | Vault + rotation broadcast; hashes remain private. | Trusted circles, family swaps. |
| **Radiant** | Full crest metadata + aura for discovery. | Public pairing, community drops. |

Changing the preset regenerates the digits with a fresh nonce and stores the choice in IndexedDB so autosave snapshots, exports, and re-imports maintain the same privacy stance.

---

## Next Steps (From Master Build Prompt)

### Phase 1: Complete Identity Layer
- [x] PrimeTail ID minting
- [x] HeptaCode v1 (pack + MAC + base-7)
- [x] **Genome Core (Red60/Blue60/Black60)**
- [x] **Deterministic trait derivation**
- [x] **Visual pet sprite (genome-driven)**
- [x] Fix ECC to output exactly 42 digits
- [x] Add audio chime (playHepta)
- [x] Privacy presets (Stealth/Standard/Radiant)
- [ ] Privacy presets (Stealth/Standard/Radiant)
- [ ] Consent grants (pairwise, time-boxed)

### Phase 2: Game Loop ✅ COMPLETE
- [x] Vitals tick (real-time)
- [x] 4-state machine (genetics → neuro → quantum → speciation)
- [x] Evolution gates + transitions
- [x] Sealed export/import (cryptographically signed)
- [x] Breeding system (genome inheritance)

### Phase 3: Vimana Integration ✅ COMPLETE
- [x] Grid map component
- [x] Field scanning
- [x] Anomaly detection
- [x] Sample collection

### Phase 4: Endgame Features ✅ COMPLETE
- [x] Battle system (consciousness-based)
- [x] Breeding (standard + recursive)
- [x] Mini-games (pattern recognition, meditation)
- [x] Cosmetics + achievements

---

## Design Principles (B$S)

1. **DNA stays private** – Only hashes + tail are ever shared
2. **One source, multi-modal** – 42 digits render as color + geometry + tone
3. **Offline-first** – Full gameplay without network
4. **Deterministic** – Same genome always produces same traits
5. **Kid-safe** – Parental mode, no ads, calm UX

---

## Tech Stack

- **Next.js 16** (Turbopack in dev, webpack for production parity)
- **TypeScript** (ES2020 for BigInt)
- **Zustand** (state)
- **Tailwind** + shadcn/ui
- **Framer Motion** (animations)
- **Crypto API** (HMAC, SHA-256)

---

## Current Status

**Version 8 - Addon & Lineage Systems Complete** ✅
- Identity core: **WORKING**
- Genome system: **WORKING** (Red60/Blue60/Black60 encoding + trait derivation)
- Visual pet sprite: **WORKING** (genome-driven SVG rendering)
- Vitals loop: **WORKING**
- Evolution system: **WORKING** (4-stage state machine)
- Breeding system: **WORKING** (3 modes with genetic inheritance)
- Sealed export/import: **WORKING** (cryptographically signed backups)
- **Vimana Integration: WORKING** (grid exploration, anomaly detection)
- **Battle System: WORKING** (consciousness-based duels)
- **Mini-Games: WORKING** (memory, rhythm, pattern recognition)
- **Cosmetics: WORKING** (10 items, 4 categories, unlock system)
- **Achievements: WORKING** (17 achievements, 4 tiers, progress tracking)
- **Addon System: WORKING** (crypto-secured, 12 addons, drag positioning)
- **Lineage System: WORKING** (heraldic coat of arms, breeding inheritance)
- HeptaCode: **PARTIAL** (needs ECC fix)
- Visual components: **WORKING**

**Phases 1-4 All Complete:**
- ✅ Real-time vitals tick with background-pause
- ✅ 4-state evolution (GENETICS → NEURO → QUANTUM → SPECIATION)
- ✅ Evolution gates and transitions with requirements
- ✅ Breeding system (DOMINANT, BALANCED, MUTATION modes)
- ✅ Sealed export/import with HMAC signatures
- ✅ **Vimana grid exploration with 4 field types**
- ✅ **Anomaly detection and sample collection**
- ✅ **Battle arena with 8 opponents and difficulty tiers**
- ✅ **4 mini-games (memory, rhythm, vimana, pattern)**
- ✅ **10 cosmetic items across 4 categories**
- ✅ **17 achievements with progress tracking**
- ✅ **Unified features dashboard with tabbed interface**
- ✅ **Crypto-secured addon system with ECDSA signatures**
- ✅ **Heraldic lineage system with breeding inheritance**
- ✅ **12 addon templates (6 standard + 6 premium)**

**Known Issues:**
- HeptaCode ECC needs to output 42 digits (currently variable)
- Need to test decode path
- Audio (playHepta) not implemented yet
- Some pre-existing linting warnings (not in new features)

**Recent Additions (v8):**
- 🎭 Crypto-secured addon system with ECDSA P-256 signatures
- 🛡️ Heraldic lineage system with coat of arms breeding
- ✨ 12 addon templates including 6 premium mythic items
- 🎯 Drag-to-position addon customization with lock/reset
- 📜 Lineage analysis with inbreeding coefficient tracking
- 🏰 8 heraldic divisions, 8 tinctures, 14 charges for coat of arms

---

## Master Build Prompt

Full spec: `docs/master-build-prompt.pdf` (attached by user)

**TL;DR:**
- Offline-first Meta-Pet (Tamagotchy × Vimana)
- PrimeTail ID + HeptaCode v1 for identity
- 4-state evolution (genetics → neuro → quantum → speciation)
- Privacy-first (DNA never shared, time-boxed consent)
- Success: D1 ≥ 45%, crash-free ≥ 99.5%, cold-start ≤ 2s

---

## License

This project is licensed under the MIT License. See [LICENSE](/LICENSE).

### Asset licensing

No separate asset license overrides are currently defined in this repository. Unless explicitly noted otherwise, assets checked into this repo are covered by the MIT License in [`/LICENSE`](/LICENSE).

---

**Built with Same.new** | [Docs](https://docs.same.new) | [Support](mailto:support@same.new)
