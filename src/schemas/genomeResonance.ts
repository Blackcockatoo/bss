import { z } from "zod";

export const simulationRequestSchema = z.object({
  selectedTraitId: z.string().min(1).optional(),
  deltas: z.record(z.string(), z.number()),
});

export const explanationToneSchema = z.enum(["story", "practical", "technical"]);

export const simulationResultSchema = z.object({
  traitId: z.string().min(1),
  estimate: z.number(),
  lowerBound: z.number(),
  upperBound: z.number(),
  feasibility: z.number(),
  tradeoffWarning: z.string().optional(),
});

export const explanationRequestSchema = z.object({
  petId: z.string().min(1),
  viewStateKey: z.string().min(1),
  tone: explanationToneSchema,
  selectedTraitId: z.string().min(1).optional(),
  simulation: z.array(simulationResultSchema),
});

export const sonifyParamsSchema = z.object({
  petId: z.string().trim().min(1),
});

