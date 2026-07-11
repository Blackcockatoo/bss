# Follow-up: adding a literal fifth evolution stage

The evolution upgrade shipped branch **apex variants** at SPECIATION instead
of a fifth `EvolutionState`: each genome path presents its own apex form
(title, palette, ceremony accent) with zero save migration. If a real fifth
stage is ever wanted, this is the checklist. The `EvolutionPanel` already
derives stage counts from `EVOLUTION_ORDER`, which shrinks the blast radius.

1. **`src/evolution/types.ts`** — add the new member to `EvolutionState` and
   `EVOLUTION_ORDER`, plus entries in `EVOLUTION_REQUIREMENTS`,
   `EVOLUTION_STAGE_INFO`, and `EVOLUTION_VISUALS`.
2. **`src/evolution/conditions.ts`** — decide the special condition for the
   new stage in `getConditionSpec`.
3. **`src/evolution/branching.ts`** — `getStageVisuals` /
   `getStageDisplayTitle` treat the *last* entry of `EVOLUTION_ORDER` as the
   apex, so they follow automatically; add an ability reveal count to
   `ABILITY_REVEAL_COUNT`.
4. **`src/evolution/index.ts`** — add essence grant + achievement id to
   `STAGE_ESSENCE_GRANTS` / `STAGE_ACHIEVEMENT_IDS`; add the achievement to
   `ACHIEVEMENT_CATALOG` in `src/progression/types.ts`.
5. **`src/lib/minigames/gameMath.ts`** — `STAGE_TIER` is
   `Record<EvolutionState, DifficultyTier>` with `DifficultyTier = 1|2|3|4`;
   widen the tier union (and `TIER_LABELS` in `ranks.ts`) and balance
   rewards.
6. **`src/components/EvolutionCeremony.tsx`** — `StageTransform` needs a
   transform for the new stage (currently one per existing stage).
7. **`src/pet/movement/movementVocabulary.ts`** — review
   `allowedEvolutionStates` on movement clips.
8. **Save compatibility** — old saves hold earlier states and load fine, but
   exported pet files re-import through the union type in
   `src/lib/persistence/indexeddb.ts`; verify `isValidEvolution` and any
   state-string switch statements.
9. **Copy** — `EvolutionPanel` footer prose and `RegistrationCertificate`
   default stage text reference stages by name.
