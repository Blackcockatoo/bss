export async function svgElementToPngDataUrl(svg: SVGSVGElement, maxDimension = 480): Promise<string> {
  const viewBox = svg.viewBox.baseVal;
  const aspect = viewBox && viewBox.width && viewBox.height ? viewBox.width / viewBox.height : 1;
  const width = aspect >= 1 ? maxDimension : Math.round(maxDimension * aspect);
  const height = aspect >= 1 ? Math.round(maxDimension / aspect) : maxDimension;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const svgString = new XMLSerializer().serializeToString(clone);
  const svgUrl = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }));

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to rasterize body preview.'));
      img.src = svgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not supported in this browser.');
    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export function dataUrlByteLength(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return Math.ceil((base64.length * 3) / 4);
}
