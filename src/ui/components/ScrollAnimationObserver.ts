/**
 * Scroll Animation Observer
 * Triggers animations when elements enter viewport using IntersectionObserver
 */

export class ScrollAnimationObserver {
  private observer: IntersectionObserver | null = null;
  private elements: Set<Element> = new Set();

  constructor(private threshold: number = 0.1, private rootMargin: string = '0px 0px -100px 0px') {
    this.init();
  }

  private init(): void {
    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers without IntersectionObserver
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            entry.target.classList.remove('animate-out');
          }
        });
      },
      {
        threshold: this.threshold,
        rootMargin: this.rootMargin,
      }
    );
  }

  observe(element: Element): void {
    if (this.observer && element) {
      this.observer.observe(element);
      this.elements.add(element);
      element.classList.add('scroll-animate');
    }
  }

  observeMultiple(selector: string, container: Element = document.body): void {
    const elements = container.querySelectorAll(selector);
    elements.forEach((el) => this.observe(el));
  }

  unobserve(element: Element): void {
    if (this.observer && element) {
      this.observer.unobserve(element);
      this.elements.delete(element);
    }
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.elements.clear();
    }
  }
}
