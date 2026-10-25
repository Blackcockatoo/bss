# Project Forge execution branch

This implementation supplies six minimum working instruments, not a certified school release. The governing rule is capability and independence: no scores for attendance, compulsory disclosure, generated child writing, or LLM decisions.

## Executable flows

| Instrument | Child action | Deterministic evidence |
|---|---|---|
| Pattern Forge | Enter 2–16 integers; try starter, Fibonacci or MOSS60 seed digits; compare trials | Adjacent differences and constant-difference continuation, with explicit non-uniqueness caveat |
| Sound Studio | Choose pitches, fractional beat lengths, tempo and repetition; play only on gesture | Frequencies, duration, visual sequence; participation never requires sound |
| Discovery Lab | Predict fall time; vary height or gravity while holding the other fixed | Ideal free-fall model, explicitly excluding air resistance; compare earlier trial |
| Story Workshop | Write an opening and two endings; select a branch and revise | Original text, mechanical word/sentence segments, plain-text export; no generated prose or automated grading |
| Maker Bench | Assemble forward/turn instructions, run, revise toward (2,2) | Robot coordinates, orientation and path; no scripts, eval, imports or networking |
| Life Compass | Plan tasks and durations; identify source uncertainty | Time sum and source-check questions; no personal/psychological inference |

All instruments use `src/lib/tools/activities.ts`, optional SPARK writing, bounded runtime validation, and the same versioned Project shape. Reopen restores the inputs; running again derives the outcome instead of maintaining a second result authority. Saving an existing ID creates the next revision; stale revisions fail instead of overwriting another tab. Fifty projects are allowed per pet; saving a fifty-first fails visibly rather than silently removing work.

Switching tools starts a fresh input and reflection so unrelated writing does not leak into another instrument's artefact. Switching registered identity remounts the editor and clears drafts. Reflection is optional; verbal or visual explanation is valid evidence.

## Identity, acquired experience and behaviour

The registered `PetRecordV2` remains authoritative for genome, identity and inherited traits. Its genome hash supplies a stable transposition. The latest saved project's deterministic signal supplies a bounded sequence and tempo. `LearnedCompanionMotion` applies that sequence to the existing renderer only after **Show learned movement**; `ForgeMemoryBadge` renders the same sequence and offers optional sound. The companion does not need visits, infer feelings, or punish absence. Reduced motion provides a still explanation. Deleting a project recomputes the response from the remaining work; clearing all work removes it.

This is an acquired performance preference, not an autonomous consciousness or a claim that genome identity changes. Pattern, sound, model results, text structure, robot designs and practical plans all have inspectable signals. The per-pet memory is loaded again on a return visit and focus.

## Persistence ownership

- `MetaPetRegistryDB` / `PetRepository`: canonical identity, genome, active selection and progress. Existing MP2 packets remain unchanged and do not acquire private reflections implicitly.
- `MetaPetDB` v3 / `src/lib/persistence/indexeddb.ts`: legacy pet archive/history and the authoritative `learningMemory` store keyed by the **registered pet ID**.
- Previous v1/v2 `MetaPetDB` openers now delegate schema opening to the same migration function. The separate `meta-pet-db` historical archive is untouched.
- Retired `MetaPetProjectForge` v1: copy-on-first-read into canonical learning storage, then remove that pet's retired copy after the write commits. A canonical empty record prevents resurrection during racing loads.

The v1→v2 history migration remains intact; v3 adds a store without deleting pet stores. No genome, crest or identity is reminted. All Forge mutations use one IDB read-modify-write transaction, including conflict checks; they resolve only on transaction completion. Generation tokens prevent an old A→B→A hydration from replacing current memory. Unsupported/corrupt canonical data blocks normal edits and is preserved. Explicit backup replacement can recover it. Quota/abort errors remain errors, not successful-save messages.

Pet archive deletion writes its tombstone and empties canonical Forge memory in the same transaction. Retired Forge copies are purged first. **Archiving a pet deliberately retains its historical pet snapshots, matching the existing archive semantics.** It is not a promise of complete identity erasure. Automatic global orphan deletion is intentionally absent: deleting unknown IDs without proving ownership could erase recoverable work. A complete registered-pet erasure/orphan-management UI is still a release requirement.

## Portability

The workspace offers validated per-pet Forge JSON restore/export and an explicit full pet + Forge bundle. Full restore validates MP2 identity/hash/proof and every Forge record before writing. It saves the identity inactive, then writes learning; the UI activates the restored pet and reloads to hydrate all renderers consistently. The two databases cannot provide a shared atomic transaction: if the second write fails, the error explicitly says that identity restored but learning did not, and instructs keeping/retrying the source backup. No rollback can silently destroy an existing identity.

Backups contain private authored text and optional reflections. They download only on explicit user action and never go to AI or an account. Import enforces size, schema, pet ID and duplicate-ID limits.

## Extension and capability contract

Add a static `ForgeToolId`, metadata and declared `forgeContract`, a bounded ActivityInput schema, a pure `runActivity` branch and an editor. Add mathematical/safety, restore, revision, deletion and UI-flow tests. An unknown identifier cannot register scripts. The engine rejects school/field/studio contexts; the route/proxy also excludes Forge from school/Field policies. No runtime plugin loading or networking is granted by registry membership.

Curriculum descriptions here are learning objectives, not accredited curriculum-code mappings or mastery assessments. Teacher guidance supplies a bounded 15-minute predict/test/compare/explain session with verbal, written and visual alternatives. The existing seven-session school programme remains intact. Instruments require educator and browser safety review before admission into Field Mode.

## Offline and accessibility limits

Activities, persistence and export have no network dependency once the route is loaded. `/pet` and `/project-forge` now exclude consumer analytics. Route loading, framework navigation and initial script delivery still use the network. The current Field Pack service worker does **not** install the Forge route for offline cold starts. Do not claim restart/reload in airplane mode is supported. Extending it requires preserving the server-enforced Field boundary; blindly caching consumer pages could bypass that boundary.

Native labels, headings, buttons, text areas, number/range controls, touch targets of at least 44 CSS pixels, visual results and optional audio are implemented. New motion respects reduced-motion preferences. DOM interaction tests do not certify real keyboard, touch or screen-reader behaviour. Browser/mobile/assistive-technology verification remains mandatory.

## Deployment evidence

Read-only Vercel lookup on 25 October 2026 confirmed `www.bluesnakestudios.com` and `bluesnakestudios.com` on project `bss-l8cw`, deployment `dpl_CVHJD9xax1omJXFg9eXpeLWvABy9`, from `Blackcockatoo/bss` `main` at `a516fe71b118473199987a9e5ecf5f6ecd50a82f`. PR #179's original head was `1c4740664ae44599ff82cc9e0ea8f3bb001dc801`. Its CI failed two lint checks and two tests while two Vercel previews succeeded. The bluesnakestudios Vercel project skipped that preview. The bss-l8cw preview log ended with Deployment completed. Production ownership was verified rather than inferred from the project name.

No merge, promotion or production deployment is authorised by this branch. See `verification.md` for measured evidence and outstanding release gates.
