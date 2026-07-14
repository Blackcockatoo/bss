const DEFAULT_MAX_DIMENSION = 480;
const DEFAULT_MIN_PIXEL_RATIO = 2;
const MAX_PIXEL_RATIO = 3;

export interface SvgToPngOptions {
  maxDimension?: number;
  pixelRatio?: number;
}

export interface SvgExportDimensions {
  width: number;
  height: number;
  pixelRatio: number;
  pixelWidth: number;
  pixelHeight: number;
}

function positiveNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getSvgSourceDimensions(svg: SVGSVGElement): { width: number; height: number } {
  const viewBox = svg.getAttribute('viewBox')
    ?.trim()
    .split(/[\s,]+/)
    .map(Number);

  if (
    viewBox?.length === 4 &&
    Number.isFinite(viewBox[2]) &&
    Number.isFinite(viewBox[3]) &&
    viewBox[2] > 0 &&
    viewBox[3] > 0
  ) {
    return { width: viewBox[2], height: viewBox[3] };
  }

  const attributeWidth = positiveNumber(svg.getAttribute('width'));
  const attributeHeight = positiveNumber(svg.getAttribute('height'));
  if (attributeWidth && attributeHeight) {
    return { width: attributeWidth, height: attributeHeight };
  }

  const bounds = svg.getBoundingClientRect();
  if (bounds.width > 0 && bounds.height > 0) {
    return { width: bounds.width, height: bounds.height };
  }

  throw new Error('The body preview has no exportable dimensions.');
}

export function getSvgExportDimensions(
  svg: SVGSVGElement,
  options: SvgToPngOptions = {},
): SvgExportDimensions {
  const { width: sourceWidth, height: sourceHeight } = getSvgSourceDimensions(svg);
  const maxDimension = Math.max(1, options.maxDimension ?? DEFAULT_MAX_DIMENSION);
  const requestedPixelRatio =
    options.pixelRatio ??
    Math.max(globalThis.devicePixelRatio || 1, DEFAULT_MIN_PIXEL_RATIO);
  const pixelRatio = Math.min(MAX_PIXEL_RATIO, Math.max(1, requestedPixelRatio));
  const aspectRatio = sourceWidth / sourceHeight;
  const width = aspectRatio >= 1 ? maxDimension : Math.round(maxDimension * aspectRatio);
  const height = aspectRatio >= 1 ? Math.round(maxDimension / aspectRatio) : maxDimension;

  return {
    width,
    height,
    pixelRatio,
    pixelWidth: Math.max(1, Math.round(width * pixelRatio)),
    pixelHeight: Math.max(1, Math.round(height * pixelRatio)),
  };
}

export async function svgElementToPngDataUrl(
  svg: SVGSVGElement,
  options: SvgToPngOptions = {},
): Promise<string> {
  const dimensions = getSvgExportDimensions(svg, options);
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('width', String(dimensions.pixelWidth));
  clone.setAttribute('height', String(dimensions.pixelHeight));
  clone.setAttributeNS(
    'http://www.w3.org/2000/xmlns/',
    'xmlns',
    'http://www.w3.org/2000/svg',
  );
  clone.setAttributeNS(
    'http://www.w3.org/2000/xmlns/',
    'xmlns:xlink',
    'http://www.w3.org/1999/xlink',
  );

  const svgString = new XMLSerializer().serializeToString(clone);
  const svgUrl = URL.createObjectURL(
    new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }),
  );

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to rasterize body preview.'));
      img.src = svgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = dimensions.pixelWidth;
    canvas.height = dimensions.pixelHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is not supported in this browser.');

    // A newly-cleared canvas is transparent. Do not paint the selected Forge
    // preview background into an identity avatar.
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Safari and privacy-hardened browsers may throw SecurityError here when
    // canvas contents are considered tainted. Let the caller show a safe error.
    const dataUrl = canvas.toDataURL('image/png');
    if (!dataUrl.startsWith('data:image/png;base64,')) {
      throw new Error('The browser did not produce a PNG avatar.');
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export function dataUrlByteLength(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex < 0) return 0;
  const base64 = dataUrl.slice(commaIndex + 1).replace(/\s/g, '');
  if (!base64) return 0;
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}
