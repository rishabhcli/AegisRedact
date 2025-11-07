/**
 * Interactive Code Block Component
 * Displays code snippet with syntax highlighting and copy functionality
 */

export class InteractiveCodeBlock {
  private container: HTMLElement;
  private copied: boolean = false;

  constructor(private code: string, private language: string = 'typescript') {
    this.container = this.createContainer();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    this.container = container;
    container.className = 'code-block';
    container.style.cssText = `
      position: relative;
      max-width: 700px;
      margin: 2rem auto;
      background: rgba(15, 20, 35, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(102, 126, 234, 0.3);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: rgba(26, 31, 53, 0.8);
      border-bottom: 1px solid rgba(102, 126, 234, 0.2);
    `;

    const languageLabel = document.createElement('span');
    languageLabel.textContent = this.language;
    languageLabel.style.cssText = `
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--accent-blue);
      letter-spacing: 0.05em;
    `;
    header.appendChild(languageLabel);

    const copyButton = document.createElement('button');
    copyButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
      <span>Copy</span>
    `;
    copyButton.style.cssText = `
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: rgba(102, 126, 234, 0.2);
      border: 1px solid rgba(102, 126, 234, 0.3);
      border-radius: 6px;
      color: var(--text-primary);
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    copyButton.addEventListener('click', () => this.copyCode(copyButton));
    copyButton.addEventListener('mouseenter', () => {
      copyButton.style.background = 'rgba(102, 126, 234, 0.3)';
      copyButton.style.borderColor = 'rgba(102, 126, 234, 0.5)';
    });
    copyButton.addEventListener('mouseleave', () => {
      if (!this.copied) {
        copyButton.style.background = 'rgba(102, 126, 234, 0.2)';
        copyButton.style.borderColor = 'rgba(102, 126, 234, 0.3)';
      }
    });
    header.appendChild(copyButton);

    container.appendChild(header);

    // Code content
    const codeContainer = document.createElement('pre');
    codeContainer.style.cssText = `
      margin: 0;
      padding: 1.5rem;
      overflow-x: auto;
      font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
      font-size: 0.875rem;
      line-height: 1.6;
    `;

    const codeElement = document.createElement('code');
    codeElement.textContent = this.code;
    codeElement.style.cssText = `
      color: #e1e4ed;
    `;

    codeContainer.appendChild(codeElement);
    container.appendChild(codeContainer);

    // Add line numbers
    this.addLineNumbers(codeContainer);

    return container;
  }

  private addLineNumbers(pre: HTMLElement): void {
    const code = pre.querySelector('code')!;
    const lines = this.code.split('\n');

    const lineNumbersContainer = document.createElement('div');
    lineNumbersContainer.style.cssText = `
      position: absolute;
      left: 0;
      top: 48px;
      padding: 1.5rem 0;
      width: 3rem;
      text-align: right;
      color: rgba(255, 255, 255, 0.3);
      font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
      font-size: 0.875rem;
      line-height: 1.6;
      user-select: none;
      pointer-events: none;
    `;

    lines.forEach((_, index) => {
      const lineNumber = document.createElement('div');
      lineNumber.textContent = String(index + 1);
      lineNumber.style.paddingRight = '0.75rem';
      lineNumbersContainer.appendChild(lineNumber);
    });

    this.container.appendChild(lineNumbersContainer);
    pre.style.paddingLeft = '3.5rem';
  }

  private async copyCode(button: HTMLElement): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code);
      this.copied = true;

      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>Copied!</span>
      `;
      button.style.background = 'rgba(46, 204, 113, 0.3)';
      button.style.borderColor = 'rgba(46, 204, 113, 0.5)';
      button.style.color = 'var(--accent-green)';

      setTimeout(() => {
        this.copied = false;
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          <span>Copy</span>
        `;
        button.style.background = 'rgba(102, 126, 234, 0.2)';
        button.style.borderColor = 'rgba(102, 126, 234, 0.3)';
        button.style.color = 'var(--text-primary)';
      }, 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }

  getElement(): HTMLElement {
    return this.container;
  }

  destroy(): void {
    this.container.remove();
  }
}
