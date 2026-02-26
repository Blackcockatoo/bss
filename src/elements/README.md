# Element Number Theory

**Elements fused into the Jewble mathematical engine.**

This module implements a deep integration of the periodic table into Jewble's number-theoretic foundation. Elements are not decorative labels—they **ARE** the mathematics.

## Core Concepts

### 1. 60-adic Coordinates

Every atomic number Z decomposes as:

```
Z = a + 60b
```

where:
- `a ∈ [0, 59]` = **residue mod 60** (position on the Jewble circle)
- `b ∈ {0, 1, 2, ...}` = **tier/layer**
  - b=0: "lower shell" (classical elements, Z=1-59)
  - b=1: "upper shell" (Z=61-118, includes lanthanides/actinides/superheavies)
  - b=2+: future frontier elements

**Example**: Hydrogen (H, Z=1) → (a=1, b=0)
**Example**: Promethium (Pm, Z=61) → (a=1, b=1)

These two elements create a **vertical bridge** at residue 1.

### 2. Factorization Relative to 60

Base-60 = 2² × 3 × 5. For each element:

```
Z = 2^α × 3^β × 5^γ × u
```

where `gcd(u, 60) = 1` (u is a **unit mod 60**).

- **(α, β, γ)** = the element's "mantle" (how much 2/3/5 structure it carries)
- **u** = the element's "core" (a unit in the 16-element multiplicative group (ℤ/60ℤ)*)

**Example**: Iron (Fe, Z=26) = 2¹ × 3⁰ × 5⁰ × 13
**Example**: Gold (Au, Z=79) = 2⁰ × 3⁰ × 5⁰ × 79

### 3. HeptaMath (Base-7 Triples)

Each atomic number decomposes in base-7:

```
Z = d₀ + 7d₁ + 49d₂
```

where `dᵢ ∈ [0, 6]`.

This triple can drive:
- **Rhythmic subdivision** (3 layers of pulses)
- **Phase modulation** in oscillators
- **HeptaCode alignment** (how elements map to base-7 structure)

**Example**: Carbon (C, Z=6) → (6, 0, 0)
**Example**: Oxygen (O, Z=8) → (1, 1, 0)

### 4. Element Wave Formula

For a Jewble genome, define its **element wave** on the 60-circle:

```
F_J(θ) = Σ w(a) · e^(i·2π·a/60) · e^(i·λ·b̄(a))
```

where:
- Sum over residues `a` hit by the genome's digits
- `w(a)` = weight from 2-3-5 factorization of elements at residue a
- `b̄(a)` = average tier (center of mass) at residue a
- `λ` = frontier coupling constant

Returns a complex amplitude whose magnitude/phase can:
- Drive **radial envelopes** for sacred geometry rendering
- Modulate **frequency ratios** in audio synthesis
- Determine **prime rotation angles**

### 5. Residue Nodes & Bridges

The 60 positions on the circle are classified as:

- **Empty** (B=0): no element at this residue
- **Single** (B=1): one element only
- **Bridge** (B=2): two elements (Z and Z+60) creating a vertical connection

**Bridge Score** for a Jewble = sum of B(a) over all residues hit by its genome.

High bridge score → Jewble connects classical and frontier chemistry.

## Usage

### Generate Element Profile

```typescript
import { generateElementProfile } from '@metapet/core/elements';

const hydrogen = generateElementProfile(1);

console.log(hydrogen.sixtyAdic);  // { a: 1, b: 0 }
console.log(hydrogen.factors);    // { alpha: 0, beta: 0, gamma: 0, u: 1 }
console.log(hydrogen.hepta);      // { d0: 1, d1: 0, d2: 0 }
console.log(hydrogen.isFrontier); // false
```

### Analyze Jewble Genome

```typescript
import { analyzeJewbleElements } from '@metapet/core/elements';

const red60 = [1, 2, 3, 4, 5, ...];   // 60 digits
const blue60 = [6, 7, 8, 9, 0, ...];  // 60 digits
const black60 = [1, 3, 5, 7, 9, ...]; // 60 digits

const analysis = analyzeJewbleElements(red60, blue60, black60);

console.log(analysis.bridgeScore);        // Sum of B(a) values
console.log(analysis.frontierWeight);     // Count of frontier elements
console.log(analysis.chargeVector);       // { c2, c3, c5 }
console.log(analysis.heptaSignature);     // { h0, h1, h2 }
console.log(analysis.averageTier);        // 0.0-2.0

// Element wave at angle θ
const wave = analysis.elementWave(Math.PI / 4);
console.log(wave.magnitude, wave.phase);
```

### Build Residue Map

```typescript
import { buildResidueNodes } from '@metapet/core/elements';

const nodes = buildResidueNodes();

// Find all bridge nodes
const bridges = nodes.filter(n => n.bridgeType === 'bridge');

for (const bridge of bridges) {
  console.log(`Residue ${bridge.a}:`);
  for (const elem of bridge.elements) {
    console.log(`  ${elem.symbol} (Z=${elem.z})`);
  }
}
```

