/**
 * Mouse Spotlight Effect
 * Creates a radial gradient spotlight that follows the mouse cursor
 */

export class MouseSpotlight {
  private spotlight: HTMLElement;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private spotlightX: number = 0;
  private spotlightY: number = 0;
  private animationFrame: number | null = null;

  constructor(private intensity: number = 0.3) {
    this.spotlight = this.createSpotlight();
    this.init();
  }

  private createSpotlight(): HTMLElement {
    const spotlight = document.createElement('div');
    spotlight.className = 'mouse-spotlight';
    spotlight.style.cssText = `
      position: fixed;
      width: 600px;
      height: 600px;
      pointer-events: none;
      z-index: 1;
      background: radial-gradient(
        circle at center,
        rgba(102, 126, 234, ${this.intensity}) 0%,
        rgba(118, 75, 162, ${this.intensity * 0.5}) 25%,
        transparent 70%
      );
      mix-blend-mode: screen;
      opacity: 0;
      transition: opacity 0.5s ease;
    `;
    document.body.appendChild(spotlight);
    return spotlight;
  }

  private init(): void {
    // Check if on touch device
    if ('ontouchstart' in window) {
      return;
    }

    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseenter', () => {
      this.spotlight.style.opacity = '1';
    });
    document.addEventListener('mouseleave', () => {
      this.spotlight.style.opacity = '0';
    });

    this.animate();
  }

  private handleMouseMove(e: MouseEvent): void {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
  }

  private animate(): void {
    // Smooth follow effect
    this.spotlightX += (this.mouseX - this.spotlightX) * 0.1;
    this.spotlightY += (this.mouseY - this.spotlightY) * 0.1;

    this.spotlight.style.left = `${this.spotlightX - 300}px`;
    this.spotlight.style.top = `${this.spotlightY - 300}px`;

    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.spotlight.remove();
  }

  getElement(): HTMLElement {
    return this.spotlight;
  }
}
