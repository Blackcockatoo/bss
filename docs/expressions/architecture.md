# MetaPet Expressions

## Entry and identity

The consumer `/pet` page links to `/expressions`. On direct entry the studio reads the active registry record from IndexedDB. My Pet handles first-time registration, including legacy migration. The studio takes a presentation snapshot of inherited traits, evolution stage and appearance. The form, expression and playback controls never call pet-care, breeding, registration or evolution actions. Form selection is temporary and initialises from the saved consumer preference.

Auralia shares its existing body, markings, eye system and adornments with the live guardian. The Evolved adapter resolves the same Visual DNA and Body Forge pipeline, then passes frame values into PetBodyRenderer and the live wardrobe drawing layers. Geometry uses the registered projection version and the static presentation boundary in GeometryAvatarRenderer. Its checksum-locked engine and autonomous behaviour remain separate.

## Performance and creative tools

The 24 authored timelines use bounded position, rotation, squash, eyelid, gaze, mouth and aura keyframes. The three adapters interpret the same sampled frame through their native capabilities. Authored timing and player controls can be saved as a versioned, declarative JSON recipe. Inherited personality controls the timing and strength of the pose. Seeded secondary movement and particles reproduce from the same inputs.

Sticker, meme and director views share one active preview. Comics edit one still panel at a time. The catalogue rasterises only expressions near the current viewport, one at a time, at 96 px. Generated thumbnails are kept in a bounded catalogue cache for the active form and released when the catalogue unmounts. Main playback targets roughly 30 fps and honours the device and Auralia motion preferences. Export pauses the preview and thumbnail work.

The preview and export share ExpressionArt and the sampler. Detached SVG frames are stripped of interactive attributes, checked for duplicate IDs and external references, then rasterised locally. Bundled epic wardrobe SVGs are validated and rasterised to embedded PNGs before the composition is encoded. PNGs use 256, 512 or 1024 px on the short side. Animated outputs use 256 px on the short side with a maximum of 32 deterministic frames. GIF quantisation and encoding run in a worker. Animated WebP packages browser-encoded pixel chunks using the [WebP RIFF container specification](https://developers.google.com/speed/webp/docs/riff_container). ZIP packs store the rendered PNGs. Print tools prepare a printable composite on demand. Pending encoders can be cancelled.

## Release verification

- `npm test -- --run` covers catalogue and recipe contracts, renderer/identity integration and the existing app regression suite.
- `npm run lint`, `npm run check:geometry-sprite-lock` and `npm run build` check the TypeScript, lint, locked sprite and production bundle.
- With the app running on port 3210, run `node scripts/verify-expressions.mjs` for the Chromium workflow. Set `EXPRESSIONS_TEST_LOCAL_HOSTS=1` to probe School and Field Mode request guards against a local server. `EXPRESSIONS_CHROMIUM` optionally points to a local Chromium executable. The script reports download times and preview-to-export colour differences. Treat these results as smoke-test measurements for the host machine.

Production-bundle Chromium checks sampled 512 px PNG exports from all three forms against their visible PNG poses. Across repeated runs, PNG downloads took 79–314 ms. The sampled GIF and WebP outputs contained 17–20 distinguishable frames and took 0.6–1.2 seconds. These measurements were taken in desktop headless Chromium. They establish a baseline for this test workstation.

The remaining catalogue entries, cross-origin identity transfer and companion portrait import are future work. Physical Android profiling and a cross-browser accessibility review are outstanding.

The consumer production project is Vercel `bss-l8cw`. The apex hostname redirects to `www.bluesnakestudios.com`. Review the preview for the feature branch before promoting a release.

## Design references

- [Bitmoji](https://support.bitmoji.com/hc/en-us/articles/5081566639380-Send-Bitmoji-Stickers-on-Web) informed keyword discovery and quick download.
- [Memoji](https://support.apple.com/guide/iphone/create-and-send-memoji-iphd730f04a7/18.0/ios/18.0) informed pose readability and the short path from selection to share.
- [Pokémon Camp](https://swordshield.pokemon.com/en-us/gameplay/pokemon-camps/) informed creature-specific reactions and movement.
- [Tamagotchi Uni](https://tamagotchi-official.com/us/series/uni/news/02_86/) informed personality differences expressed through actions.
