# BSS Digital Dosha System

## Purpose

This system borrows the structural idea of the Ayurvedic tridoṣa model and translates it into a fictional digital ecology for the BSS companion.

It is not a medical implementation, a human constitution test, a diagnostic tool, or a claim that doshas are measurable biological variables. It is a game and behaviour architecture.

The useful design pattern is:

1. each pet inherits a characteristic native ratio;
2. live events produce temporary drift;
3. health is not defined as equal thirds;
4. readable behaviour emerges from the relationship between native pattern, current drift, needs, environment, and accumulated residue.

The implementation entry point is:

```ts
resolveDigitalDosha({ traits, vitals, evolution, lastAction, lastActionAt })
```

It returns one `DigitalDoshaPhenotype`, which is also included in every resolved `VisualPhenotype`.

---

## The digital translation

### Vāta → Flux

Traditional inspiration: movement, mobility, variability, lightness, subtlety, air and space.

Digital meaning:

- signal movement
- curiosity and environmental scanning
- rapid switching
- adaptive variation
- particle speed
- aura rotation
- improvisation
- exploration
- instability when excessive

Flux is not simply “energy.” It is the rate and unpredictability with which information and attention move through the pet.

### Pitta → Forge

Traditional inspiration: transformation, heat, sharpness, metabolism, fire and water.

Digital meaning:

- processing intensity
- learning and conversion
- focus
- decision sharpness
- visual brightness
- pulse speed
- task completion
- transformation of experience into persistent growth
- over-processing when excessive

Forge is the pet’s capacity to turn input into changed state.

### Kapha → Anchor

Traditional inspiration: cohesion, stability, heaviness, softness, nourishment, earth and water.

Digital meaning:

- memory retention
- bonding
- persistence
- resilience
- structural cohesion
- visual density
- aura opacity
- recovery
- stored state
- inertia or saturation when excessive

Anchor is what lets the pet remain the same creature across time rather than dissolving into reactions.

---

## Native constitution

The native ratio is the digital equivalent of a constitutional pattern. In code it is called:

```ts
constitution.baseline
```

It is derived only from inherited or durable traits:

### Flux contributors

- curiosity
- playfulness
- independence
- frontier affinity
- void drift

### Forge contributors

- discipline
- inherited energy tendency
- mental potential
- physical potential

### Anchor contributors

- affection
- loyalty
- social tendency
- element-web coverage
- bridge density
- social potential

The baseline is normalised so Flux + Forge + Anchor = 1.

The system must never force every pet to `0.333 / 0.333 / 0.333`. A heavily Anchor–Forge pet and a heavily Flux–Forge pet have different healthy native patterns.

The baseline must not change because the pet is hungry, sick, dirty, tired, recently played with, or recently fed.

---

## Live state

The current ratio is:

```ts
state.current
```

It begins with the native constitution and receives temporary influences from:

- hunger
- energy depletion
- hygiene
- mood
- sickness severity
- evolution stage
- recent care actions

The difference between current and native state is:

```ts
state.drift
```

Drift values are signed. Positive Flux drift means the current pet is more mobile and variable than its native pattern. Negative Flux drift means it is less mobile than its native pattern.

---

## Care-action impulses

Care impulses last approximately 1.6 seconds and influence both the dosha engine and the Visual DNA renderer.

### Feed

- reduces some Flux scatter
- increases Forge transformation
- increases Anchor rebuilding

### Clean

- reduces Flux noise
- slightly increases Forge clarity
- increases Anchor coherence
- reduces unresolved residue

### Play

- strongly increases Flux
- increases Forge engagement
- temporarily reduces Anchor stillness

### Sleep

- strongly increases Anchor
- reduces Flux
- reduces Forge intensity
- lowers volatility

These are visual and behavioural impulses. Long-term state still follows the actual vitals after the impulse ends.

---

## Evolution bias

Evolution does not replace constitution. It creates a small stage-specific operating bias:

| Stage | Digital bias |
| --- | --- |
| GENETICS | Flux-led formation and variation |
| NEURO | Forge-led connection and processing |
| QUANTUM | Flux–Forge phase mobility |
| SPECIATION | Anchor-led coherence and persistent identity |

A Flux-native pet remains Flux-native at SPECIATION. The mature stage simply gives it more structural containment.

---

## Derived system metrics

### Coherence

Distance from the pet’s native ratio.

- `1.0` means the current ratio is close to its inherited pattern.
- lower values mean stronger drift.

Coherence does not mean equal thirds.

### Volatility

A composite of:

- current Flux
- hunger pressure
- visual noise
- sickness instability
- stabilising Anchor

Volatility affects motion, rotation, shiver, particle speed, and aura irregularity.

### Throughput

A composite of:

- current Forge
- available energy
- cleanliness
- sickness interference

Throughput affects pulse, brightness, learning flavour, and processing intensity.

### Cohesion

A composite of:

- current Anchor
- cleanliness
- positive mood
- hunger and sickness disruption

Cohesion affects aura density, opacity, persistence, and recovery behaviour.

### Digital residue

A fictional equivalent for unresolved state that has not been cleanly processed.

It may accumulate from:

