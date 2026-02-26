/**
 * Enhanced QR Scanner with multi-strategy preprocessing
 * Improves detection for QR codes with logos, low contrast, or difficult lighting
 */

import jsQR, { QRCode } from 'jsqr';
import {
  applyStrategy,
  getStrategies,
  type PreprocessingStrategy,
} from './imageProcessing';

export interface ScanResult {
  data: string;
  strategy: PreprocessingStrategy;
  location: QRCode['location'];
}

export interface ScanOptions {
  /** Maximum number of strategies to try before giving up */
  maxAttempts?: number;
  /** Specific strategies to try (overrides default order) */
  strategies?: PreprocessingStrategy[];
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Scan image data for QR code using multiple preprocessing strategies
 * Returns the first successful decode or null if none work
 */
export function scanWithStrategies(
  imageData: ImageData,
  options: ScanOptions = {}
): ScanResult | null {
  const {
    maxAttempts = 7,
    strategies = getStrategies(),
    debug = false,
  } = options;

  const attemptsToTry = strategies.slice(0, maxAttempts);

  for (const strategy of attemptsToTry) {
    try {
      const processed = applyStrategy(imageData, strategy);
      const result = jsQR(processed.data, processed.width, processed.height, {
        inversionAttempts: 'dontInvert', // We handle inversion ourselves
      });

      if (result) {
        if (debug) {
          console.debug(`[QR Scanner] Success with strategy: ${strategy}`);
        }
        return {
          data: result.data,
          strategy,
          location: result.location,
        };
      }
    } catch (error) {
      if (debug) {
        console.debug(`[QR Scanner] Strategy ${strategy} failed:`, error);
      }
    }
  }

  // Try jsQR's built-in inversion as last resort
  try {
    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });

    if (result) {
      if (debug) {
        console.debug('[QR Scanner] Success with jsQR attemptBoth');
      }
      return {
        data: result.data,
        strategy: 'none',
        location: result.location,
      };
    }
  } catch {
    // Ignore
  }

  return null;
}

/**
 * Extract and process a region of interest from the center of the image
 * Useful when QR code is known to be in the center
 */
export function extractCenterRegion(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  regionRatio: number = 0.7
): ImageData {
  const regionWidth = Math.floor(width * regionRatio);
  const regionHeight = Math.floor(height * regionRatio);
  const offsetX = Math.floor((width - regionWidth) / 2);
  const offsetY = Math.floor((height - regionHeight) / 2);

  return ctx.getImageData(offsetX, offsetY, regionWidth, regionHeight);
}

/**
 * Scale down image for faster processing while maintaining aspect ratio
 */
export function scaleDown(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  maxDimension: number = 640
): ImageData {
  const { width, height } = sourceCanvas;

  if (width <= maxDimension && height <= maxDimension) {
    return ctx.getImageData(0, 0, width, height);
  }

  const scale = maxDimension / Math.max(width, height);
  const newWidth = Math.floor(width * scale);
  const newHeight = Math.floor(height * scale);

  // Create temporary canvas for scaling
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = newWidth;
  tempCanvas.height = newHeight;
  const tempCtx = tempCanvas.getContext('2d');

  if (!tempCtx) {
    return ctx.getImageData(0, 0, width, height);
  }

  tempCtx.drawImage(sourceCanvas, 0, 0, newWidth, newHeight);
  return tempCtx.getImageData(0, 0, newWidth, newHeight);
}

/**
 * Create a scanning session that maintains state between frames
 * Useful for continuous scanning from video
 */
export function createScanSession(options: ScanOptions = {}) {
  let lastSuccessfulStrategy: PreprocessingStrategy | null = null;
  let frameCount = 0;

  return {
    /**
     * Scan a single frame, prioritizing last successful strategy
     */
    scanFrame(imageData: ImageData): ScanResult | null {
      frameCount++;

      // Every 10th frame, try all strategies to adapt to changing conditions
      const shouldTryAll = frameCount % 10 === 0;

      let strategies = options.strategies || getStrategies();

      // Prioritize last successful strategy (but not every frame)
      if (lastSuccessfulStrategy && !shouldTryAll) {
        strategies = [
          lastSuccessfulStrategy,
          ...strategies.filter(s => s !== lastSuccessfulStrategy),
        ];
      }

      const result = scanWithStrategies(imageData, {
        ...options,
        strategies,
      });

      if (result) {
        lastSuccessfulStrategy = result.strategy;
      }

      return result;
    },

    /**
     * Reset session state
     */
    reset() {
      lastSuccessfulStrategy = null;
      frameCount = 0;
    },

    /**
     * Get current session stats
     */
    getStats() {
      return {
        frameCount,
        lastSuccessfulStrategy,
      };
    },
  };
}
