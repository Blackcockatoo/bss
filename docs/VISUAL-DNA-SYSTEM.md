# BSS Visual DNA System

## Purpose

The pet must look like one living organism, not a stack of unrelated effects.

Its inherited genome creates a permanent visual identity. Evolution adds structural complexity to that identity. Live vitals deform the current expression. Personality controls how strongly it reacts. Recent care actions create brief impulses. Sickness can destabilise the whole field without erasing who the pet is.

The implementation entry point is:

```ts
resolveVisualDNA({ traits, vitals, evolution, lastAction, lastActionAt })
```

It returns one `VisualPhenotype`. Renderers must consume that resolved frame instead of making their own mood, hunger, evolution, aura, particle, face, or movement decisions.

---

## Non-negotiable rules

1. **DNA owns identity.** Body type, inherited colours, pattern, texture, proportions, features, asymmetry, and deterministic motion bias come from `DerivedTraits`.
2. **Evolution grows the same creature.** It may add rings, nodes, topology, complexity, phase behaviour, and permanent features. It must not randomly replace the inherited palette or silhouette.
3. **Vitals deform; they do not redesign.** Hunger contracts the field. Mood expands or withdraws it. Energy changes tempo and posture. Hygiene adds or removes noise. Sickness breaks coherence.
4. **One resolver owns visual meaning.** Components do not declare private thresholds such as `mood > 70` or `hunger > 70`.
5. **The same input produces the same frame.** No random values during render. Every particle position or asymmetry must derive from the identity seed.
6. **Transitions explain cause and effect.** A visual change must be readable as hunger, tiredness, mood, sickness, evolution, or a care action.
7. **Critical conditions outrank decoration.** The pet must never look celebratory while severely sick or starving unless the current animation clearly depicts treatment.
8. **Reduced-motion support is part of the phenotype.** It is not a separate, forgotten renderer.

---

## Signal stack

Resolve the pet in this order:

### 1. Permanent identity

Source: `DerivedTraits`

- `physical.bodyType` → silhouette grammar
- `physical.primaryColor` → inherited dominant colour
- `physical.secondaryColor` → inherited edge and facial colour
- `physical.pattern` → body surface pattern
- `physical.texture` → material response
- `physical.size` → body scale
- `physical.proportions` → head, limb, and tail emphasis
- `physical.features` → wings, horns, third eye, tail flame, crown, aura affinity
- `personality.*` → reaction amplitude and behavioural flavour
- `latent.evolutionPath` → future mutation family
- `latent.hiddenGenes` → deterministic seed material
- `elementWeb.coverage` → field continuity
- `elementWeb.bridgeCount` → connection density
- `elementWeb.frontierAffinity` → exploratory edge behaviour
- `elementWeb.voidDrift` → inherited asymmetry and phase instability

Permanent identity must remain recognisable in every stage and condition.

### 2. Evolution structure

Source: `evolution.state`

| Stage | Aura topology | Rings | Base nodes | Visual meaning |
| --- | --- | ---: | ---: | --- |
| `GENETICS` | halo | 1 | 3 | A forming membrane around an unstable genome |
| `NEURO` | neural lattice | 2 | 8 | Cross-linked awareness and synaptic response |
| `QUANTUM` | phase torus | 3 | 12 | Overlapping phase planes and dimensional drift |
| `SPECIATION` | speciation crown | 4 | 16 | Stable species identity with a mature field signature |

Evolution changes complexity, not ownership. The first aura colour remains inherited. Stage colours are supporting spectral bands.

### 3. Live needs

Source: `Vitals`

All need values are normalised to `0..1`, where `1` means urgent.

- Hunger need increases above a hunger reading of roughly `45`.
- Energy need increases below roughly `55` energy.
- Hygiene need increases below roughly `55` hygiene.
- Mood need increases below roughly `50` mood.
- Sickness is at least `0.35` whenever `isSick` is true, then follows severity.

### 4. Personality reactivity

Energy, playfulness, and curiosity increase how visibly the pet responds. A calm pet still changes state, but with smaller movement and field amplitude. A highly reactive pet expresses the same condition more dramatically.

### 5. Recent action impulse

A care action remains visually active for approximately `1600 ms`.

- `feed` → particles pull inward; attention moves to food; field begins rebuilding
- `clean` → noise lifts away; outer field clarifies
- `play` → bounce and spark behaviour; attention moves to the user
- `sleep` → eyelids close; aura folds inward; movement slows

The impulse is temporary. The resolver then returns to the needs-based state.

---

