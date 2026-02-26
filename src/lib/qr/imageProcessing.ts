/**
 * QR Code Image Preprocessing Utilities
 * Improves QR code detection for codes with logo overlays, low contrast, or noise
 */

export interface ProcessedImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/**
 * Convert image to grayscale
 */
export function toGrayscale(imageData: ImageData): ImageData {
  const data = new Uint8ClampedArray(imageData.data);

  for (let i = 0; i < data.length; i += 4) {
    // Luminosity method: 0.299*R + 0.587*G + 0.114*B
    const gray = Math.round(
      data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    );
    data[i] = gray;     // R
    data[i + 1] = gray; // G
    data[i + 2] = gray; // B
    // Alpha stays the same
  }

  return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Apply contrast enhancement
 */
export function enhanceContrast(imageData: ImageData, factor: number = 1.5): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const intercept = 128 * (1 - factor);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, factor * data[i] + intercept));
    data[i + 1] = Math.min(255, Math.max(0, factor * data[i + 1] + intercept));
    data[i + 2] = Math.min(255, Math.max(0, factor * data[i + 2] + intercept));
  }

  return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Apply binary threshold (converts to black and white)
 */
export function binaryThreshold(imageData: ImageData, threshold: number = 128): ImageData {
  const data = new Uint8ClampedArray(imageData.data);

  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i]; // Assuming already grayscale
    const value = gray > threshold ? 255 : 0;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Calculate Otsu's threshold for optimal binarization
 */
export function calculateOtsuThreshold(imageData: ImageData): number {
  const histogram = new Array(256).fill(0);
  const data = imageData.data;
  const totalPixels = imageData.width * imageData.height;

  // Build histogram
  for (let i = 0; i < data.length; i += 4) {
    histogram[data[i]]++;
  }

  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let maxVariance = 0;
  let threshold = 0;

  for (let i = 0; i < 256; i++) {
    wB += histogram[i];
    if (wB === 0) continue;

    wF = totalPixels - wB;
    if (wF === 0) break;

    sumB += i * histogram[i];

    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const variance = wB * wF * (mB - mF) * (mB - mF);

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = i;
    }
  }

  return threshold;
}

/**
 * Apply adaptive threshold using local mean
 */
export function adaptiveThreshold(
  imageData: ImageData,
  blockSize: number = 11,
  constant: number = 2
): ImageData {
  const { width, height, data } = imageData;
  const result = new Uint8ClampedArray(data);
  const halfBlock = Math.floor(blockSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate local mean
      let sum = 0;
      let count = 0;

      for (let dy = -halfBlock; dy <= halfBlock; dy++) {
        for (let dx = -halfBlock; dx <= halfBlock; dx++) {
          const nx = x + dx;
          const ny = y + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            sum += data[(ny * width + nx) * 4];
            count++;
          }
        }
      }

      const mean = sum / count;
      const idx = (y * width + x) * 4;
      const value = data[idx] > mean - constant ? 255 : 0;

      result[idx] = value;
      result[idx + 1] = value;
      result[idx + 2] = value;
    }
  }

  return new ImageData(result, width, height);
}

/**
 * Invert image colors (for light-on-dark QR codes)
 */
export function invertColors(imageData: ImageData): ImageData {
  const data = new Uint8ClampedArray(imageData.data);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }

  return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Sharpen image to improve edge detection
 */
export function sharpen(imageData: ImageData, strength: number = 1): ImageData {
  const { width, height, data } = imageData;
  const result = new Uint8ClampedArray(data);

  // Sharpening kernel
  const kernel = [
    0, -strength, 0,
    -strength, 1 + 4 * strength, -strength,
    0, -strength, 0
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        let ki = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4 + c;
            sum += data[idx] * kernel[ki++];
          }
        }

        const idx = (y * width + x) * 4 + c;
        result[idx] = Math.min(255, Math.max(0, sum));
      }
    }
  }

  return new ImageData(result, width, height);
}

/**
 * Mask center region (for QR codes with logo overlays)
 * Fills center with white to help decoder ignore logo
 */
export function maskCenter(
  imageData: ImageData,
  maskRatio: number = 0.3
): ImageData {
  const { width, height, data } = imageData;
  const result = new Uint8ClampedArray(data);

  const centerX = width / 2;
  const centerY = height / 2;
  const maskWidth = width * maskRatio;
  const maskHeight = height * maskRatio;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = Math.abs(x - centerX);
      const dy = Math.abs(y - centerY);

      if (dx < maskWidth / 2 && dy < maskHeight / 2) {
        const idx = (y * width + x) * 4;
        result[idx] = 255;     // R
        result[idx + 1] = 255; // G
        result[idx + 2] = 255; // B
      }
    }
  }

  return new ImageData(result, width, height);
}

export type PreprocessingStrategy =
  | 'none'
  | 'grayscale'
  | 'contrast'
  | 'threshold'
  | 'adaptive'
  | 'inverted'
  | 'sharpen'
  | 'masked'
  | 'full';

/**
 * Apply a preprocessing strategy to image data
 */
export function applyStrategy(
  imageData: ImageData,
  strategy: PreprocessingStrategy
): ImageData {
  switch (strategy) {
    case 'none':
      return imageData;

    case 'grayscale':
      return toGrayscale(imageData);

    case 'contrast':
      return enhanceContrast(toGrayscale(imageData), 1.5);

    case 'threshold': {
      const gray = toGrayscale(imageData);
      const threshold = calculateOtsuThreshold(gray);
      return binaryThreshold(gray, threshold);
    }

    case 'adaptive':
      return adaptiveThreshold(toGrayscale(imageData), 15, 5);

    case 'inverted': {
      const gray = toGrayscale(imageData);
      const threshold = calculateOtsuThreshold(gray);
      return invertColors(binaryThreshold(gray, threshold));
    }

    case 'sharpen':
      return sharpen(toGrayscale(imageData), 0.5);

    case 'masked': {
      const gray = toGrayscale(imageData);
      const threshold = calculateOtsuThreshold(gray);
      return maskCenter(binaryThreshold(gray, threshold), 0.25);
    }

    case 'full': {
      const gray = toGrayscale(imageData);
      const contrasted = enhanceContrast(gray, 1.3);
      const sharpened = sharpen(contrasted, 0.3);
      const threshold = calculateOtsuThreshold(sharpened);
      return binaryThreshold(sharpened, threshold);
    }

    default:
      return imageData;
  }
}

/**
 * Get all preprocessing strategies to try in order of preference
 */
export function getStrategies(): PreprocessingStrategy[] {
  return [
    'none',      // Try raw first (fastest)
    'contrast',  // Simple contrast enhancement
    'threshold', // Otsu's threshold
    'adaptive',  // Local adaptive threshold
    'masked',    // Center masked for logos
    'inverted',  // For inverted QR codes
    'full',      // Full preprocessing pipeline
  ];
}
