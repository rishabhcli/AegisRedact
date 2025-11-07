/**
 * Typewriter Text Effect
 * Creates a typing animation for text content
 */

export class TypewriterText {
  private element: HTMLElement;
  private texts: string[];
  private currentTextIndex: number = 0;
  private currentCharIndex: number = 0;
  private isDeleting: boolean = false;
  private timeout: number | null = null;
  private speed: number = 100;
  private deleteSpeed: number = 50;
  private pauseTime: number = 2000;

  constructor(texts: string[], private loop: boolean = true) {
    this.texts = texts;
    this.element = this.createElement();
  }

  private createElement(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'typewriter-text';
    span.style.cssText = `
      display: inline-block;
      position: relative;
    `;

    // Add cursor
    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    cursor.textContent = '|';
    cursor.style.cssText = `
      display: inline-block;
      margin-left: 2px;
      animation: cursorBlink 1s step-end infinite;
    `;
    span.appendChild(cursor);

    return span;
  }

  start(): void {
    this.type();
  }

  private type(): void {
    const currentText = this.texts[this.currentTextIndex];

    if (!this.isDeleting && this.currentCharIndex < currentText.length) {
      // Typing
      const textContent = currentText.substring(0, this.currentCharIndex + 1);
      this.element.firstChild!.textContent = textContent;
      this.currentCharIndex++;
      this.timeout = window.setTimeout(() => this.type(), this.speed);
    } else if (this.isDeleting && this.currentCharIndex > 0) {
      // Deleting
      const textContent = currentText.substring(0, this.currentCharIndex - 1);
      this.element.firstChild!.textContent = textContent;
      this.currentCharIndex--;
      this.timeout = window.setTimeout(() => this.type(), this.deleteSpeed);
    } else if (!this.isDeleting && this.currentCharIndex === currentText.length) {
      // Pause before deleting
      if (this.loop || this.currentTextIndex < this.texts.length - 1) {
        this.isDeleting = true;
        this.timeout = window.setTimeout(() => this.type(), this.pauseTime);
      }
    } else if (this.isDeleting && this.currentCharIndex === 0) {
      // Move to next text
      this.isDeleting = false;
      this.currentTextIndex = (this.currentTextIndex + 1) % this.texts.length;
      this.timeout = window.setTimeout(() => this.type(), 500);
    }
  }

  getElement(): HTMLElement {
    return this.element;
  }

  destroy(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.element.remove();
  }
}
