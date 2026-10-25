# Living Genome: breeding, heraldry and registration

## Repository scope

Follow-up to Battle/Vimana PR #180, implemented on
`forge/living-genome-lineage-registration`. The initial checkout was clean at
local commit `683e265`; that commit's source tree matches published commit
`e36a20647af6831f45a570ac712aca414f5ebb7e`.

The real breeding entry point remains `BreedingChamber` within the advanced
`/pet` tools. Registration is performed by the existing registered-breeding
engine and repository, with certificates accessed from `/pet` or the newly
registered child's confirmation. The existing `PetProfilePanel` and
`HeraldryLegend` use the shared coat renderer. No prototype routes were added.

## Implemented changes

- **Breeding:** responsive parent heraldry cards; choose/preview/register progress
  indicator; exact genome contribution bar; a clear child-preview heading;
  collapsible inheritance/fingerprint details; and a registered-child confirmation
  with its birth certificate. Parent/blend/name controls are locked during async
  operations. A synchronous operation guard prevents repeated registration taps.
  Changing parents clears the old preview. Clipboard failure is explained in place.
- **Coats of arms:** restrained metallic rims, lighting and gold; responsive SVGs;
  meaningful accessible names/descriptions; typed lineage markers; shield clipping;
  and unique per-instance gradient, clip and title IDs. The existing saltire drawing
  incorrectly filled adjacent wedges; it now fills opposing wedges. The guide uses
  the same charge paths as saved coats rather than separate emoji illustrations.
- **Customisation:** regeneration previews a candidate before replacing the saved
  coat. Keep/cancel controls preserve the current shield until accepted. A proposal
  is scoped to its companion ID and cannot be saved to another companion after
  switching identity.
- **Shared heraldry loading:** certificate and profile now use one validated local
  loader/hook with same-tab and cross-tab refresh. Valid saved designs, mottos and
  the original `auralia_coat_of_arms_<petId>` keys are retained. Damaged/unavailable
  storage receives a temporary display; reads never overwrite damaged data.
- **Certificate:** native modal dialog with Escape/close handling, native focus
  containment and focus/scroll restoration; clearer identity and proof status;
  responsive detail layouts; collapsed technical data; visible clipboard/share/
  popup error handling; a downloadable real MP2 backup; and print output containing
  the actual displayed shield and full companion ID. Printed names are escaped.
  External Google Fonts imports were removed so printing needs no font service.

Affected source components: `BreedingChamber`, `RegistrationCertificate`,
`addons/PetProfilePanel`, `lineage/CoatOfArmsRenderer`, `lineage/HeraldryLegend`,
new `lineage/usePetHeraldry`, `lib/lineage/storage`, and the existing Living Genome
stylesheet. Corresponding regression coverage is included.

## Mechanics and records preserved

The registered-breeding engine, inheritance mathematics, mutation rules, conception
packets, preview fingerprint comparison, registration proofs, genome schemas,
lineage records, active-companion selection and local registry persistence have not
been rewritten. Registering a child still leaves the active companion selected.
Coat decoration remains local customisation, separate from registered DNA/ancestry.
An MP2 backup contains the existing companion packet; decorative heraldry remains
separate and is described as such in the backup confirmation. This change does not
claim new portable coat inheritance or add owner-data collection.

## Validation

Baseline: 20 breeding/registration tests passed.

Release checks:

- Full Vitest suite: **192 files / 1,385 tests passed**.
- Targeted heraldry/breeding/certificate/profile checks passed; dedicated export
  checks verify that the download contains an actual `MP2.` packet.
- `npm run lint`: school-document check, TypeScript and ESLint passed.
- `npm run build`: production webpack build passed.
- `git diff --check`: passed.

Regression cases cover saved-coat preservation, damaged/blocked storage, SVG ID
isolation, registration input locking, failed-registration recovery, preview
invalidation, accepted/cancelled coat changes, companion switching, closed-modal
side effects, modal lifecycle, clipboard failure, escaped offline print output
and real backup content. Dialog methods are mocked in unit tests; these tests do
not constitute native-browser focus-trap verification.

All eight heraldic divisions were rendered from the actual React SVG renderer
with libvips and visually inspected for shield clipping, field layout, charge
placement and metallic finish. This was artwork verification, not a screenshot
of the application. Full browser/mobile layout and print-dialog verification
remain open because the environment has no Chromium binary and the earlier
installation attempt failed with a truncated download. No frame-rate claims or
live production deployment are made.