## Condition-to-visual mapping

### Hunger

**Mild hunger**

- aura radius contracts slightly
- particle flow leans inward
- pupils focus toward the food target
- body gains a small vertical compression

**Critical hunger**

- behaviour becomes `starving`
- aura contracts strongly
- inward pull exceeds 70%
- pulse accelerates while overall body brightness falls
- field edges become sharper and less generous
- shiver may appear

Hunger must never be represented only by an emoji.

### Energy

**Tired**

- slower bob cycle
- reduced vertical movement
- eyelids partially close
- body tilts and settles
- aura rotation slows

**Exhausted**

- behaviour becomes `exhausted`
- aura dims and contracts
- body saturation and brightness fall
- particles rise slowly like dissipating charge

### Mood

**High mood**

- field expands
- nodes brighten
- body bounce increases according to personality
- face opens into a smile
- particles spark or orbit socially

**Low mood**

- field withdraws
- posture tilts inward
- eyes lower
- mouth forms a restrained frown
- user attention increases, signalling a need for connection

Mood must affect posture, spacing, and tempo—not just colour.

### Hygiene

**Low hygiene**

- particles change to dust/noise
- aura edge becomes rougher
- turbulence increases
- surface texture appears less coherent

Cleaning should visibly remove noise from the outside inward.

### Sickness

Sickness destabilises the whole phenotype.

- behaviour becomes `sick` when no care action is currently active
- aura turbulence rises with severity
- asymmetry increases
- body saturation and brightness fall
- particles become static or erratic
- face becomes strained
- movement may shiver

Sickness does not replace inherited colours with a universal green filter. It damages coherence while preserving identity.

---

## Behaviour priority

Use this priority when resolving the readable behaviour label:

1. active care action
2. sickness
3. critical hunger
4. critical exhaustion
5. hunger
6. tiredness
7. poor hygiene
8. low mood
9. high mood
10. curious/alert personality
11. idle

The aura may still express sickness or hunger beneath an active care animation. For example, feeding can be the visible behaviour while the field remains compressed until the hunger reading actually improves.

---

## Evolution grammar

### GENETICS

- one soft halo
- three principal nodes
- slow membrane breathing
- strong inherited silhouette
- low particle density
- no complex phase crossings

The pet should feel newly assembled, not unfinished UI.

### NEURO

- two linked field bands
- synaptic nodes and crossing ellipses
- attention and eye tracking become more expressive
- curiosity produces visible environmental scanning
- actions create clearer response arcs

### QUANTUM

- three phase planes
- toroidal or Möbius-like overlap
- controlled after-image feeling
- phase offset derives from identity seed
- higher node count and rotational complexity

Quantum must remain readable and performant. Do not turn it into full-screen noise.

### SPECIATION

- four stable rings or crown bands
- mature field signature
- strongest identity retention
- permanent crest, tail, third-eye, or feature emphasis when inherited
- calmer confidence rather than simply faster animation

The final stage should feel more coherent, not merely more chaotic.

---

## Renderer layer order

Render from back to front:

1. environmental glow
2. evolution aura topology
3. aura nodes
4. condition particles
5. inherited external features such as wings or horns
6. body silhouette and pattern
7. texture response
8. face and gaze
9. crown, third eye, tail flame, and other foreground features
10. optional diagnostic readout

No layer should independently query thresholds from the store. The renderer receives `VisualPhenotype` and draws it.

---

## The phenotype contract

`VisualPhenotype` contains:

- `identity` — permanent inherited appearance
- `evolution` — stage profile and topology
- `aura` — rings, nodes, radius, thickness, opacity, blur, tempo, turbulence, asymmetry, pull, colours
- `body` — scale, squash, tilt, bob, saturation, brightness, opacity, shiver
- `face` — expression, eyelid opening, pupil scale, gaze
- `particles` — mode, count, speed, opacity, size
- `behavior` — readable state, urgency, attention target, action progress, label
- `needs` — normalised hunger, energy, hygiene, mood, and sickness values

New visual systems must extend this contract rather than bypass it.

---

## State smoothing and hysteresis

The resolver currently produces a deterministic target frame. Renderers animate toward that target.

Before adding more thresholds, introduce hysteresis where repeated boundary crossing is visible:

- enter hungry at a higher threshold than the threshold used to leave hungry
- enter tired below a lower energy level than the level used to leave tired
- maintain sickness visuals until recovery is genuinely stable
- use action timestamps rather than intervals that mutate every frame

Do not store every animation frame in Zustand. Store game truth; derive presentation.

