import type {
  AdvancedDnaMode,
  DnaModeRenderer,
  DnaVisualModel,
} from "../types";
import { createCascadeRenderer } from "./cascadeRenderer";
import { createFourDRenderer } from "./fourDRenderer";
import { createSigilRenderer } from "./sigilRenderer";
import { createVortexRenderer } from "./vortexRenderer";

export function createDnaModeRenderer(
  mode: AdvancedDnaMode,
  model: DnaVisualModel,
  animationNonce: number,
): DnaModeRenderer {
  if (mode === "sigil") return createSigilRenderer(model, animationNonce);
  if (mode === "cascade") return createCascadeRenderer(model, animationNonce);
  if (mode === "fourD") return createFourDRenderer(model, animationNonce);
  return createVortexRenderer(model, animationNonce);
}
