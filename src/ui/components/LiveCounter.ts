/**
 * Live Counter Component
 * Animated counter showing privacy statistics
 */

export class LiveCounter {
  private container: HTMLElement;
  private count: number = 0;
  private targetCount: number = 0;
  private interval: number | null = null;

  constructor(private label: string, private suffix: string = '', private incrementSpeed: number = 50) {
    this.container = this.createContainer();
    this.targetCount = this.generateRandomCount();
    this.startCounting();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'live-counter';
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      background: var(--glass-bg);
      backdrop-filter: blur(20px);
      border: 1px solid var(--glass-border);
      border-radius: 16px;
      min-width: 200px;
      transition: all 0.3s ease;
    `;

    const number = document.createElement('div');
    number.className = 'counter-number';
    number.textContent = '0';
    number.style.cssText = `
      font-size: 3rem;
      font-weight: 900;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
      margin-bottom: 0.5rem;
      font-family: 'SF Mono', 'Monaco', monospace;
    `;

    const label = document.createElement('div');
    label.className = 'counter-label';
    label.textContent = this.label;
    label.style.cssText = `
      font-size: 0.9rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
      text-align: center;
    `;

    container.appendChild(number);
    container.appendChild(label);

    // Add hover effect
    container.addEventListener('mouseenter', () => {
      container.style.transform = 'translateY(-4px) scale(1.05)';
      container.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.4)';
    });
    container.addEventListener('mouseleave', () => {
      container.style.transform = 'translateY(0) scale(1)';
      container.style.boxShadow = 'none';
    });

    return container;
  }

  private generateRandomCount(): number {
    // Generate a number that increases over time
    const base = Math.floor(Math.random() * 10000) + 50000;
    const increment = Math.floor(Date.now() / 1000 / 60); // Increases every minute
    return base + increment;
  }

  private startCounting(): void {
    const numberEl = this.container.querySelector('.counter-number') as HTMLElement;
    const increment = Math.ceil(this.targetCount / 50);

    this.interval = window.setInterval(() => {
      this.count += increment;

      if (this.count >= this.targetCount) {
        this.count = this.targetCount;
        if (this.interval) {
          clearInterval(this.interval);
        }
        // Continue incrementing slowly
        this.interval = window.setInterval(() => {
          this.count++;
          numberEl.textContent = this.formatNumber(this.count) + this.suffix;
        }, 5000);
      }

      numberEl.textContent = this.formatNumber(this.count) + this.suffix;
    }, this.incrementSpeed);
  }

  private formatNumber(num: number): string {
    return num.toLocaleString();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  destroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.container.remove();
  }
}