Recommended future smoothing layer:

```ts
interface VisualMemory {
  previousBehavior: VisualBehaviorState;
  previousAuraRadius: number;
  enteredAt: number;
  lastStableAt: number;
}
```

This memory belongs beside the renderer or in a dedicated visual controller, not in the genome.

---

## Evolution ceremonies

When `tryEvolve()` succeeds:

1. freeze ordinary idle movement
2. preserve the current inherited body silhouette
3. gather existing aura nodes inward
4. collapse to the genome seed
5. expand into the next topology
6. reveal only the new permanent structures
7. settle into the new stage tempo
8. return control after the phenotype is stable

The ceremony must interpolate old and new `EvolutionVisualProfile` values. It must not swap components halfway through with an unrelated visual.

Recommended duration: 4–7 seconds, with reduced-motion fallback under 1 second.

---

## Permanent mutations

Not every mood change belongs in DNA. Persist only changes earned through durable systems.

Good permanent mutations:

- a new inherited feature after evolution
- a scar, crest, glyph, or colour accent earned by a major achievement
- a stable asymmetry caused by a documented mutation event
- a species title or signature node arrangement

Do not persist:

- temporary hunger contraction
- low-mood posture
- sickness turbulence
- a recent feed/play/clean/sleep impulse
- transient particle modes

If mutation persistence is added, version it:

```ts
interface VisualGenomeMutation {
  id: string;
  version: number;
  source: 'evolution' | 'achievement' | 'ritual' | 'system';
  appliedAt: number;
  changes: Record<string, number | string | boolean>;
}
```

---

## Accessibility

- honour `prefers-reduced-motion`
- retain state meaning when animation is disabled
- provide an accessible text label for current behaviour
- never rely on colour alone for hunger, sickness, tiredness, or mood
- keep aura contrast below the face and body contrast
- avoid strobing, rapid flashes, and high-frequency opacity pulses
- allow the diagnostic readout to be hidden in production but available in development

---

## Performance rules

- resolve once per relevant store change
- never generate random particle positions during render
- use a deterministic seed
- do not update React state every animation frame
- animate SVG/CSS properties through Framer Motion where possible
- cap particles and nodes
- keep expensive blur filters bounded
- use unique SVG IDs per component instance
- mount one canonical pet renderer on the main pet route
- remove or migrate duplicate renderers after parity is confirmed

Target on ordinary mobile hardware: stable 60 fps for GENETICS/NEURO and no worse than stable 30 fps for maximum SPECIATION effects.

---

## Testing matrix

Every resolver change must cover at least:

- same input → same output
- all four evolution stages
- stable vitals
- mild and critical hunger
- mild and critical energy depletion
- low hygiene
- low and high mood
- sickness at low and high severity
- each recent action
- action expiry
- reduced motion
- inherited colour preservation
- extreme but valid trait values

Visual regression captures should eventually include:

1. each evolution stage at stable vitals
2. starving state at each stage
3. exhausted state at each stage
4. sick state at each stage
5. joyful/play state at each stage
6. reduced-motion version of each stage

---

## Migration plan

### Phase 1 — now

- add the pure resolver
- add the canonical `VisualDNAPet` renderer
- wire it into `/app/pet`
- add resolver tests
- keep the old components temporarily for comparison

### Phase 2

- replace private visual thresholds inside `PetSprite`, `EnhancedPetSprite`, `AmbientParticles`, and `AmbientBackground`
- either make them consume `VisualPhenotype` or retire them
- route evolution ceremony visuals through the same profile definitions

### Phase 3

- add phenotype interpolation and hysteresis memory
- add achievement/ritual mutation support
- add environment response without letting environment override DNA
- add visual regression snapshots

### Phase 4

- expose a controlled Visual DNA lab for debugging genes, vitals, evolution, and actions
- never ship unrestricted developer sliders into the child-facing experience

---

## Acceptance criteria

The Visual DNA system is complete when:

- the pet is recognisable across all stages and conditions
- evolution visibly changes aura topology and permanent complexity
- hunger visibly contracts and pulls the field inward
- energy visibly changes posture and tempo
- mood visibly changes openness, expression, and movement
- hygiene visibly changes field noise
- sickness visibly damages coherence
- care actions produce brief readable impulses
- no renderer contains competing mood/hunger/evolution thresholds
- reduced motion retains full semantic meaning
- all resolver tests pass
- the main pet route shows the canonical renderer
- duplicate legacy renderers are removed or reduced to wrappers around the phenotype contract
