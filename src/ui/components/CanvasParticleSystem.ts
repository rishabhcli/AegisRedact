/**
 * Canvas-Based Particle System
 * High-performance particle system with interactive mouse effects
 */

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

export class CanvasParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private mouseX: number = 0;
  private mouseY: number = 0;
  private animationFrame: number | null = null;
  private particleCount: number;
  private connectionDistance: number = 150;

  constructor(particleCount: number = 50) {
    this.particleCount = particleCount;
    this.canvas = this.createCanvas();
    this.ctx = this.canvas.getContext('2d')!;
    this.init();
  }

  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.className = 'particle-canvas';
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
    `;
    return canvas;
  }

  private init(): void {
    this.resize();
    this.createParticles();

    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    this.animate();
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private createParticles(): void {
    const colors = [
      'rgba(102, 126, 234, 0.8)',
      'rgba(118, 75, 162, 0.8)',
      'rgba(74, 144, 226, 0.8)',
    ];

    for (let i = 0; i < this.particleCount; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;

      this.particles.push({
        x,
        y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  private animate(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw particles
    this.particles.forEach((particle, index) => {
      // Mouse interaction
      const dx = this.mouseX - particle.x;
      const dy = this.mouseY - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = 150;

      if (distance < maxDistance) {
        const force = (maxDistance - distance) / maxDistance;
        particle.vx -= (dx / distance) * force * 0.5;
        particle.vy -= (dy / distance) * force * 0.5;
      }

      // Return to base position
      particle.vx += (particle.baseX - particle.x) * 0.01;
      particle.vy += (particle.baseY - particle.y) * 0.01;

      // Apply velocity with damping
      particle.vx *= 0.95;
      particle.vy *= 0.95;
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Boundary check
      if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.color;
      this.ctx.globalAlpha = particle.opacity;
      this.ctx.fill();

      // Draw connections
      for (let j = index + 1; j < this.particles.length; j++) {
        const other = this.particles[j];
        const dist = Math.sqrt(
          Math.pow(particle.x - other.x, 2) + Math.pow(particle.y - other.y, 2)
        );

        if (dist < this.connectionDistance) {
          this.ctx.beginPath();
          this.ctx.moveTo(particle.x, particle.y);
          this.ctx.lineTo(other.x, other.y);
          this.ctx.strokeStyle = `rgba(102, 126, 234, ${
            (1 - dist / this.connectionDistance) * 0.2
          })`;
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
        }
      }
    });

    this.ctx.globalAlpha = 1;
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  getElement(): HTMLCanvasElement {
    return this.canvas;
  }

  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.canvas.remove();
  }
}
