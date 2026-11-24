# MetaPet Expressions

## Entry and identity

The consumer `/pet` page links to `/expressions`. On direct entry the studio reads the active registry record from IndexedDB. My Pet handles first-time registration, including legacy migration. The studio takes a presentation snapshot of inherited traits, evolution stage and appearance. The form, expression and playback controls never call pet-care, breeding, registration or evolution actions. Form selection is temporary and initialises from the saved consumer preference.

Auralia shares its existing body, markings, eye system and adornments with the live guardian. The Evolved adapter resolves the same Visual DNA and Body Forge pipeline, then passes frame values into PetBodyRenderer and the live wardrobe drawing layers. Geometry uses the registered projection version and the static presentation boundary in GeometryAvatarRenderer. Its checksum-locked engine and autonomous behaviour remain separate.

## Expression contract (v2)

`src/lib/expressions/contract.ts` is the single typed contract shared by every form. An `Expression` declares:

- `keyframes`: body poses (x, y, rotation, squash, eyelid, gaze x/y, mouth curve, aura) authored with a small beat DSL. `defineExpression` adds neutral rests at 0 and 1 so loops are seamless, and rejects malformed ids, out-of-range or unordered beats, invalid prop/oscillator windows and particle counts above 16 when the module loads.
- `face`: an eye mood (15 moods) and mouth shape (10 shapes). Each adapter maps these onto its own eye and mouth systems.
- `movement`: enveloped oscillators (shake, bob, sway, spin, tremble, pulse) layered on the keyframes.
- `effect` and `particles`: one of eight effects drawn with one of six seeded particle behaviours.
- `props`: timed cues for 27 original vector props (sleep Zs, question mark, light bulb, sweat drop, shades, gem and so on).
- `personality` and `interpretation`: which inherited trait drives emphasis, and whether the performance is explosive, inspecting, measured, playful or tender.
- `staticFrame` and `reducedMotionFrame`: the phases used for PNG export/thumbnails and for reduced-motion display.
- `capabilities`: what each form can express (Geometry has resonance instead of a mouth, for example).

`src/lib/expressions/catalogue.ts` holds 69 expressions in 12 packs. The original 24 ids from the first revision are unchanged, so saved favourites, recents, recipes and comics keep working. The catalogue is data only: no code is generated or evaluated from it.

## Animation engine

`sampleExpression` in `src/lib/expressions/studio.ts` is a pure function of the expression, phase, settings, personality and a numeric seed. It never reads the clock, storage or the pet record, so the same inputs always produce the same frame.

- **Anticipation and overshoot**: keyframe interpolation uses a smoothstep curve with an extra term that dips backwards before a move and overshoots past the target. The strength comes from the creature's playfulness and calm. "Spring" easing enables it, and "linear" switches it off.
- **Squash and stretch**: keyframe squash is scaled by energy, recipe controls and personality, plus oscillator pulses, and clamped to ±0.25.
- **Follow-through**: loose parts (Auralia orb deformation, Evolved wings and head tilt, Geometry resonance, props) lag the body's velocity, sampled 0.035 phase behind.
- **Reduced motion**: shows `reducedMotionFrame` with no follow-through, oscillation or particle drift.
- **Personality**: `performanceProfile` (`src/lib/expressions/personality.ts`) derives boldness, reserve, curiosity, playfulness, calm and energy from the genome-decoded `PersonalityTraits`, with a small temperament lean and the "Loves to spin" / "Dances when happy" quirks. Bold creatures travel further in celebrations, reserved ones keep gestures close, curious ones look around more when inspecting, and disciplined calm ones damp squash and overshoot. The profile changes how an expression is performed, never what it means, and nothing is stored.

## Adapters

All three adapters receive a read-only `CreatureSnapshot` (structured clone of traits, evolution, vitals and genome, plus local appearance) and the sampled frame.

- **Auralia** drives the existing AuraliaMetaPet presentation layer: eye emotion and shape per mood, mouth, orb deformation from follow-through and the existing grumpy transformation for angry poses.
- **Evolved** drives VisualDNAPet / PetBodyRenderer: pupils and lids per mood, mouth curve and opening, wing spread/fold and head tilt from follow-through, and the live wardrobe layers.
- **Geometry** wraps the checksum-locked portrait from GeometryAvatarRenderer in transforms (resonance rotation, pulse, harmonic rings, dimming for closed eyes). The locked engine files are not modified; `npm run check:geometry-sprite-lock` enforces this.

`PropLayer.tsx` draws props as inline SVG paths anchored per form. It uses no fonts, images or external references.

