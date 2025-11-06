/**
 * Landing Page Component
 * Hero section with features showcase and CTA
 */

import { AnimatedBackground } from './AnimatedBackground';
import { FeatureCard, type FeatureData } from './FeatureCard';

export class LandingPage {
  private container: HTMLElement;
  private background: AnimatedBackground;
  private onGetStarted: () => void;

  constructor(onGetStarted: () => void) {
    this.onGetStarted = onGetStarted;
    this.background = new AnimatedBackground(25);
    this.container = this.createLandingPage();
    this.setupParallax();
  }

  private setupParallax(): void {
    // Add subtle parallax effect on scroll
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = this.container.scrollTop;
          const heroSection = this.container.querySelector('.hero-section') as HTMLElement;

          if (heroSection) {
            const heroContent = heroSection.querySelector('.hero-content') as HTMLElement;
            if (heroContent) {
              // Parallax effect: content moves slower than scroll
              heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
              heroContent.style.opacity = `${1 - scrolled / 800}`;
            }
          }

          ticking = false;
        });

        ticking = true;
      }
    };

    this.container.addEventListener('scroll', handleScroll, { passive: true });
  }

  private createLandingPage(): HTMLElement {
    const page = document.createElement('div');
    page.className = 'landing-page';
    page.style.position = 'relative';
    page.style.width = '100%';
    page.style.minHeight = '100vh';
    page.style.overflowY = 'auto';
    page.style.overflowX = 'hidden';

    // Add animated background
    page.appendChild(this.background.getElement());

    // Create main content container
    const content = document.createElement('div');
    content.style.position = 'relative';
    content.style.zIndex = '1';

    // Hero section
    content.appendChild(this.createHeroSection());

    // Features section
    content.appendChild(this.createFeaturesSection());

    // How it works section
    content.appendChild(this.createHowItWorksSection());

    // Privacy section
    content.appendChild(this.createPrivacySection());

    // Footer
    content.appendChild(this.createFooter());

    page.appendChild(content);

    return page;
  }

  private createHeroSection(): HTMLElement {
    const hero = document.createElement('section');
    hero.className = 'hero-section';

    const content = document.createElement('div');
    content.className = 'hero-content';

    // Badge
    const badge = document.createElement('div');
    badge.className = 'badge badge-info animate-fade-in-down';
    badge.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
      </svg>
      100% Client-Side Processing
    `;
    content.appendChild(badge);

    // Logo/Brand
    const brand = document.createElement('div');
    brand.className = 'hero-brand animate-fade-in-up';
    brand.style.marginBottom = 'var(--space-lg)';
    brand.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 1rem;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="url(#gradient)" stroke-width="2">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
          </defs>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
        <h1 style="font-size: 3rem; font-weight: 800; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 0;">
          Aegis Redact
        </h1>
      </div>
    `;
    content.appendChild(brand);

    // Title
    const title = document.createElement('h2');
    title.className = 'hero-title animate-fade-in-up';
    title.style.fontSize = '2.5rem';
    title.innerHTML = `Remove <span class="gradient-text">Personally Identifiable Information</span>`;
    content.appendChild(title);

    // Subtitle
    const subtitle = document.createElement('p');
    subtitle.className = 'hero-subtitle animate-fade-in-up stagger-1';
    subtitle.textContent = 'Professional document redaction toolkit. All processing happens in your browser—no uploads, no tracking, complete control.';
    content.appendChild(subtitle);

    // CTA buttons
    const ctaContainer = document.createElement('div');
    ctaContainer.className = 'animate-fade-in-up stagger-2';
    ctaContainer.style.display = 'flex';
    ctaContainer.style.gap = '1rem';
    ctaContainer.style.justifyContent = 'center';
    ctaContainer.style.flexWrap = 'wrap';
    ctaContainer.style.marginTop = 'var(--space-xl)';

    const getStartedBtn = document.createElement('button');
    getStartedBtn.className = 'btn-gradient hover-lift';
    getStartedBtn.textContent = 'Get Started';
    getStartedBtn.setAttribute('aria-label', 'Get started with Aegis Redact');
    getStartedBtn.addEventListener('click', () => this.onGetStarted());
    ctaContainer.appendChild(getStartedBtn);

    content.appendChild(ctaContainer);
    hero.appendChild(content);

    return hero;
  }

  private createFeaturesSection(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'section';
    section.style.background = 'var(--bg-primary)';

    const container = document.createElement('div');
    container.className = 'container';

    const title = document.createElement('h2');
    title.className = 'section-title gradient-text';
    title.textContent = 'Privacy-First Features';
    container.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'section-subtitle';
    subtitle.textContent = 'Powerful redaction tools designed with your privacy and security in mind';
    container.appendChild(subtitle);

    const features: FeatureData[] = [
      {
        icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>`,
        title: 'Instant Processing',
        description: 'All processing happens in your browser. No waiting for uploads or server-side processing. Your files never leave your device.'
      },
      {
        icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>`,
        title: 'Zero Tracking',
        description: 'No analytics, no cookies, no third-party scripts. Your privacy is protected by design, not just policy.'
      },
      {
        icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>`,
        title: 'Secure Redaction',
        description: 'Uses opaque black boxes and document flattening. Unlike blur or pixelation, our redactions are truly irreversible.'
      },
      {
        icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>`,
        title: 'Format Support',
        description: 'Works with PDFs and images. Automatically detects emails, phone numbers, SSNs, credit cards, and custom patterns.'
      },
      {
        icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>`,
        title: 'Lightning Fast',
        description: 'No server round-trips means instant processing. Redact large PDFs and images in seconds, not minutes.'
      },
      {
        icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="7.5 4.21 12 6.81 16.5 4.21"/>
          <polyline points="7.5 19.79 7.5 14.6 3 12"/>
          <polyline points="21 12 16.5 14.6 16.5 19.79"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>`,
        title: 'PWA Ready',
        description: 'Install as a standalone app on any device. Works offline after first visit. No app store required.'
      }
    ];

    const grid = document.createElement('div');
    grid.className = 'features-grid';

    features.forEach((feature, index) => {
      const card = new FeatureCard(feature, index);
      grid.appendChild(card.getElement());
    });

    container.appendChild(grid);
    section.appendChild(container);

    return section;
  }

  private createHowItWorksSection(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'section';
    section.style.background = 'var(--bg-secondary)';

    const container = document.createElement('div');
    container.className = 'container-sm';

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = 'How It Works';
    container.appendChild(title);

    const steps = [
      { number: '1', title: 'Upload Your File', description: 'Drop a PDF or image into your browser' },
      { number: '2', title: 'Review & Redact', description: 'Auto-detect sensitive info or manually select areas' },
      { number: '3', title: 'Export Securely', description: 'Download your redacted file with irreversible privacy protection' }
    ];

    const stepsContainer = document.createElement('div');
    stepsContainer.style.display = 'flex';
    stepsContainer.style.flexDirection = 'column';
    stepsContainer.style.gap = 'var(--space-lg)';
    stepsContainer.style.marginTop = 'var(--space-xl)';

    steps.forEach((step, index) => {
      const stepEl = document.createElement('div');
      stepEl.className = 'glass-card animate-fade-in-up';
      stepEl.style.padding = 'var(--space-lg)';
      stepEl.style.display = 'flex';
      stepEl.style.gap = 'var(--space-md)';
      stepEl.style.animationDelay = `${index * 0.1}s`;
      stepEl.style.opacity = '0';
      stepEl.style.animationFillMode = 'forwards';

      const number = document.createElement('div');
      number.className = 'feature-icon';
      number.style.flexShrink = '0';
      number.textContent = step.number;
      number.style.fontSize = '1.5rem';
      number.style.fontWeight = '700';
      stepEl.appendChild(number);

      const content = document.createElement('div');
      const stepTitle = document.createElement('h3');
      stepTitle.className = 'feature-title';
      stepTitle.style.textAlign = 'left';
      stepTitle.textContent = step.title;
      content.appendChild(stepTitle);

      const stepDesc = document.createElement('p');
      stepDesc.className = 'feature-description';
      stepDesc.style.textAlign = 'left';
      stepDesc.textContent = step.description;
      content.appendChild(stepDesc);

      stepEl.appendChild(content);
      stepsContainer.appendChild(stepEl);
    });

    container.appendChild(stepsContainer);
    section.appendChild(container);

    return section;
  }

  private createPrivacySection(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'section';

    const container = document.createElement('div');
    container.className = 'container-sm';

    const title = document.createElement('h2');
    title.className = 'section-title gradient-text';
    title.textContent = 'Your Privacy, Guaranteed';
    container.appendChild(title);

    const badges = document.createElement('div');
    badges.style.display = 'flex';
    badges.style.flexWrap = 'wrap';
    badges.style.gap = 'var(--space-md)';
    badges.style.justifyContent = 'center';
    badges.style.marginTop = 'var(--space-xl)';

    const badgeItems = [
      '✓ No Server Uploads',
      '✓ No Analytics',
      '✓ No Cookies',
      '✓ No Tracking',
      '✓ Instant Processing',
      '✓ Offline Capable'
    ];

    badgeItems.forEach((text, index) => {
      const badge = document.createElement('div');
      badge.className = 'badge badge-success animate-scale-in';
      badge.style.animationDelay = `${index * 0.05}s`;
      badge.textContent = text;
      badges.appendChild(badge);
    });

    container.appendChild(badges);
    section.appendChild(container);

    return section;
  }

  private createFooter(): HTMLElement {
    const footer = document.createElement('footer');
    footer.className = 'section';
    footer.style.borderTop = '1px solid var(--border-color)';
    footer.style.paddingTop = 'var(--space-xl)';
    footer.style.paddingBottom = 'var(--space-xl)';

    const container = document.createElement('div');
    container.className = 'container';
    container.style.textAlign = 'center';

    const text = document.createElement('p');
    text.style.color = 'var(--text-secondary)';
    text.style.marginBottom = 'var(--space-md)';
    text.textContent = 'Built with privacy in mind.';
    container.appendChild(text);

    const copyright = document.createElement('p');
    copyright.style.color = 'var(--text-secondary)';
    copyright.style.fontSize = '0.875rem';
    copyright.textContent = `© ${new Date().getFullYear()} Aegis Redact. All rights reserved.`;
    container.appendChild(copyright);

    footer.appendChild(container);
    return footer;
  }

  getElement(): HTMLElement {
    return this.container;
  }

  show(): void {
    this.container.style.display = 'block';
  }

  hide(): void {
    this.container.style.display = 'none';
  }

  destroy(): void {
    this.background.destroy();
    this.container.remove();
  }
}