## Mathematical Properties

### Charge Vector (2-3-5 Exponents)

For elements hit by a Jewble, sum their factorization exponents:

```
C₂ = Σ α(Z)
C₃ = Σ β(Z)
C₅ = Σ γ(Z)
```

**Use cases**:
- Frequency scaling: `f → f × 2^(C₂/10) × 3^(C₃/10) × 5^(C₅/10)`
- Prime seeding: bias RNG by charge vector components
- Harmonic ratios: derive intervals from (C₂, C₃, C₅)

### Hepta Signature (Base-7 Sums)

Sum base-7 digits mod 7:

```
H₀ = (Σ d₀) mod 7
H₁ = (Σ d₁) mod 7
H₂ = (Σ d₂) mod 7
```

**Use cases**:
- HeptaCode deterministic seed: use (H₀, H₁, H₂) as entropy source
- Rhythmic patterns: 3-layer pulse generator
- Sacred geometry: 7-fold symmetry parameters

### Frontier Weight

Count of elements with Z > 82 (beyond lead).

**Interpretation**:
- Low → grounded in classical, stable chemistry
- High → pulled towards radioactive/synthetic frontier
- Can be used as **mixing coefficient** in transformations

## Worked Examples

Run the demo to see detailed analysis:

```bash
npx ts-node packages/core/src/elements/demo.ts
```

This shows:

1. **H/Pm Bridge** (residue 1): full coordinate breakdown for Hydrogen and Promethium
2. **Jewble Analysis**: complete element-theoretic profile for an example genome

## Integration Points

### With Astrogenetics

Combine element math with Lucas sequences:

```typescript
import { lucasMod60 } from '@metapet/core/astrogenetics';
import { buildResidueNodes } from '@metapet/core/elements';

const nodes = buildResidueNodes();
const lucasIndex = lucasMod60(daysSinceBirth);
const node = nodes[lucasIndex];

console.log(`Today's element: ${node.elements[0]?.symbol}`);
```

### With Genome Decoder

Inject element properties into trait decoding:

```typescript
import { decodeGenome } from '@metapet/core/genome';
import { analyzeJewbleElements } from '@metapet/core/elements';

const genome = { red60, blue60, black60 };
const traits = decodeGenome(genome);
const elementAnalysis = analyzeJewbleElements(red60, blue60, black60);

// Modulate traits by element charge vector
const modifiedEnergy = traits.personality.energy * (1 + elementAnalysis.chargeVector.c3 / 100);
```

### With HeptaCode

Use Hepta signature as additional entropy:

```typescript
import { analyzeJewbleElements } from '@metapet/core/elements';

const analysis = analyzeJewbleElements(red60, blue60, black60);
const { h0, h1, h2 } = analysis.heptaSignature;

// Use as seed for deterministic generation
const seed = h0 + 7 * h1 + 49 * h2;
```

## Philosophy

This module treats elements as **structured numbers** living in multiple mathematical spaces simultaneously:

- **60-adic space**: position + tier
- **Prime factorization space**: 2-3-5 charges + unit core
- **Base-7 space**: rhythmic/HeptaCode alignment
- **Complex wave space**: interference patterns on the circle

Elements are not "assigned" to Jewbles—they emerge from the genome's digits hitting specific residues on the 60-circle. The chemistry **is** the number theory.

---

## New Features: Complete Element Fusion Engine

### Reaction Algebra

Mathematical operations for combining elements:

```typescript
import {
  addElementsMod60,
  composeHeptaTriples,
  combineCharges,
  reactElements,
  elementPathway,
  tensorProduct,
} from '@metapet/core/elements';

// Element addition mod 60
const residue = addElementsMod60(1, 14); // H + Si → 15

// HeptaTriple composition
const h1 = { d0: 1, d1: 0, d2: 0 };
const h2 = { d0: 5, d1: 1, d2: 1 };
const composed = composeHeptaTriples(h1, h2); // (6,1,1)

// Full reaction in all 4 coordinate systems
const reaction = reactElements(1, 61); // H ⊗ Pm

// Element pathways around the circle
const pathway = elementPathway(1, 7, 60); // Start at 1, step by 7

// Tensor product (full 4D fusion)
const tensor = tensorProduct(1, 61);
```

### Computational Invariants

Calculate fundamental properties of Jewble genomes:

```typescript
import {
  chargeMagnitude,
  heptaMagnitude,
  chargeToSeed,
  heptaToSeed,
  calculateInvariants,
  formatInvariants,
  compareGenomes,
} from '@metapet/core/elements';

// Charge magnitude: ‖C‖ = √(C₂² + C₃² + C₅²)
const charge = { c2: 7, c3: 3, c5: 0 };
const mag = chargeMagnitude(charge); // 7.616

// Convert charge to seed for prime generation
const seed = chargeToSeed(charge); // C₂ + 7·C₃ + 49·C₅

// Complete invariant analysis
const analysis = analyzeJewbleElements(red60, blue60, black60);
const invariants = calculateInvariants(analysis);

