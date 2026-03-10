# Route Smoke Checklist

Use this quick checklist after landing/compass updates.

## Preconditions
- App boots successfully.
- Test on desktop and mobile widths.

## Route checks
- [ ] Open `/` and confirm the page renders without console/runtime errors.
- [ ] In landing nav, click `Compass` and confirm it scrolls to `#compass`.
- [ ] In the Compass section on `/`, click `Open Compass` and confirm navigation to `/compass`.
- [ ] In the Compass section on `/`, click `Launch Monkey Invaders` and confirm the game opens.

## Compass page checks (`/compass`)
- [ ] Confirm helper copy references `twelve live sectors`.
- [ ] Drag the wheel and confirm momentum + smooth snap still work.
- [ ] Click a sector and confirm route activation works.
- [ ] Click `Launch Monkey Invaders` and confirm the game opens.
- [ ] Click `Open Classroom Quest` and confirm navigation to `/school-game`.

## Monkey Invaders checks (`/monkey-invaders`)
- [ ] Confirm the route redirects cleanly into the standalone game experience.
- [ ] Confirm the fixed top bar shows `B$S` / `Blue Snake Studios` branding plus `Compass` back action.
- [ ] Confirm the start screen loads with difficulty options and no overflow on desktop or mobile widths.
- [ ] Confirm touch controls appear on phones and the page does not rubber-band scroll while playing.
- [ ] Reach level 5 and confirm a boss level appears with HUD bars and attack telegraphs.
- [ ] Open the legacy `/space-jewbles` URL and confirm it redirects to Monkey Invaders.

## Pass criteria
- [ ] No 404s across `/`, `/compass`, `/monkey-invaders`, `/space-jewbles`.
- [ ] No broken CTA links in tested paths.
