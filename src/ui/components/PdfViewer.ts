/**
 * Native PDF viewer component using browser's built-in PDF renderer
 * Supports two modes:
 * - Initial view: Display original PDF with "Start Redacting" button
 * - Preview mode: Display redacted PDF with "Download" and "Back to Edit" buttons
 */

export class PdfViewer {
  private element: HTMLDivElement;
  private iframe: HTMLIFrameElement;
  private blobUrl: string | null = null;
  private onDownload: () => void;
  private onBack: () => void;
  private onStartRedacting: (() => void) | null = null;
  private mode: 'initial' | 'preview' = 'preview';

  constructor(onDownload: () => void, onBack: () => void, onStartRedacting?: () => void) {
    this.onDownload = onDownload;
    this.onBack = onBack;
    this.onStartRedacting = onStartRedacting || null;
    this.element = this.createViewer();
    this.iframe = this.element.querySelector('iframe')!;
  }

  private createViewer(): HTMLDivElement {
    const viewer = document.createElement('div');
    viewer.className = 'pdf-viewer';
    viewer.style.display = 'none';

    viewer.innerHTML = `
      <div class="pdf-viewer-header">
        <div class="pdf-viewer-title">
          <h2 id="pdf-viewer-title">Redacted PDF Preview</h2>
          <p id="pdf-viewer-subtitle">Your document has been redacted. Review it below.</p>
        </div>
        <div class="pdf-viewer-actions">
          <button id="pdf-back-btn" class="btn btn-secondary" aria-label="Back to editing" style="display: none;">
            <span>← Back to Edit</span>
          </button>
          <button id="pdf-start-redacting-btn" class="btn btn-primary" aria-label="Start redacting" style="display: none;">
            <span>Start Redacting →</span>
          </button>
          <button id="pdf-download-btn" class="btn btn-primary" aria-label="Download redacted PDF" style="display: none;">
            <span>Download PDF</span>
          </button>
        </div>
      </div>
      <div class="pdf-viewer-content">
        <iframe
          title="PDF Preview"
          frameborder="0"
          width="100%"
          height="100%"
        ></iframe>
      </div>
    `;

    // Setup event listeners
    viewer.querySelector('#pdf-download-btn')?.addEventListener('click', () => {
      this.onDownload();
    });

    viewer.querySelector('#pdf-back-btn')?.addEventListener('click', () => {
      this.onBack();
    });

    viewer.querySelector('#pdf-start-redacting-btn')?.addEventListener('click', () => {
      if (this.onStartRedacting) {
        this.onStartRedacting();
      }
    });

    return viewer;
  }

  /**
   * Display the original PDF in initial view mode (before redaction)
   */
  showInitialView(pdfBytes: ArrayBuffer) {
    this.mode = 'initial';
    this.updateHeader();
    this.displayPdf(pdfBytes);
  }

  /**
   * Display a redacted PDF in preview mode (after redaction)
   */
  show(pdfBytes: Uint8Array) {
    this.mode = 'preview';
    this.updateHeader();
    this.displayPdf(pdfBytes);
  }

  /**
   * Update header text and buttons based on current mode
   */
  private updateHeader() {
    const titleEl = this.element.querySelector('#pdf-viewer-title') as HTMLElement;
    const subtitleEl = this.element.querySelector('#pdf-viewer-subtitle') as HTMLElement;
    const backBtn = this.element.querySelector('#pdf-back-btn') as HTMLElement;
    const startBtn = this.element.querySelector('#pdf-start-redacting-btn') as HTMLElement;
    const downloadBtn = this.element.querySelector('#pdf-download-btn') as HTMLElement;

    if (this.mode === 'initial') {
      titleEl.textContent = 'PDF Document';
      subtitleEl.textContent = 'Review your document using the browser\'s native PDF viewer. Click "Start Redacting" when ready.';
      backBtn.style.display = 'none';
      startBtn.style.display = 'inline-block';
      downloadBtn.style.display = 'none';
    } else {
      titleEl.textContent = 'Redacted PDF Preview';
      subtitleEl.textContent = 'Your document has been redacted. Review it below.';
      backBtn.style.display = 'inline-block';
      startBtn.style.display = 'none';
      downloadBtn.style.display = 'inline-block';
    }
  }

  /**
   * Display a PDF from bytes using browser's native viewer
   */
  private displayPdf(pdfBytes: ArrayBuffer | Uint8Array) {
    // Clean up previous blob URL if it exists
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
    }

    // Create blob and URL
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    this.blobUrl = URL.createObjectURL(blob);

    // Set iframe source
    this.iframe.src = this.blobUrl;

    // Show the viewer with animation
    this.element.style.display = 'flex';
    this.element.style.opacity = '0';
    this.element.style.transform = 'scale(1.05)';
    this.element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

    requestAnimationFrame(() => {
      this.element.style.opacity = '1';
      this.element.style.transform = 'scale(1)';
    });
  }

  /**
   * Hide the viewer and clean up resources
   */
  hide() {
    // Animate out
    this.element.style.opacity = '1';
    this.element.style.transform = 'scale(1)';
    this.element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

    requestAnimationFrame(() => {
      this.element.style.opacity = '0';
      this.element.style.transform = 'scale(0.95)';
    });

    setTimeout(() => {
      this.element.style.display = 'none';

      // Clean up blob URL
      if (this.blobUrl) {
        URL.revokeObjectURL(this.blobUrl);
        this.blobUrl = null;
      }

      // Clear iframe
      this.iframe.src = '';
    }, 300);
  }

  getElement(): HTMLDivElement {
    return this.element;
  }

  /**
   * Clean up resources when component is destroyed
   */
  destroy() {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
  }
}
