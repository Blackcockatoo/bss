import { z } from "zod";

// The constellation UI only ever sends one delta per visible trait node
// (a few dozen at most); this bound just keeps a malicious payload from
// forcing the server to iterate an arbitrarily large object.
const MAX_TRAIT_ENTRIES = 64;
const MAX_ID_LENGTH = 200;

const traitIdSchema = z.string().min(1).max(MAX_ID_LENGTH);

export const simulationRequestSchema = z.object({
  selectedTraitId: traitIdSchema.optional(),
  deltas: z
    .record(traitIdSchema, z.number().finite())
    .refine((deltas) => Object.keys(deltas).length <= MAX_TRAIT_ENTRIES, {
      message: `deltas may not contain more than ${MAX_TRAIT_ENTRIES} entries`,
    }),
});

export const explanationToneSchema = z.enum(["story", "practical", "technical"]);

export const simulationResultSchema = z.object({
  traitId: traitIdSchema,
  estimate: z.number().finite(),
  lowerBound: z.number().finite(),
  upperBound: z.number().finite(),
  feasibility: z.number().finite(),
  tradeoffWarning: z.string().max(500).optional(),
});

export const explanationRequestSchema = z.object({
  petId: traitIdSchema,
  viewStateKey: traitIdSchema,
  tone: explanationToneSchema,
  selectedTraitId: traitIdSchema.optional(),
  simulation: z.array(simulationResultSchema).max(MAX_TRAIT_ENTRIES),
});

export const sonifyParamsSchema = z.object({
  petId: z.string().trim().min(1).max(MAX_ID_LENGTH),
});

