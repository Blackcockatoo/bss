export function buildGeometrySoundIframeSrc(searchParams: { toString: () => string }) {
  const query = new URLSearchParams(searchParams.toString()).toString();
  return query ? `/geometry-sound.html?${query}` : '/geometry-sound.html';
}
