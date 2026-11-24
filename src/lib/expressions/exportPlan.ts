/**
 * Bounded export plans and a cancellable worker request helper.
 *
 * Kept free of DOM rendering so frame budgets, timeouts and failure handling
 * can be unit-tested without a browser.
 */
export const MIN_ANIMATION_FRAMES = 10;
export const MAX_ANIMATION_FRAMES = 32;
/** Browsers treat GIF delays under 20 ms as 100 ms, so never go below it. */
export const MIN_FRAME_DELAY_MS = 20;
export const MAX_PACK_STICKERS = 40;
export const MAX_PACK_BYTES = 48 * 1024 * 1024;
/** A whole export job is stopped after this long so the studio can't hang. */
export const EXPORT_TIME_LIMIT_MS = 120_000;
/** A single worker reply should take well under a second; this only catches a stuck worker. */
export const WORKER_REPLY_LIMIT_MS = 20_000;

export type AnimationPlan = { frames: number; delay: number; phases: number[] };

export function planAnimation(durationMs: number, loop: boolean, reducedMotion = false): AnimationPlan {
  const duration = Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 1000;
  const frames = reducedMotion ? 1 :
    Math.max(MIN_ANIMATION_FRAMES, Math.min(MAX_ANIMATION_FRAMES, Math.round(duration / 85)));
  const delay = Math.max(MIN_FRAME_DELAY_MS, Math.round(duration / frames / 10) * 10);
  // A loop never repeats its first frame at the end; a one-shot ends on the final pose.
  const span = loop ? frames : Math.max(1, frames - 1);
  return { frames, delay, phases: Array.from({ length: frames }, (_, index) => frames === 1 ? 0 : index / span) };
}

export class ExportTimeoutError extends Error {
  constructor(message = "The export took too long and was stopped. Try a PNG or a smaller pack.") {
    super(message);
    this.name = "ExportTimeoutError";
  }
}

type WorkerLike = Pick<Worker, "postMessage" | "addEventListener" | "removeEventListener">;

/** Posts one message and resolves with the worker's next reply, rejecting on error, abort or timeout. */
export function workerRequest<T>(
  worker: WorkerLike, message: unknown, transfer: Transferable[], signal: AbortSignal,
  failure: string, timeoutMs = WORKER_REPLY_LIMIT_MS,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    function clean() {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      worker.removeEventListener("message", response as EventListener);
      worker.removeEventListener("error", fail);
      worker.removeEventListener("messageerror", fail);
    }
    function fail() {
      clean();
      reject(new Error(failure));
    }
    function abort() {
      clean();
      reject(signal.reason);
    }
    function response(event: MessageEvent<{ error?: string } & T>) {
      clean();
      if (event.data && typeof event.data.error === "string") reject(new Error(event.data.error));
      else resolve(event.data);
    }
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    signal.addEventListener("abort", abort, { once: true });
    worker.addEventListener("message", response as EventListener, { once: true });
    worker.addEventListener("error", fail, { once: true });
    worker.addEventListener("messageerror", fail, { once: true });
    const timer = setTimeout(() => {
      clean();
      reject(new ExportTimeoutError(failure));
    }, timeoutMs);
    try {
      worker.postMessage(message, transfer);
    } catch (error) {
      clean();
      reject(error);
    }
  });
}

export function startWorker(create: () => Worker, failure: string): Worker {
  try {
    return create();
  } catch {
    throw new Error(failure);
  }
}
