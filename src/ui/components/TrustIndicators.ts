/**
 * Trust Indicators Component
 * Displays security badges and compliance indicators
 */

export class TrustIndicators {
  private container: HTMLElement;

  constructor() {
    this.container = this.createContainer();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'trust-indicators';
    container.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      max-width: 1000px;
      margin: 0 auto;
    `;

    const indicators = [
      {
        icon: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>`,
        title: 'Zero-Knowledge',
        description: 'All processing happens in your browser. We never see your files.',
      },
      {
        icon: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>`,
        title: 'GDPR Compliant',
        description: 'Privacy-first architecture meets EU data protection standards.',
      },
      {
        icon: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>`,
        title: 'HIPAA Ready',
        description: 'Secure document handling suitable for healthcare data.',
      },
      {
        icon: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4m0-4h.01"/>
        </svg>`,
        title: 'No Tracking',
        description: 'Zero analytics, zero cookies, zero telemetry. Complete privacy.',
      },
      {
        icon: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="7.5 4.21 12 6.81 16.5 4.21"/>
          <polyline points="7.5 19.79 7.5 14.6 3 12"/>
          <polyline points="21 12 16.5 14.6 16.5 19.79"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>`,
        title: 'Open Source',
        description: 'Transparent code you can audit and verify yourself.',
      },
      {
        icon: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>`,
        title: 'Instant Processing',
        description: 'No uploads, no waiting. Redact documents in milliseconds.',
      },
    ];

    indicators.forEach((indicator, index) => {
      const card = this.createIndicatorCard(indicator, index);
      container.appendChild(card);
    });

    return container;
  }

  private createIndicatorCard(
    data: { icon: string; title: string; description: string },
    index: number
  ): HTMLElement {
    const card = document.createElement('div');
    card.className = 'trust-indicator-card scroll-animate';
    card.style.cssText = `
      padding: 2rem;
      background: var(--glass-bg);
      backdrop-filter: blur(20px);
      border: 1px solid var(--glass-border);
      border-radius: 16px;
      text-align: center;
      transition: all 0.3s ease;
      opacity: 0;
      transform: translateY(30px);
    `;
    card.style.animationDelay = `${index * 0.1}s`;

    // Icon
    const icon = document.createElement('div');
    icon.style.cssText = `
      width: 64px;
      height: 64px;
      margin: 0 auto 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 16px;
      background: var(--gradient-primary);
      color: white;
      transition: all 0.3s ease;
    `;
    icon.innerHTML = data.icon;
    card.appendChild(icon);

    // Title
    const title = document.createElement('h3');
    title.textContent = data.title;
    title.style.cssText = `
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
    `;
    card.appendChild(title);

    // Description
    const description = document.createElement('p');
    description.textContent = data.description;
    description.style.cssText = `
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.6;
    `;
    card.appendChild(description);

    // Hover effects
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-8px)';
      card.style.borderColor = 'rgba(102, 126, 234, 0.5)';
      card.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.3)';
      icon.style.transform = 'scale(1.1) rotate(5deg)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.borderColor = 'var(--glass-border)';
      card.style.boxShadow = 'none';
      icon.style.transform = 'scale(1) rotate(0deg)';
    });

    return card;
  }

  getElement(): HTMLElement {
    return this.container;
  }

  destroy(): void {
    this.container.remove();
  }
}
