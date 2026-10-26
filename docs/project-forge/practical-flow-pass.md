# Practical flow and authored Battle motion

26 October 2026. This pass improves existing routes and presentation. It does not
replace the game engines, companion registry, saves, learning tools or school
workspaces.

## Implemented

- Navigator Explore opens the real Vimana tab rather than the mock-enabled
  integration scaffold. Family opens the canonical companion's existing breeding
  panel, including on a bookmarked/reloaded link. Achievements opens real saved
  achievements rather than the sharing explanation page. DNA visuals is labelled
  for what it actually opens. Legacy URLs remain intact.
- Existing music/story/experiment tools are reachable from Navigator, the app
  home, the companion and Body Forge. Companion actions provide direct Play,
  Explore and Make entrances. Family and the real certificate are available
  without hunting through mechanics tabs. The original controls remain usable.
- Activity query changes remount the requested tab instead of keeping the
  previous tab's initial state. This covers navigating between destinations on
  the same activities route and following browser history.
- Removed the shop's unfinished marketplace promotion and nonfunctional Notify
  me display. Functional shop content and purchase state are untouched.
- Battle reuses the locked sprite's authored wave (greeting), shuffle (ready/
  response), walk/dab (attack), lotus (settling/recovery) and dance (victory).
  Movement cues are local presentation props through the approved renderer.
  Turn resolution, speed order, PP, maths, health/status updates and reward
  persistence retain their existing authority and 650ms presentation window.
  Feedback timers clean up on unmount. Reduced motion stops the sprite clock
  and displays a still idle pose; hidden/offscreen scenes retain their pause.

## Next pass: only when the practical benefit justifies the work

| Candidate | Benefit | Work needed before implementation |
|---|---|---|
| Unified scrapbook | Find real saved songs, stories, discoveries and family records together. | Read-only adapters across existing stores; pet ownership, export/deletion and migrations must remain correct. Avoid a second save store. |
| Movement playground / showtime | Child-directed performance using authored poses and saved music. | Scoped playback controls, stop/navigation cleanup and reduced-motion presentation. No new reward currency. |
| DNA Lab entrance | Reduce overlap between DNA, genome, resonance and visual tools. | Inventory which routes use live DNA versus demonstration seeds and retain advanced links. Do not imply edits change a saved pet unless they do. |
| Vimana activity encounters | Give a destination a meaningful short experiment or creation. | Explicit mapping to real activities and persisted discovery outcomes; no invented rewards, timers or mission state. |
| Habitat creations | Display a child's actual artwork/music in the companion home. | Versioned references to existing creations, ownership and missing/deleted-art fallback. |
| Navigation consolidation | Fewer labels and duplicate presentations. | Observe children completing tasks first. Preserve the current bottom navigation and optional wheel modes until there is evidence for replacing them. |

Fun, self-expression and discovery can justify a feature without teacher use.
Teacher lessons, Field Mode and adult controls remain distinct. This pass makes
no curriculum, physical-device, screen-reader or offline-cold-start certification.

## Verification

Baseline targeted suite: 3 files / 15 tests passed. Added regression coverage for
authored cues, exact-once turns, victory/defeat, timer cleanup, reduced motion,
unchanged genome packets, real destinations, direct family/certificate access
and activity-query navigation. The existing Chromium release script additionally
checks actual SVG animation frames, captured movement changes, reduced motion,
Navigator-to-Vimana navigation and family access/reload before exercising the
existing breeding, backup and arcade flows.

Release results are recorded with the pull request and CI evidence. No physical
iPhone/Android or FPS result is claimed.
