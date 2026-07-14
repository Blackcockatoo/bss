import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  dataUrlByteLength,
  getSvgExportDimensions,
  svgElementToPngDataUrl,
} from '@/lib/media/svgToPngDataUrl';

const VALID_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

function createSvg(viewBox = '0 0 280 250') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', viewBox);
  svg.append(document.createElementNS('http://www.w3.org/2000/svg', 'circle'));
  return svg;
}

describe('svgElementToPngDataUrl', () => {
  const createObjectURL = vi.fn(() => 'blob:body-forge-avatar');
  const revokeObjectURL = vi.fn();
  const clearRect = vi.fn();
  const drawImage = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    vi.stubGlobal(
      'Image',
      class MockSafariImage {
        decoding = '';
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;

        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      },
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect,
      drawImage,
    } as never);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(VALID_PNG);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    clearRect.mockClear();
    drawImage.mockClear();
  });

  it('preserves aspect ratio, exports at high DPI, and keeps the background transparent', async () => {
    const svg = createSvg();
    const dimensions = getSvgExportDimensions(svg, {
      maxDimension: 480,
      pixelRatio: 2,
    });

    expect(dimensions).toEqual({
      width: 480,
      height: 429,
      pixelRatio: 2,
      pixelWidth: 960,
      pixelHeight: 858,
    });

    await expect(
      svgElementToPngDataUrl(svg, { maxDimension: 480, pixelRatio: 2 }),
    ).resolves.toBe(VALID_PNG);

    const canvas = drawImage.mock.calls[0][0] as HTMLImageElement;
    expect(canvas).toBeDefined();
    expect(clearRect).toHaveBeenCalledWith(0, 0, 960, 858);
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 960, 858);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:body-forge-avatar');
  });

  it('uses the image load event path supported by mobile Safari', async () => {
    await expect(svgElementToPngDataUrl(createSvg())).resolves.toBe(VALID_PNG);
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
  });

  it('revokes the temporary URL after canvas security failures', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(() => {
      throw new DOMException('Tainted canvas', 'SecurityError');
    });

    await expect(svgElementToPngDataUrl(createSvg())).rejects.toMatchObject({
      name: 'SecurityError',
    });
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:body-forge-avatar');
  });

  it('fails before allocating an object URL when the SVG has no usable dimensions', async () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    await expect(svgElementToPngDataUrl(svg)).rejects.toThrow(
      /no exportable dimensions/i,
    );
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('calculates padded data URL byte lengths exactly', () => {
    expect(dataUrlByteLength('data:image/png;base64,YQ==')).toBe(1);
    expect(dataUrlByteLength('data:image/png;base64,YWI=')).toBe(2);
    expect(dataUrlByteLength('not-a-data-url')).toBe(0);
  });
});
