/**
 * FAQ Accordion Component
 * Expandable FAQ section with smooth animations
 */

interface FAQItem {
  question: string;
  answer: string;
}

export class FAQAccordion {
  private container: HTMLElement;
  private items: FAQItem[] = [];

  constructor(items: FAQItem[]) {
    this.items = items;
    this.container = this.createContainer();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'faq-accordion';
    container.style.cssText = `
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    `;

    this.items.forEach((item, index) => {
      const accordionItem = this.createAccordionItem(item, index);
      container.appendChild(accordionItem);
    });

    return container;
  }

  private createAccordionItem(item: FAQItem, index: number): HTMLElement {
    const itemContainer = document.createElement('div');
    itemContainer.className = 'faq-item scroll-animate';
    itemContainer.style.cssText = `
      background: var(--glass-bg);
      backdrop-filter: blur(20px);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.3s ease;
      opacity: 0;
      transform: translateY(20px);
    `;
    itemContainer.style.animationDelay = `${index * 0.05}s`;

    // Question header
    const header = document.createElement('button');
    header.className = 'faq-header';
    header.style.cssText = `
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      background: transparent;
      border: none;
      cursor: pointer;
      text-align: left;
      color: var(--text-primary);
      font-size: 1.1rem;
      font-weight: 600;
      transition: all 0.2s ease;
    `;

    const questionText = document.createElement('span');
    questionText.textContent = item.question;
    header.appendChild(questionText);

    const icon = document.createElement('span');
    icon.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition: transform 0.3s ease;">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    `;
    icon.style.cssText = `
      flex-shrink: 0;
      display: flex;
      align-items: center;
      color: var(--accent-blue);
    `;
    header.appendChild(icon);

    // Answer content
    const content = document.createElement('div');
    content.className = 'faq-content';
    content.style.cssText = `
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.4s ease, padding 0.4s ease;
    `;

    const answer = document.createElement('div');
    answer.style.cssText = `
      padding: 0 1.5rem 1.5rem;
      color: var(--text-secondary);
      line-height: 1.7;
      font-size: 1rem;
    `;
    answer.textContent = item.answer;
    content.appendChild(answer);

    // Toggle functionality
    let isOpen = false;
    header.addEventListener('click', () => {
      isOpen = !isOpen;
      const iconSvg = icon.querySelector('svg') as SVGElement;

      if (isOpen) {
        content.style.maxHeight = content.scrollHeight + 'px';
        iconSvg.style.transform = 'rotate(180deg)';
        itemContainer.style.borderColor = 'rgba(102, 126, 234, 0.5)';
        itemContainer.style.background = 'rgba(26, 31, 53, 0.85)';
      } else {
        content.style.maxHeight = '0';
        iconSvg.style.transform = 'rotate(0deg)';
        itemContainer.style.borderColor = 'var(--glass-border)';
        itemContainer.style.background = 'var(--glass-bg)';
      }
    });

    // Hover effect
    header.addEventListener('mouseenter', () => {
      if (!isOpen) {
        itemContainer.style.borderColor = 'rgba(102, 126, 234, 0.3)';
      }
    });
    header.addEventListener('mouseleave', () => {
      if (!isOpen) {
        itemContainer.style.borderColor = 'var(--glass-border)';
      }
    });

    itemContainer.appendChild(header);
    itemContainer.appendChild(content);

    return itemContainer;
  }

  getElement(): HTMLElement {
    return this.container;
  }

  destroy(): void {
    this.container.remove();
  }
}
