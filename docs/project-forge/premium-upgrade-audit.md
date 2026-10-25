# Project Forge — premium quality upgrade audit

25 October 2026. Scope: the existing six-instrument family experience on `feature/project-forge-first-slice-20261025`, PR #179. This audit implements repairs and learning improvements; it does not merge or publish the branch. Free access, existing pet identity and the seven-session classroom boundary are preserved.

## Findings and implemented repairs

| Priority | Finding | Repair and regression evidence |
|---|---|---|
| P1 — preservation | Migration could delete a retired Forge value written by another tab after the copy was read. | Retired-copy cleanup uses a compare-and-delete IDB transaction. A changed value remains available for recovery. Test: changed legacy copy survives cleanup and imports intact. |
| P1 — preservation | Corrupt/future retired data could be normalised to empty and then removed. | Legacy reads use the same strict validation as canonical reads. Unsupported records remain untouched and surface an error. |
| P1 — ownership | An old tab could save a revision after another tab deleted its project, recreating the deleted work. | Missing IDs accept revision 1 only. Existing IDs require the next revision, unchanged creation time and unchanged instrument. |
| P1 — portability | The old 500,000-character import ceiling could reject the app's own valid full-workspace export; file bytes and string characters were inconsistent. | Shared UTF-8 limits: 4 MB Forge / 8 MB full bundle. Export and import both enforce the same byte contract. A 50-project workspace with escaped writing roundtrips beyond the old ceiling. |
| P2 — correctness | Numeric edits applied on blur; invalid drafts could run or play old values. | Controlled editors apply valid numbers immediately. Invalid drafts clear results, label the error and disable running/playback. No focus-losing input remounts. |
| P2 — reliability | A valid imported project with an empty title could dereference an absent old-style discovery. | Companion recall chooses by project presence, with safe display/fallback values. Regression renders an empty-title project with no discoveries. |
| P2 — continuity | Older asynchronous memory reads could arrive after deletion and redraw an obsolete response. | Per-read generation guards in both companion views discard stale responses. |
| P2 — privacy | A learned-movement message could retain the previous pet's project name after switching identity. | Messages are scoped to pet identity. A two-pet UI regression verifies that the earlier name is absent. |
| P2 — resources | Repeated audio could overlap; playback lacked Stop and could continue after navigation. | Bounded audio validation, exclusive playback, AbortSignal cancellation, Stop controls, and cleanup of contexts, timers and listeners on stop/unmount. Lifecycle regressions cover cancellation and replacement. |
| P2 — editor state | A delayed save could finish after instrument switching and reopen the old project in the new tool. | Editor generation guards prevent stale save/delete completion from changing the current editor. |
| P2 — movement | Routine record updates could cancel a learned movement; deliberate cancellation could reject an animation promise without a handler. | Motion subscribes to stable identity/genome inputs and handles intentional cancellation. UI regression checks metadata updates do not reload the response. |

Normal write mutations also validate the whole resulting memory rather than silently dropping invalid new records. Duplicate project/discovery IDs are rejected. Runtime project validation now checks known tools, integer timestamps, timestamp order and strict source-choice values.

## Learning upgrades

**Maker Bench:** exact coordinate traces replace ambiguous flattened path numbers. A responsive SVG shows the start, goal, route and current robot position, with a textual accessible description. Turns remain bounded instructions; no arbitrary execution was introduced.

**Story Workshop:** counts and companion signals now follow the opening plus the chosen ending. Editing an unchosen branch no longer changes the selected story's results. Word Explorer shows distinct/repeated words and fixed prompts about capitals, end punctuation, subject/verb and revising a repeated word. It generates no student prose, diagnoses or mastery score. Existing authored text is preserved; rerunning an older story uses the corrected selected-branch analysis.

**Pattern/Sound:** immediate, validated editing supports keyboard use and makes the values being run explicit. Audio remains optional; all six learning flows work without sound.

## Verification

- Focused audit suite: **49 tests passed across 10 files**, with no unhandled errors.
- Full local suite: **1,360 tests passed across 188 files**, zero failures.
- Production build: passed on Next.js 16.4.3.
- TypeScript/ESLint: passed, with no errors or warnings.
- Explicit schools deployment configuration and geometry lock: passed. The default deployment assertion skips when student mode is unset.
- `npm audit`: **0 known vulnerabilities** at this check; no dependency additions were needed.
- Browser smoke now additionally checks invalid-draft blocking, Sound Studio playback/Stop, the robot diagram and Word Explorer. Its new CI result is recorded after execution; the earlier successful browser run is historical evidence for the prior application version.

## Remaining release gates

Forge still has no installed offline cold-start/reload pack. Complete registered-pet erasure and explicit orphan recovery/cleanup controls remain outstanding. Manual screen-reader, full keyboard/touch, muted-audio and cross-browser checks, and educator/curriculum approval, remain required. Grok stays disabled. These upgrades do not declare the entire platform release-ready.

See [architecture.md](architecture.md) for ownership and extension rules, and [verification.md](verification.md) for the original implementation evidence and production-release sequence.
