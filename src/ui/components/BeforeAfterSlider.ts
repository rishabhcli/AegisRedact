/**
 * Before/After Comparison Slider
 * Interactive slider to compare documents before and after redaction
 */

export class BeforeAfterSlider {
  private container: HTMLElement;
  private slider: HTMLElement;
  private isDragging: boolean = false;
  private sliderPosition: number = 50; // percentage

  constructor() {
    this.container = this.createContainer();
    this.slider = this.createSlider();
    this.init();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'before-after-slider';
    container.style.cssText = `
      position: relative;
      width: 100%;
      max-width: 800px;
      height: 500px;
      margin: 2rem auto;
      overflow: hidden;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      cursor: ew-resize;
      user-select: none;
    `;

    // Before image (unredacted)
    const before = document.createElement('div');
    before.className = 'before-image';
    before.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 2rem;
    `;
    before.innerHTML = `
      <h3 style="color: #333; margin-bottom: 1rem; font-size: 1.5rem;">Before Redaction</h3>
      <div style="color: #666; line-height: 1.8; font-size: 1rem;">
        <p><strong>Name:</strong> John Smith</p>
        <p><strong>Email:</strong> john.smith@example.com</p>
        <p><strong>Phone:</strong> 555-123-4567</p>
        <p><strong>SSN:</strong> 123-45-6789</p>
        <p><strong>Address:</strong> 123 Main St, City, ST 12345</p>
        <p><strong>Card:</strong> 4532-1234-5678-9010</p>
      </div>
      <div style="position: absolute; top: 10px; right: 10px; background: rgba(231, 76, 60, 0.2); color: #e74c3c; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.875rem;">
        ⚠️ Sensitive Data Exposed
      </div>
    `;

    // After image (redacted)
    const after = document.createElement('div');
    after.className = 'after-image';
    after.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 50%;
      height: 100%;
      background: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 2rem;
      clip-path: inset(0 0 0 0);
      transition: width 0.05s ease;
    `;
    after.innerHTML = `
      <h3 style="color: #333; margin-bottom: 1rem; font-size: 1.5rem;">After Redaction</h3>
      <div style="color: #666; line-height: 1.8; font-size: 1rem;">
        <p><strong>Name:</strong> <span style="background: #000; color: transparent; border-radius: 4px; padding: 0 8px;">████████</span></p>
        <p><strong>Email:</strong> <span style="background: #000; color: transparent; border-radius: 4px; padding: 0 8px;">████████████████</span></p>
        <p><strong>Phone:</strong> <span style="background: #000; color: transparent; border-radius: 4px; padding: 0 8px;">████████████</span></p>
        <p><strong>SSN:</strong> <span style="background: #000; color: transparent; border-radius: 4px; padding: 0 8px;">███████████</span></p>
        <p><strong>Address:</strong> <span style="background: #000; color: transparent; border-radius: 4px; padding: 0 8px;">██████████████████</span></p>
        <p><strong>Card:</strong> <span style="background: #000; color: transparent; border-radius: 4px; padding: 0 8px;">███████████████</span></p>
      </div>
      <div style="position: absolute; top: 10px; right: 10px; background: rgba(46, 204, 113, 0.2); color: #2ecc71; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.875rem;">
        ✓ Data Protected
      </div>
    `;

    container.appendChild(before);
    container.appendChild(after);

    return container;
  }

  private createSlider(): HTMLElement {
    const slider = document.createElement('div');
    slider.className = 'slider-handle';
    slider.style.cssText = `
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      z-index: 10;
      cursor: ew-resize;
    `;

    // Add handle circle
    const handle = document.createElement('div');
    handle.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: 4px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    handle.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
        <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
      </svg>
    `;
    slider.appendChild(handle);

    this.container.appendChild(slider);
    return slider;
  }

  private init(): void {
    this.container.addEventListener('mousedown', (e) => this.startDrag(e));
    this.container.addEventListener('touchstart', (e) => this.startDrag(e));
    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('touchmove', (e) => this.drag(e));
    document.addEventListener('mouseup', () => this.stopDrag());
    document.addEventListener('touchend', () => this.stopDrag());

    // Add labels
    const beforeLabel = document.createElement('div');
    beforeLabel.textContent = 'BEFORE';
    beforeLabel.style.cssText = `
      position: absolute;
      bottom: 1rem;
      left: 1rem;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      z-index: 5;
    `;
    this.container.appendChild(beforeLabel);

    const afterLabel = document.createElement('div');
    afterLabel.textContent = 'AFTER';
    afterLabel.style.cssText = `
      position: absolute;
      bottom: 1rem;
      right: 1rem;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      z-index: 5;
    `;
    this.container.appendChild(afterLabel);
  }

  private startDrag(e: MouseEvent | TouchEvent): void {
    this.isDragging = true;
    this.drag(e);
  }

  private drag(e: MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;

    const rect = this.container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    this.sliderPosition = Math.max(0, Math.min(100, percentage));
    this.updateSlider();
  }

  private stopDrag(): void {
    this.isDragging = false;
  }

  private updateSlider(): void {
    this.slider.style.left = `${this.sliderPosition}%`;
    const afterImage = this.container.querySelector('.after-image') as HTMLElement;
    if (afterImage) {
      afterImage.style.width = `${this.sliderPosition}%`;
    }
  }

  getElement(): HTMLElement {
    return this.container;
  }

  destroy(): void {
    this.container.remove();
  }
}
