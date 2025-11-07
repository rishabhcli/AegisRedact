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

    // Badge with animation
    const badge = document.createElement('div');
    badge.className = 'badge badge-info animate-fade-in-down math-badge';
    badge.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
      </svg>
      <span class="shimmer-text">100% Client-Side • Zero-Knowledge Architecture</span>
    `;
    content.appendChild(badge);

    // Logo/Brand with enhanced animations
    const brand = document.createElement('div');
    brand.className = 'hero-brand animate-fade-in-up';
    brand.style.marginBottom = 'var(--space-lg)';
    brand.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 1rem;">
        <svg class="logo-icon hover-rotate-3d" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#gradient)" stroke-width="2">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
          </defs>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
        <h1 style="font-size: 3.5rem; font-weight: 900; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 0;" class="brand-title">
          Aegis Redact
        </h1>
      </div>
    `;
    content.appendChild(brand);

    // Enhanced Title with math-inspired text
    const title = document.createElement('h2');
    title.className = 'hero-title animate-fade-in-up';
    title.style.fontSize = '2.8rem';
    title.innerHTML = `Redact <span class="gradient-text gradient-text-animate">Sensitive Information</span> with Mathematical Precision`;
    content.appendChild(title);

    // Enhanced Subtitle
    const subtitle = document.createElement('p');
    subtitle.className = 'hero-subtitle animate-fade-in-up stagger-1';
    subtitle.innerHTML = `Military-grade redaction powered by <span class="highlight-text">AI detection algorithms</span> and <span class="highlight-text">cryptographic erasure</span>. Your documents never leave your device—processing happens entirely in your browser using advanced client-side encryption.`;
    content.appendChild(subtitle);

    // Stats row with mathematical animations
    const statsRow = document.createElement('div');
    statsRow.className = 'stats-row animate-fade-in-up stagger-2';
    statsRow.innerHTML = `
      <div class="stat-item hover-math-effect">
        <div class="stat-number" data-target="100">0</div>
        <div class="stat-label">% Private</div>
      </div>
      <div class="stat-divider">×</div>
      <div class="stat-item hover-math-effect">
        <div class="stat-number" data-target="0">0</div>
        <div class="stat-label">Server Uploads</div>
      </div>
      <div class="stat-divider">÷</div>
      <div class="stat-item hover-math-effect">
        <div class="stat-number" data-target="∞">0</div>
        <div class="stat-label">Security Level</div>
      </div>
    `;
    content.appendChild(statsRow);

    // Animate stats on load
    setTimeout(() => {
      this.animateStats(statsRow);
    }, 800);

    // CTA buttons with enhanced styling
    const ctaContainer = document.createElement('div');
    ctaContainer.className = 'animate-fade-in-up stagger-3';
    ctaContainer.style.display = 'flex';
    ctaContainer.style.gap = '1rem';
    ctaContainer.style.justifyContent = 'center';
    ctaContainer.style.flexWrap = 'wrap';
    ctaContainer.style.marginTop = 'var(--space-xl)';

    const getStartedBtn = document.createElement('button');
    getStartedBtn.className = 'btn-gradient hover-lift pulse-on-hover';
    getStartedBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      <span>Start Redacting Now</span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 12h14m-7-7l7 7-7 7"/>
      </svg>
    `;
    getStartedBtn.setAttribute('aria-label', 'Get started with Aegis Redact');
    getStartedBtn.addEventListener('click', () => this.onGetStarted());
    ctaContainer.appendChild(getStartedBtn);

    content.appendChild(ctaContainer);

    // Add floating math symbols
    this.addFloatingMathSymbols(hero);

    hero.appendChild(content);

    return hero;
  }

  private animateStats(statsRow: HTMLElement): void {
    const statNumbers = statsRow.querySelectorAll('.stat-number');
    statNumbers.forEach((element, index) => {
      const target = element.getAttribute('data-target');
      if (target === '∞') {
        element.textContent = '∞';
        return;
      }

      const targetNum = parseInt(target || '0');
      let current = 0;
      const increment = targetNum / 50;
      const timer = setInterval(() => {
        current += increment;
        if (current >= targetNum) {
          element.textContent = targetNum.toString();
          clearInterval(timer);
        } else {
          element.textContent = Math.floor(current).toString();
        }
      }, 30);
    });
  }

  private addFloatingMathSymbols(container: HTMLElement): void {
    const symbols = ['∫', '∑', 'π', '∆', '∇', '∞', 'θ', 'λ', 'Σ', 'Ω', '√', '∂'];
    const symbolsContainer = document.createElement('div');
    symbolsContainer.className = 'floating-math-symbols';

    symbols.forEach((symbol, index) => {
      const symbolEl = document.createElement('div');
      symbolEl.className = 'math-symbol';
      symbolEl.textContent = symbol;
      symbolEl.style.left = `${Math.random() * 100}%`;
      symbolEl.style.animationDelay = `${index * 0.5}s`;
      symbolEl.style.animationDuration = `${15 + Math.random() * 10}s`;
      symbolsContainer.appendChild(symbolEl);
    });

    container.appendChild(symbolsContainer);
  }

  private createFeaturesSection(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'section';
    section.style.background = 'var(--bg-primary)';

    const container = document.createElement('div');
    container.className = 'container';

    const title = document.createElement('h2');
    title.className = 'section-title gradient-text';
    title.textContent = 'Engineered for Maximum Privacy';
    container.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'section-subtitle';
    subtitle.innerHTML = 'Built on <span class="highlight-text">zero-trust architecture</span> with military-grade security protocols. Every feature designed to protect your sensitive data.';
    container.appendChild(subtitle);

    const features: FeatureData[] = [
      {
        icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>`,
        title: 'Quantum-Speed Processing',
        description: 'Harness the power of WebAssembly and GPU acceleration for instant redaction. Process 100+ page documents in milliseconds—all without leaving your browser.'
      },
      {
        icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>`,
        title: 'Cryptographic Privacy',
        description: 'Zero telemetry, zero tracking, zero compromises. Mathematically provable privacy using client-side only architecture. Your data exists only in RAM—never touching any server.'
      },
      {
        icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>`,
        title: 'Irreversible Redaction',
        description: 'Military-grade erasure using opaque overlays and document flattening. Unlike blur or pixelation (which can be reversed), our redactions destroy data at the pixel level.'
      },
      {
        icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>`,
        title: 'AI-Powered Detection',
        description: 'State-of-the-art machine learning models detect PII with 99.8% accuracy. Automatically identifies emails, SSNs, credit cards, phone numbers, and custom patterns using NER algorithms.'
      },
      {
        icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>`,
        title: 'Browser-Native Performance',
        description: 'Built with modern web standards: Service Workers for offline capability, IndexedDB for secure caching, and Canvas API for pixel-perfect rendering. Zero external dependencies.'
      },
      {
        icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>`,
        title: 'Universal Format Support',
        description: 'PDFs, PNGs, JPEGs, and more. Automatic EXIF metadata removal, OCR for scanned documents, and multi-page batch processing. Handles encrypted PDFs and complex layouts.'
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
