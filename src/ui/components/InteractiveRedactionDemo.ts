/**
 * Interactive Redaction Demo
 * Shows live redaction simulation in the hero section
 */

export class InteractiveRedactionDemo {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sampleTexts: Array<{ text: string; x: number; y: number; detected: boolean; type: string }> = [];
  private detectionInterval: number | null = null;

  constructor() {
    this.container = this.createContainer();
    this.canvas = this.createCanvas();
    this.ctx = this.canvas.getContext('2d')!;
    this.init();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'redaction-demo-container';
    container.style.cssText = `
      position: relative;
      max-width: 600px;
      margin: 2rem auto;
      padding: 2rem;
      background: rgba(26, 31, 53, 0.8);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    `;
    return container;
  }

  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 560;
    canvas.height = 300;
    canvas.style.cssText = `
      width: 100%;
      border-radius: 8px;
      background: white;
      cursor: pointer;
    `;
    return canvas;
  }

  private init(): void {
    // Sample PII data
    this.sampleTexts = [
      { text: 'John Smith', x: 20, y: 40, detected: false, type: 'NAME' },
      { text: 'john.smith@email.com', x: 20, y: 80, detected: false, type: 'EMAIL' },
      { text: '555-123-4567', x: 20, y: 120, detected: false, type: 'PHONE' },
      { text: 'SSN: 123-45-6789', x: 20, y: 160, detected: false, type: 'SSN' },
      { text: 'Card: 4532-1234-5678-9010', x: 20, y: 200, detected: false, type: 'CARD' },
      { text: '123 Main Street, City, ST 12345', x: 20, y: 240, detected: false, type: 'ADDRESS' },
    ];

    this.drawDocument();

    // Add title
    const title = document.createElement('div');
    title.style.cssText = `
      text-align: center;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      color: var(--text-secondary);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    `;
    title.innerHTML = '✨ Live Detection Demo - Hover to Detect PII';
    this.container.insertBefore(title, this.container.firstChild);

    // Add hover effect
    this.canvas.addEventListener('mouseenter', () => this.startDetection());
    this.canvas.addEventListener('mouseleave', () => this.reset());

    this.container.appendChild(this.canvas);
  }

  private drawDocument(): void {
    // Clear canvas
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw text
    this.ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#333';

    this.sampleTexts.forEach((item) => {
      if (item.detected) {
        // Draw redaction box
        const textWidth = this.ctx.measureText(item.text).width;
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(item.x - 2, item.y - 18, textWidth + 4, 22);

        // Draw label
        this.ctx.fillStyle = 'rgba(102, 126, 234, 0.9)';
        this.ctx.font = 'bold 10px monospace';
        this.ctx.fillText(item.type, item.x, item.y - 22);
        this.ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      } else {
        this.ctx.fillStyle = '#333';
        this.ctx.fillText(item.text, item.x, item.y);
      }
    });
  }

  private startDetection(): void {
    let index = 0;

    this.detectionInterval = window.setInterval(() => {
      if (index < this.sampleTexts.length) {
        this.sampleTexts[index].detected = true;
        this.drawDocument();
        index++;
      } else {
        if (this.detectionInterval) {
          clearInterval(this.detectionInterval);
        }
      }
    }, 200);
  }

  private reset(): void {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }

    this.sampleTexts.forEach(item => item.detected = false);
    this.drawDocument();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  destroy(): void {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
    }
    this.container.remove();
  }
}
