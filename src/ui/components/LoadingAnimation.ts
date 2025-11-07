/**
 * Loading Animation Component
 * Beautiful initial page load animation with logo reveal
 */

export class LoadingAnimation {
  private container: HTMLElement;
  private isComplete: boolean = false;

  constructor(private onComplete: () => void) {
    this.container = this.createContainer();
    this.animate();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'loading-animation';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #0b1020 0%, #1a1f35 100%);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: opacity 0.5s ease;
    `;

    // Logo
    const logo = document.createElement('div');
    logo.className = 'loading-logo';
    logo.innerHTML = `
      <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="url(#loadingGradient)" stroke-width="2">
        <defs>
          <linearGradient id="loadingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    `;
    logo.style.cssText = `
      opacity: 0;
      transform: scale(0.5);
      filter: drop-shadow(0 0 30px rgba(102, 126, 234, 0.8));
      animation: logoReveal 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
    `;
    container.appendChild(logo);

    // Brand name
    const brand = document.createElement('div');
    brand.textContent = 'Aegis Redact';
    brand.style.cssText = `
      margin-top: 2rem;
      font-size: 2rem;
      font-weight: 900;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      opacity: 0;
      transform: translateY(20px);
      animation: fadeInUp 0.6s ease forwards 0.3s;
    `;
    container.appendChild(brand);

    // Loading bar
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      width: 300px;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      margin-top: 2rem;
      overflow: hidden;
      opacity: 0;
      animation: fadeInUp 0.6s ease forwards 0.5s;
    `;

    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
      height: 100%;
      background: var(--gradient-primary);
      border-radius: 2px;
      width: 0%;
      transition: width 0.3s ease;
      animation: progressFill 1.5s ease-in-out forwards 0.7s;
    `;
    progressContainer.appendChild(progressBar);
    container.appendChild(progressContainer);

    // Particles
    this.createParticles(container);

    document.body.appendChild(container);
    return container;
  }

  private createParticles(container: HTMLElement): void {
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: rgba(102, 126, 234, 0.6);
        border-radius: 50%;
        top: 50%;
        left: 50%;
        animation: particleBurst 1s ease-out forwards;
        animation-delay: ${0.8 + i * 0.02}s;
        opacity: 0;
      `;
      particle.style.setProperty('--angle', `${i * 18}deg`);
      particle.style.setProperty('--distance', `${100 + Math.random() * 100}px`);
      container.appendChild(particle);
    }
  }

  private animate(): void {
    // Complete loading after animation duration
    setTimeout(() => {
      if (!this.isComplete) {
        this.complete();
      }
    }, 2500);
  }

  complete(): void {
    if (this.isComplete) return;
    this.isComplete = true;

    this.container.style.opacity = '0';
    this.container.style.pointerEvents = 'none';

    setTimeout(() => {
      this.container.remove();
      this.onComplete();
    }, 500);
  }

  getElement(): HTMLElement {
    return this.container;
  }
}
