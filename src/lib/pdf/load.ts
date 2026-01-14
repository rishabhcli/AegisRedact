import { pdfjsLib } from './worker';

/**
 * Load a PDF document from various sources
 */
export async function loadPdf(data: ArrayBuffer | Uint8Array) {
  const doc = await (pdfjsLib as any).getDocument({ data }).promise;
  return doc;
}

/**
 * Render a PDF page to a canvas at the specified scale
 * Returns the page, canvas, and viewport for further processing
 *
 * Per PDF.js best practices (Context7):
 * - Supports HiDPI/Retina displays via devicePixelRatio
 * - Uses transform matrix for crisp rendering on high-res screens
 * - Sets both canvas dimensions and CSS dimensions separately
 */
export async function renderPageToCanvas(
  doc: any,
  pageIndex: number,
  scale = 2
): Promise<{ page: any; canvas: HTMLCanvasElement; viewport: any }> {
  const page = await doc.getPage(pageIndex + 1); // PDF pages are 1-indexed
  const viewport = page.getViewport({ scale });

  // Support HiDPI/Retina displays (per PDF.js docs)
  const outputScale = window.devicePixelRatio || 1;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Set actual canvas dimensions (scaled for HiDPI)
  canvas.width = Math.floor(viewport.width * outputScale);
  canvas.height = Math.floor(viewport.height * outputScale);

  // Set CSS display dimensions
  canvas.style.width = Math.floor(viewport.width) + 'px';
  canvas.style.height = Math.floor(viewport.height) + 'px';

  // Define transform matrix for HiDPI scaling
  const transform = outputScale !== 1
    ? [outputScale, 0, 0, outputScale, 0, 0]
    : null;

  await page.render({
    canvasContext: ctx,
    transform,
    viewport
  }).promise;

  return { page, canvas, viewport };
}

/**
 * Get the number of pages in a PDF document
 */
export function getPageCount(doc: any): number {
  return doc.numPages;
}
