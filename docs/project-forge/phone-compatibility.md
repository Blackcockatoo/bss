# Phone compatibility follow-up

This patch builds on the Battle/Vimana and lineage/registration work. It preserves
all combat, discovery, breeding and registry state mechanics and local save keys.

## Corrections

- Shared controls have at least 44px CSS width/height, wrapping labels and
  non-shrinking icons. Long names and IDs may wrap instead of forcing wide rows.
- Breeding and Vimana inputs/selects/textareas use 16px text in portrait and landscape to avoid
  the common iOS focus-zoom trigger. Zoom remains available to the user.
- Certificate symbols remain in one column until the 640px breakpoint. The
  previous 420px three-column layout did not leave enough room for 120px glyphs
  and card padding. Certificate actions also stack below tablet width.
- The certificate close control stays in a sticky header while its body scrolls.
  Its dialog accounts for dynamic viewport height and all safe-area insets.
- Vimana's real selected-field inspector and actions precede the atlas on phone
  layouts. The native destination selector remains the primary readable control;
  tiny SVG labels are hidden on phones. The atlas's minimum height is reduced.
- Arena presentations shorten on compact phones and short landscape screens.
  Companion captions, health/status rows and result actions wrap safely.
- Activity tabs have larger labels and touch targets. The pet Mechanics Lab uses
  a two-column phone grid instead of requiring horizontal tab scrolling. Its form,
  breeding, profile and certificate entry controls also receive 44px height.
- Battle/activity shells and the pet page account for landscape notches and
  bottom safe areas.

Affected code: `src/components/living-genome/living-genome.css`, BattleArena,
VimanaMap, RegistrationCertificate, FeaturesDashboard, `/pet`, `/app/battle` and
`/app/activities`. Certificate regression coverage includes a very long alias
while retaining an accessible modal close action.

## Validation

- Targeted local flow checks: **6 files / 29 tests passed**.
- Full suite: **192 files / 1,386 tests passed**.
- School-document consistency, TypeScript and ESLint: passed (`npm run lint`).
- Production webpack build: passed (`npm run build`).
- `git diff --check`: passed.

The responsive source was reviewed for compact and typical portrait widths
(320, 360, 390 and 430 CSS pixels), tablet transitions, and short landscape
viewports. These are target widths, not measured browser viewport results.

## Remaining verification boundary

No phone screenshots, browser overflow measurements, physical-device tests or
mobile Safari/Android keyboard tests were executed. The local browser binary is
absent; installing the primary runtime's headless browser failed with a truncated
archive. Cloud-browser access to the local build was then automatically rejected:
the origin gate identified possible disclosure of locally stored companion data
to an unverified service. That rejection was not bypassed. Unaffected local source,
flow tests, type/lint checks and build validation continued.

The new responsive layout must still be rendered on a phone/browser before an
all-devices compatibility claim or production release. Production has not been
deployed by this patch.
