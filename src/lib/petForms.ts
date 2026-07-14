export const PET_FORMS = ['auralia', 'evolved', 'geometry'] as const;

export type PetForm = (typeof PET_FORMS)[number];

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
