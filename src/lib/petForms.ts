export const PET_FORMS = ['auralia', 'evolved', 'geometry'] as const;

export type PetForm = (typeof PET_FORMS)[number];

/**
 * The one renderer the Body Forge returns to after save/apply/import. The
 * forged BodySpec is only rendered by the Evolved form, so every Forge exit
 * path must select this — never a literal string, and never the legacy
 * `geometric` value.
 */
export const BODY_FORGE_RETURN_FORM: PetForm = 'evolved';

/**
 * Resolve current and historical body labels to the canonical three-form
 * companion contract. Historical `geometric` saves used the Visual DNA / Body
 * Forge renderer, so they migrate to `evolved` rather than the new Geometry
 * form.
 */
export function normalizePetForm(
  value: unknown,
  fallback: PetForm = 'auralia',
): PetForm {
  if (value === 'auralia' || value === 'evolved' || value === 'geometry') {
    return value;
  }

  if (value === 'geometric' || value === 'hybrid') {
    return 'evolved';
  }

  if (value === 'organic') {
    return 'auralia';
  }

  return fallback;
}