console.log(formatInvariants(invariants));

// Compare two genomes
const inv1 = calculateInvariants(analysis1);
const inv2 = calculateInvariants(analysis2);
const comparison = compareGenomes(inv1, inv2);
console.log(`Similarity: ${comparison.similarity}`);
```

### Bridge Analysis

Complete bridge positions where elements at Z and Z+60 both exist:

```typescript
import {
  getBridgePositions,
  getPureBridges,
  getChargedBridges,
  getMaximumChargeBridge,
  generateBridgeTable,
  analyzeBridgeConnectivity,
} from '@metapet/core/elements';

// Get all bridges
const bridges = getBridgePositions();

// Pure bridges: C=(0,0,0) - no 2-3-5 structure change
// Expected: Residues 1, 17, 19, 31
const pureBridges = getPureBridges();

// Charged bridges: electromagnetic transitions
// Expected: Residues 9, 10, 14, 25, 30, 33, 36
const chargedBridges = getChargedBridges();

// Maximum charge bridge: Residue 36 (Kr/Cm) with C=(7,3,0)
const maxBridge = getMaximumChargeBridge();

// Generate formatted table
console.log(generateBridgeTable());

// Analyze connectivity for specific residues
const residues = [1, 9, 36];
const connectivity = analyzeBridgeConnectivity(residues);
```

### Jewble Generation Applications

Apply element theory to generate Jewble content:

```typescript
import {
  generatePrimesFromCharge,
  primeWalk,
  chargeToFrequency,
  generateHarmonicSeries,
  createApertureModulation,
  generateSacredGeometryVertices,
  generateModulatedPolygon,
  generateVisualizationData,
  verticesToSVGPath,
} from '@metapet/core/elements';

// A. Prime walks from charge vector
const charge = { c2: 2, c3: 1, c5: 1 };
const primes = generatePrimesFromCharge(charge, 10);
const walk = primeWalk(charge, 2, 10);

// B. Frequency scaling (just intonation)
// f(a) = f₀ · 2^(C₂/12) · 3^(C₃/19) · 5^(C₅/28)
const frequency = chargeToFrequency(charge, 440.0);
const harmonics = generateHarmonicSeries(charge, 440.0, 8);

// C. Aperture modulation from HeptaTriple
// r(t) = r₀ · [1 + ε₀·sin(ω₀t) + ε₁·sin(ω₁t) + ε₂·sin(ω₂t)]
const hepta = { d0: 1, d1: 2, d2: 3 };
const aperture = createApertureModulation(hepta, 1.0);
const radius = aperture.modulation(0.5); // radius at time t=0.5

// D. Sacred geometry from element wave
const analysis = analyzeJewbleElements(red60, blue60, black60);
const samples = sampleElementWave(analysis, 60);
const vertices = generateSacredGeometryVertices(samples, 1.0, 0.2);
const polygon = generateModulatedPolygon(7, samples, 1.0, 0.1);
const svgPath = verticesToSVGPath(vertices);

// Complete visualization data
const vizData = generateVisualizationData(charge, hepta, samples);
console.log(vizData.frequencies);      // Audio frequencies
console.log(vizData.vertices);         // Geometric vertices
console.log(vizData.apertureSamples);  // Animation keyframes
console.log(vizData.primes);           // Prime sequence
```

## Complete Mathematical Framework

This implementation covers all aspects of the JEWBLE-MATH specification:

### I. Fundamental Coordinates
- ✅ 60-adic coordinates (a, b)
- ✅ Prime factorization relative to base-60 (mantle and core)
- ✅ HeptaTriple system (base-7 representation)
- ✅ Bridge score calculation

### II. Reaction Algebra
- ✅ Element addition (mod 60)
- ✅ Charge combination
- ✅ HeptaTriple composition
- ✅ Element pathways and cycles
- ✅ Tensor products (4D fusion)

### III. Computational Invariants
- ✅ Total bridge score
- ✅ Charge magnitude (Euclidean, Manhattan, Max norms)
- ✅ Frontier weight and counts
- ✅ Hepta signature and magnitude
- ✅ Genome comparison metrics

### IV. Bridge Analysis
- ✅ Complete bridge positions table
- ✅ Pure vs charged bridge classification
- ✅ Maximum charge bridge detection
- ✅ Bridge connectivity analysis
- ✅ Theorem verification

### V. Applications
- ✅ Deterministic prime walks
- ✅ Frequency scaling (just intonation)
- ✅ Aperture modulation (radial pulsing)
- ✅ Sacred geometry generation
- ✅ Complete visualization data

### VI. Element Wave Formula
- ✅ F_J(θ) complex amplitude calculation
- ✅ Sampling at arbitrary angles
- ✅ Magnitude and phase extraction
- ✅ Integration with geometry and audio

---

**Philosophy**: Elements are not decorative labels—they ARE the mathematics. This module treats elements as **structured numbers** living in multiple mathematical spaces simultaneously, creating a unified framework where chemistry becomes inseparable from number theory.
