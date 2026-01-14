import { createWorker } from 'tesseract.js';

/**
 * OCR result with word-level bounding boxes
 */
export interface OCRWord {
  text: string;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

export interface OCRResult {
  text: string;
  words: OCRWord[];
}

/**
 * OCR progress callback for tracking recognition progress
 */
export type OCRProgressCallback = (progress: number, status: string) => void;

/**
 * OCR options for customization
 */
export interface OCROptions {
  lang?: string;
  onProgress?: OCRProgressCallback;
}

/**
 * Perform OCR on an image canvas and return text with word-level bounding boxes
 * This is used for images and scanned PDFs where PDF.js text coordinates aren't available
 *
 * Per Tesseract.js best practices (Context7):
 * - Uses logger option for progress tracking
 * - Properly terminates worker after use
 * - Handles errors gracefully
 */
export async function ocrImageCanvas(
  canvas: HTMLCanvasElement,
  langOrOptions: string | OCROptions = 'eng'
): Promise<OCRResult> {
  // Normalize options
  const options: OCROptions = typeof langOrOptions === 'string'
    ? { lang: langOrOptions }
    : langOrOptions;

  const lang = options.lang || 'eng';
  let worker;

  try {
    // Create worker with optional progress logger (per Tesseract.js docs)
    worker = await createWorker(lang, 1, {
      logger: options.onProgress
        ? (m: { status: string; progress: number }) => {
            options.onProgress!(Math.round(m.progress * 100), m.status);
          }
        : undefined
    });
  } catch (error) {
    // Enhanced error for worker creation failures (download, network, etc.)
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to initialize OCR worker:', errorMessage);
    throw new Error(`OCR initialization failed: ${errorMessage}. Check your internet connection and try again.`);
  }

  try {
    const { data } = await worker.recognize(canvas);

    // Extract word-level bounding boxes
    const words: OCRWord[] = (data.words || []).map((word: any) => ({
      text: word.text,
      bbox: {
        x: word.bbox.x0,
        y: word.bbox.y0,
        width: word.bbox.x1 - word.bbox.x0,
        height: word.bbox.y1 - word.bbox.y0,
      },
      confidence: word.confidence / 100, // Tesseract returns 0-100, normalize to 0-1
    }));

    return {
      text: data.text || '',
      words,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('OCR recognition failed:', errorMessage);
    throw new Error(`OCR processing failed: ${errorMessage}`);
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {
        console.warn('Failed to terminate OCR worker:', e);
      }
    }
  }
}

/**
 * Simple OCR that only returns text (for backward compatibility)
 */
export async function ocrCanvas(
  canvas: HTMLCanvasElement,
  lang: string = 'eng'
): Promise<string> {
  const result = await ocrImageCanvas(canvas, lang);
  return result.text;
}
