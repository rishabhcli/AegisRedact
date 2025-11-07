/**
 * Custom Cursor Component
 * Creates an interactive cursor with trailing effects and magnetic behavior
 */

export class CustomCursor {
  private cursor: HTMLElement;
  private cursorDot: HTMLElement;
  private trail: HTMLElement[] = [];
  private mouseX: number = 0;
  private mouseY: number = 0;
  private cursorX: number = 0;
  private cursorY: number = 0;
  private isVisible: boolean = false;
  private animationFrame: number | null = null;
  private trailLength: number = 8;

  constructor() {
    this.cursor = this.createCursor();
    this.cursorDot = this.createCursorDot();
    this.createTrail();
    this.init();
  }

  private createCursor(): HTMLElement {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.style.cssText = `
      position: fixed;
      width: 40px;
      height: 40px;
      border: 2px solid rgba(102, 126, 234, 0.5);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      transition: transform 0.15s ease, opacity 0.3s ease;
      opacity: 0;
    `;
    document.body.appendChild(cursor);
    return cursor;
  }

  private createCursorDot(): HTMLElement {
    const dot = document.createElement('div');
    dot.className = 'custom-cursor-dot';
    dot.style.cssText = `
      position: fixed;
      width: 8px;
      height: 8px;
      background: rgba(102, 126, 234, 0.8);
      border-radius: 50%;
      pointer-events: none;
      z-index: 10000;
      transition: transform 0.1s ease, opacity 0.3s ease;
      opacity: 0;
      box-shadow: 0 0 10px rgba(102, 126, 234, 0.6);
    `;
    document.body.appendChild(dot);
    return dot;
  }

  private createTrail(): void {
    for (let i = 0; i < this.trailLength; i++) {
      const trail = document.createElement('div');
      trail.className = 'cursor-trail';
      trail.style.cssText = `
        position: fixed;
        width: 6px;
        height: 6px;
        background: rgba(102, 126, 234, ${0.3 - i * 0.03});
        border-radius: 50%;
        pointer-events: none;
        z-index: 9998;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(trail);
      this.trail.push(trail);
    }
  }

  private init(): void {
    // Check if on touch device
    if ('ontouchstart' in window) {
      return; // Don't show custom cursor on touch devices
    }

    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseenter', () => this.show());
    document.addEventListener('mouseleave', () => this.hide());

    // Add hover effects for interactive elements
    const interactiveElements = 'a, button, [role="button"], input, textarea, select';
    document.addEventListener('mouseover', (e) => {
      if ((e.target as Element).closest(interactiveElements)) {
        this.cursor.style.transform = 'scale(1.5)';
        this.cursor.style.borderColor = 'rgba(102, 126, 234, 0.8)';
      }
    });
    document.addEventListener('mouseout', (e) => {
      if ((e.target as Element).closest(interactiveElements)) {
        this.cursor.style.transform = 'scale(1)';
        this.cursor.style.borderColor = 'rgba(102, 126, 234, 0.5)';
      }
    });

    this.animate();
  }

  private handleMouseMove(e: MouseEvent): void {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;

    // Update dot immediately for responsiveness
    this.cursorDot.style.left = `${this.mouseX - 4}px`;
    this.cursorDot.style.top = `${this.mouseY - 4}px`;
  }

  private animate(): void {
    // Smooth follow effect for main cursor
    this.cursorX += (this.mouseX - this.cursorX) * 0.15;
    this.cursorY += (this.mouseY - this.cursorY) * 0.15;

    this.cursor.style.left = `${this.cursorX - 20}px`;
    this.cursor.style.top = `${this.cursorY - 20}px`;

    // Update trail
    for (let i = this.trail.length - 1; i > 0; i--) {
      const prevTrail = this.trail[i - 1];
      this.trail[i].style.left = prevTrail.style.left;
      this.trail[i].style.top = prevTrail.style.top;
    }
    if (this.trail.length > 0) {
      this.trail[0].style.left = `${this.cursorX - 3}px`;
      this.trail[0].style.top = `${this.cursorY - 3}px`;
    }

    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  private show(): void {
    if (!this.isVisible) {
      this.isVisible = true;
      this.cursor.style.opacity = '1';
      this.cursorDot.style.opacity = '1';
      this.trail.forEach(t => t.style.opacity = '1');
    }
  }

  private hide(): void {
    if (this.isVisible) {
      this.isVisible = false;
      this.cursor.style.opacity = '0';
      this.cursorDot.style.opacity = '0';
      this.trail.forEach(t => t.style.opacity = '0');
    }
  }

  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.cursor.remove();
    this.cursorDot.remove();
    this.trail.forEach(t => t.remove());
  }
}
