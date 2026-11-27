import { z } from "zod";

// These schemas guard public, unauthenticated API routes. The UI only ever
// sends a handful of traits, so generous caps on collection sizes and string
// lengths stop oversized payloads without affecting real use. In zod 4,
// z.number() already rejects NaN and Infinity.
const MAX_TRAITS = 64;
const MAX_ID_LENGTH = 200;

const idString = z.string().min(1).max(MAX_ID_LENGTH);

export const simulationRequestSchema = z.object({
  selectedTraitId: idString.optional(),
  deltas: z
    .record(z.string().max(MAX_ID_LENGTH), z.number())
    .refine((value) => Object.keys(value).length <= MAX_TRAITS, {
      message: `At most ${MAX_TRAITS} trait deltas are allowed`,
    }),
});

export const explanationToneSchema = z.enum(["story", "practical", "technical"]);

export const simulationResultSchema = z.object({
  traitId: idString,
  estimate: z.number(),
  lowerBound: z.number(),
  upperBound: z.number(),
  feasibility: z.number(),
  tradeoffWarning: z.string().max(500).optional(),
});

export const explanationRequestSchema = z.object({
  petId: idString,
  viewStateKey: idString,
  tone: explanationToneSchema,
  selectedTraitId: idString.optional(),
  simulation: z.array(simulationResultSchema).max(MAX_TRAITS),
});

export const sonifyParamsSchema = z.object({
  petId: z.string().trim().min(1).max(MAX_ID_LENGTH),
});