- poor hygiene
- strong hunger
- depleted energy
- withdrawal
- sickness

Cleaning and stabilising care can reduce it.

Residue is not a toxin, disease, biological claim, or human wellness score. It represents unintegrated game state, stale signals, unfinished transitions, errors, and accumulated visual noise.

---

## Digital phases

### Native

The current pattern remains close to the inherited constitution.

### Flux surge

Signals and attention are moving faster than the native pattern can comfortably contain.

Visual expression:

- faster rotation
- higher bob
- more orbiting particles
- increased asymmetry
- environmental scanning

System cue: settle into a steady rhythm.

### Forge surge

Transformation and focus exceed the native processing pattern.

Visual expression:

- brighter body
- faster pulse
- sharper particles
- focused gaze
- intense nodes

System cue: cool processing intensity.

### Anchor surge

Stored state and cohesion exceed the native pattern.

Visual expression:

- dense aura
- slower movement
- larger particles
- stronger opacity
- inward persistence

System cue: seek novelty and movement.

### Saturated

Anchor drift combines with significant unresolved residue.

Visual expression:

- heavy field
- slow falling particles
- muted response
- excessive persistence

### Fragmented

High residue combines with strong distance from native constitution.

Visual expression:

- static or noisy particles
- turbulent rings
- asymmetry
- broken rhythm
- reduced brightness

System cue: integrate unresolved state before seeking more input.

---

## Visual DNA integration

The dosha engine is subordinate to critical care truth.

Priority remains:

1. active care action
2. sickness
3. critical hunger
4. critical exhaustion
5. other needs
6. dosha phase flavour
7. ordinary personality behaviour

Dosha dynamics alter how a state looks; they do not hide what is actually happening.

### Flux controls

- aura rotation speed
- motion amplitude
- phase instability
- particle speed
- temporary asymmetry
- shiver under overload

### Forge controls

- pulse rate
- brightness
- saturation
- node intensity
- spark density
- processing character

### Anchor controls

- aura thickness
- opacity
- blur and density
- particle size
- motion damping
- field radius stability

### Residue controls

- turbulence
- desaturation
- dimming
- noise
- fragmentation tendency

---

## Behaviour design rules

1. Never label a pet “bad” because one axis is high.
2. Never force equal thirds.
3. Compare current state with native state.
4. Show the cause of drift when possible.
5. Use actions to create temporary impulses, not permanent personality changes.
6. Persist only genuine long-term learning or mutation.
7. Keep the medical disclaimer visible wherever users might confuse the system with a human assessment.
8. Do not recommend herbs, diets, supplements, detoxification, or human treatment.
9. Do not infer a user’s dosha from their behaviour.
10. Keep Sanskrit terms paired with the fictional aliases Flux, Forge, and Anchor.

---

## Future event ledger

The current resolver uses the state already available in the pet store. A later version should add a rolling event ledger:

```ts
interface DigitalDoshaEvent {
  id: string;
  occurredAt: number;
  source:
    | 'care'
    | 'battle'
    | 'exploration'
    | 'minigame'
    | 'ritual'
    | 'idle'
    | 'system';
  impulse: {
    vata: number;
    pitta: number;
    kapha: number;
    residue?: number;
  };
  halfLifeMs: number;
}
```

This would allow:

- battle streaks to raise Forge
- exploration to raise Flux
- repeated bonding to strengthen Anchor
- unfinished activities to add residue
- rest to decay volatility
- rituals to integrate residue
- evolution ceremonies to permanently improve containment

Use exponentially decaying impulses. Do not permanently rewrite constitution from short-lived activity.

---

## Persistence plan

Persist:

- native constitution version
- long-term adaptation modifiers
- earned integration capacity
- permanent mutation events
- optional historical summaries

Do not persist every animated frame.

Recommended future state:

```ts
interface PersistentDigitalDoshaState {
  version: number;
  adaptation: DigitalDoshaVector;
  integrationCapacity: number;
  eventHistory: DigitalDoshaEvent[];
  lastResolvedAt: number;
}
```

---

## Testing matrix

The engine must cover:

- deterministic output
- baseline sums to one
- baseline is not forced to equal thirds
- baseline remains unchanged across live vitals
- current state sums to one
- play raises Flux temporarily
- sleep raises Anchor temporarily
- feeding raises Forge transformation
- cleaning lowers residue
- action expiry
- all evolution stages
- severe unresolved state enters fragmented or saturated phase
- no NaN output at extreme valid inputs
- Visual DNA consumes the same resolved dosha object

---

## Research boundary

Ayurveda is a traditional Indian medical system. The three doshas are part of that historical system, not established measurable variables in modern biomedicine. The United States National Center for Complementary and Integrative Health states that evidence for Ayurvedic approaches is limited and warns that some Ayurvedic preparations may contain toxic metals.

This project uses only the abstract design pattern of constitution, dynamic qualities, transformation, movement, and cohesion. It does not implement Ayurvedic medicine.

Reference starting points:

- National Center for Complementary and Integrative Health, “Ayurvedic Medicine: In Depth”
- World Health Organization materials on benchmarks for traditional medicine practice
- Historical and scholarly descriptions of vāta, pitta, kapha, prakṛti, and guṇa
