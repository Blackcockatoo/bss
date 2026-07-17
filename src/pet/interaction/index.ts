export {
  GESTURE_THRESHOLDS,
  classifyGesture,
  clampGazeOffset,
  deriveInteractionOverlay,
  normalizePointerPosition,
  reduceInteractionState,
  shouldApplyInteractionOverlay,
  DEFAULT_INTERACTION_CONTEXT,
} from "./touchNervousSystem";
export type { StageGeometry, GestureWindow, InteractionOverlay, ReduceResult } from "./touchNervousSystem";
export { useTouchNervousSystem } from "./useTouchNervousSystem";
export type { TouchNervousSystemApi, TouchNervousSystemInputs } from "./useTouchNervousSystem";
export type {
  GestureSignals,
  InteractionContext,
  InteractionEvent,
  InteractionEventType,
  InteractionState,
  PointerKind,
  PointerRegion,
  PointerSample,
} from "./types";
