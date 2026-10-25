# Geometry companion in Battle and Monkey Invaders

## Implemented

Battle now explicitly presents the companion through the approved
`GeometryAvatarRenderer`, using the current registered genome and evolution.
It no longer embeds the full PetRuntimeStage/learned-response UI and scales that
entire shell down for a geometry scene. Compact geometry gets a square viewport
and direct scene sizing, including phone and short-landscape sizes. The main
pet's selected body preference is not changed. Vimana also uses the direct
geometry scene when Geometry is the selected form.

The checksum-locked `SriYantraPetEngine` and display bridge are unchanged.
No replacement sprite, invented DNA or second geometry generator was added.

Battle's idle and result screens offer **Play geometry in Monkey Invaders**.
This captures the actual displayed SVG and earned evolution overlay, rasterises
one transparent 256px PNG in the browser, places only `{version, image}` in
session storage, and navigates to the existing `/monkey-invaders` route. Nothing
is sent to another service and no genome, pet ID, name or registration key is
written into the handoff packet. Stale/unloaded companions and unavailable image,
canvas or session storage produce an inline error and leave Battle open.

The existing Monkey Invaders canvas game loads that local PNG once and draws it
through the same player-drawing entry point used for movement and duplicate
players. **Pilot: Geometry / Pilot: Monkey** on the title screen toggles the
cosmetic pilot. A **Bring your geometry pet** link returns to Battle if no local
sprite is available. Corrupt, unsupported or undecodable packets fall back to the
original monkey. Controls wrap and retain 44px targets on phones; overflowing title
content starts at a scrollable top rather than an unreachable negative offset.

Player bounds and hitboxes remain 60×60. The geometry drawing is 80×80, centred
on that original player box. Movement, firing, weapon visuals, powerups, bosses,
progress and game saves are unchanged. The arcade uses a captured pose of the
real companion, not the continuously running SVG animation/companion simulation.
The session skin survives same-tab reloads, and is refreshed by launching from
Battle again. It is not a permanent pet save and is not shared with external
alternative game builds on other origins.

## Code

- BattleArena, LivingScene and shared Living Genome styles: direct geometry scene
  and launch affordance.
- GeometryAvatarRenderer: compact square viewport and capture identity marker.
- GeometryArcadeLauncher and `src/lib/games/geometryPilot.ts`: guarded local
  capture, PNG preparation, error/retry handling and existing-route navigation.
- `public/games/geometry-pilot.js`: bounded PNG-only session decoder and pilot
  toggle/drawing controller.
- `public/monkey-invaders.html`: controller load, title controls, player drawing
  integration and shared weapon-rendering path.

## Validation

Baseline: 4 targeted files / 20 tests passed.

Release checks:

- Full Vitest suite: **196 files / 1,397 tests passed**.
- Targeted regression checks cover exact registered renderer capture, evolution
  adornments, stale identity rejection, self-contained SVG, pixel-only session
  storage, launch ordering/duplicate tap protection, failed-capture retry,
  unregistered fallback, corrupt sessions, decoded pilot selection, original-monkey
  fallback, mirrored players, shared bazooka drawing and existing touch controls.
- Sprite checksum/import gate and existing golden-render tests passed.
- School-document check, TypeScript and ESLint passed (`npm run lint`).
- Production webpack build passed (`npm run build`).
- `git diff --check` passed.

The real-renderer integration test uses a synthetic registered genome and the
actual approved wrapper/engine, not a replacement sprite. Canvas/image decoding
and navigation are mocked where required in unit tests. No end-to-end browser,
phone screenshot or FPS result is claimed: the earlier browser verification
block remains unresolved. This is published source for review; it is not a
verified production deployment.