## Performance and creative tools

Sticker, meme and director views share one active preview. Comics edit one still panel at a time. The catalogue lists all 69 expressions in a scrolling region and rasterises only those near the viewport, one at a time, at 96 px. Thumbnails are keyed by form and expression, held in memory for the session and persisted in a bounded (420-entry) Cache Storage cache named `metapet-expression-thumbs-v2`. Cache keys use a one-way hash of the snapshot, so thumbnails redraw when the creature's appearance changes. "Clear thumbnail cache" deletes only that cache; "Clear local creative saves" clears it as well. Main playback targets roughly 30 fps and honours the device and Auralia motion preferences. Export pauses the preview and thumbnail work.

The preview and export share ExpressionArt and the sampler. Detached SVG frames are stripped of interactive attributes, checked for duplicate IDs and external references, then rasterised locally. Bundled epic wardrobe SVGs are validated and rasterised to embedded PNGs before the composition is encoded. PNGs use 256, 512 or 1024 px on the short side. Animated outputs use 256 px on the short side with a maximum of 32 deterministic frames. GIF quantisation and encoding run in a worker. Animated WebP packages browser-encoded pixel chunks using the [WebP RIFF container specification](https://developers.google.com/speed/webp/docs/riff_container). ZIP packs store the rendered PNGs. Print tools prepare a printable composite on demand. Pending encoders can be cancelled.

## Release verification

- `npm test -- --run` covers the catalogue contract (`catalogue.test.ts`: vocabulary, rests, real animation, bounds, determinism, reduced motion, anticipation/overshoot, squash/stretch, follow-through, personality), recipes and storage isolation (`studio.test.ts`), all 69 expressions on all three forms rendered from a frozen snapshot with the canonical record unchanged (`ExpressionArt.test.tsx`), the thumbnail cache (`thumbnailCache.test.ts`), the proxy boundary for MetaPet.school and Field Mode (`src/app/expressions/routing.test.ts`), and the existing app regression suite.
- `npm run lint`, `npm run check:geometry-sprite-lock` and `npm run build` check the TypeScript, lint, locked sprite and production bundle.
- With the app running on port 3210, run `node scripts/verify-expressions.mjs` for the Chromium workflow. Set `EXPRESSIONS_TEST_LOCAL_HOSTS=1` to probe School and Field Mode request guards against a local server. Set `EXPRESSIONS_FULL_SWEEP=1` to export a PNG pose of every expression on every form and assert each is non-empty and clear of the image border. The script also checks transparent PNG at 256/512/1024 px on all three forms, that PNG files contain no metadata chunks, and that the thumbnail cache clears and redraws. `EXPRESSIONS_CHROMIUM` optionally points to a local Chromium executable. The script reports download times and preview-to-export colour differences. Treat these results as smoke-test measurements for the host machine.

Production-bundle Chromium checks sampled 512 px PNG exports from all three forms against their visible PNG poses. Across repeated runs, PNG downloads took 79–314 ms. The sampled GIF and WebP outputs contained 17–20 distinguishable frames and took 0.6–1.2 seconds. These measurements were taken in desktop headless Chromium. They establish a baseline for this test workstation.

The catalogue has 69 of the targeted 120 expressions. Only static poses are swept for framing; mid-animation frames are bounded by the sampler but not pixel-checked for every expression. There is no committed visual regression baseline. Cross-origin identity transfer and companion portrait import are future work. Physical Android profiling and a cross-browser accessibility review are outstanding.

The consumer hostname is `www.bluesnakestudios.com` (`METAPET_ORIGIN`); the proxy redirects the apex and aliases to it. Repository evidence about the Vercel project disagrees: `docs/project-forge/architecture.md` records a read-only lookup confirming project `bss-l8cw`, while the older `docs/release-evidence/domain-product-split.md` says the domains resolve through `bss`. See `phase0-audit.md`. Review the preview for the feature branch before promoting a release.

## Design references

- [Bitmoji](https://support.bitmoji.com/hc/en-us/articles/5081566639380-Send-Bitmoji-Stickers-on-Web) informed keyword discovery and quick download.
- [Memoji](https://support.apple.com/guide/iphone/create-and-send-memoji-iphd730f04a7/18.0/ios/18.0) informed pose readability and the short path from selection to share.
- [Pokémon Camp](https://swordshield.pokemon.com/en-us/gameplay/pokemon-camps/) informed creature-specific reactions and movement.
- [Tamagotchi Uni](https://tamagotchi-official.com/us/series/uni/news/02_86/) informed personality differences expressed through actions.
