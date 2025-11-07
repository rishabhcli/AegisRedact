/**
 * Feature Card Component
 * Displays a feature with icon, title, and description
 */

export interface FeatureData {
  icon: string; // SVG string or emoji
  title: string;
  description: string;
}

export class FeatureCard {
  private container: HTMLElement;
  private data: FeatureData;

  constructor(data: FeatureData, index: number = 0) {
    this.data = data;
    this.container = this.createCard(index);
  }

  private createCard(index: number): HTMLElement {
    const card = document.createElement('div');
    card.className = 'feature-card glass-card-hover animate-fade-in-up hover-3d-card';
    card.style.animationDelay = `${index * 0.1}s`;
    card.style.opacity = '0';
    card.style.animationFillMode = 'forwards';

    // Add interactive 3D tilt effect on mouse move
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
    });

    // Icon container with particles
    const iconContainer = document.createElement('div');
    iconContainer.className = 'feature-icon hover-icon-float';
    iconContainer.innerHTML = this.data.icon;
    card.appendChild(iconContainer);

    // Add particle effect container
    const particleContainer = document.createElement('div');
    particleContainer.className = 'icon-particles';
    for (let i = 0; i < 8; i++) {
      const particle = document.createElement('div');
      particle.className = 'icon-particle';
      particle.style.setProperty('--angle', `${i * 45}deg`);
      particleContainer.appendChild(particle);
    }
    iconContainer.appendChild(particleContainer);

    // Title
    const title = document.createElement('h3');
    title.className = 'feature-title gradient-text-on-hover';
    title.textContent = this.data.title;
    card.appendChild(title);

    // Description
    const description = document.createElement('p');
    description.className = 'feature-description';
    description.textContent = this.data.description;
    card.appendChild(description);

    // Add decorative corner elements
    const corner = document.createElement('div');
    corner.className = 'card-corner-decoration';
    card.appendChild(corner);

    return card;
  }

  getElement(): HTMLElement {
    return this.container;
  }
}
